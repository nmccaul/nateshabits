"use client";

import { useEffect, useRef, useState } from "react";
import { getBook, chapterKey } from "@/lib/books";
import { type Highlight, removeHighlight } from "@/lib/highlightStorage";
import { type Note, getChapterNotes, addNote, removeNote, formatAge } from "@/lib/noteStorage";

interface PendingQuote {
  text: string;
  color: string;
}

interface AnnotationsPanelProps {
  selectedBook: string;
  selectedChapter: number;
  readChapters: Set<string>;
  highlights: Highlight[];
  onToggleRead: (key: string) => void;
  onRemoveHighlight: (id: string) => void;
  pendingQuote: PendingQuote | null;
  onClearPendingQuote: () => void;
  onNoteAdded: (chapterKey: string) => void;
}

export default function AnnotationsPanel({
  selectedBook,
  selectedChapter,
  readChapters,
  highlights,
  onToggleRead,
  onRemoveHighlight,
  pendingQuote,
  onClearPendingQuote,
  onNoteAdded,
}: AnnotationsPanelProps) {
  const key = chapterKey(selectedBook, selectedChapter);
  const book = getBook(selectedBook as Parameters<typeof getBook>[0]);
  const isRead = readChapters.has(key);

  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setNotes(getChapterNotes(key));
  }, [key]);

  useEffect(() => {
    if (pendingQuote) {
      textareaRef.current?.focus();
    }
  }, [pendingQuote]);

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveNote();
    }
  }

  function saveNote() {
    const text = input.trim();
    if (!text) return;
    const note = addNote(key, {
      text,
      quote: pendingQuote?.text,
      quoteColor: pendingQuote?.color,
    });
    setNotes((prev) => [note, ...prev]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
    onClearPendingQuote();
    onNoteAdded(key);
  }

  function handleRemoveNote(noteId: string) {
    removeNote(key, noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    onNoteAdded(key);
  }

  function handleRemoveHL(id: string) {
    removeHighlight(id);
    onRemoveHighlight(id);
  }

  const unlinkedHighlights = highlights.filter(
    (h) => !notes.some((n) => n.quote && n.quote === h.text)
  );

  return (
    <aside
      style={{
        width: 300,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid var(--border-soft)",
        background: "var(--cream)",
        overflow: "hidden",
      }}
    >
      {/* ── Fixed top section: header + mark as read + note input ── */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid var(--border-soft)" }}>

        {/* Chapter identity */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border-soft)" }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
            Study Notes
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--navy)", lineHeight: 1.3 }}>
            {book.name}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 14, color: "var(--muted)", marginTop: 2 }}>
            Chapter {selectedChapter}
          </div>
        </div>

        {/* Mark as Read */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-soft)" }}>
          <button
            onClick={() => onToggleRead(key)}
            style={{
              width: "100%", padding: "8px 16px", borderRadius: 8,
              fontSize: 11, fontWeight: 700, fontFamily: "var(--font-body)",
              letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
              transition: "all 0.15s",
              ...(isRead
                ? { background: "var(--navy)", color: "white", border: "none" }
                : { background: "transparent", color: "var(--navy)", border: "1.5px solid var(--border)" }),
            }}
          >
            {isRead ? "✓ Marked as Read" : "Mark as Read"}
          </button>
        </div>

        {/* ── Note input — always visible ── */}
        <div style={{ background: "white" }}>
          {/* Quote context banner */}
          {pendingQuote && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px 0" }}>
              <div
                style={{
                  flex: 1,
                  borderLeft: `3px solid ${pendingQuote.color}`,
                  paddingLeft: 8,
                  fontSize: 11,
                  fontFamily: "var(--font-body)",
                  color: "var(--muted)",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                &ldquo;{pendingQuote.text}&rdquo;
              </div>
              <button
                onClick={onClearPendingQuote}
                style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 14, cursor: "pointer", padding: 0, lineHeight: 1, flexShrink: 0, marginTop: 1 }}
              >
                ×
              </button>
            </div>
          )}

          <div style={{ padding: "10px 14px 12px", display: "flex", alignItems: "flex-end", gap: 8 }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
              onKeyDown={handleKeyDown}
              placeholder={pendingQuote ? "Add a note about this highlight…" : "Add a note… ↵ to save, ⇧↵ new line"}
              rows={2}
              style={{
                flex: 1,
                resize: "none",
                border: "1.5px solid var(--border-soft)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                fontFamily: "var(--font-body)",
                color: "var(--text-body)",
                background: "var(--cream)",
                outline: "none",
                lineHeight: 1.5,
                overflow: "hidden",
                minHeight: 52,
                maxHeight: 120,
                transition: "border-color 0.15s",
              }}
              onFocus={e => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--gold)")}
              onBlur={e => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border-soft)")}
            />
            <button
              onClick={saveNote}
              disabled={!input.trim()}
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: input.trim() ? "var(--navy)" : "var(--border-soft)",
                color: "white",
                fontSize: 14,
                cursor: input.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              title="Save note (Enter)"
            >
              ↵
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable section: saved notes + highlights ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Notes list */}
        {notes.length > 0 && (
          <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)" }}>
              Notes ({notes.length})
            </div>
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onRemove={() => handleRemoveNote(note.id)} />
            ))}
          </div>
        )}

        {/* Highlights (unlinked only) */}
        {unlinkedHighlights.length > 0 && (
          <div style={{ padding: "14px 20px", borderTop: notes.length > 0 ? "1px solid var(--border-soft)" : undefined }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
              Highlights ({unlinkedHighlights.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {unlinkedHighlights.map((h) => (
                <div
                  key={h.id}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: "white", border: "1px solid var(--border-soft)" }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, fontFamily: "var(--font-body)", color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.text}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>p.{h.page}</span>
                  <button
                    onClick={() => handleRemoveHL(h.id)}
                    style={{ background: "none", border: "none", color: "var(--border)", fontSize: 13, cursor: "pointer", padding: 0, lineHeight: 1, flexShrink: 0, transition: "color 0.12s" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#e57373")}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "var(--border)")}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Sub-component: single note card ── */
function NoteCard({ note, onRemove }: { note: Note; onRemove: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white",
        border: "1px solid var(--border-soft)",
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 0.15s",
        borderColor: hovered ? "var(--border)" : "var(--border-soft)",
      }}
    >
      {note.quote && (
        <div
          style={{
            padding: "8px 12px",
            borderLeft: `3px solid ${note.quoteColor ?? "#fde68a"}`,
            background: note.quoteColor ? `${note.quoteColor}22` : "#fef9e7",
            fontSize: 11,
            fontFamily: "var(--font-body)",
            fontStyle: "italic",
            color: "var(--muted)",
            lineHeight: 1.5,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          &ldquo;{note.quote}&rdquo;
        </div>
      )}
      <div style={{ padding: "10px 12px 8px" }}>
        <p style={{ margin: 0, fontSize: 12, fontFamily: "var(--font-body)", color: "var(--text-body)", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {note.text}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 10, fontFamily: "var(--font-body)", color: "var(--muted)" }}>
            {formatAge(note.timestamp)}
          </span>
          {hovered && (
            <button
              onClick={onRemove}
              style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "var(--font-body)", transition: "color 0.12s" }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#e57373")}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "var(--muted)")}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
