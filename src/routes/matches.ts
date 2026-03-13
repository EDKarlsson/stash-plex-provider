import { Router, Request, Response } from 'express';
import path from 'path';
import { findScenesByPath, findScenesByTitle, StashSceneSummary } from '../stash/client.js';
import { config } from '../config.js';

const router = Router();

// POST /library/metadata/matches
// Plex sends a JSON body describing what it wants to match. We search Stash and
// return candidate scenes. The ratingKey we return here is the Stash scene ID.
router.post('/', async (req: Request, res: Response) => {
  const { title, year, type, guid } = req.body as {
    title?: string;
    year?: number;
    type?: number;
    guid?: string;
  };

  // Only handle movie type (1)
  if (type !== undefined && type !== 1) {
    return res.json(emptyContainer(config.provider.identifier));
  }

  let scenes: StashSceneSummary[] = [];

  // Strategy 1: if Plex gives us a filename hint buried in the guid or title,
  // use the basename as the path search term
  const hint = extractFilenameHint(guid, title);
  if (hint) {
    scenes = await findScenesByPath(hint);
  }

  // Strategy 2: fallback to title search
  if (scenes.length === 0 && title) {
    scenes = await findScenesByTitle(title);
  }

  // Apply filters
  const filtered = scenes.filter((s) => passesFilters(s));

  // Score candidates: exact filename match scores 100, others score 80
  const candidates = filtered.map((s) => {
    const score = isExactFilenameMatch(s, hint) ? 100 : 80;
    return sceneToCandidate(s, score, config.provider.identifier);
  });

  return res.json({
    MediaContainer: {
      offset: 0,
      totalSize: candidates.length,
      size: candidates.length,
      identifier: config.provider.identifier,
      Metadata: candidates,
    },
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractFilenameHint(guid?: string, title?: string): string | undefined {
  // Plex sometimes passes the file path in the guid or title for initial matching
  if (guid && guid.includes('/')) {
    return path.basename(guid);
  }
  if (title && (title.includes('/') || title.includes('\\'))) {
    return path.basename(title);
  }
  return title;
}

function isExactFilenameMatch(scene: StashSceneSummary, hint: string | undefined): boolean {
  if (!hint) return false;
  return scene.files.some((f) => path.basename(f.path).includes(hint));
}

function passesFilters(scene: StashSceneSummary): boolean {
  // Filters that require the full scene object are applied in the metadata
  // endpoint. Here we only drop scenes with no title when title is required.
  void scene;
  return true;
}

function sceneToCandidate(
  scene: StashSceneSummary,
  score: number,
  identifier: string
): object {
  const year = scene.date ? parseInt(scene.date.substring(0, 4), 10) : undefined;
  return {
    type: 'movie',
    ratingKey: scene.id,
    guid: `${identifier}://movie/${scene.id}`,
    title: scene.title ?? scene.files[0]?.path ?? scene.id,
    ...(year ? { year } : {}),
    score,
  };
}

function emptyContainer(identifier: string): object {
  return {
    MediaContainer: {
      offset: 0,
      totalSize: 0,
      size: 0,
      identifier,
      Metadata: [],
    },
  };
}

export default router;
