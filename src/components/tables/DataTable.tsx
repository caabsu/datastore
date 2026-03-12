"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  searchKey?: string;
  exportFilename?: string;
}

export default function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKey,
  exportFilename,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="bg-[#0A0A0B] border border-border rounded-md px-3 py-1.5 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent w-64"
        />
        {exportFilename && (
          <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-surface">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "flex items-center gap-1 cursor-pointer select-none hover:text-zinc-300 transition-colors"
                              : "flex items-center gap-1"
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-zinc-600">
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp size={12} />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown size={12} />
                              ) : (
                                <ArrowUpDown size={12} />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 data-row transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-2 text-xs text-zinc-600">
        {table.getFilteredRowModel().rows.length} results
      </div>
    </div>
  );
}
