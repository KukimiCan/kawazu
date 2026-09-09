import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchNovel, fetchNovels } from '../src/lib/api.ts';
const payload = (id = 1) => ({ name: '作品', author: '作者', content: '冒頭の文章', url: `https://www.aozora.gr.jp/cards/1/files/${id}.html` });

test('API contract, outage behavior, and old-server compatibility', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const signal = new AbortController().signal;
  await t.test('single work validation and explicit no-store', async () => {
    globalThis.fetch = async (_url, options) => { assert.equal(options.cache, 'no-store'); return Response.json(payload()); };
    assert.equal((await fetchNovel(signal)).name, '作品');
    globalThis.fetch = async () => Response.json({ ...payload(), url: 'javascript:alert(1)' });
    await assert.rejects(fetchNovel(signal), /読み取れません/);
  });
  await t.test('batch excludes invalid works and deduplicates', async () => {
    globalThis.fetch = async () => Response.json([payload(), payload(), { broken: true }, payload(2)]);
    assert.equal((await fetchNovels(3, signal)).length, 2);
  });
  await t.test('503 makes only one call rather than an outage-amplifying fallback', async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response('', { status: 503 }); };
    await assert.rejects(fetchNovels(3, signal));
    assert.equal(calls, 1);
  });
  await t.test('an empty or malformed batch is not silently accepted', async () => {
    for (const data of [[], {}, [{ name: 'invalid' }]]) {
      globalThis.fetch = async () => Response.json(data);
      await assert.rejects(fetchNovels(3, signal));
    }
  });
  await t.test('aborted requests propagate cancellation', async () => {
    globalThis.fetch = async (_url, { signal }) => { signal.throwIfAborted(); return Response.json(payload()); };
    const controller = new AbortController(); controller.abort();
    await assert.rejects(fetchNovel(controller.signal), { name: 'AbortError' });
  });
  await t.test('404 switches to bounded single requests, remembering missing batch support', async () => {
    const calls = [];
    globalThis.fetch = async (url) => {
      calls.push(url);
      return url.includes('/batch') ? new Response('', { status: 404 }) : Response.json(payload(calls.length));
    };
    assert.equal((await fetchNovels(2, signal)).length, 2);
    await fetchNovels(1, signal);
    assert.equal(calls.filter(url => url.includes('/batch')).length, 1);
    assert.equal(calls.length, 4);
  });
});
