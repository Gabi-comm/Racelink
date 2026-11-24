// csv cell, iwas formula injection sa Excel
export function csvCell(v: string | number | null | undefined) {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function slugify(s: string, fallback = "export") {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
}

// BOM so Excel reads UTF-8 (₱, ñ) correctly
export function csvResponse(header: string[], rows: (string | number | null | undefined)[][], filename: string) {
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new Response(`﻿${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
