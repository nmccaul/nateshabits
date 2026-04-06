"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AnnotationsPanel from "@/components/reader/AnnotationsPanel";
import { TOTAL_CHAPTERS } from "@/lib/books";
import { getProgress, setReadChapters } from "@/lib/storage";
import { type Highlight, getHighlights, saveHighlights, addHighlight, updateHighlightColor } from "@/lib/highlightStorage";
import { getAllNotes } from "@/lib/noteStorage";
import { buildChapterPageMap } from "@/lib/chapterMap";
import type { PDFDocumentProxy } from "pdfjs-dist";

const PDFPane = dynamic(() => import("@/components/reader/PDFPane"), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#e8e2d9", color: "var(--muted)", fontSize: 13, fontFamily: "var(--font-body)" }}>
      Loading PDF viewer…
    </div>
  ),
});

interface PendingQuote { text: string; color: string }

export default function ReadPage() {
  const [selectedBook, setSelectedBook] = useState("1nephi");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set(["1nephi"]));
  const [readChapters, setReadChaptersState] = useState<Set<string>>(new Set());
  // Legacy notes record used only by Sidebar to show the dot indicator
  const [noteIndicators, setNoteIndicators] = useState<Record<string, string>>({});
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [chapterPageMap, setChapterPageMap] = useState<Record<string, number>>({});
  const [targetPage, setTargetPage] = useState<number | undefined>();
  const [pendingQuote, setPendingQuote] = useState<PendingQuote | null>(null);

  useEffect(() => {
    const saved = getProgress();
    setReadChaptersState(new Set(saved.readChapters));
    setHighlights(getHighlights());
    // Build note indicators for the sidebar
    const allNotes = getAllNotes();
    const indicators: Record<string, string> = {};
    for (const [k, arr] of Object.entries(allNotes)) {
      if (arr.length > 0) indicators[k] = "•";
    }
    setNoteIndicators(indicators);
  }, []);

  async function handleDocumentLoad(doc: PDFDocumentProxy) {
    const map = await buildChapterPageMap(doc);
    setChapterPageMap(map);
    // Auto-jump to the currently selected chapter once the map is ready
    const page = map[`${selectedBook}:${selectedChapter}`];
    if (page) setTargetPage(page);
  }

  function handleSelectChapter(bookId: string, chapter: number) {
    setSelectedBook(bookId);
    setSelectedChapter(chapter);
    const page = chapterPageMap[`${bookId}:${chapter}`];
    if (page) setTargetPage(page);
  }

  function handleToggleBook(bookId: string) {
    setExpandedBooks(prev => {
      const next = new Set(prev);
      next.has(bookId) ? next.delete(bookId) : next.add(bookId);
      return next;
    });
  }

  function handleToggleRead(key: string) {
    setReadChaptersState(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      setReadChapters(Array.from(next));
      return next;
    });
  }

  function handleAddHighlight(page: number, text: string, color: string) {
    const entry = addHighlight({ page, text, color });
    setHighlights(prev => [...prev, entry]);
  }

  function handleRemoveHighlight(id: string) {
    setHighlights(prev => {
      const next = prev.filter(h => h.id !== id);
      saveHighlights(next);
      return next;
    });
  }

  function handleChangeHighlightColor(id: string, color: string) {
    const updated = updateHighlightColor(id, color);
    setHighlights(updated);
  }

  function handleStartNote(quoteText: string, quoteColor: string) {
    setPendingQuote({ text: quoteText, color: quoteColor });
  }

  // Called by AnnotationsPanel after a note is saved — refresh the sidebar dot indicators
  function handleNoteAdded(chapterKey: string) {
    const allNotes = getAllNotes();
    const arr = allNotes[chapterKey] ?? [];
    setNoteIndicators(prev => {
      const next = { ...prev };
      if (arr.length > 0) next[chapterKey] = "•";
      else delete next[chapterKey];
      return next;
    });
  }

  const readCount = readChapters.size;
  const pct = Math.round((readCount / TOTAL_CHAPTERS) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Header ── */}
      <header style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 20, padding: "0 24px", height: 60, background: "var(--navy)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link
          href="/"
          style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.45)", textDecoration: "none", letterSpacing: "0.04em", flexShrink: 0, transition: "color 0.15s" }}
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.8)")}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.45)")}
        >
          ← Habits
        </Link>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.15)" }} />
        <h1 style={{ margin: 0, display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 22, color: "var(--gold)", lineHeight: 1 }}>Nate&rsquo;s</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "white", letterSpacing: "0.02em" }}>Book of Mormon</span>
        </h1>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end", maxWidth: 320, marginLeft: "auto" }}>
          <div style={{ flex: 1, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, background: "var(--gold)", width: `${pct}%`, transition: "width 0.4s" }} />
          </div>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
            {readCount} / {TOTAL_CHAPTERS}
          </span>
        </div>
      </header>

      {/* ── 3-column body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          expandedBooks={expandedBooks}
          readChapters={readChapters}
          notes={noteIndicators}
          onSelectChapter={handleSelectChapter}
          onToggleBook={handleToggleBook}
        />

        <PDFPane
          highlights={highlights}
          onAddHighlight={handleAddHighlight}
          onRemoveHighlight={handleRemoveHighlight}
          onChangeHighlightColor={handleChangeHighlightColor}
          onPageChange={setCurrentPage}
          onDocumentLoad={handleDocumentLoad}
          targetPage={targetPage}
          onStartNote={handleStartNote}
        />

        <AnnotationsPanel
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          readChapters={readChapters}
          highlights={highlights}
          onToggleRead={handleToggleRead}
          onRemoveHighlight={handleRemoveHighlight}
          pendingQuote={pendingQuote}
          onClearPendingQuote={() => setPendingQuote(null)}
          onNoteAdded={handleNoteAdded}
        />
      </div>
    </div>
  );
}
