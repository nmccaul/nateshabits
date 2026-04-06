export interface Note {
  id: string;
  chapterKey: string;
  text: string;
  timestamp: number;
  quote?: string;        // highlighted text this note is attached to
  quoteColor?: string;   // background color of the linked highlight
}

const KEY = "bom-notes-v2";

function load(): Record<string, Note[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, Note[]>;
  } catch {
    return {};
  }
}

export function getAllNotes(): Record<string, Note[]> {
  return load();
}

export function getChapterNotes(chapterKey: string): Note[] {
  return load()[chapterKey] ?? [];
}

export function addNote(
  chapterKey: string,
  data: Pick<Note, "text" | "quote" | "quoteColor">
): Note {
  const entry: Note = {
    ...data,
    id: crypto.randomUUID(),
    chapterKey,
    timestamp: Date.now(),
  };
  const all = load();
  all[chapterKey] = [entry, ...(all[chapterKey] ?? [])];
  localStorage.setItem(KEY, JSON.stringify(all));
  return entry;
}

export function removeNote(chapterKey: string, noteId: string) {
  const all = load();
  all[chapterKey] = (all[chapterKey] ?? []).filter((n) => n.id !== noteId);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function formatAge(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
