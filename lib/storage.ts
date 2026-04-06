const STORAGE_KEY = "bom-progress";

interface BOMData {
  readChapters: string[];
  notes: Record<string, string>;
}

function load(): BOMData {
  if (typeof window === "undefined") return { readChapters: [], notes: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { readChapters: [], notes: {} };
    return JSON.parse(raw) as BOMData;
  } catch {
    return { readChapters: [], notes: {} };
  }
}

function save(data: BOMData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getProgress(): BOMData {
  return load();
}

export function setReadChapters(keys: string[]) {
  const data = load();
  data.readChapters = keys;
  save(data);
}

export function setNote(key: string, text: string) {
  const data = load();
  if (text.trim() === "") {
    delete data.notes[key];
  } else {
    data.notes[key] = text;
  }
  save(data);
}
