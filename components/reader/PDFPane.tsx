"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { type Highlight } from "@/lib/highlightStorage";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const HIGHLIGHT_COLORS = [
  { color: "#fde68a", label: "Yellow" },
  { color: "#bbf7d0", label: "Green" },
  { color: "#fecaca", label: "Pink" },
  { color: "#bfdbfe", label: "Blue" },
];

interface PDFPaneProps {
  highlights: Highlight[];
  onAddHighlight: (page: number, text: string, color: string) => void;
  onRemoveHighlight: (id: string) => void;
  onChangeHighlightColor: (id: string, color: string) => void;
  onPageChange?: (page: number) => void;
  onDocumentLoad?: (doc: PDFDocumentProxy) => void;
  targetPage?: number;
  onStartNote?: (quoteText: string, quoteColor: string) => void;
}

interface ToolbarState {
  x: number;
  y: number;
  text: string;
}

interface HighlightToolbar {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export default function PDFPane({
  highlights,
  onAddHighlight,
  onRemoveHighlight,
  onChangeHighlightColor,
  onPageChange,
  onDocumentLoad,
  targetPage,
  onStartNote,
}: PDFPaneProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  // Store pending target if document hasn't loaded yet
  const pendingPageRef = useRef<number | null>(null);
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const [hlToolbar, setHlToolbar] = useState<HighlightToolbar | null>(null);
  // Ref-captured selection so it survives the mousedown/click on toolbar buttons
  const capturedRef = useRef<{ text: string; page: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep a stable ref to pageNumber for use inside event listeners
  const pageNumberRef = useRef(pageNumber);

  // Keep ref in sync with state so event listeners always have the current page
  useEffect(() => { pageNumberRef.current = pageNumber; }, [pageNumber]);

  // Memoize so textRenderer only gets a new reference when highlights actually change —
  // otherwise react-pdf's TextLayer cancels+restarts its async render on every parent render,
  // which prevents highlights from ever being committed to the DOM.
  const pageHighlights = useMemo(
    () => highlights.filter((h) => h.page === pageNumber),
    [highlights, pageNumber]
  );

  // Dismiss toolbars on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-toolbar]")) {
        capturedRef.current = null;
        setToolbar(null);
        setHlToolbar(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Detect text selection — shows highlight colour toolbar
  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      // Ignore mouseup events that originate from the toolbar itself
      if ((e.target as HTMLElement).closest("[data-toolbar]")) return;
      requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        const text = sel.toString().trim();
        if (!text || text.length < 2) return;
        const range = sel.getRangeAt(0);
        if (!containerRef.current?.contains(range.commonAncestorContainer)) return;
        const rect = range.getBoundingClientRect();
        // Capture into a ref so the text survives any toolbar click
        capturedRef.current = { text, page: pageNumberRef.current };
        setToolbar({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY - 8,
          text,
        });
      });
    }
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Event delegation: clicking a <mark> opens the highlight context toolbar
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function handleClick(e: MouseEvent) {
      const mark = (e.target as HTMLElement).closest("mark[data-hid]");
      if (!mark) return;
      const id = (mark as HTMLElement).dataset.hid;
      if (!id) return;
      // Find the matching highlight to get current color + text
      const rect = (mark as HTMLElement).getBoundingClientRect();
      // Dispatch a custom event carrying the id so the React state handler can look it up
      containerRef.current?.dispatchEvent(new CustomEvent("hl-click", { detail: { id, rect }, bubbles: false }));
      e.stopPropagation();
    }
    el.addEventListener("click", handleClick);
    return () => el.removeEventListener("click", handleClick);
  }, []);

  // Listen for highlight clicks to open the context toolbar (needs fresh highlights)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function handleHlClick(e: Event) {
      const { id, rect } = (e as CustomEvent).detail as { id: string; rect: DOMRect };
      const hl = highlights.find((h) => h.id === id);
      if (!hl) return;
      setToolbar(null);
      setHlToolbar({
        id: hl.id,
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 8,
        text: hl.text,
        color: hl.color,
      });
    }
    el.addEventListener("hl-click", handleHlClick);
    return () => el.removeEventListener("hl-click", handleHlClick);
  }, [highlights]);

  function applyHighlight(color: string) {
    // Prefer the ref-captured value (survives browser selection clearing on click)
    const captured = capturedRef.current;
    const text = captured?.text || toolbar?.text;
    const page = captured?.page ?? pageNumber;
    if (!text) return;
    onAddHighlight(page, text, color);
    window.getSelection()?.removeAllRanges();
    capturedRef.current = null;
    setToolbar(null);
  }

  function startNote() {
    const captured = capturedRef.current;
    const text = captured?.text || toolbar?.text;
    const page = captured?.page ?? pageNumber;
    if (!text) return;
    // Save as a yellow highlight + open the note input pre-loaded with the quote
    const defaultColor = "#fde68a";
    onAddHighlight(page, text, defaultColor);
    onStartNote?.(text, defaultColor);
    window.getSelection()?.removeAllRanges();
    capturedRef.current = null;
    setToolbar(null);
  }

  // Returns an HTML string; react-pdf sanitises and sets it as innerHTML
  const textRenderer = useCallback(
    ({ str }: { str: string }): string => {
      if (!pageHighlights.length) return str;
      let result = str;
      for (const h of pageHighlights) {
        // Exact span match — the highlight text equals or contains the whole span
        if (h.text.includes(str) && str.length > 2) {
          return `<mark style="background:${h.color};padding:0;cursor:pointer" data-hid="${h.id}" title="Click to edit">${str}</mark>`;
        }
        // Partial match — highlight text starts inside this span
        if (str.includes(h.text)) {
          result = str
            .split(h.text)
            .join(
              `<mark style="background:${h.color};padding:0;cursor:pointer" data-hid="${h.id}" title="Click to edit">${h.text}</mark>`
            );
          break;
        }
      }
      return result;
    },
    [pageHighlights]
  );

  function goToPage(n: number) {
    const clamped = Math.max(1, Math.min(n, numPages || 1));
    setPageNumber(clamped);
    setPageInput(String(clamped));
    onPageChange?.(clamped);
  }

  // Navigate whenever the parent sets a new targetPage
  useEffect(() => {
    if (!targetPage) return;
    if (numPages > 0) {
      goToPage(targetPage);
    } else {
      // Document not loaded yet — queue the navigation
      pendingPageRef.current = targetPage;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPage]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#e8e2d9", overflow: "hidden" }}>
      {/* Page navigation bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 16px", background: "var(--cream-card)", borderBottom: "1px solid var(--border-soft)", flexShrink: 0 }}>
        <button
          onClick={() => goToPage(pageNumber - 1)}
          disabled={pageNumber <= 1}
          style={{ padding: "5px 14px", fontSize: 12, fontFamily: "var(--font-body)", fontWeight: 500, border: "1.5px solid var(--border)", borderRadius: 7, background: "var(--cream)", color: "var(--text-body)", cursor: "pointer", opacity: pageNumber <= 1 ? 0.35 : 1 }}
        >
          ← Prev
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "var(--font-body)", color: "var(--muted)" }}>
          <span>Page</span>
          <input
            type="number"
            value={pageInput}
            min={1}
            max={numPages || 1}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={() => goToPage(parseInt(pageInput, 10))}
            onKeyDown={(e) => e.key === "Enter" && goToPage(parseInt(pageInput, 10))}
            style={{ width: 52, textAlign: "center", border: "1.5px solid var(--border)", borderRadius: 6, padding: "3px 6px", fontSize: 12, fontFamily: "var(--font-body)", color: "var(--text)", background: "var(--cream)", outline: "none" }}
          />
          <span style={{ color: "var(--muted)" }}>of {numPages || "—"}</span>
        </div>

        <button
          onClick={() => goToPage(pageNumber + 1)}
          disabled={pageNumber >= numPages}
          style={{ padding: "5px 14px", fontSize: 12, fontFamily: "var(--font-body)", fontWeight: 500, border: "1.5px solid var(--border)", borderRadius: 7, background: "var(--cream)", color: "var(--text-body)", cursor: "pointer", opacity: pageNumber >= numPages ? 0.35 : 1 }}
        >
          Next →
        </button>
      </div>

      {/* Highlight hint */}
      <div style={{ flexShrink: 0, padding: "5px 16px", background: "var(--cream)", borderBottom: "1px solid var(--border-soft)", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-body)", letterSpacing: "0.03em" }}>
          ✦ Select any text to highlight or add a note
        </span>
      </div>

      {/* PDF render area */}
      <div ref={containerRef} style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", padding: "24px 16px" }}>
        <Document
          file="/api/pdf"
          onLoadSuccess={(doc) => {
            setNumPages(doc.numPages);
            onDocumentLoad?.(doc as unknown as PDFDocumentProxy);
            if (pendingPageRef.current !== null) {
              const p = pendingPageRef.current;
              pendingPageRef.current = null;
              // Let React re-render with numPages first
              setTimeout(() => goToPage(p), 0);
            }
          }}
          loading={
            <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
              Loading Book of Mormon…
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500 text-sm">
              <p>Could not load PDF.</p>
              <a
                href="https://www.churchofjesuschrist.org/bc/content/shared/content/english/pdf/language-materials/34406_eng.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Open PDF in new tab →
              </a>
            </div>
          }
        >
          <Page
            key={pageNumber}
            pageNumber={pageNumber}
            renderTextLayer={true}
            renderAnnotationLayer={false}
            customTextRenderer={textRenderer}
            className="shadow-lg"
            width={Math.min((containerRef.current?.clientWidth ?? 740) - 32, 820)}
          />
        </Document>
      </div>

      {/* Floating selection toolbar */}
      {toolbar && (
        <div
          data-toolbar
          style={{
            position: "fixed",
            zIndex: 50,
            top: toolbar.y - 52,
            left: toolbar.x,
            transform: "translateX(-50%)",
            background: "var(--navy)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(27,48,79,0.35)",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            pointerEvents: "auto",
          }}
        >
          {toolbar.text && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-body)", fontStyle: "italic", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 2 }}>
              &ldquo;{toolbar.text.length > 28 ? toolbar.text.slice(0, 28) + "…" : toolbar.text}&rdquo;
            </span>
          )}
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
          {HIGHLIGHT_COLORS.map(({ color, label }) => (
            <button
              key={color}
              onMouseDown={(e) => { e.preventDefault(); applyHighlight(color); }}
              title={label}
              style={{ width: 22, height: 22, borderRadius: "50%", background: color, border: "2px solid rgba(255,255,255,0.3)", cursor: "pointer", flexShrink: 0, transition: "transform 0.1s" }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.2)")}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            />
          ))}
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />
          <button
            onMouseDown={(e) => { e.preventDefault(); startNote(); }}
            title="Add note"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              color: "white",
              fontSize: 11,
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              cursor: "pointer",
              padding: "3px 8px",
              letterSpacing: "0.03em",
              flexShrink: 0,
              transition: "background 0.12s",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)")}
          >
            ✏ Note
          </button>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />
          <button
            onClick={() => setToolbar(null)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Highlight context toolbar (click existing highlight) ── */}
      {hlToolbar && (
        <div
          data-toolbar
          style={{
            position: "fixed",
            zIndex: 50,
            top: hlToolbar.y - 52,
            left: hlToolbar.x,
            transform: "translateX(-50%)",
            background: "var(--navy)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(27,48,79,0.35)",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            pointerEvents: "auto",
          }}
        >
          {/* Truncated quote */}
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-body)", fontStyle: "italic", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            &ldquo;{hlToolbar.text.length > 24 ? hlToolbar.text.slice(0, 24) + "…" : hlToolbar.text}&rdquo;
          </span>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
          {/* Change color */}
          {HIGHLIGHT_COLORS.map(({ color, label }) => (
            <button
              key={color}
              onMouseDown={(e) => {
                e.preventDefault();
                onChangeHighlightColor(hlToolbar.id, color);
                setHlToolbar((prev) => prev ? { ...prev, color } : prev);
              }}
              title={`Change to ${label}`}
              style={{
                width: 22, height: 22, borderRadius: "50%", background: color, cursor: "pointer", flexShrink: 0, transition: "transform 0.1s",
                border: hlToolbar.color === color ? "2.5px solid white" : "2px solid rgba(255,255,255,0.3)",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.2)")}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            />
          ))}
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />
          {/* Add note */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onStartNote?.(hlToolbar.text, hlToolbar.color);
              setHlToolbar(null);
            }}
            style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6,
              color: "white", fontSize: 11, fontFamily: "var(--font-body)", fontWeight: 600,
              cursor: "pointer", padding: "3px 8px", letterSpacing: "0.03em", flexShrink: 0, transition: "background 0.12s",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)")}
          >
            ✏ Note
          </button>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />
          {/* Delete */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onRemoveHighlight(hlToolbar.id);
              setHlToolbar(null);
            }}
            style={{
              background: "rgba(229,115,115,0.15)", border: "1px solid rgba(229,115,115,0.35)", borderRadius: 6,
              color: "#fca5a5", fontSize: 11, fontFamily: "var(--font-body)", fontWeight: 600,
              cursor: "pointer", padding: "3px 8px", letterSpacing: "0.03em", flexShrink: 0, transition: "background 0.12s",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(229,115,115,0.3)")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(229,115,115,0.15)")}
          >
            Delete
          </button>
          <button
            onClick={() => setHlToolbar(null)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
