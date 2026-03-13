import { StashScene } from './stash/client.js';
import { config, stashBaseUrl } from './config.js';

// ── Plex metadata types ───────────────────────────────────────────────────────

interface PlexImage {
  type: 'coverPoster' | 'background';
  url: string;
}

interface PlexTag {
  tag: string;
}

interface PlexRole {
  tag: string;
  thumb?: string;
}

interface PlexRating {
  value: number;
  type: 'user' | 'critic' | 'audience';
  image?: string;
}

interface PlexGuid {
  id: string;
}

export interface PlexMetadata {
  type: 'movie';
  ratingKey: string;
  guid: string;
  title: string;
  summary?: string;
  studio?: string;
  originallyAvailableAt?: string;
  year?: number;
  contentRating: 'XXX';
  Image?: PlexImage[];
  Genre?: PlexTag[];
  Role?: PlexRole[];
  Studio?: PlexTag[];
  Collection?: PlexTag[];
  Rating?: PlexRating[];
  Guid?: PlexGuid[];
}

// ── Mapping ───────────────────────────────────────────────────────────────────

export function sceneToPlexMetadata(scene: StashScene, identifier: string): PlexMetadata {
  const guid = `${identifier}://movie/${scene.id}`;

  const title = resolveTitle(scene);
  const year = scene.date ? parseInt(scene.date.substring(0, 4), 10) : undefined;

  const images: PlexImage[] = [];
  if (scene.paths.screenshot) {
    // Stash screenshot URLs are relative paths — make them absolute
    const screenshotUrl = scene.paths.screenshot.startsWith('http')
      ? scene.paths.screenshot
      : `${stashBaseUrl()}${scene.paths.screenshot}`;
    images.push({ type: 'coverPoster', url: screenshotUrl });
  }

  const genres: PlexTag[] = scene.tags.map((t) => ({ tag: t.name }));

  const roles: PlexRole[] = scene.performers.map((p) => ({
    tag: p.name,
    ...(p.image_path
      ? {
          thumb: p.image_path.startsWith('http')
            ? p.image_path
            : `${stashBaseUrl()}${p.image_path}`,
        }
      : {}),
  }));

  const studios: PlexTag[] = [];
  if (scene.studio) {
    studios.push({ tag: scene.studio.name });
    if (scene.studio.parent_studio) {
      studios.push({ tag: scene.studio.parent_studio.name });
    }
  }

  const collections: PlexTag[] = buildCollections(scene);

  const ratings: PlexRating[] = [];
  if (scene.rating100 !== null) {
    ratings.push({ value: scene.rating100 / 10, type: 'user' });
  }

  // stash_ids → Guid[] for cross-provider linking (StashDB, TPDB, etc.)
  const guids: PlexGuid[] = scene.stash_ids.map((sid) => ({
    id: `${sid.scheme}://${sid.stash_id}`,
  }));

  return {
    type: 'movie',
    ratingKey: scene.id,
    guid,
    title,
    ...(scene.details ? { summary: scene.details } : {}),
    ...(scene.studio ? { studio: scene.studio.name } : {}),
    ...(scene.date ? { originallyAvailableAt: scene.date } : {}),
    ...(year ? { year } : {}),
    contentRating: 'XXX',
    ...(images.length ? { Image: images } : {}),
    ...(genres.length ? { Genre: genres } : {}),
    ...(roles.length ? { Role: roles } : {}),
    ...(studios.length ? { Studio: studios } : {}),
    ...(collections.length ? { Collection: collections } : {}),
    ...(ratings.length ? { Rating: ratings } : {}),
    ...(guids.length ? { Guid: guids } : {}),
  };
}

function resolveTitle(scene: StashScene): string {
  if (config.titleFormat === 'filename' || !scene.title) {
    const file = scene.files[0];
    if (file) return file.basename;
  }
  return scene.title ?? scene.id;
}

function buildCollections(scene: StashScene): PlexTag[] {
  const tags: PlexTag[] = [];
  const { collections } = config;

  if (collections.fromStudio && scene.studio) {
    tags.push({ tag: scene.studio.name });
  }
  if (collections.fromParentStudio && scene.studio?.parent_studio) {
    tags.push({ tag: scene.studio.parent_studio.name });
  }
  if (collections.fromMovie) {
    for (const m of scene.movies) {
      tags.push({ tag: m.movie.name });
    }
  }
  if (collections.fromPerformer) {
    for (const p of scene.performers) {
      tags.push({ tag: p.name });
    }
  }
  if (collections.fromTags) {
    for (const t of scene.tags) {
      tags.push({ tag: t.name });
    }
  }
  if (collections.fromOrganized && scene.organized) {
    tags.push({ tag: 'Organized' });
  }

  return tags;
}
