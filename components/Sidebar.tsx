"use client";

import { BOOKS } from "@/lib/books";

interface SidebarProps {
  selectedBook: string;
  selectedChapter: number;
  expandedBooks: Set<string>;
  readChapters: Set<string>;
  notes: Record<string, string>;
  onSelectChapter: (bookId: string, chapter: number) => void;
  onToggleBook: (bookId: string) => void;
}

export default function Sidebar({
  selectedBook,
  selectedChapter,
  expandedBooks,
  readChapters,
  notes,
  onSelectChapter,
  onToggleBook,
}: SidebarProps) {
  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        overflowY: "auto",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        background: "#162640",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
        }}>
          Contents
        </span>
      </div>

      {/* Book list */}
      <div style={{ padding: "8px 0", flex: 1 }}>
        {BOOKS.map((book) => {
          const isExpanded = expandedBooks.has(book.id);
          const readCount = Array.from({ length: book.chapters }, (_, i) =>
            readChapters.has(`${book.id}:${i + 1}`)
          ).filter(Boolean).length;
          const isBookSelected = selectedBook === book.id;

          return (
            <div key={book.id}>
              {/* Book header */}
              <button
                onClick={() => onToggleBook(book.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 18px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
              >
                <span style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: isBookSelected ? 600 : 500,
                  fontSize: 14,
                  color: isBookSelected ? "white" : "rgba(255,255,255,0.6)",
                  letterSpacing: "0.01em",
                  transition: "color 0.12s",
                }}>
                  {book.name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {readCount > 0 && (
                    <span style={{
                      fontSize: 10,
                      fontFamily: "var(--font-body)",
                      color: "var(--gold)",
                      fontWeight: 600,
                    }}>
                      {readCount}/{book.chapters}
                    </span>
                  )}
                  <span style={{
                    fontSize: 8,
                    color: "rgba(255,255,255,0.25)",
                    transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: "transform 0.2s",
                    display: "inline-block",
                  }}>
                    ▾
                  </span>
                </div>
              </button>

              {/* Chapter list */}
              {isExpanded && (
                <div style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", marginLeft: 18 }}>
                  {Array.from({ length: book.chapters }, (_, i) => {
                    const ch = i + 1;
                    const key = `${book.id}:${ch}`;
                    const isRead = readChapters.has(key);
                    const hasNote = Boolean(notes[key]);
                    const isSelected = selectedBook === book.id && selectedChapter === ch;

                    return (
                      <button
                        key={ch}
                        onClick={() => onSelectChapter(book.id, ch)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "5px 14px",
                          background: isSelected ? "rgba(181,129,31,0.18)" : "transparent",
                          border: "none",
                          borderLeft: isSelected ? "2px solid var(--gold)" : "2px solid transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.12s",
                          marginLeft: -1,
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        }}
                      >
                        {/* Read indicator */}
                        <span style={{
                          width: 12,
                          flexShrink: 0,
                          fontSize: 10,
                          color: isRead ? (isSelected ? "var(--gold)" : "rgba(181,129,31,0.7)") : "transparent",
                          fontWeight: 700,
                        }}>
                          ✓
                        </span>

                        <span style={{
                          flex: 1,
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? "white" : "rgba(255,255,255,0.45)",
                          transition: "color 0.12s",
                          letterSpacing: "0.01em",
                        }}>
                          Chapter {ch}
                        </span>

                        {/* Note dot */}
                        {hasNote && (
                          <span style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: isSelected ? "var(--gold)" : "rgba(181,129,31,0.5)",
                            flexShrink: 0,
                          }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
