#!/usr/bin/env node
/**
 * Mirror the photo bucket into src/content/photos/ before a build.
 *
 * Photos live in a private S3-compatible bucket (Cloudflare R2, Backblaze B2, S3…),
 * one folder per album, optionally with an album.md. This script downloads new and
 * changed files and removes local files that are no longer in the bucket, so the
 * rest of the site can read photos from disk as usual. The folder is gitignored.
 *
 * Configuration (environment or .env):
 *   PHOTOS_S3_ENDPOINT           e.g. https://<account-id>.r2.cloudflarestorage.com
 *   PHOTOS_S3_BUCKET             bucket name
 *   PHOTOS_S3_ACCESS_KEY_ID      read-only key
 *   PHOTOS_S3_SECRET_ACCESS_KEY
 *   PHOTOS_S3_REGION             optional, defaults to "auto" (R2)
 *
 * Without credentials it does nothing, so the site still builds (without photos).
 */
import { mkdir, readFile, rm, readdir, rmdir, writeFile, rename } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AwsClient } from 'aws4fetch';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(ROOT, 'src/content/photos');
const MANIFEST = join(TARGET, '.sync-manifest.json');
const WANTED = /^[^/]+\/[^/]+\.(jpe?g|png|webp|avif|md)$/i; // <album>/<file>
const CONCURRENCY = 6;

const env = process.env;
const endpoint = env.PHOTOS_S3_ENDPOINT?.replace(/\/+$/, '');
const bucket = env.PHOTOS_S3_BUCKET;

if (!endpoint || !bucket || !env.PHOTOS_S3_ACCESS_KEY_ID || !env.PHOTOS_S3_SECRET_ACCESS_KEY) {
  console.warn('[photos] No bucket configured (PHOTOS_S3_*), skipping sync.');
  process.exit(0);
}

const s3 = new AwsClient({
  accessKeyId: env.PHOTOS_S3_ACCESS_KEY_ID,
  secretAccessKey: env.PHOTOS_S3_SECRET_ACCESS_KEY,
  region: env.PHOTOS_S3_REGION || 'auto',
  service: 's3',
});

const objectUrl = (key) =>
  `${endpoint}/${encodeURIComponent(bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;

const decodeXml = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const tag = (xml, name) => xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1];

/** All objects in the bucket, via ListObjectsV2 with pagination. */
async function listObjects() {
  const objects = [];
  let token;
  do {
    const url = new URL(`${endpoint}/${encodeURIComponent(bucket)}`);
    url.searchParams.set('list-type', '2');
    if (token) url.searchParams.set('continuation-token', token);
    const res = await s3.fetch(url);
    if (!res.ok) {
      const body = await res.text();
      const reason = [tag(body, 'Code'), tag(body, 'Message')].filter(Boolean).join(': ') || body.slice(0, 200);
      throw new Error(`[photos] Listing bucket "${bucket}" failed (${res.status}): ${reason}`);
    }
    const xml = await res.text();
    for (const [, block] of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      objects.push({
        key: decodeXml(tag(block, 'Key') ?? ''),
        etag: decodeXml(tag(block, 'ETag') ?? ''),
        size: Number(tag(block, 'Size') ?? 0),
      });
    }
    token = tag(xml, 'IsTruncated') === 'true' ? decodeXml(tag(xml, 'NextContinuationToken') ?? '') : undefined;
  } while (token);
  return objects;
}

async function download({ key }) {
  const res = await s3.fetch(objectUrl(key));
  if (!res.ok) throw new Error(`[photos] Downloading ${key} failed (${res.status})`);
  const file = join(TARGET, ...key.split('/'));
  await mkdir(dirname(file), { recursive: true });
  await writeFile(`${file}.part`, Buffer.from(await res.arrayBuffer()));
  await rename(`${file}.part`, file);
}

async function localFiles(dir = TARGET) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? localFiles(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return files.flat();
}

async function pool(items, worker) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length) await worker(queue.shift());
    }),
  );
}

const started = Date.now();
const remote = (await listObjects()).filter((o) => WANTED.test(o.key));
const manifest = JSON.parse(await readFile(MANIFEST, 'utf8').catch(() => '{}'));
const onDisk = new Set((await localFiles()).map((f) => relative(TARGET, f).split(sep).join('/')));

const changed = remote.filter(
  (o) => !onDisk.has(o.key) || manifest[o.key]?.etag !== o.etag || manifest[o.key]?.size !== o.size,
);
await pool(changed, download);

// Remove anything that is no longer in the bucket (the bucket is the source of truth).
const keep = new Set([...remote.map((o) => o.key), '.sync-manifest.json', '.gitkeep']);
let removed = 0;
for (const key of onDisk) {
  if (!keep.has(key)) {
    await rm(join(TARGET, ...key.split('/')));
    removed++;
  }
}
for (const entry of await readdir(TARGET, { withFileTypes: true }).catch(() => [])) {
  if (entry.isDirectory()) await rmdir(join(TARGET, entry.name)).catch(() => {}); // only succeeds when empty
}

await mkdir(TARGET, { recursive: true });
await writeFile(
  MANIFEST,
  JSON.stringify(Object.fromEntries(remote.map((o) => [o.key, { etag: o.etag, size: o.size }])), null, 2),
);

const albums = new Set(remote.map((o) => o.key.split('/')[0])).size;
console.log(
  `[photos] ${remote.length} files in ${albums} albums: ${changed.length} downloaded, ${removed} removed (${Date.now() - started}ms)`,
);
