import sys
from pathlib import Path

FILE = Path(sys.argv[1])
text = FILE.read_text()

old_a = '''    return await convertBlobToPngDataUrl(blob);
  } catch (error) {
    console.error("Failed to convert image URL to data URL:", error, url);
    return "";
  }
}

async function header(doc: jsPDF, title: string, subtitle?: string) {'''

new_a = '''    return await convertBlobToPngDataUrl(blob);
  } catch (error) {
    console.error("Failed to convert image URL to data URL:", error, url);
    return "";
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function fetchWithRetry(url: string, retries = 2, timeoutMs = 15000): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { mode: "cors", signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

function compressImageDataUrl(dataUrl: string, maxDim = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas context"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("image decode failed"));
    img.src = dataUrl;
  });
}

async function urlToCompressedDataUrl(url?: string): Promise<{ data: string; error?: string }> {
  if (!url) return { data: "" };
  try {
    let raw: string;
    if (url.startsWith("data:image/")) {
      raw = url;
    } else {
      const resolvedUrl = typeof window !== "undefined" ? new URL(url, window.location.href).href : url;
      const res = await fetchWithRetry(resolvedUrl);
      const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.startsWith("image/")) throw new Error(`bad content-type: ${contentType}`);
      const blob = await res.blob();
      raw = await blobToDataUrl(blob);
    }
    const compressed = await compressImageDataUrl(raw);
    return { data: compressed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Image failed:", url, msg);
    return { data: "", error: msg };
  }
}

async function header(doc: jsPDF, title: string, subtitle?: string) {'''

old_b = '''  let fy = getY(doc) + 6;
  if (input.photoEvidence.length) {
    console.log("generateInspectionPdf received photoEvidence:", JSON.stringify(input.photoEvidence, null, 2));
    console.log(
      "generateInspectionPdf received photoEvidence summary:",
      input.photoEvidence.map((p) => ({ before: p.before?.slice(0, 80), during: p.during?.slice(0, 80), after: p.after?.slice(0, 80) })),
    );
    doc.setFontSize(11);
    doc.text("Photo Evidence", 14, fy);
    fy += 4;

    const photosData = await Promise.all(
      input.photoEvidence.map(async (p) => ({
        before: p.before ? await urlToDataUrl(p.before) : "",
        during: p.during ? await urlToDataUrl(p.during) : "",
        after: p.after ? await urlToDataUrl(p.after) : "",
      })),
    );

    console.log(
      "generateInspectionPdf converted photo data:",
      photosData.map((p) => ({ before: p.before ? p.before.length : 0, during: p.during ? p.during.length : 0, after: p.after ? p.after.length : 0 })),
    ); 

    autoTable(doc, {
      startY: fy,
      head: [["Before", "During", "After"]],
      body: photosData.map(() => [ "",  "", ""]),
      styles: { fontSize: 9, halign: "center", valign: "middle",minCellHeight: 45 },
      headStyles: { fillColor: BRAND, textColor: 255, halign: "center" ,minCellHeight: 10 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 60 }, 2: { cellWidth: 60 } },
      didDrawCell: (data: any) => {
    if (data.section !== "body") return;

    const field = ["before", "during", "after"][data.column.index] as
      | "before"
      | "during"
      | "after";

    const img = photosData[data.row.index]?.[field];

    if (!img) return;

    try {
      doc.addImage(
        img,
        getImageTypeFromDataUrl(img),
        data.cell.x + 2,
        data.cell.y + 2,
        data.cell.width - 4,
        data.cell.height - 4
      );
    } catch (err) {
      console.error("Failed to draw image:", err);
    }
  },
    });
    fy = getY(doc) + 6;
  }'''

new_b = '''  let fy = getY(doc) + 6;
  if (input.photoEvidence.length) {
    doc.setFontSize(11);
    doc.text("Photo Evidence", 14, fy);
    fy += 4;

    const failedImages: string[] = [];

    const photosData = await mapWithConcurrency(
      input.photoEvidence,
      6,
      async (p, idx) => {
        const [before, during, after] = await Promise.all([
          urlToCompressedDataUrl(p.before),
          urlToCompressedDataUrl(p.during),
          urlToCompressedDataUrl(p.after),
        ]);
        if (p.before && before.error) failedImages.push(`Row ${idx + 1} (before)`);
        if (p.during && during.error) failedImages.push(`Row ${idx + 1} (during)`);
        if (p.after && after.error) failedImages.push(`Row ${idx + 1} (after)`);
        return { before: before.data, during: during.data, after: after.data };
      },
    );

    autoTable(doc, {
      startY: fy,
      head: [["Before", "During", "After"]],
      body: photosData.map(() => [ "",  "", ""]),
      styles: { fontSize: 9, halign: "center", valign: "middle",minCellHeight: 45 },
      headStyles: { fillColor: BRAND, textColor: 255, halign: "center" ,minCellHeight: 10 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 60 }, 2: { cellWidth: 60 } },
      didDrawCell: (data: any) => {
    if (data.section !== "body") return;

    const field = ["before", "during", "after"][data.column.index] as
      | "before"
      | "during"
      | "after";

    const img = photosData[data.row.index]?.[field];

    if (!img) return;

    try {
      doc.addImage(
        img,
        "JPEG",
        data.cell.x + 2,
        data.cell.y + 2,
        data.cell.width - 4,
        data.cell.height - 4
      );
    } catch (err) {
      console.error("Failed to draw image:", err);
      failedImages.push(`Row ${data.row.index + 1} (${field}) - render error`);
    }
  },
    });
    fy = getY(doc) + 6;

    if (failedImages.length) {
      doc.setFontSize(8);
      doc.setTextColor(200, 0, 0);
      doc.text(`Note: ${failedImages.length} image(s) could not be embedded: ${failedImages.join(", ")}`, 14, fy, { maxWidth: 186 });
      doc.setTextColor(20);
      fy += 8;
    }
  }'''

def apply_patch(text, old, new, label):
    count = text.count(old)
    if count == 0:
        print(f"FAILED - {label}: no exact match found. Nothing was changed.")
        sys.exit(1)
    if count > 1:
        print(f"FAILED - {label}: match found {count} times, expected exactly 1. Nothing was changed.")
        sys.exit(1)
    return text.replace(old, new)

text = apply_patch(text, old_a, new_a, "Patch A (helper functions)")
text = apply_patch(text, old_b, new_b, "Patch B (photo loading block)")

FILE.write_text(text)
print("Both patches applied successfully.")
