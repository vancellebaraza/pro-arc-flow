import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BANK_DETAILS } from "./services";

const BRAND = [218, 31, 38] as const;
const whatsappLogoUrl = "/WhatsApp Image 2026-07-04 at 09.55.16 (1).jpeg";

function getImageTypeFromDataUrl(dataUrl: string) {
  const match = /^data:image\/(png|jpeg|jpg|webp|bmp)(?:;[^,]*)?,/.exec(dataUrl);
  if (!match) return "JPEG";
  const type = match[1].toUpperCase();
  return type === "JPG" ? "JPEG" : type;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function convertBlobToPngDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Cannot create canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for conversion"));
    };
    img.src = url;
  });
}

async function urlToDataUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("data:image/")) return url;

  try {
    const resolvedUrl = typeof window !== "undefined" ? new URL(url, window.location.href).href : url;
    const res = await fetch(resolvedUrl, { mode: "cors" });
    if (!res.ok) {
      console.error(`Failed to fetch image URL (${res.status}): ${resolvedUrl}`);
      return "";
    }
    const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("image/")) {
      console.error(`Unexpected image content type: ${contentType} for ${resolvedUrl}`);
      return "";
    }
    const blob = await res.blob();
    const type = blob.type.toLowerCase();
    if (type === "image/png" || type === "image/jpeg" || type === "image/jpg") {
      return await blobToDataUrl(blob);
    }
    return await convertBlobToPngDataUrl(blob);
  } catch (error) {
    console.error("Failed to convert image URL to data URL:", error, url);
    return "";
  }
}

async function header(doc: jsPDF, title: string, subtitle?: string) {
    const pageWidth = doc.internal.pageSize.getWidth();

  doc.setDrawColor(BRAND[0], BRAND[1], BRAND[2]);

  doc.setLineWidth(2);
  doc.line(0, 2, pageWidth, 2);

  doc.setLineWidth(0.5);
  doc.line(0, 6, pageWidth, 6);

  try {
    if (typeof window !== "undefined") {
      const logoData = await urlToDataUrl(whatsappLogoUrl);
      if (logoData) {
        doc.addImage(logoData, getImageTypeFromDataUrl(logoData), 14, 6.4, 70, 18);
      }
    }
  } catch (err) {
    // Non-fatal — continue without logo
    // eslint-disable-next-line no-console
    console.error("Header logo not added:", err);
  }

  // doc.setFontSize(20);
  // doc.setTextColor(BRAND[0], BRAND[1], BRAND[2]);
  // doc.text("FUSIONPRO", 14, 18);
  // doc.setFontSize(9);
  // doc.setTextColor(110);
  // doc.text("RealArc Estates · Operations", 14, 23);
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text(title, 200, 18, { align: "right" });
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(subtitle, 200, 23, { align: "right" });
  }
  doc.setDrawColor(220);
  doc.line(14, 28, 200, 28);
}

