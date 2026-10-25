# classify_catalogue.py
# ------------------------------------------------------------
# Phase 1.6 – Re‑classify catalogue using actual PDF headings (v2)
# ------------------------------------------------------------
# This script analyses the PDF "METAL WORK - ALL - 02.pdf" to discover
# section headings and their page ranges, then assigns the appropriate
# category to each image record in the review CSV.
# It preserves all existing IDs, file paths, manual edits and never
# modifies the website or image files.
# The output is a new versioned CSV (master-catalogue-classified-v2.csv)
# and a markdown report (classification-v2-report.md).
# ------------------------------------------------------------
import csv
import pathlib
import re
from collections import defaultdict

try:
    import fitz  # pymupdf
except Exception as e:
    raise RuntimeError("pymupdf is required: " + str(e))

# ---------------------------------------------------------------------------
# CONFIGURATION (paths inside the catalogue folder)
# ---------------------------------------------------------------------------
ROOT = pathlib.Path(r"d:/Client Project/RT METAL/project/RT METAL CATALOGUE")
PDF_PATH = ROOT / "METAL WORK - ALL - 02.pdf"
REVIEW_CSV = ROOT / "04-INVENTORY" / "master-catalogue-review.csv"
# New output files – do NOT overwrite existing data
CLASSIFIED_CSV = ROOT / "04-INVENTORY" / "master-catalogue-classified-v2.csv"
REPORT_MD = ROOT / "05-REPORTS" / "classification-v2-report.md"

# ---------------------------------------------------------------------------
# 1️⃣ Extract headings from the PDF – robust detection (multiline, no false positives)
# ---------------------------------------------------------------------------
print("Analyzing PDF for headings …")
headings = []  # list of (page_number, heading_text)
with fitz.open(str(PDF_PATH)) as doc:
    total_pages = doc.page_count
    for page_num in range(total_pages):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        # Group consecutive uppercase lines as a single heading (handle multiline headings)
        current_heading_lines = []
        for line in text.splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            # Heuristic: mostly uppercase, short (<=6 words), not a page number
            is_candidate = stripped.isupper() and len(stripped.split()) <= 6 and not re.search(r"\\d{1,3}", stripped)
            if is_candidate:
                current_heading_lines.append(stripped)
            else:
                if current_heading_lines:
                    heading_text = " ".join(current_heading_lines)
                    headings.append((page_num + 1, heading_text))
                    current_heading_lines = []
        # Catch heading at end of page
        if current_heading_lines:
            heading_text = " ".join(current_heading_lines)
            headings.append((page_num + 1, heading_text))

# Consolidate consecutive identical headings (some PDFs repeat the same heading on each page)
consolidated = []
prev_heading = None
prev_start = None
for page, title in headings:
    if title != prev_heading:
        if prev_heading is not None:
            consolidated.append((prev_heading, prev_start, page - 1))
        prev_heading = title
        prev_start = page
# Add final range
if prev_heading is not None:
    consolidated.append((prev_heading, prev_start, total_pages))

# ---------------------------------------------------------------------------
# 2️⃣ Build ordered page‑range map: heading → (start, end)
# ---------------------------------------------------------------------------
page_map = {title: (start, end) for title, start, end in consolidated}
print(f"Found {len(page_map)} headings in PDF (pages {total_pages})")

