import express, { Router } from 'express';
import { config } from './config.js';
import matchesRouter from './routes/matches.js';
import metadataRouter from './routes/metadata.js';

const app = express();
app.use(express.json());

// ── /movie router ─────────────────────────────────────────────────────────────
// All provider endpoints are mounted at /movie, mirroring the reference impl
// which mounts its TV provider at /tv. Plex derives feature URLs relative to
// the registered base path, so the user registers:
//   http://stash-plex-provider:3000/movie

const movieRouter = Router();

// Manifest — Plex fetches GET /movie to discover capabilities
movieRouter.get('/', (_req, res) => {
  const { identifier, title, version } = config.provider;
  res.json({
    MediaProvider: {
      identifier,
      title,
      version,
      // Type 1 = movie library. Stash scenes and movies both map to this type.
      Types: [
        {
          type: 1,
          Scheme: [{ scheme: identifier }],
        },
      ],
      Feature: [
        { type: 'match', key: '/library/metadata/matches' },
        { type: 'metadata', key: '/library/metadata' },
      ],
    },
  });
});

movieRouter.post('/library/metadata/matches', matchesRouter);
movieRouter.use('/library/metadata', metadataRouter);

app.use('/movie', movieRouter);

// ── Health check (root, outside /movie) ───────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', identifier: config.provider.identifier });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const port = config.provider.port;
app.listen(port, () => {
  console.log(`[stash-plex-provider] listening on http://localhost:${port}`);
  console.log(`[stash-plex-provider] register URL: http://localhost:${port}/movie`);
  console.log(`[stash-plex-provider] identifier: ${config.provider.identifier}`);
  console.log(`[stash-plex-provider] stash: ${config.stash.host}:${config.stash.port}`);
  console.log(`[stash-plex-provider] addPlexUrl: ${config.addPlexUrl}`);
});
