import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface HistoricalProject {
  no: string;
  clientDate: string;
  projectId: string;
  projectName: string;
  location: string;
  quotedAmt: number;
  paidByClient: number;
  dueFromClient: number;
  vendorName: string;
  vendorQuoted: number;
  variance: number;
  amountPayable: number;
  paidToVendor: number;
  dueToVendor: number;
  margin: number;
  marginPct: number;
  workDoneDate: string;
}

export const HISTORICAL_PROJECTS: HistoricalProject[] = [
  { no: "1", clientDate: "29/3/2026", projectId: "FUS-336", projectName: "Tank cleaning whole estate", location: "Jambo", quotedAmt: 62000, paidByClient: 62000, dueFromClient: 0, vendorName: "SecAqua", vendorQuoted: 51500, variance: 0, amountPayable: 51500, paidToVendor: 51500, dueToVendor: 0, margin: 10500, marginPct: 20, workDoneDate: "20/4/2026" },
  { no: "2", clientDate: "29/3/2026", projectId: "FUS-335", projectName: "Solar Lights installation - whole estate", location: "The Pointe", quotedAmt: 28000, paidByClient: 28000, dueFromClient: 0, vendorName: "John Njeru", vendorQuoted: 11500, variance: 0, amountPayable: 11500, paidToVendor: 11500, dueToVendor: 0, margin: 16500, marginPct: 143, workDoneDate: "21/4/2026" },
  { no: "2a", clientDate: "12/6/2026", projectId: "FUS-355", projectName: "Solar Lights installation - whole estate", location: "The Pointe", quotedAmt: 9600, paidByClient: 9600, dueFromClient: 0, vendorName: "John Njeru", vendorQuoted: 6200, variance: 0, amountPayable: 6200, paidToVendor: 6200, dueToVendor: 0, margin: 3400, marginPct: 55, workDoneDate: "29/6/2026" },
  { no: "3", clientDate: "2/4/2026", projectId: "FUS-340", projectName: "Repainting - stairway entry", location: "Mac", quotedAmt: 299800, paidByClient: 299800, dueFromClient: 0, vendorName: "Ayub Miruka", vendorQuoted: 266300, variance: 0, amountPayable: 266300, paidToVendor: 266300, dueToVendor: 0, margin: 33500, marginPct: 13, workDoneDate: "4/5/2026" },
  { no: "4", clientDate: "13/4/2026", projectId: "FUS-342", projectName: "Wall repair - Perimeter wall", location: "Muthama", quotedAmt: 148920, paidByClient: 148920, dueFromClient: 0, vendorName: "Onesmus Maitha", vendorQuoted: 134060, variance: 0, amountPayable: 134060, paidToVendor: 134060, dueToVendor: 0, margin: 14860, marginPct: 11, workDoneDate: "26/5/2026" },
  { no: "5", clientDate: "3/12/2025", projectId: "FUS-321", projectName: "Welding", location: "Blue Bells", quotedAmt: 20200, paidByClient: 20200, dueFromClient: 0, vendorName: "Welder", vendorQuoted: 12000, variance: 0, amountPayable: 12000, paidToVendor: 12000, dueToVendor: 0, margin: 8200, marginPct: 68, workDoneDate: "3/1/2026" },
  { no: "6", clientDate: "3/12/2025", projectId: "FUS-322", projectName: "Painting and Minor Plumbing and Electricals", location: "KV Homes A9", quotedAmt: 41050, paidByClient: 41050, dueFromClient: 0, vendorName: "John Njeru & Ayub Miruka", vendorQuoted: 22133, variance: 0, amountPayable: 22133, paidToVendor: 22133, dueToVendor: 0, margin: 18917, marginPct: 85, workDoneDate: "3/1/2026" },
  { no: "7", clientDate: "3/12/2025", projectId: "FUS-323", projectName: "Painting and Minor Plumbing and Electricals", location: "KV Homes B6", quotedAmt: 51500, paidByClient: 51500, dueFromClient: 0, vendorName: "John Njeru & Ayub Miruka", vendorQuoted: 27767, variance: 0, amountPayable: 27767, paidToVendor: 27767, dueToVendor: 0, margin: 23733, marginPct: 85, workDoneDate: "3/1/2026" },
  { no: "8", clientDate: "3/12/2025", projectId: "FUS-324", projectName: "Painting and Minor Plumbing and Electricals", location: "KV Homes B11", quotedAmt: 35500, paidByClient: 35500, dueFromClient: 0, vendorName: "John Njeru & Ayub Miruka", vendorQuoted: 19140, variance: 0, amountPayable: 19140, paidToVendor: 19140, dueToVendor: 0, margin: 16360, marginPct: 85, workDoneDate: "3/1/2026" },
  { no: "9", clientDate: "12/12/2025", projectId: "FUS-325", projectName: "Painting and Minor Plumbing and Electricals", location: "The Pointe D7", quotedAmt: 109950, paidByClient: 109950, dueFromClient: 0, vendorName: "Ayub Miruka", vendorQuoted: 87960, variance: 0, amountPayable: 87960, paidToVendor: 87960, dueToVendor: 0, margin: 21990, marginPct: 25, workDoneDate: "12/1/2026" },
  { no: "10", clientDate: "16/12/2025", projectId: "FUS-326", projectName: "Tree trimming, carpentry, plumbing and electricals", location: "Bahari", quotedAmt: 220000, paidByClient: 220000, dueFromClient: 0, vendorName: "Frewin", vendorQuoted: 176000, variance: 0, amountPayable: 176000, paidToVendor: 176000, dueToVendor: 0, margin: 44000, marginPct: 25, workDoneDate: "16/1/2026" },
  { no: "11", clientDate: "16/12/2025", projectId: "FUS-327", projectName: "Paintwork", location: "The Pointe B5", quotedAmt: 31080, paidByClient: 31080, dueFromClient: 0, vendorName: "Ayub Miruka", vendorQuoted: 24864, variance: 0, amountPayable: 24864, paidToVendor: 24864, dueToVendor: 0, margin: 6216, marginPct: 25, workDoneDate: "16/1/2026" },
  { no: "12", clientDate: "16/12/2025", projectId: "FUS-328", projectName: "Painting and Minor Plumbing and Electricals", location: "KV Homes B5", quotedAmt: 58980, paidByClient: 58980, dueFromClient: 0, vendorName: "John Njeru & Ayub Miruka", vendorQuoted: 47184, variance: 0, amountPayable: 47184, paidToVendor: 47184, dueToVendor: 0, margin: 11796, marginPct: 25, workDoneDate: "16/1/2026" },
  { no: "13", clientDate: "14/1/2025", projectId: "FUS-329", projectName: "Painting and Minor Plumbing and Electricals", location: "KV Homes A7", quotedAmt: 47550, paidByClient: 47550, dueFromClient: 0, vendorName: "John Njeru & Ayub Miruka", vendorQuoted: 38040, variance: 0, amountPayable: 38040, paidToVendor: 38040, dueToVendor: 0, margin: 9510, marginPct: 25, workDoneDate: "14/2/2025" },
];

