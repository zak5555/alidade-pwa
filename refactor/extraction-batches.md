# Planned Extraction Batches

## Batch 1 (Low Risk, No Behavior Change)

- Audit tooling and baseline freeze.
- Module scaffold creation.
- Contract tracking for globals/duplicates/listeners.

## Batch 2 (Pure Utilities)

- Extract pure helpers (string/format/math helpers) into `js/app/core` and `js/app/features/*/utils`.
- Keep wrappers in legacy namespace to preserve call sites.

## Batch 3 (Core Services)

- Extract state/haptics/error management with legacy bridge exports.
- Preserve existing init order.

## Batch 4 (View Modules)

- Move view render blocks module-by-module:
  - dashboard/defense/souk/organic/intel/fortress/protocols/vector/phrases
- Keep `renderApp` router contract unchanged.

## Batch 5 (Heavy Features)

- Extract route planner, context engine, and price checker pipeline.
- Keep external script interoperability with tactical modules.

## Batch 6 (Bootstrap Unification)

- Consolidate dual initialization paths.
- Remove dead/duplicate declarations only after parity pass.
