"use client";

import { useEffect, useRef, useState } from "react";
import { getBook, chapterKey } from "@/lib/books";
import { setNote } from "@/lib/storage";

interface NotesPanelProps {
  selectedBook: string;
  selectedChapter: number;
  readChapters: Set<string>;
  notes: Record<string, string>;
  onToggleRead: (key: string) => void;
  onNoteChange: (key: string, text: string) => void;
}

export default function NotesPanel({
  selectedBook,
  selectedChapter,
  readChapters,
  notes,
  onToggleRead,
  onNoteChange,
}: NotesPanelProps) {
  const key = chapterKey(selectedBook, selectedChapter);
  const book = getBook(selectedBook as Parameters<typeof getBook>[0]);
  const isRead = readChapters.has(key);
  const currentNote = notes[key] ?? "";

  const [localNote, setLocalNote] = useState(currentNote);
  const [savedFlash, setSavedFlash] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local note when selection changes
  useEffect(() => {
    setLocalNote(notes[key] ?? "");
  }, [key, notes]);

  function handleNoteChange(text: string) {
    setLocalNote(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setNote(key, text);
      onNoteChange(key, text);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    }, 500);
  }

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
        <h2 className="text-sm font-bold text-gray-900">
          {book.name} — Chapter {selectedChapter}
        </h2>
      </div>

      {/* Mark as Read button */}
      <div className="px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => onToggleRead(key)}
          className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
            isRead
              ? "bg-[#1a365d] text-white hover:bg-[#162a4a]"
              : "border-2 border-[#1a365d] text-[#1a365d] hover:bg-[#1a365d]/5"
          }`}
        >
          {isRead ? "✓ Marked as Read" : "Mark as Read"}
        </button>
      </div>

      {/* Notes textarea */}
      <div className="flex-1 flex flex-col px-4 py-3 gap-2 min-h-0">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500 font-medium">My Notes</label>
          {savedFlash && (
            <span className="text-xs text-green-600 font-medium">Saved ✓</span>
          )}
        </div>
        <textarea
          value={localNote}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Your thoughts, insights, and notes for this chapter..."
          className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1a365d]/30 focus:border-[#1a365d]/40"
        />
      </div>
    </aside>
  );
}