const fmt = (n: number) => n.toLocaleString("en-KE", { minimumFractionDigits: 0 });

export function exportHistoricalProjectsPdf() {
  const doc = new jsPDF({ orientation: "landscape" });
  const date = new Date().toISOString().slice(0, 10);

  doc.setFontSize(16);
  doc.text("FusionPro Historical Projects (Pre-System)", 14, 16);
  doc.setFontSize(9);
  doc.text(`Export date: ${date}`, 14, 22);

  const totals = HISTORICAL_PROJECTS.reduce(
    (acc, p) => ({
      quoted: acc.quoted + p.quotedAmt,
      paidClient: acc.paidClient + p.paidByClient,
      dueClient: acc.dueClient + p.dueFromClient,
      vendorQuoted: acc.vendorQuoted + p.vendorQuoted,
      payable: acc.payable + p.amountPayable,
      paidVendor: acc.paidVendor + p.paidToVendor,
      dueVendor: acc.dueVendor + p.dueToVendor,
      margin: acc.margin + p.margin,
    }),
    { quoted: 0, paidClient: 0, dueClient: 0, vendorQuoted: 0, payable: 0, paidVendor: 0, dueVendor: 0, margin: 0 },
  );
  const totalMarginPct = totals.vendorQuoted ? Math.round((totals.margin / totals.vendorQuoted) * 100) : 0;

  autoTable(doc, {
    startY: 28,
    head: [
      ["No.", "Date", "Project ID", "Project", "Location", "Quoted", "Paid (Client)", "Due (Client)", "Vendor", "Vendor Quoted", "Payable", "Paid (Vendor)", "Due (Vendor)", "Margin", "Margin %", "Completed"],
    ],
    body: HISTORICAL_PROJECTS.map((p) => [
      p.no,
      p.clientDate,
      p.projectId,
      p.projectName,
      p.location,
      fmt(p.quotedAmt),
      fmt(p.paidByClient),
      fmt(p.dueFromClient),
      p.vendorName,
      fmt(p.vendorQuoted),
      fmt(p.amountPayable),
      fmt(p.paidToVendor),
      fmt(p.dueToVendor),
      fmt(p.margin),
      `${p.marginPct}%`,
      p.workDoneDate,
    ]),
    foot: [
      ["", "", "", "GRAND TOTAL", "", fmt(totals.quoted), fmt(totals.paidClient), fmt(totals.dueClient), "", fmt(totals.vendorQuoted), fmt(totals.payable), fmt(totals.paidVendor), fmt(totals.dueVendor), fmt(totals.margin), `${totalMarginPct}%`, ""],
    ],
    styles: { fontSize: 6.5, cellPadding: 1.5, valign: "middle" },
    headStyles: { fillColor: [218, 31, 38], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [240, 240, 240], textColor: [20, 20, 20], fontStyle: "bold" },
    columnStyles: {
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
      9: { halign: "right" },
      10: { halign: "right" },
      11: { halign: "right" },
      12: { halign: "right" },
      13: { halign: "right" },
      14: { halign: "right" },
    },
    theme: "striped",
    margin: { left: 8, right: 8 },
  });

  doc.save(`fusionpro-historical-projects-${date}.pdf`);
}
