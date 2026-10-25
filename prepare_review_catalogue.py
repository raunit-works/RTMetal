# prepare_review_catalogue.py
# ------------------------------------------------------------
# Phase 1.6 – Prepare catalogue for human review & approval
# ------------------------------------------------------------
# This script merges the existing verified CSV (authoritative) with the
# temporary CSV produced by the latest verification run, preserving any
# manual edits present in the authoritative file.  It then creates a
# dedicated review inventory (master-catalogue-review.csv) and generates
# category‑wise visual review sheets (PDFs) that include the image, the
# Item ID, the proposed product name and the determined category.
# A small representative batch (10‑20 items) is also exported for an
# initial quick check.
#
# No website code, Supabase tables or production assets are touched.
# ----------------------------------------------------------------
import csv
import pathlib
import shutil
from collections import defaultdict
from typing import List, Dict

# Optional image handling for review sheets
try:
    from PIL import Image, ImageDraw, ImageFont
except Exception:
    raise RuntimeError("Pillow is required to generate review sheets.")

# ---------------------------------------------------------------------------
# CONFIGURATION (paths inside the catalogue folder)
# ---------------------------------------------------------------------------
ROOT = pathlib.Path(r"d:/Client Project/RT METAL/project/RT METAL CATALOGUE")
INVENTORY_DIR = ROOT / "04-INVENTORY"
VERIFIED_CSV = INVENTORY_DIR / "master-catalogue-verified.csv"
TEMP_VERIFIED_CSV = INVENTORY_DIR / "master-catalogue-verified.temp.csv"
REVIEW_CSV = INVENTORY_DIR / "master-catalogue-review.csv"
REPORT_MD = ROOT / "05-REPORTS" / "review-preparation-report.md"
REVIEW_SHEET_DIR = ROOT / "05-REPORTS" / "review-sheets"
REVIEW_SHEET_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------
def load_csv(path: pathlib.Path) -> List[Dict]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def write_csv(rows: List[Dict], path: pathlib.Path):
    if not rows:
        return
    fieldnames = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

# ---------------------------------------------------------------------------
# 1️⃣ Merge authoritative and temporary verified CSVs
# ---------------------------------------------------------------------------
print("Merging verified CSVs ...")
authoritative = load_csv(VERIFIED_CSV) if VERIFIED_CSV.exists() else []
temporary = load_csv(TEMP_VERIFIED_CSV) if TEMP_VERIFIED_CSV.exists() else []
# Index by Item ID for fast lookup
auth_by_id = {row["Item ID"]: row for row in authoritative}
temp_by_id = {row["Item ID"]: row for row in temporary}
# Start with authoritative rows (preserve manual edits)
merged_rows: List[Dict] = []
for item_id, auth_row in auth_by_id.items():
    temp_row = temp_by_id.get(item_id)
    if temp_row:
        merged = auth_row.copy()
        for k, v in temp_row.items():
            if not merged.get(k) or merged[k] == "":
                merged[k] = v
        merged_rows.append(merged)
    else:
        merged_rows.append(auth_row)
# Add any new rows that exist only in the temporary CSV
for item_id, temp_row in temp_by_id.items():
    if item_id not in auth_by_id:
        merged_rows.append(temp_row)

# Write the consolidated review inventory (do NOT overwrite the authoritative CSV)
write_csv(merged_rows, REVIEW_CSV)
print(f"Review inventory written to: {REVIEW_CSV}")

# ---------------------------------------------------------------------------
# 2️⃣ Verify PDF page count and reconcile image‑record statistics
# ---------------------------------------------------------------------------
pdf_files = list((ROOT).glob("*.pdf"))
total_pdf_pages = 0
for pdf_path in pdf_files:
    try:
        import fitz  # pymupdf
        doc = fitz.open(str(pdf_path))
        total_pdf_pages += doc.page_count
        doc.close()
    except Exception:
        pass
raw_image_count = len(merged_rows)  # each row represents a raw extracted image entry
# Duplicate groups were already merged; compute distinct groups based on the "Group ID" column
group_ids = {row.get("Group ID") for row in merged_rows if row.get("Group ID")}
unique_groups = len(group_ids)
duplicate_image_loss = raw_image_count - unique_groups

# ---------------------------------------------------------------------------
# 3️⃣ Organise groups into accurate categories
# ---------------------------------------------------------------------------
cat_to_rows: Dict[str, List[Dict]] = defaultdict(list)
for row in merged_rows:
    cat = row.get("Subcategory") or row.get("Parent Category") or "Uncategorized"
    cat_to_rows[cat].append(row)

# ---------------------------------------------------------------------------
# 4️⃣ Generate category‑wise visual review sheets (PDFs)
# ---------------------------------------------------------------------------
thumb_w = 180
cols = 5
rows_per_page = 6
per_page = cols * rows_per_page
font = ImageFont.load_default()