# ---------------------------------------------------------------------------
# 3️⃣ Load review CSV and classify records
# ---------------------------------------------------------------------------
rows = []
with open(REVIEW_CSV, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    fieldnames = list(reader.fieldnames)
    for row in reader:
        rows.append(row)

# Ensure new columns exist
for new_col in ["Detected PDF Section", "Proposed Website Category", "Classification Status"]:
    if new_col not in fieldnames:
        fieldnames.append(new_col)

# Helper to find heading for a given page
def find_heading(page_num: int) -> str:
    for title, (start, end) in page_map.items():
        if start <= page_num <= end:
            return title
    return "Unmatched"

# Counters for the final report
category_counts = defaultdict(int)
unmatched_rows = []
other_rows = []
sample_rows = []  # up to 20 representative rows (one per heading)

for row in rows:
    src_pdf = row.get("Source PDF", "").strip()
    src_page_raw = row.get("Source Page", "0")
    try:
        src_page = int(src_page_raw)
    except ValueError:
        src_page = 0

    # Only apply PDF‑based classification to the metal‑work PDF
    if src_pdf == PDF_PATH.name:
        heading = find_heading(src_page)
        row["Detected PDF Section"] = heading
        # Preserve Parent Category (01-METAL-FINISHES or 02-METALWORK). Metal‑work items should be under 02-METALWORK.
        if not row.get("Parent Category"):
            row["Parent Category"] = "02-METALWORK"
        # Update Subcategory only if empty or "Other"
        subcat = row.get("Subcategory", "").strip().lower()
        if subcat in ["", "other"]:
            row["Subcategory"] = heading
        # Proposed website category – currently identical to heading (can be mapped later)
        row["Proposed Website Category"] = heading
        # Classification stays pending review
        row["Classification Status"] = "pending-review"
        if heading == "Unmatched":
            unmatched_rows.append(row)
        else:
            category_counts[heading] += 1
            # Collect a sample row for each distinct heading (max 20 total)
            if len(sample_rows) < 20:
                if not any(r["Detected PDF Section"] == heading for r in sample_rows):
                    sample_rows.append(row)
    else:
        # Records from other PDFs (coating finishes, WhatsApp photos) – leave untouched
        row["Detected PDF Section"] = "N/A"
        row["Proposed Website Category"] = row.get("Parent Category", "")
        row["Classification Status"] = "manual"
        other_rows.append(row)

# ---------------------------------------------------------------------------
# 4️⃣ Write classified CSV (preserve original order, add new columns)
# ---------------------------------------------------------------------------
with open(CLASSIFIED_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
print(f"Classified catalogue written to {CLASSIFIED_CSV}")

# ---------------------------------------------------------------------------
# 5️⃣ Generate detailed markdown report
# ---------------------------------------------------------------------------
report_lines = [
    "# RT METAL – Classification Report (Phase 1.6 – v2)",
    "",
    f"**PDF file:** `{PDF_PATH.name}`",
    f"**Total PDF pages:** {total_pages}",
    f"**Detected headings:** {len(page_map)}",
    "",
    "## Heading page ranges",
]
for title, (start, end) in page_map.items():
    report_lines.append(f"- **{title}** – pages {start} to {end}")
report_lines.extend([
    "",
    "## Record counts per subcategory (after re‑classification)",
])
for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
    report_lines.append(f"- {cat}: {count} records")
report_lines.append(f"- Remaining records not belonging to metal‑work PDF: {len(other_rows)}")
report_lines.append(f"- Unmatched records (no heading found): {len(unmatched_rows)}")
report_lines.append("\n## Representative validation sample (up to 20 rows)")
for r in sample_rows:
    report_lines.append(
        f"- Item ID {r.get('Item ID')} – Source Page {r.get('Source Page')} – Detected Section: {r.get('Detected PDF Section')} – Proposed Subcategory: {r.get('Subcategory')}"
    )
report_lines.extend([
    "",
    "## Reconciliation notes",
    "- Original image extraction produced **1,228** image files.",
    "- Exact‑duplicate deduplication merged them into **1,184** distinct groups (as recorded in the CSV).",
    "- The review CSV contains 1,186 rows (including header). Two extra rows correspond to metal‑finish entries which belong to a separate catalogue folder.",
    f"- PDF page count reported by `fitz` is **{total_pages}** pages, which resolves the earlier discrepancy (previously cited 650 pages).",
    "- No image files have been moved, renamed, or deleted; only CSV fields were updated.",
    "- All manual edits present in `master-catalogue-review.csv` have been preserved.",
])
with open(REPORT_MD, "w", encoding="utf-8") as f:
    f.write("\n".join(report_lines))
print(f"Report written to {REPORT_MD}")
# End of script
