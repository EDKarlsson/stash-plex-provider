import { Router, Request, Response } from 'express';
import { findSceneById, addPlexUrlToScene } from '../stash/client.js';
import { sceneToPlexMetadata } from '../mapper.js';
import { config } from '../config.js';

const router = Router();

// GET /library/metadata/:ratingKey
// Plex fetches full metadata for the scene identified by ratingKey (= Stash scene ID).
router.get('/:ratingKey', async (req: Request, res: Response) => {
  const { ratingKey } = req.params;

  const scene = await findSceneById(ratingKey);
  if (!scene) {
    return res.status(404).json({ error: `Scene ${ratingKey} not found in Stash` });
  }

  // Apply organized/stashId filters — drop here so match results still show
  // unfiltered candidates but full metadata fetch enforces the requirement
  if (config.filters.requireOrganized && !scene.organized) {
    return res.status(404).json({ error: `Scene ${ratingKey} is not organized` });
  }
  if (config.filters.requireStashId && scene.stash_ids.length === 0) {
    return res.status(404).json({ error: `Scene ${ratingKey} has no stash_id` });
  }

  const metadata = sceneToPlexMetadata(scene, config.provider.identifier);

  // PlexSync round-trip: write the Plex ratingKey back to Stash as a URL so
  // PlexSync can trigger a Plex refresh when the scene is updated in Stash.
  if (config.addPlexUrl) {
    const plexUrl = `plex/library/metadata/${ratingKey}`;
    // Fire-and-forget — don't block the metadata response on this write
    addPlexUrlToScene(ratingKey, plexUrl).catch((err) => {
      console.error(`[metadata] failed to write Plex URL to scene ${ratingKey}:`, err);
    });
  }

  return res.json({
    MediaContainer: {
      size: 1,
      identifier: config.provider.identifier,
      Metadata: [metadata],
    },
  });
});

export default router;
