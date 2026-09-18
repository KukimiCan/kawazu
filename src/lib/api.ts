import { normalizeBook, type Book } from './books.ts';

const API_BASE_PATH = (process.env.NEXT_PUBLIC_AOZORA_API_BASE_PATH ?? '/api/aozora').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 12000;
let batchSupported = true;

class ApiError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`作品の取得に失敗しました (${status})`);
    this.status = status;
  }
}

async function request(path: string, signal: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal.aborted) abort();
  signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_PATH}${path}`, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new ApiError(response.status);
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}

export async function fetchNovel(signal: AbortSignal): Promise<Book> {
  const book = normalizeBook(await request('/search?num_chars=500', signal));
  if (!book) throw new Error('作品のデータを読み取れませんでした');
  return book;
}

export async function fetchNovels(count: number, signal: AbortSignal): Promise<Book[]> {
  if (batchSupported) {
    try {
      const data = await request(`/search/batch?count=${count}&num_chars=500`, signal);
      if (!Array.isArray(data)) throw new Error('作品のデータを読み取れませんでした');
      const books = data.map(normalizeBook).filter((book): book is Book => book !== null);
      if (!books.length) throw new Error('作品が見つかりませんでした');
      return [...new Map(books.map((book) => [book.id, book])).values()].slice(0, count);
    } catch (error) {
      // An older backend has no batch route. Do not fan out requests on a 503,
      // timeout or malformed response: that would amplify an upstream outage.
      if (!(error instanceof ApiError) || ![404, 405].includes(error.status)) throw error;
      batchSupported = false;
    }
  }
  const books: Book[] = [];
  for (let index = 0; index < count; index++) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      const book = await fetchNovel(signal);
      if (!books.some((item) => item.id === book.id)) books.push(book);
    } catch (error) {
      if (!books.length || signal.aborted) throw error;
      break;
    }
  }
  return books;
}
