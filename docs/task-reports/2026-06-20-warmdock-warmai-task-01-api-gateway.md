# Task 1 Report: Local WarmAI Gateway

## Scope

- Added `createLocalWarmAiGateway`.
- Added WarmAI score to WarmDock band mapping.
- Exported the gateway from `@warmdock/api`.

## TDD

- RED: `vitest run packages/api/src/warmai.test.ts` failed because `./warmai` did not exist.
- GREEN: focused gateway tests passed.

## Verification

- `node node_modules/vitest/vitest.mjs run packages/api/src/warmai.test.ts`: 3 passed.
- `node node_modules/typescript/bin/tsc -p packages/api/tsconfig.json --noEmit`: passed.

## Files

- `packages/api/src/warmai.ts`
- `packages/api/src/warmai.test.ts`
- `packages/api/src/index.ts`

## Commit

`feat: add local WarmAI gateway`
