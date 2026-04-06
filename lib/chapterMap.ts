import type { PDFDocumentProxy } from "pdfjs-dist";
import { BOOKS } from "./books";

// Each entry: [list of title fragments that match this book, bookId]
const BOOK_ALIASES: [string[], string][] = [
  [["first book of nephi", "1 nephi", "i nephi", "1nephi"], "1nephi"],
  [["second book of nephi", "2 nephi", "ii nephi", "2nephi"], "2nephi"],
  [["book of jacob", "jacob"], "jacob"],
  [["book of enos", "enos"], "enos"],
  [["book of jarom", "jarom"], "jarom"],
  [["book of omni", "omni"], "omni"],
  [["words of mormon", "word of mormon"], "wom"],
  [["book of mosiah", "mosiah"], "mosiah"],
  [["book of alma", "alma"], "alma"],
  [["book of helaman", "helaman"], "helaman"],
  [["third nephi", "3 nephi", "iii nephi", "3nephi"], "3nephi"],
  [["fourth nephi", "4 nephi", "iv nephi", "4nephi"], "4nephi"],
  // "book of mormon" must come AFTER 3nephi / 4nephi to avoid false positive
  [["book of mormon", "mormon"], "mormon"],
  [["book of ether", "ether"], "ether"],
  [["book of moroni", "moroni"], "moroni"],
];

function titleToBookId(title: string): string | null {
  const t = title.toLowerCase().trim();
  for (const [aliases, bookId] of BOOK_ALIASES) {
    for (const alias of aliases) {
      if (t === alias || t.startsWith(alias + " ") || t.startsWith(alias + ",")) {
        return bookId;
      }
    }
  }
  return null;
}

function extractChapterNumber(title: string): number | null {
  // Matches "Chapter 5", "chapter5", or a bare number at the end
  const m = title.toLowerCase().trim().match(/(?:chapter\s*)?(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OutlineItem = { title: string; dest: any; items: OutlineItem[] };

async function resolvePageNumber(doc: PDFDocumentProxy, dest: unknown): Promise<number | null> {
  if (!dest) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolved: any[] | null =
      typeof dest === "string"
        ? await doc.getDestination(dest)
        : (dest as unknown[]);
    if (!resolved?.[0]) return null;
    const idx = await doc.getPageIndex(resolved[0]);
    return idx + 1;
  } catch {
    return null;
  }
}

async function processItems(
  doc: PDFDocumentProxy,
  items: OutlineItem[],
  map: Record<string, number>,
  parentBookId: string | null = null
): Promise<void> {
  for (const item of items) {
    const title = item.title ?? "";
    const bookId = titleToBookId(title) ?? parentBookId;
    const chapterNum = extractChapterNumber(title);
    const pageNum = await resolvePageNumber(doc, item.dest);

    if (pageNum !== null && bookId && chapterNum) {
      const book = BOOKS.find((b) => b.id === bookId);
      if (book && chapterNum >= 1 && chapterNum <= book.chapters) {
        const key = `${bookId}:${chapterNum}`;
        // Keep first occurrence (earlier page wins)
        if (!map[key]) map[key] = pageNum;
      }
    }

    if (item.items?.length) {
      await processItems(doc, item.items, map, bookId);
    }
  }
}

export async function buildChapterPageMap(
  doc: PDFDocumentProxy
): Promise<Record<string, number>> {
  const map: Record<string, number> = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outline = (await doc.getOutline()) as OutlineItem[] | null;
    if (!outline) {
      console.warn("[BOM] PDF has no outline/bookmarks — chapter navigation unavailable");
      return map;
    }
    await processItems(doc, outline, map);
    console.info(`[BOM] Chapter map built: ${Object.keys(map).length} chapters mapped`);
  } catch (err) {
    console.warn("[BOM] Could not build chapter page map:", err);
  }
  return map;
}
