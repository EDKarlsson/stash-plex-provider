# Changelog

## [Unreleased]

### Fixed
- **Match route broken** (`cd91ee3`): `movieRouter.post('/library/metadata/matches', matchesRouter)` never worked — Express `.post(path, router)` does not strip the path prefix for sub-routers, so `matchesRouter`'s `router.post('/')` never matched. Changed to `.use()` which strips the prefix correctly. This was silently causing every match request to return "Cannot POST", causing Plex to fall back to scanner-derived titles with no metadata.

### Added
- **`filename` field as primary match signal** (`7d1729f`): Plex sends `filename` (full file path) in the match request body — we were ignoring it and relying on scanner-mangled `title`/`guid` hints. Now uses `path.basename(filename)` as Strategy 1, old hint extraction as Strategy 2, title search as Strategy 3. Most reliable signal since it bypasses all scanner title mangling.
- **Debug request logging**: `LOG_LEVEL=debug` now logs the full match request body, enabling mount path alignment verification between Plex and Stash.

## [0.1.0] - 2026-03-13

### Added
- Initial implementation: TypeScript + Express provider serving the Plex Custom Metadata Provider API
- `GET /movie` manifest endpoint
- `POST /movie/library/metadata/matches` — search Stash by path/title, return candidates
- `GET /movie/library/metadata/:ratingKey` — fetch full scene metadata from Stash
- Full field mapping: title, summary, studio, performers (Role), tags (Genre), cover image, rating, stash_ids (Guid), collections
- PlexSync round-trip: writes `plex/library/metadata/{ratingKey}` back to Stash scene URLs after each metadata fetch
- Config via env vars with sane defaults (see README)
- Docker multi-stage build (node:22-alpine), GitHub Actions push to ghcr.io
- K8s deployment in `media` namespace alongside Plex
