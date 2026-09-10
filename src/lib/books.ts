export interface Book {
  id: string;
  name: string;
  author: string;
  content: string;
  url: string;
}

export type Shelf = 'liked' | 'favorites';
export interface LibraryState {
  liked: Book[];
  favorites: Book[];
}

export const LIBRARY_KEY = 'kawazuLibrary.v1';

export function readLibrary(storage: Pick<Storage, 'getItem'>): LibraryState {
  const current = storage.getItem(LIBRARY_KEY);
  let library: LibraryState;
  if (current !== null) {
    const value: unknown = JSON.parse(current);
    if (!value || typeof value !== 'object' || !('liked' in value) || !('favorites' in value)) {
      throw new Error('Invalid saved library');
    }
    library = { liked: parseStoredBooks(JSON.stringify(value.liked)), favorites: parseStoredBooks(JSON.stringify(value.favorites)) };
  } else {
    library = { liked: parseStoredBooks(storage.getItem('likedBooks')), favorites: parseStoredBooks(storage.getItem('favoriteBooks')) };
  }
  const favorites = new Set(library.favorites.map((book) => book.id));
  return { ...library, liked: library.liked.filter((book) => !favorites.has(book.id)) };
}

export function writeLibrary(storage: Pick<Storage, 'setItem'>, library: LibraryState) {
  // One atomic write prevents losing a book if a move succeeds for one shelf
  // but the second write runs out of storage. Legacy keys remain untouched.
  storage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

// Old saved records used url + title + author as their ID. A canonical URL
// also identifies those records when an author name or title is corrected.
export function normalizeBook(value: unknown): Book | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.name !== 'string' || !record.name.trim() ||
      typeof record.author !== 'string' || typeof record.content !== 'string' ||
      !record.content.trim() || typeof record.url !== 'string') return null;
  try {
    const url = new URL(record.url);
    if (!['http:', 'https:'].includes(url.protocol) ||
        !['aozora.gr.jp', 'www.aozora.gr.jp'].includes(url.hostname) ||
        url.username || url.password || url.port) return null;
    url.protocol = 'https:';
    url.hostname = 'www.aozora.gr.jp';
    url.hash = '';
    url.search = '';
    return { id: url.href, url: url.href, name: record.name.trim(),
      author: record.author.trim(), content: record.content };
  } catch {
    return null;
  }
}

export function parseStoredBooks(raw: string | null): Book[] {
  if (!raw) return [];
  const values: unknown = JSON.parse(raw);
  if (!Array.isArray(values)) throw new Error('Invalid saved library');
  const books = new Map<string, Book>();
  for (const value of values) {
    const book = normalizeBook(value);
    if (book && !books.has(book.id)) books.set(book.id, book);
  }
  return [...books.values()];
}

export function placeBook(state: LibraryState, book: Book, shelf: Shelf | null): LibraryState {
  const next = {
    liked: state.liked.filter((item) => item.id !== book.id),
    favorites: state.favorites.filter((item) => item.id !== book.id),
  };
  if (shelf) next[shelf] = [book, ...next[shelf]];
  return next;
}

export function searchBooks(books: Book[], query: string): Book[] {
  const terms = query.normalize('NFKC').toLocaleLowerCase('ja').trim().split(/\s+/).filter(Boolean);
  return books.filter((book) => {
    const text = `${book.name} ${book.author}`.normalize('NFKC').toLocaleLowerCase('ja');
    return terms.every((term) => text.includes(term));
  });
}

export function swipeDirection(dx: number, dy: number): 'left' | 'right' | null {
  return Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.5
    ? dx > 0 ? 'right' : 'left'
    : null;
}
