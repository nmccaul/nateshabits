export interface Highlight {
  id: string;
  page: number;
  text: string;
  color: string;
  timestamp: number;
}

const KEY = "bom-highlights";

export function getHighlights(): Highlight[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Highlight[];
  } catch {
    return [];
  }
}

export function saveHighlights(highlights: Highlight[]) {
  localStorage.setItem(KEY, JSON.stringify(highlights));
}

export function addHighlight(h: Omit<Highlight, "id" | "timestamp">): Highlight {
  const entry: Highlight = { ...h, id: crypto.randomUUID(), timestamp: Date.now() };
  const all = getHighlights();
  all.push(entry);
  saveHighlights(all);
  return entry;
}

export function removeHighlight(id: string) {
  saveHighlights(getHighlights().filter((h) => h.id !== id));
}

export function updateHighlightColor(id: string, color: string) {
  const all = getHighlights().map((h) => (h.id === id ? { ...h, color } : h));
  saveHighlights(all);
  return all;
}
