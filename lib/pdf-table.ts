import "server-only";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

export type PdfColumn = { label: string; width: number; align?: "left" | "right" };

// A4 landscape, in points
const PAGE = { w: 842, h: 595, margin: 32 };
const SIZE = { title: 16, meta: 9, head: 8, cell: 8 };
const ROW_H = 18;
const BRAND = rgb(0.83, 0, 0); // #D40000
const INK = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.42, 0.42, 0.42);
const LINE = rgb(0.86, 0.86, 0.86);
const ZEBRA = rgb(0.97, 0.97, 0.97);

// standard fonts are WinAnsi only; swap what they can't draw (₱, emoji, CJK)
function clean(s: string) {
  return s
    .replace(/₱/g, "PHP ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function fit(text: string, font: PDFFont, size: number, max: number) {
  let s = clean(text);
  if (font.widthOfTextAtSize(s, size) <= max) return s;
  while (s.length > 1 && font.widthOfTextAtSize(`${s}...`, size) > max) s = s.slice(0, -1);
  return `${s.trimEnd()}...`;
}

// a simple paginated table: title + meta line, repeating header, zebra rows, page numbers
export async function pdfTable({
  title,
  meta,
  columns,
  rows,
}: {
  title: string;
  meta: string;
  columns: PdfColumn[];
  rows: string[][];
}) {
  const doc = await PDFDocument.create();
  doc.setTitle(clean(title));
  doc.setCreator("RaceLink");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // scale columns to the printable width
  const usable = PAGE.w - PAGE.margin * 2;
  const total = columns.reduce((t, c) => t + c.width, 0);
  const cols = columns.map((c) => ({ ...c, width: (c.width / total) * usable }));

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;

  const header = () => {
    let x = PAGE.margin;
    page.drawRectangle({ x: PAGE.margin, y: y - ROW_H + 5, width: usable, height: ROW_H, color: BRAND });
    for (const c of cols) {
      const text = fit(c.label, bold, SIZE.head, c.width - 8);
      const tx = c.align === "right" ? x + c.width - 4 - bold.widthOfTextAtSize(text, SIZE.head) : x + 4;
      page.drawText(text, { x: tx, y: y - 7, size: SIZE.head, font: bold, color: rgb(1, 1, 1) });
      x += c.width;
    }
    y -= ROW_H;
  };

  const newPage = (first: boolean) => {
    page = doc.addPage([PAGE.w, PAGE.h]);
    pages.push(page);
    y = PAGE.h - PAGE.margin;
    if (first) {
      page.drawText(fit(title, bold, SIZE.title, usable), { x: PAGE.margin, y: y - SIZE.title, size: SIZE.title, font: bold, color: INK });
      y -= SIZE.title + 8;
      page.drawText(fit(meta, font, SIZE.meta, usable), { x: PAGE.margin, y: y - SIZE.meta, size: SIZE.meta, font, color: MUTED });
      y -= SIZE.meta + 14;
    }
    header();
  };

  newPage(true);
  if (rows.length === 0) {
    page.drawText("No runners in this list.", { x: PAGE.margin + 4, y: y - 12, size: SIZE.cell, font, color: MUTED });
  }
  rows.forEach((row, i) => {
    if (y - ROW_H < PAGE.margin + 16) newPage(false);
    if (i % 2 === 1) page.drawRectangle({ x: PAGE.margin, y: y - ROW_H + 5, width: usable, height: ROW_H, color: ZEBRA });
    let x = PAGE.margin;
    cols.forEach((c, j) => {
      const text = fit(row[j] ?? "", font, SIZE.cell, c.width - 8);
      const tx = c.align === "right" ? x + c.width - 4 - font.widthOfTextAtSize(text, SIZE.cell) : x + 4;
      page.drawText(text, { x: tx, y: y - 7, size: SIZE.cell, font, color: INK });
      x += c.width;
    });
    page.drawLine({ start: { x: PAGE.margin, y: y - ROW_H + 5 }, end: { x: PAGE.w - PAGE.margin, y: y - ROW_H + 5 }, thickness: 0.5, color: LINE });
    y -= ROW_H;
  });

  pages.forEach((p, i) => {
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, { x: PAGE.w - PAGE.margin - font.widthOfTextAtSize(label, SIZE.meta), y: PAGE.margin - 14, size: SIZE.meta, font, color: MUTED });
    p.drawText("RaceLink", { x: PAGE.margin, y: PAGE.margin - 14, size: SIZE.meta, font: bold, color: BRAND });
  });

  return doc.save();
}

export function pdfResponse(bytes: Uint8Array, filename: string) {
  return new Response(new Blob([bytes as BlobPart], { type: "application/pdf" }), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
