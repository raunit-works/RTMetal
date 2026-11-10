# Category hierarchy — approval packet

## Verification boundary

Staging target: `rbucefvtkiohmaugvkyz`. No database connection was made in this task.
No staging public key was available in the process environment, and no Supabase CLI
was installed. Environment files and secret credentials were not read. Production
was not contacted. The staging schema and data integrity are therefore **unverified**.

The checked-in migrations define `products.category_id -> categories.id`, unique
category slugs, and public/admin RLS. They do **not** define these category columns:

| Column | Proposed definition | Existing-data treatment |
| --- | --- | --- |
| `main_section` | nullable text: `home_decor` or `metal_services` | NULL = unassigned; no guessed classification |
| `parent_id` | nullable UUID, same-section self-reference, restricted deletion | NULL = existing top level; no inferred parents |
| `is_published` | nullable boolean, new-row default false | Existing NULL retains historical visibility; existing false stays false |

The application checks column availability with a zero-row SELECT in the existing
admin session. Until all three exist, it permits legacy category detail edits but
disables new category creation/hierarchy controls. New products/services remain drafts.

## Application behaviour

- Product section is derived from its existing `category_id`. No product section
  column or second category-management system is introduced.
- New configured categories require an explicit section. Parent options and product
  options respect that section. Category changes with existing products/children
  cannot silently move an entire branch to a different section.
- Unassigned legacy roots retain their historical Home Decor listing placement,
  without a database classification. Admin labels them unassigned.
- Legacy `products.sub_category` text is retained; it is not a foreign key and is
  never used to infer category relationships.
- Draft ancestors hide their branch. Orphans, cycles, duplicate IDs/slugs, unknown
  sections and cross-section parent relationships are excluded from public results.
- Empty published categories have a usable page with zero products.
- New category pages: `/home-decor/category/[slug]`, for either product section.
  Existing `/home-decor?category=slug` and `/home-decor/[product-slug-or-id]` still work.
  `/home-decor?section=metal_services` browses Metal products. Services stay separate.

## Proposed migration / staging procedure

`category-hierarchy.sql` is deliberately outside the automatic migration directory.
It has **not** been executed or validated by PostgreSQL. Approval applies only to
staging after these preflight checks:

1. Confirm the staging project in the dashboard; take a schema/policy snapshot and
   export category IDs/slugs, product category IDs and all publication flags.
2. Inspect `information_schema.columns`, category constraints and `pg_policies`.
   Confirm actual column types, existing data, policy names and any additional
   permissive SELECT policies. Adjust this proposal to the live schema if necessary.
3. If hierarchy fields already exist, check unknown sections, invalid parent IDs,
   cross-section parents, cycles and duplicate/blank slugs. Do not auto-repair them.
   The proposed constraints fail transactionally on incompatible data.
4. Obtain explicit approval. Apply the reviewed transaction to staging only.
5. Test anonymous, ordinary authenticated and admin reads independently. A draft
   parent and its descendant products must be hidden publicly but editable by admin.
   Check legacy root visibility, empty categories, nested published counts and draft
   defaults. Test changes inside a controlled staging test fixture approved separately.

The proposal preserves all existing product IDs/category assignments, image URLs,
product/service publication flags and admin RLS policies. Public SELECT policies gain
an ancestor-aware visibility check so drafts are not exposed through the REST API.
The helper uses a fixed search path and returns only a visibility boolean.

Database constraints prevent self-parenting, nonexistent parents and cross-section
parents. Longer cycles are prevented by application validation and hidden by the
recursive visibility policy; direct administrative SQL must still be checked for
acyclicity. No automatic backfill or bulk import is included.

## Backfill needing separate approval

Prepare an explicit reviewed mapping of category ID -> section/parent/publication.
Existing categories with assigned products need special review because assigning a
section changes where all those products appear. No such mapping is known or supplied.
Do not infer it from names, images, product text or the nine curated service slugs.
New rows default to drafts; publication is an explicit admin action.

## Rollback

- Before COMMIT, a failed check rolls back the entire transaction.
- After rollout, the preferred rollback is to revert application changes while
  retaining the additive columns, data and stricter visibility policies. Reverting
  RLS to unrestricted category reads would expose newly drafted branches.
- A full schema rollback requires a fresh export, proof that no new hierarchy or
  publication state will be lost, and separate approval. Restore the saved policy
  definitions before removing the helper; then remove only this proposal's FK/check/
  unique constraints and index. Drop newly added columns only after preserving their
  values. Never drop columns that predated this proposal. No destructive rollback is
  executed or provided as an automatic command.
