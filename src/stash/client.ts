import { GraphQLClient } from 'graphql-request';
import { config, stashBaseUrl } from '../config.js';
import {
  FIND_SCENES_BY_PATH,
  FIND_SCENES_BY_TITLE,
  FIND_SCENE_BY_ID,
  BULK_SCENE_UPDATE_URL,
} from './queries.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StashSceneSummary {
  id: string;
  title: string | null;
  date: string | null;
  files: { path: string }[];
}

export interface StashScene {
  id: string;
  title: string | null;
  details: string | null;
  urls: string[];
  date: string | null;
  rating100: number | null;
  organized: boolean;
  files: { path: string; basename: string }[];
  paths: { screenshot: string | null; stream: string | null };
  studio: {
    id: string;
    name: string;
    parent_studio: { id: string; name: string } | null;
  } | null;
  stash_ids: { endpoint: string; stash_id: string; scheme: string }[];
  tags: { id: string; name: string }[];
  performers: { id: string; name: string; gender: string | null; image_path: string | null }[];
  movies: { movie: { id: string; name: string } }[];
  galleries: { id: string }[];
}

// ── Client factory ────────────────────────────────────────────────────────────

function makeClient(): GraphQLClient {
  const url = `${stashBaseUrl()}/graphql`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.stash.apiKey) {
    headers['ApiKey'] = config.stash.apiKey;
  }
  return new GraphQLClient(url, { headers });
}

// Lazy singleton — recreated only if env changes (which it won't at runtime)
let _client: GraphQLClient | null = null;
function client(): GraphQLClient {
  if (!_client) _client = makeClient();
  return _client;
}

// ── Query helpers ─────────────────────────────────────────────────────────────

export async function findScenesByPath(path: string): Promise<StashSceneSummary[]> {
  const data = await client().request<{ findScenes: { scenes: StashSceneSummary[] } }>(
    FIND_SCENES_BY_PATH,
    { path }
  );
  return data.findScenes.scenes;
}

export async function findScenesByTitle(title: string): Promise<StashSceneSummary[]> {
  const data = await client().request<{ findScenes: { scenes: StashSceneSummary[] } }>(
    FIND_SCENES_BY_TITLE,
    { title }
  );
  return data.findScenes.scenes;
}

export async function findSceneById(id: string): Promise<StashScene | null> {
  const data = await client().request<{ findScene: StashScene | null }>(
    FIND_SCENE_BY_ID,
    { id }
  );
  return data.findScene;
}

export async function addPlexUrlToScene(sceneId: string, plexUrl: string): Promise<void> {
  const scene = await findSceneById(sceneId);
  if (!scene) return;

  // Keep existing non-plex URLs; replace any prior plex URL
  const existingUrls = (scene.urls ?? []).filter((u) => !u.includes('plex/library/metadata'));
  const updatedUrls = [...existingUrls, plexUrl];

  await client().request(BULK_SCENE_UPDATE_URL, {
    input: {
      ids: [sceneId],
      urls: { mode: 'SET', values: updatedUrls },
    },
  });
}
