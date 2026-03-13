import express from 'express';
import { config } from './config.js';
import matchesRouter from './routes/matches.js';
import metadataRouter from './routes/metadata.js';

const app = express();
app.use(express.json());

// ── Provider manifest ─────────────────────────────────────────────────────────
// Plex fetches this to learn the provider's capabilities and endpoints.

app.get('/', (_req, res) => {
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

// ── Routes ────────────────────────────────────────────────────────────────────

app.post('/library/metadata/matches', matchesRouter);
app.use('/library/metadata', metadataRouter);

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', identifier: config.provider.identifier });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const port = config.provider.port;
app.listen(port, () => {
  console.log(`[stash-plex-provider] listening on http://localhost:${port}`);
  console.log(`[stash-plex-provider] identifier: ${config.provider.identifier}`);
  console.log(`[stash-plex-provider] stash: ${config.stash.host}:${config.stash.port}`);
  console.log(`[stash-plex-provider] addPlexUrl: ${config.addPlexUrl}`);
});
