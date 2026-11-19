import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

export const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

export function fixturePath(name: string): string {
  return path.join(FIXTURES_DIR, name);
}

export function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * The Masa source tree that is bind-mounted into the engine container
 * (../masacms in this repo). Tests read the file cache from it directly, so
 * the file-storage tests only work against a local environment.
 * Override with MASA_DIR.
 */
export function masaDir(): string {
  return process.env.MASA_DIR || path.resolve(__dirname, '../../masacms');
}

export function fileCacheDir(filePoolId = 'default'): string {
  const dir = path.join(masaDir(), 'sites', filePoolId, 'cache', 'file');
  if (!existsSync(dir)) {
    throw new Error(
      `File cache directory not found: ${dir}. The file-storage tests read it from the ` +
        `bind-mounted Masa tree; set MASA_DIR if your checkout lives elsewhere.`,
    );
  }
  return dir;
}

export function listFileCache(filePoolId = 'default'): string[] {
  return readdirSync(fileCacheDir(filePoolId)).filter((name) =>
    statSync(path.join(fileCacheDir(filePoolId), name)).isFile(),
  );
}

export function readCacheFile(name: string, filePoolId = 'default'): Buffer {
  return readFileSync(path.join(fileCacheDir(filePoolId), name));
}

/** Cache file names look like {fileID}.jpg or {fileID}_small.jpg. */
const FILE_ID = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{16}/i;

export function fileIdOf(cacheFileName: string): string | undefined {
  return cacheFileName.match(FILE_ID)?.[0];
}

export function cacheFilesFor(fileId: string, filePoolId = 'default'): string[] {
  return listFileCache(filePoolId).filter((name) => name.startsWith(fileId));
}

/**
 * Plain HTTP GET that sends the path exactly as given. Playwright's request
 * client (like any URL parser) normalises "/../", which would defeat
 * path-traversal probes.
 */
export function rawGet(
  baseURL: string,
  rawPath: string,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  const { hostname, port } = new URL(baseURL);
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname, port, path: rawPath, method: 'GET', timeout: 60_000 }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('timeout', () => req.destroy(new Error(`timeout for ${rawPath}`)));
    req.on('error', reject);
    req.end();
  });
}
