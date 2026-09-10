import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBook, parseStoredBooks, placeBook, searchBooks, swipeDirection, readLibrary, writeLibrary, LIBRARY_KEY } from '../src/lib/books.ts';

const old = { id: 'legacy-id', name: '吾輩は猫である', author: '夏目 漱石', content: '吾輩は猫である。', url: 'http://www.aozora.gr.jp/cards/148/files/789.html#start' };
const book = normalizeBook(old);

test('legacy records use a stable HTTPS work ID and are deduplicated', () => {
  assert.equal(book.id, 'https://www.aozora.gr.jp/cards/148/files/789.html');
  assert.equal(parseStoredBooks(JSON.stringify([old, { ...old, id: 'another', url: book.url }])).length, 1);
});
test('untrusted URLs and incomplete API or saved records are rejected', () => {
  for (const url of ['javascript:alert(1)', 'https://evil.example/cards/1', 'https://www.aozora.gr.jp.evil.test/', 'https://a:b@www.aozora.gr.jp/']) assert.equal(normalizeBook({ ...old, url }), null);
  assert.equal(normalizeBook({ ...old, content: '' }), null);
  assert.equal(normalizeBook({ ...old, name: null }), null);
});
test('moves are exclusive, can be undone, and cannot duplicate the work', () => {
  const initial = { liked: [book], favorites: [] };
  const moved = placeBook(initial, book, 'favorites');
  assert.deepEqual(moved, { liked: [], favorites: [book] });
  assert.deepEqual(placeBook(moved, book, 'liked'), initial);
  assert.deepEqual(placeBook(moved, book, 'favorites'), moved);
  assert.deepEqual(placeBook(moved, book, null), { liked: [], favorites: [] });
});
test('search handles Japanese spaces and combinations of author and title', () => {
  assert.equal(searchBooks([book], '猫　漱石').length, 1);
  assert.equal(searchBooks([book], '太宰').length, 0);
  assert.equal(searchBooks([book], '  ').length, 1);
  assert.equal(searchBooks([{ ...book, name: 'ABC' }], 'ａｂｃ').length, 1);
});
test('vertical and short gestures never choose a work', () => {
  assert.equal(swipeDirection(100, 200), null);
    assert.equal(swipeDirection(55, 0), null);
    assert.equal(swipeDirection(56, 10), 'right');
    assert.equal(swipeDirection(-56, 10), 'left');
    assert.equal(swipeDirection(56, 40), null);
  assert.equal(swipeDirection(90, 70), null);
  assert.equal(swipeDirection(100, 10), 'right');
  assert.equal(swipeDirection(-100, -10), 'left');
});
test('migration preserves favorites, keeps old keys and writes both shelves atomically', () => {
  const data = new Map([['likedBooks', JSON.stringify([old])], ['favoriteBooks', JSON.stringify([old])]]);
  const writes = [];
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => { writes.push(key); data.set(key, value); } };
  const library = readLibrary(storage);
  assert.deepEqual(library, { liked: [], favorites: [book] });
  writeLibrary(storage, library);
  assert.deepEqual(writes, [LIBRARY_KEY]);
  assert.equal(data.get('likedBooks'), JSON.stringify([old]));
  assert.deepEqual(readLibrary(storage), library);
});
test('invalid saved JSON is not silently replaced with an empty collection', () => {
  assert.throws(() => parseStoredBooks('{broken'));
  assert.throws(() => readLibrary({ getItem: () => '{broken' }));
  assert.throws(() => readLibrary({ getItem: () => '{"liked":null,"favorites":[]}' }));
});
test('a quota failure leaves the last complete library untouched', () => {
  const data = JSON.stringify({ liked: [book], favorites: [] });
  const storage = { getItem: () => data, setItem: () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); } };
  assert.throws(() => writeLibrary(storage, { liked: [], favorites: [book] }), /Quota/);
  assert.deepEqual(readLibrary(storage), { liked: [book], favorites: [] });
});
