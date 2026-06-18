import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BANK_DETAILS } from "./services";

const BRAND = [218, 31, 38] as const;

function header(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFontSize(20);
  doc.setTextColor(BRAND[0], BRAND[1], BRAND[2]);
  doc.text("FUSIONPRO", 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("RealArc Estates · Operations", 14, 23);
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

export function generateQuotationPdf(q: QuotePdfInput) {
  const doc = new jsPDF();
  header(doc, "QUOTATION", `No: ${q.quoteNo || "DRAFT"}  •  ${q.date}`);

  let y = 34;
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
    headStyles: { fillColor: [30, 30, 30] },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
  });

  let fy = getY(doc) + 6;
  doc.setFontSize(10);
  doc.text(`Labour: KES ${q.labour.toFixed(2)}`, 200, fy, { align: "right" });
  doc.text(`Sub-total: KES ${q.subtotal.toFixed(2)}`, 200, fy + 6, { align: "right" });
  doc.setFontSize(12);
  doc.text(`Grand Total: KES ${q.grandTotal.toFixed(2)}`, 200, fy + 14, { align: "right" });

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

  doc.save(`Quotation-${(q.quoteNo || "draft").replace(/\W+/g, "_")}.pdf`);
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

export function generateInspectionPdf(input: InspectionPdfInput) {
  const doc = new jsPDF();
  header(doc, "INSPECTION REPORT", input.inspectionDate);
  let y = 34;
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

  autoTable(doc, {
    startY: y + 28,
    head: [["Work Item", "Remarks", "Status"]],
    body: input.checklist.map((c) => [c.item, c.remark ?? "", c.pass ? "PASS" : "FAIL"]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 30, 30] },
    columnStyles: { 2: { halign: "center", cellWidth: 22 } },
  });

  let fy = getY(doc) + 6;
  if (input.photoEvidence.length) {
    doc.setFontSize(11);
    doc.text("Photo Evidence", 14, fy);
    fy += 4;
    autoTable(doc, {
      startY: fy,
      head: [["Before", "During", "After"]],
      body: input.photoEvidence.map((p) => [
        p.before ? "✓" : "—",
        p.during ? "✓" : "—",
        p.after ? "✓" : "—",
      ]),
      styles: { fontSize: 9, halign: "center" },
      headStyles: { fillColor: [30, 30, 30], halign: "center" },
    });
    fy = getY(doc) + 6;
  }

  if (fy > 240) { doc.addPage(); fy = 20; }
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

  doc.save(`Inspection-${input.projectName.replace(/\W+/g, "_")}-${Date.now()}.pdf`);
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

export function generateWorksheetPdf(w: WorksheetPdfInput) {
  const doc = new jsPDF();
  header(doc, "WORKSHEET", `Job ${w.jobNo}  •  ${w.jobDate}`);
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
    headStyles: { fillColor: [30, 30, 30] },
  });
  let fy = getY(doc) + 8;
  if (w.imagesBefore.length) {
    doc.setFontSize(10);
    doc.text(`Images Before: ${w.imagesBefore.length} attached`, 14, fy);
    fy += 6;
  }
  if (fy > 240) { doc.addPage(); fy = 20; }
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
  doc.save(`Worksheet-${w.jobNo.replace(/\W+/g, "_") || "job"}-${Date.now()}.pdf`);
}

// ---------------- CSV ----------------
export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
