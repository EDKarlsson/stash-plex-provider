import 'dotenv/config';

function bool(key: string, defaultVal: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return defaultVal;
  return v.toLowerCase() === 'true' || v === '1';
}

function str(key: string, defaultVal: string): string {
  return process.env[key] ?? defaultVal;
}

function num(key: string, defaultVal: number): number {
  const v = process.env[key];
  if (v === undefined) return defaultVal;
  const n = parseInt(v, 10);
  return isNaN(n) ? defaultVal : n;
}

export const config = {
  stash: {
    host: str('STASH_HOST', 'localhost'),
    port: num('STASH_PORT', 9999),
    https: bool('STASH_HTTPS', false),
    apiKey: str('STASH_API_KEY', ''),
  },
  provider: {
    port: num('PROVIDER_PORT', 3000),
    identifier: 'tv.plex.agents.custom.stash',
    title: 'Stash',
    version: '0.1.0',
  },
  titleFormat: str('TITLE_FORMAT', 'title') as 'title' | 'filename',
  collections: {
    fromStudio: bool('COLLECTION_FROM_STUDIO', true),
    fromParentStudio: bool('COLLECTION_FROM_PARENT_STUDIO', true),
    fromMovie: bool('COLLECTION_FROM_MOVIE', true),
    fromPerformer: bool('COLLECTION_FROM_PERFORMER', false),
    fromTags: bool('COLLECTION_FROM_TAGS', false),
    fromOrganized: bool('COLLECTION_FROM_ORGANIZED', false),
  },
  filters: {
    requireOrganized: bool('REQUIRE_ORGANIZED', false),
    requireStashId: bool('REQUIRE_STASH_ID', false),
  },
  addPlexUrl: bool('ADD_PLEX_URL', true),
  logLevel: str('LOG_LEVEL', 'info'),
} as const;

export function stashBaseUrl(): string {
  const { host, port, https } = config.stash;
  const scheme = https ? 'https' : 'http';
  return `${scheme}://${host}:${port}`;
}
