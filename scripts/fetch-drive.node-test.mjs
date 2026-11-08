import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { collectInventory, createDriveClient, fetchContent, validateName } from './fetch-drive.mjs';
const folder = (id, name = id) => ({ id, name, mimeType: 'application/vnd.google-apps.folder', version: '1' });
const bytes = Buffer.from([0, 255, 12, 13, 10]);
const file = { id: 'image', name: '사진.png', mimeType: 'image/png', version: '1', size: String(bytes.length), md5Checksum: createHash('md5').update(bytes).digest('hex') };

function fixture({ changed = false, corrupt = false } = {}) {
  let inventories = 0;
  return async (path, params, consume) => {
    if (path === 'files/posts') { inventories++; return folder('posts'); }
    if (path === 'files/assets') return folder('assets');
    if (path === 'files/image') return consume(new Response(corrupt ? 'bad' : bytes));
    if (path === 'files') {
      if (params.q.startsWith("'posts'")) return { files: [] };
      if (params.q.startsWith("'assets'")) return { files: [folder('nested', '글-이미지')] };
      if (params.q.startsWith("'nested'")) return { files: [{ ...file, version: changed && inventories > 1 ? '2' : '1' }] };
    }
    throw new Error(`Unexpected request: ${path}`);
  };
}
async function sandbox(t) {
  const base = await mkdtemp(join(tmpdir(), 'drive-test-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  return base;
}

test('preserves nested paths, empty folders, binary bytes and manifest hash', async (t) => {
  const base = await sandbox(t);
  const result = await fetchContent({ token: 'test', postsId: 'posts', assetsId: 'assets', outputBase: base, request: fixture() });
  assert.equal(result.posts, 0); assert.equal(result.assets, 1);
  assert.deepEqual(await readFile(join(result.directory, 'assets/글-이미지/사진.png')), bytes);
  assert.deepEqual(await readdir(join(result.directory, 'posts')), []);
  const manifest = JSON.parse(await readFile(join(result.directory, 'manifest.json'), 'utf8'));
  assert.equal(manifest.files[0].sha256, createHash('sha256').update(bytes).digest('hex'));
});
for (const scenario of ['changed', 'corrupt']) {
  test(`${scenario} content fails and removes partial import`, async (t) => {
    const base = await sandbox(t);
    await assert.rejects(fetchContent({ token: 'test', postsId: 'posts', assetsId: 'assets', outputBase: base, request: fixture({ [scenario]: true }) }), /변경|일치/);
    assert.deepEqual(await readdir(base), []);
  });
}
test('rejects unsafe file names', () => {
  for (const name of ['..', '.', '../x', '/absolute', 'a\\b', 'x\n', 'x.']) assert.throws(() => validateName(name));
});
test('lists every page and rejects cross-page name collisions', async () => {
  let pages = 0;
  const request = async (path, params) => {
    if (path === 'files/posts') return folder('posts');
    pages++;
    return params.pageToken ? { files: [{ ...file, id: 'second', name: 'SECOND.png' }] } : { files: [file], nextPageToken: 'next' };
  };
  const entries = await collectInventory(request, { posts: 'posts' });
  assert.equal(pages, 2); assert.equal(entries.length, 3);
  await assert.rejects(collectInventory(async (path, params) => {
    const result = await request(path, params);
    if (params.pageToken) result.files[0].name = file.name;
    return result;
  }, { posts: 'posts' }), /충돌/);
});
test('rejects native Google documents and incomplete listings', async () => {
  for (const page of [{ files: [{ ...file, mimeType: 'application/vnd.google-apps.shortcut' }] }, { files: [], incompleteSearch: true }]) {
    await assert.rejects(collectInventory(async (path) => path === 'files/posts' ? folder('posts') : page, { posts: 'posts' }));
  }
});
test('retries rate limits but not invalid credentials; never includes token in error', async () => {
  let attempts = 0;
  const request = createDriveClient('private-token', { sleep: async () => {}, fetchImpl: async () => {
    attempts++;
    return attempts < 3 ? new Response('', { status: 429 }) : Response.json({ ok: true });
  } });
  assert.deepEqual(await request('files'), { ok: true }); assert.equal(attempts, 3);
  attempts = 0;
  const denied = createDriveClient('private-token', { fetchImpl: async () => { attempts++; return new Response('private-token', { status: 401 }); } });
  await assert.rejects(denied('files'), (error) => error.message.includes('401') && !error.message.includes('private-token'));
  assert.equal(attempts, 1);
});