function getY(doc: jsPDF) {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

// ---------------- QUOTATION ----------------
export interface QuoteItem {
  description: string;
  unit?: string | null;
  qty: number;
  unit_cost: number;
  amount: number;
}
export interface QuotePdfInput {
  vatRate: number;
  vatAmount: number;
  projectTitle: string;
  service: string;
  location?: string | null;
  billTo?: string;
  quoteNo?: string;
  date: string;
  to?: string;
  forText?: string;
  items: QuoteItem[];
  labour: number;
  subtotal: number;
  grandTotal: number;
  authorisedBy?: string;
  notes?: string | null;
}

export async function generateQuotationPdf(doc:jsPDF,q: QuotePdfInput) {
  // const doc = new jsPDF();
  await header(doc, "QUOTATION", `No: ${q.quoteNo || "DRAFT"}  •  ${q.date}`);

  const y = 34;
  doc.setFontSize(10);
  doc.setTextColor(20);
  doc.text(`Bill To: ${q.billTo || "—"}`, 14, y);
  doc.text(`To: ${q.to || "—"}`, 14, y + 6);
  doc.text(`For: ${q.forText || "—"}`, 14, y + 12);
  doc.text(`Project: ${q.projectTitle}`, 120, y);
  doc.text(`Service: ${q.service}`, 120, y + 6);
  if (q.location) doc.text(`Location: ${q.location}`, 120, y + 12);

  autoTable(doc, {
    startY: y + 20,
    head: [["Description / Detail", "Unit", "Quantity", "Unit Cost (KES)", "Amount (KES)"]],
    body: q.items.map((i) => [
      i.description,
      i.unit ?? "",
      String(i.qty),
      i.unit_cost.toFixed(2),
      i.amount.toFixed(2),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: BRAND, textColor: 255 },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
  });

  let fy = getY(doc) + 6;
  doc.setFontSize(10);
  doc.text(`Labour: KES ${q.labour.toFixed(2)}`, 200, fy, { align: "right" });
  doc.text(`Sub-total: KES ${q.subtotal.toFixed(2)}`, 200, fy + 6, { align: "right" });
  doc.text(`VAT (${q.vatRate}%): KES ${q.vatAmount.toFixed(2)}`,200,fy + 12,{ align: "right" });
  doc.setFontSize(12);
  doc.text(`Grand Total: KES ${q.grandTotal.toFixed(2)}`, 200, fy + 20, { align: "right" });

  fy += 24;
  doc.setFontSize(10);
  doc.text("Authorised By:", 14, fy);
  doc.setTextColor(90);
  doc.text(q.authorisedBy || "_______________________", 45, fy);
  doc.setTextColor(20);

  fy += 12;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, fy, 186, 36, "F");
  doc.setFontSize(10);
  doc.text("Payment — Bank Details", 18, fy + 6);
  doc.setFontSize(9);
  doc.setTextColor(60);
  const lines = [
    `Bank: ${BANK_DETAILS.bank}`,
    `Account Name: ${BANK_DETAILS.account_name}`,
    `Branch: ${BANK_DETAILS.branch}`,
    `Bank Code: ${BANK_DETAILS.bank_code}`,
    `Account No: ${BANK_DETAILS.account_number}`,
    `Swift Code: ${BANK_DETAILS.swift_code}`,
  ];
  lines.forEach((l, i) => doc.text(l, 18 + (i % 2) * 95, fy + 14 + Math.floor(i / 2) * 6));

  if (q.notes) {
    doc.setTextColor(80);
    doc.text("Notes: " + q.notes, 14, fy + 46, { maxWidth: 186 });
  }

  // doc.save(`Quotation-${(q.quoteNo || "draft").replace(/\W+/g, "_")}.pdf`);
}

// ---------------- INSPECTION ----------------
export interface InspectionPdfInput {
  workCategory: string;
  projectName: string;
  clientName: string;
  siteLocation: string;
  inspectionDate: string;
  inspectorName: string;
  technician: string;
  checklist: Array<{ item: string; remark?: string; pass: boolean }>;
  photoEvidence: Array<{ before?: string; during?: string; after?: string; note?: string }>;
  signatures: {
    client_name?: string;
    inspector_name?: string;
    technician_name?: string;
  };
}

export async function generateInspectionPdf(doc:jsPDF,input: InspectionPdfInput) {
  // const doc = new jsPDF();
  await header(doc, "INSPECTION REPORT", input.inspectionDate);
  const y = 34;
  doc.setFontSize(10);
  doc.setTextColor(20);
  const left = [
    `Work Category: ${input.workCategory}`,
    `Project Name: ${input.projectName}`,
    `Client Name: ${input.clientName}`,
    `Site Location: ${input.siteLocation}`,
  ];
  const right = [
    `Inspection Date: ${input.inspectionDate}`,
    `Inspector: ${input.inspectorName}`,
    `Technician: ${input.technician}`,
  ];
  left.forEach((l, i) => doc.text(l, 14, y + i * 6));
  right.forEach((l, i) => doc.text(l, 120, y + i * 6));

  const passCount = input.checklist.filter((c) => c.pass).length;
  const failCount = input.checklist.filter((c) => !c.pass).length;
  const boxWidth = 50;
  const boxHeight = 10;
  const boxY = y + 28;
  const tableLeft = 14;
  const tableRight = doc.internal.pageSize.getWidth() - 14;

  doc.setDrawColor(BRAND[0], BRAND[1], BRAND[2]);
  doc.setLineWidth(1);
  doc.line(tableLeft, boxY - 2, tableRight, boxY - 2);

  doc.setFillColor(0, 128, 0);
  doc.rect(tableLeft, boxY, boxWidth, boxHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Passed: ${passCount}`, tableLeft + 2, boxY + 7);

  doc.setFillColor(BRAND[0], BRAND[1], BRAND[2]);
  doc.rect(tableLeft + boxWidth + 8, boxY, boxWidth, boxHeight, "F");
  doc.text(`Failed: ${failCount}`, tableLeft + boxWidth + 10, boxY + 7);

  const tableStartY = boxY + boxHeight + 8;
  autoTable(doc, {
    startY: tableStartY,
    head: [["Work Item", "Remarks", "Status"]],
    body: input.checklist.map((c) => [c.item, c.remark ?? "", c.pass ? "PASS" : "FAIL"]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: BRAND, textColor: 255 },
    columnStyles: { 2: { halign: "center", cellWidth: 22 } },
    didParseCell: (data: any) => {
      if (data.section !== "body" || data.column.index !== 2) return;
      const statusText = String(data.cell.text?.[0] ?? "");
      if (statusText === "PASS") {
        data.cell.styles.textColor = [0, 128, 0];
      } else if (statusText === "FAIL") {
        data.cell.styles.textColor = [255, 0, 0];
      }
    },
  });

  let fy = getY(doc) + 6;
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
  }

  if (fy > 240) {
    doc.addPage();
    fy = 20;
  }
  doc.setFontSize(11);
  doc.text("Sign-off", 14, fy);
  fy += 6;
  doc.setFontSize(9);
  doc.setTextColor(80);
  const sigs = [
    { role: "Client", name: input.signatures.client_name ?? "—" },
    { role: "Inspector", name: input.signatures.inspector_name ?? "—" },
    { role: "Technician", name: input.signatures.technician_name ?? "—" },
  ];
  sigs.forEach((s, i) => {
    const x = 14 + i * 62;
    doc.text(`${s.role}: ${s.name}`, x, fy);
    doc.line(x, fy + 14, x + 55, fy + 14);
    doc.text("Signature", x, fy + 19);
  });

  // doc.save(`Inspection-${input.projectName.replace(/\W+/g, "_")}-${Date.now()}.pdf`);
}

// ---------------- WORKSHEET ----------------
export interface WorksheetPdfInput {
  clientName: string;
  jobNo: string;
  jobLocation: string;
  jobDate: string;
  jobType: string;
  technician: string;
  personInCharge: string;
  jobDescription: string;
  observations: Array<{ observation: string; action: string }>;
  imagesBefore: string[];
  signatures: { technician_name?: string; supervisor_name?: string; client_name?: string };
}

export async function generateWorksheetPdf(doc:jsPDF,w: WorksheetPdfInput) {
  // const doc = new jsPDF();
  await header(doc, "WORKSHEET", `Job ${w.jobNo}  •  ${w.jobDate}`);
  let y = 34;
  doc.setFontSize(10);
  doc.setTextColor(20);
  const rows: Array<[string, string]> = [
    ["Client Name", w.clientName],
    ["Job No.", w.jobNo],
    ["Job Location", w.jobLocation],
    ["Job Date", w.jobDate],
    ["Job Type", w.jobType],
    ["Technician", w.technician],
    ["Person in Charge", w.personInCharge],
  ];
  rows.forEach((r, i) => {
    const x = 14 + (i % 2) * 95;
    const yy = y + Math.floor(i / 2) * 6;
    doc.text(`${r[0]}: ${r[1]}`, x, yy);
  });
  y = y + Math.ceil(rows.length / 2) * 6 + 4;
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text("Job Description:", 14, y);
  doc.setTextColor(20);
  doc.text(doc.splitTextToSize(w.jobDescription || "—", 186), 14, y + 5);

  autoTable(doc, {
    startY: y + 5 + Math.max(6, doc.splitTextToSize(w.jobDescription || "—", 186).length * 5),
    head: [["Technician's Observation", "Action to Be Taken"]],
    body: w.observations.map((o) => [o.observation, o.action]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: BRAND, textColor: 255 },
  });
  let fy = getY(doc) + 8;
  if (w.imagesBefore.length) {
    doc.setFontSize(10);
    doc.text(`Images Before: ${w.imagesBefore.length} attached`, 14, fy);
    fy += 6;

    const imgData = await Promise.all(w.imagesBefore.map((img) => urlToDataUrl(img)));
    const imageYStart = fy;
    const imageWidth = 60;
    const imageHeight = 45;
    imgData.forEach((img, index) => {
      if (!img) return;
      const x = 14 + (index % 3) * (imageWidth + 10);
      const yPos = imageYStart + Math.floor(index / 3) * (imageHeight + 10);
      doc.addImage(img, x, yPos, imageWidth, imageHeight);
    });
    fy += Math.ceil(w.imagesBefore.length / 3) * (imageHeight + 10);
  }
  if (fy > 240) {
    doc.addPage();
    fy = 20;
  }
  doc.setFontSize(11);
  doc.text("Signatures", 14, fy);
  fy += 6;
  doc.setFontSize(9);
  const sigs = [
    { role: "Technician", name: w.signatures.technician_name ?? "—" },
    { role: "Supervisor", name: w.signatures.supervisor_name ?? "—" },
    { role: "Client", name: w.signatures.client_name ?? "—" },
  ];
  sigs.forEach((s, i) => {
    const x = 14 + i * 62;
    doc.text(`${s.role}: ${s.name}`, x, fy);
    doc.line(x, fy + 14, x + 55, fy + 14);
    doc.text("Signature", x, fy + 19);
  });
  // doc.save(`Worksheet-${w.jobNo.replace(/\W+/g, "_") || "job"}-${Date.now()}.pdf`);
}

export async function generateProjectPdf({
    project,
    quotation,
    inspection,
    worksheet,
}: {
  project: {
    title: string;
    location?: string | null;
    service: string;
  };
  quotation: QuotePdfInput;
  inspection: InspectionPdfInput;
  worksheet: WorksheetPdfInput;
}) {
    const doc = new jsPDF();

    //
    // Cover Page
    //

    await header(doc, "PROJECT REPORT");

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();

const centerX = pageWidth / 2;
const centerY = pageHeight / 2;

// Vertical spacing
const titleY = centerY - 25;
const projecttitleY=centerY- 8;
const locationY = centerY + 8;
const serviceY = centerY + 20;

doc.setFont("helvetica", "bold");
doc.setFontSize(40);
doc.text("Overall Project Report", centerX, titleY, {
  align: "center",
});

doc.setFont("helvetica", "normal");
doc.setFontSize(16);
doc.text(`Project Title: ${project.title}`, centerX, projecttitleY, {
  align: "center",
});
doc.text(`Location: ${project.location ?? "-"}`, centerX, locationY, {
  align: "center",
});

doc.text(`Service: ${project.service}`, centerX, serviceY, {
  align: "center",
});


    //
    // Quotation
    //

    doc.addPage();
    await generateQuotationPdf(doc, quotation);

    //
    // Inspection
    //

    doc.addPage();
    await generateInspectionPdf(doc, inspection);

    //
    // Worksheet
    //

    doc.addPage();
    await generateWorksheetPdf(doc, worksheet);

    doc.save(`${project.title}-Project-Report.pdf`);
}

// ---------------- CSV ----------------
export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join(
    "\n",
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
}
