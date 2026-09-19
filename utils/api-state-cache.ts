import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const CACHE_ROOT = join(process.cwd(), '.auth');
const inflight = new Map<string, Promise<unknown>>();

function getCachePath(prefix: string, scope: string): string {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'default';
  return join(CACHE_ROOT, scope, `${safePrefix}.json`);
}

export async function withSharedState<T>(
  prefix: string,
  scope: string,
  factory: () => Promise<T>,
): Promise<T> {
  const cacheKey = `${scope}:${prefix}`;
  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey) as Promise<T>;
  }

  const work = (async () => {
    const filePath = getCachePath(prefix, scope);
    mkdirSync(dirname(filePath), { recursive: true });

    if (existsSync(filePath)) {
      try {
        const cached = JSON.parse(readFileSync(filePath, 'utf-8')) as T;
        return cached;
      } catch {
        // ignore invalid cache and rebuild below
      }
    }

    const created = await factory();
    const tempPath = `${filePath}.${process.pid}.tmp`;
    writeFileSync(tempPath, JSON.stringify(created, null, 2));
    renameSync(tempPath, filePath);

    return created;
  })();

  inflight.set(cacheKey, work);
  try {
    return await work;
  } finally {
    inflight.delete(cacheKey);
  }
}

export function clearStateCache(scope?: string): void {
  if (!existsSync(CACHE_ROOT)) return;

  if (scope) {
    const scopePath = join(CACHE_ROOT, scope);
    if (existsSync(scopePath)) {
      const files = readdirSync(scopePath, { withFileTypes: true });
      for (const file of files) {
        if (file.isFile()) {
          unlinkSync(join(scopePath, file.name));
        }
      }
    }
    return;
  }

  const dirs = readdirSync(CACHE_ROOT, { withFileTypes: true });
  for (const dir of dirs) {
    if (dir.isDirectory()) {
      clearStateCache(dir.name);
    }
  }
}
