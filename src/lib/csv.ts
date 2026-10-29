// CSV helpers for Excel-friendly exports. Everything is built in the browser; nothing is uploaded.

/** A phone-like cell that must reach Excel as text so a leading 0 survives. */
export type TextCell = { text: string };
export type CsvCell = string | number | null | undefined | TextCell;

/** Marks a value as a phone number (see escapeCell for why it needs special handling). */
export const phoneCell = (value: string | null | undefined): TextCell => ({ text: value ?? "" });

const PHONE_LIKE = /^[+0-9 ()-]+$/;
const FORMULA_START = /^[=+\-@\t\r]/;

function quote(s: string) {
  return `"${s.replace(/"/g, '""')}"`;
}

function escapeCell(cell: CsvCell): string {
  // Numbers are real numbers, so a negative one is not a formula and must not be prefixed.
  if (typeof cell === "number") return quote(Number.isFinite(cell) ? String(cell) : "");
  if (cell == null) return quote("");

  if (typeof cell === "object") {
    // Excel turns 0720321492 into the number 720321492 and drops the leading 0. Writing the cell
    // as the formula ="0720321492" makes Excel keep it as text. Only digits and phone punctuation
    // are written this way, so no user text can become a live formula.
    if (PHONE_LIKE.test(cell.text)) return quote(`="${cell.text}"`);
    return escapeText(cell.text);
  }
  return escapeText(cell);
}

// Spreadsheet formula injection: a text cell starting with = + - @ tab or CR would run as a
// formula when opened in Excel, so it gets a leading single quote.
function escapeText(s: string) {
  return quote(FORMULA_START.test(s) ? `'${s}` : s);
}

/** Builds CSV text: every field quoted, quotes doubled, CRLF line ends, newlines kept inside fields. */
export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers.map((h) => quote(h)), ...rows.map((r) => r.map(escapeCell))];
  return lines.map((l) => l.join(",")).join("\r\n") + "\r\n";
}

/** Local date as YYYY-MM-DD (not UTC, so late evenings keep the user's own day). */
export function localDateStamp(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Downloads CSV text as a UTF-8 file with a BOM so Excel detects the encoding. */
export function downloadCsvFile(filename: string, csv: string) {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

interface VendorRow {
  name: string;
  cost: number | null;
  contact_person: string | null;
  phone: string;
  whatsapp_phone: string | null;
  email: string | null;
  category: string;
  services_offered: string | null;
  payment_history: string | null;
}

export const VENDOR_CSV_HEADERS = [
  "Vendor",
  "Cost",
  "Contact person",
  "Phone",
  "WhatsApp",
  "Email",
  "Category",
  "Services offered",
  "Payment history",
];

/** Vendor list as CSV text, columns in list order, no ids. */
export function vendorsToCsv(vendors: VendorRow[]): string {
  return toCsv(
    VENDOR_CSV_HEADERS,
    vendors.map((v) => [
      v.name,
      v.cost,
      v.contact_person,
      phoneCell(v.phone),
      phoneCell(v.whatsapp_phone),
      v.email,
      v.category,
      v.services_offered,
      v.payment_history,
    ]),
  );
}

/** Exports the given vendors and returns how many were written. */
export function exportVendorsCsv(vendors: VendorRow[]): number {
  downloadCsvFile(`vendors-${localDateStamp()}.csv`, vendorsToCsv(vendors));
  return vendors.length;
}
