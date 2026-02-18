# ALIDADE Refactor Workspace

This folder tracks the staged decomposition of `app.js` into modules without behavior changes.

## Principles

- Preserve runtime behavior first; optimize later.
- Keep all legacy global APIs available during migration.
- Move code in small, verifiable batches.
- Treat script load order as part of the contract.

## Baseline Artifacts

- `baseline-notes.md`: frozen metrics and risk inventory before extraction.

## Immediate Next Steps

1. Freeze global/window contract.
2. Extract pure utilities first.
3. Extract core services with compatibility wrappers.
4. Extract feature blocks incrementally.
