# ALIDADE App Modules (Migration Scaffold)

This directory hosts the staged extraction from legacy `app.js`.

## Target Structure

- `core/`: state, bootstrap, haptics, errors, routing shell.
- `access/`: tier/auth gates and feature access logic.
- `views/`: view renderers and tab handlers.
- `features/`: price checker, negotiation, route planner, context engines.
- `legacy/`: compatibility bridge exposing legacy `window.*` APIs.

## Migration Rules

- Move code in small batches.
- Keep legacy globals stable until final cutover.
- Do not reorder boot sequence without explicit parity validation.