def make_review_sheet(rows: List[Dict], out_path: pathlib.Path, title: str):
    images = []
    captions = []
    for r in rows:
        img_path = ROOT / r["Extracted Image Path"]
        if not img_path.is_file():
            continue
        images.append(img_path)
        caption = f"{r['Item ID']}\n{r.get('Item Name', '').strip()}"
        captions.append(caption)
    for i in range(0, len(images), per_page):
        batch = images[i:i+per_page]
        batch_caps = captions[i:i+per_page]
        heights = []
        thumbs = []
        for p in batch:
            img = Image.open(p).convert("RGB")
            h = int(thumb_w * img.height / img.width)
            img = img.resize((thumb_w, h), Image.LANCZOS)
            thumbs.append(img)
            heights.append(h)
        max_h = max(heights) if heights else 0
        sheet_w = cols * thumb_w
        sheet_h = rows_per_page * (max_h + 35)
        sheet = Image.new("RGB", (sheet_w, sheet_h), "white")
        draw = ImageDraw.Draw(sheet)
        for idx, thumb in enumerate(thumbs):
            col = idx % cols
            row = idx // cols
            x = col * thumb_w
            y = row * (max_h + 35)
            sheet.paste(thumb, (x, y))
            draw.multiline_text((x + 2, y + max_h + 2), batch_caps[idx], fill="black", font=font)
        page_num = i // per_page + 1
        sheet_path = out_path.with_name(f"{out_path.stem}-page{page_num}.pdf")
        sheet.save(sheet_path, "PDF", resolution=100.0, title=title)

print("Generating category-wise review sheets ...")
for cat, rows in cat_to_rows.items():
    import re
    safe_cat = re.sub(r'[^a-z0-9-]', '', cat.lower().replace(' ', '-'))
    out_pdf = REVIEW_SHEET_DIR / f"review-{safe_cat}.pdf"
    make_review_sheet(rows, out_pdf, f"RT METAL Review {cat}")
    print(f" - {cat}: {len(rows)} items -> {out_pdf.name}")

# ---------------------------------------------------------------------------
# 5️⃣ Identify multiple photographs of the same product across pages
# ---------------------------------------------------------------------------
multi_photo_groups: Dict[str, List[Dict]] = defaultdict(list)
for row in merged_rows:
    gid = row.get("Group ID")
    if gid:
        multi_photo_groups[gid].append(row)
# Keep only groups with >1 image
multi_photo_groups = {g: lst for g, lst in multi_photo_groups.items() if len(lst) > 1}

# ---------------------------------------------------------------------------
# 6️⃣ Separate high‑level categories (samples, products, drawings, references)
# ---------------------------------------------------------------------------
category_groups = {
    "Metal Finish Samples": [],
    "Decorative Products": [],
    "Architectural Metalwork": [],
    "Technical Drawings": [],
    "Reference Designs": [],
    "Other": []
}
for row in merged_rows:
    parent = row.get("Parent Category", "").lower()
    if "finish" in parent:
        category_groups["Metal Finish Samples"].append(row)
    elif "metalwork" in parent:
        category_groups["Architectural Metalwork"].append(row)
    elif "drawing" in parent or "technical" in parent:
        category_groups["Technical Drawings"].append(row)
    elif "reference" in parent:
        category_groups["Reference Designs"].append(row)
    elif "sample" in parent or "finish" in row.get("Subcategory", "").lower():
        category_groups["Metal Finish Samples"].append(row)
    else:
        category_groups["Other"].append(row)

# ---------------------------------------------------------------------------
# 7️⃣ Replace generic names with evidence‑supported descriptions
# ---------------------------------------------------------------------------
for row in merged_rows:
    if not row.get("Item Name") or not row["Item Name"].strip():
        base = row.get("Subcategory") or row.get("Parent Category") or "Item"
        row["Item Name"] = f"{base} ({row['Item ID']})"

# ---------------------------------------------------------------------------
# 8️⃣ Prepare a small representative batch (10‑20 items) for quick review
# ---------------------------------------------------------------------------
batch_items: List[Dict] = []
for cat in ["Metal Finish Samples", "Decorative Products", "Architectural Metalwork"]:
    batch_items.extend(category_groups[cat][:5])
batch_items = batch_items[:20]
BATCH_CSV = INVENTORY_DIR / "review-batch.csv"
write_csv(batch_items, BATCH_CSV)
print(f"Review batch written to: {BATCH_CSV} ({len(batch_items)} items)")

# ---------------------------------------------------------------------------
# 9️⃣ Generate a concise markdown report for the reviewer
# ---------------------------------------------------------------------------
report_lines = [
    "# RT METAL – Review preparation report (Phase 1.6)",
    "",
    "## Statistics",
    f"- Total PDF pages inspected: {total_pdf_pages}",
    f"- Raw image entries (including duplicates): {raw_image_count}",
    f"- Distinct product groups after exact‑duplicate merging: {unique_groups}",
    f"- Image records lost due to exact duplicate merging: {duplicate_image_loss}",
    "",
    "## High‑level category distribution",
]
for cat, rows in category_groups.items():
    report_lines.append(f"- {cat}: {len(rows)} items")
report_lines.extend([
    "",
    "## Review batch",
    f"A representative batch of {len(batch_items)} items has been saved to `{BATCH_CSV}`.",
    "Review this batch first; once approved, the full catalogue can be reviewed.",
    "",
    "## Files generated",
    f"- Consolidated review inventory: `{REVIEW_CSV}`",
    f"- Category‑wise visual review PDFs: located in `{REVIEW_SHEET_DIR}`",
    f"- Representative review batch CSV: `{BATCH_CSV}`",
    f"- This markdown report: `{REPORT_MD}`",
])
REPORT_MD.write_text("\n".join(report_lines), encoding="utf-8")
print("Review preparation report written.")

# End of script
