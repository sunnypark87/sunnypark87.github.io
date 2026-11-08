import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile, appendFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';

const FOLDER = 'application/vnd.google-apps.folder';
const FIELDS = 'id,name,mimeType,version,size,md5Checksum,trashed';
const validId = (id) => typeof id === 'string' && /^[\w-]+$/.test(id);

export function validateName(name) {
  if (typeof name !== 'string' || !name || name === '.' || name === '..' ||
      /[/\\\x00-\x1f\x7f]/.test(name) || /[. ]$/.test(name)) {
    throw new Error('Drive에 로컬 경로로 사용할 수 없는 파일명이 있습니다.');
  }
  return name;
}

export function createDriveClient(token, { fetchImpl = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  return async (path, params = {}, consume = (r) => r.json()) => {
    const url = new URL(`https://www.googleapis.com/drive/v3/${path}`);
    url.search = new URLSearchParams(params).toString();
    for (let attempt = 0; attempt < 3; attempt++) {
      let retry = false;
      try {
        const response = await fetchImpl(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(120_000),
          redirect: 'error',
        });
        if (response.ok) return await consume(response);
        retry = response.status === 429 || response.status >= 500;
        if (response.status === 403) {
          const body = await response.json().catch(() => ({}));
          retry = body.error?.errors?.some((e) => ['rateLimitExceeded', 'userRateLimitExceeded'].includes(e.reason));
        } else {
          await response.body?.cancel();
        }
        if (!retry) throw new Error(`Drive 요청 실패 (HTTP ${response.status}). 인증·폴더 공유·API 설정을 확인하세요.`);
      } catch (error) {
        // Do not expose remote response bodies, URLs, or credentials in CI logs.
        if (!(error instanceof TypeError) && !['TimeoutError', 'AbortError'].includes(error.name)) throw error;
        retry = true;
      }
      if (retry && attempt < 2) await sleep(1000 * 2 ** attempt);
    }
    throw new Error('Drive 요청이 3회 실패했습니다. 잠시 후 다시 실행하세요.');
  };
}

export async function collectInventory(request, roots) {
  const entries = [];
  const seen = new Set();
  async function visit(file, path) {
    if (!validId(file.id) || !file.version || file.trashed) throw new Error('Drive 파일 메타데이터가 유효하지 않습니다.');
    if (seen.has(file.id)) throw new Error('수집 폴더가 겹치거나 같은 파일을 중복 참조합니다.');
    seen.add(file.id);
    entries.push({ path, id: file.id, mimeType: file.mimeType, version: file.version, size: file.size ?? null, md5Checksum: file.md5Checksum ?? null });
    if (file.mimeType !== FOLDER) {
      if (file.mimeType.startsWith('application/vnd.google-apps.')) throw new Error('Drive 바로가기·Google 문서는 지원하지 않습니다. 원본 파일을 사용하세요.');
      return;
    }
    const names = new Set();
    const pages = new Set();
    let pageToken;
    do {
      const page = await request('files', {
        q: `'${file.id}' in parents and trashed = false`,
        fields: `nextPageToken,incompleteSearch,files(${FIELDS})`,
        pageSize: '1000', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true',
        ...(pageToken ? { pageToken } : {}),
      });
      if (page.incompleteSearch || !Array.isArray(page.files)) throw new Error('Drive 파일 목록을 완전하게 가져오지 못했습니다.');
      for (const child of page.files) {
        const name = validateName(child.name);
        const key = name.normalize('NFC').toLowerCase();
        if (names.has(key)) throw new Error('같은 폴더에 충돌하는 파일명이 있습니다. 이름을 구분해 주세요.');
        names.add(key);
        await visit(child, `${path}/${name}`);
      }
      pageToken = page.nextPageToken;
      if (pageToken && pages.has(pageToken)) throw new Error('Drive 페이지 토큰이 반복되었습니다.');
      pages.add(pageToken);
    } while (pageToken);
  }
  for (const [name, id] of Object.entries(roots)) {
    if (!validId(id)) throw new Error(`${name} 폴더 ID가 유효하지 않습니다.`);
    const folder = await request(`files/${id}`, { fields: FIELDS, supportsAllDrives: 'true' });
    if (folder.mimeType !== FOLDER) throw new Error(`${name}에 지정한 ID가 폴더가 아닙니다.`);
    await visit(folder, name);
  }
  return entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

export async function fetchContent({ token, postsId, assetsId, outputBase = '.content', request = createDriveClient(token) }) {
  if (!token || !postsId || !assetsId) throw new Error('GOOGLE_DRIVE_ACCESS_TOKEN, DRIVE_POSTS_FOLDER_ID, DRIVE_ASSETS_FOLDER_ID가 필요합니다.');
  if (postsId === assetsId) throw new Error('posts와 assets는 서로 다른 폴더여야 합니다.');
  const roots = { posts: postsId, assets: assetsId };
  const before = await collectInventory(request, roots);
  await mkdir(outputBase, { recursive: true });
  const directory = await mkdtemp(join(resolve(outputBase), 'import-'));
  try {
    const files = [];
    for (const entry of before) {
      const target = join(directory, entry.path);
      if (entry.mimeType === FOLDER) {
        await mkdir(target, { recursive: true });
        continue;
      }
      const digest = await request(`files/${entry.id}`, { alt: 'media', supportsAllDrives: 'true' }, async (response) => {
        const md5 = createHash('md5');
        const sha256 = createHash('sha256');
        let size = 0;
        const meter = new Transform({ transform(chunk, encoding, callback) {
          md5.update(chunk); sha256.update(chunk); size += chunk.length;
          callback(null, chunk);
        } });
        await pipeline(response.body, meter, createWriteStream(target, { flags: 'w' }));
        return { md5: md5.digest('hex'), sha256: sha256.digest('hex'), size };
      });
      if ((entry.size !== null && BigInt(entry.size) !== BigInt(digest.size)) ||
          (entry.md5Checksum && entry.md5Checksum !== digest.md5)) {
        throw new Error('다운로드 내용이 Drive의 크기·해시와 일치하지 않습니다.');
      }
      files.push({ ...entry, sha256: digest.sha256, bytes: digest.size });
    }
    const after = await collectInventory(request, roots);
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('수집 중 Drive 내용이 변경되었습니다. 동기화 완료 후 다시 실행하세요.');
    const manifest = { collectedAt: new Date().toISOString(), commit: process.env.GITHUB_SHA ?? null, files };
    await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2));
    return { directory, posts: files.filter((f) => f.path.startsWith('posts/')).length, assets: files.filter((f) => f.path.startsWith('assets/')).length };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = await fetchContent({ token: process.env.GOOGLE_DRIVE_ACCESS_TOKEN, postsId: process.env.DRIVE_POSTS_FOLDER_ID, assetsId: process.env.DRIVE_ASSETS_FOLDER_ID });
    console.log(`수집 완료: posts ${result.posts}개, assets ${result.assets}개. 저장 위치: ${result.directory}`);
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `content_dir=${result.directory}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Drive 수집 완료\n\n- posts: ${result.posts}개\n- assets: ${result.assets}개\n- 크기·해시 및 수집 전후 목록 검증 완료\n- 다운로드한 원본은 배포하거나 artifact로 업로드하지 않았습니다.\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
