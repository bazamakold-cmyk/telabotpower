import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T, index?: number) => ReactNode;
  className?: string;
};

function cellValue<T>(col: Column<T>, row: T, index?: number): ReactNode {
  if (col.render) return col.render(row, index);
  return (row as Record<string, unknown>)[col.key] as ReactNode;
}

export function ResponsiveTable<T>({
  columns,
  data,
  getRowKey,
  empty,
}: {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  empty?: ReactNode;
}) {
  if (data.length === 0 && empty) return <>{empty}</>;

  return (
    <>
      {/* Desktop table */}
      <div className="glass hidden overflow-hidden rounded-xl md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {cellValue(col, row, i)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.map((row, i) => (
          <div key={getRowKey(row)} className="glass flex flex-col gap-2 rounded-xl p-4">
            {columns.map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{col.header}</span>
                <span className={cn("text-sm", col.className)}>{cellValue(col, row, i)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
