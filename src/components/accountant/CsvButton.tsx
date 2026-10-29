import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsvFile, localDateStamp, toCsv, type CsvCell } from "@/lib/csv";

interface CsvButtonProps {
  /** File name without date or extension, e.g. "invoices". */
  name: string;
  headers: string[];
  rows: CsvCell[][];
}

export function CsvButton({ name, headers, rows }: CsvButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={rows.length === 0}
      onClick={() => downloadCsvFile(`${name}-${localDateStamp()}.csv`, toCsv(headers, rows))}
    >
      <Download className="mr-1 h-4 w-4" />
      Export CSV
    </Button>
  );
}
