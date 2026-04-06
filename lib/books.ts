export const BOOKS = [
  { id: "1nephi",  name: "1 Nephi",         chapters: 22 },
  { id: "2nephi",  name: "2 Nephi",         chapters: 33 },
  { id: "jacob",   name: "Jacob",           chapters: 7  },
  { id: "enos",    name: "Enos",            chapters: 1  },
  { id: "jarom",   name: "Jarom",           chapters: 1  },
  { id: "omni",    name: "Omni",            chapters: 1  },
  { id: "wom",     name: "Words of Mormon", chapters: 1  },
  { id: "mosiah",  name: "Mosiah",          chapters: 29 },
  { id: "alma",    name: "Alma",            chapters: 63 },
  { id: "helaman", name: "Helaman",         chapters: 16 },
  { id: "3nephi",  name: "3 Nephi",         chapters: 30 },
  { id: "4nephi",  name: "4 Nephi",         chapters: 1  },
  { id: "mormon",  name: "Mormon",          chapters: 9  },
  { id: "ether",   name: "Ether",           chapters: 15 },
  { id: "moroni",  name: "Moroni",          chapters: 10 },
] as const;

export type BookId = typeof BOOKS[number]["id"];
export const TOTAL_CHAPTERS = 239;

export function getBook(id: BookId) {
  return BOOKS.find((b) => b.id === id)!;
}

export function chapterKey(bookId: string, chapter: number) {
  return `${bookId}:${chapter}`;
}
