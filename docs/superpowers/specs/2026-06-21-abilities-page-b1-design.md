# AbilitiesPage B1 No-Scroll Overview Design

## Goal

Redesign WarmDock's narrow AbilitiesPage as a fixed-size, no-scroll ability overview for the `320px x 560px` docked book panel. The page should make dependency structure clear without returning to the old crowded radial tree.

The chosen direction is B1: a compact overview dashboard with a core awakening block, a capacity ladder, three branch bookmarks, and a selected ability detail well.

## Hard Constraints

- The page must not create horizontal or vertical scrollbars.
- The full experience must fit inside the existing WarmDock panel body.
- The design must work in shared web, desktop, and future extension contexts.
- Unlocking must keep the current sense of commitment and misclick protection.
- The frontend mirrors backend unlock costs, requirements, and purchase logic. It must not invent authoritative unlock rules.

## Information Architecture

The page is not a card list. It is a one-screen map with two information layers:

1. Overview layer: always visible, compact, used for scanning.
2. Detail layer: one selected ability at a time, used for mantra, cost, requirement, and action hint.

The overview contains:

- Header: title and available points.
- Core awakening block: root ability and system status.
- Capacity ladder: four connected compact nodes for slots 4, 5, 6, and 7.
- Branch bookmarks: three compact nodes for Focus, Rhythm, and Weekly Analysis.
- Detail well: selected ability details and unlock instruction.
- Existing page dots remain outside or below the page body according to the current book shell.

## Layout Budget

Use fixed internal regions with responsive safeguards rather than relying on content flow.

Approximate vertical budget:

- Header: 36px
- Core awakening: 104px
- Capacity ladder: 132px
- Branch bookmarks: 86px
- Detail well: 118px
- Padding and page affordance allowance: about 44px

The root container should use `overflow: hidden`, `box-sizing: border-box`, and `min-width: 0` on all flex/grid children. Text must use line clamps or ellipsis inside fixed regions.

## Core Awakening Block

The root ability is shown as the emotional center of the page:

- Large sparkle icon.
- Short name.
- Current root state.
- If not awakened, a subtle dashed or breathing border.
- If awakened, a gold or warm filled state.

The block should be clickable/selectable. If it is awakenable, holding on it starts the same hold progress pattern as other unlockable abilities.

## Capacity Ladder

The capacity chain should be visually special because it is the only linear dependency chain.

Show `4 -> 5 -> 6 -> 7` as four compact fixed-size nodes connected by a horizontal or gently stepped line that never exceeds the container width. Each node shows:

- Grid icon or number.
- Cost.
- State treatment.

Avoid diagonal layouts that push nodes outside the page. If the line is horizontal, use small vertical offsets or labels to preserve the feeling of progression without creating overflow risk.

## Branch Bookmarks

Focus, Rhythm, and Weekly Analysis appear as three equal-width bookmark tiles.

Each tile shows:

- Icon.
- Short label.
- Cost.
- State treatment.

The tiles must use a fixed three-column grid with `minmax(0, 1fr)` and no intrinsic width overflow. Long labels clamp or abbreviate.

## Detail Well

The detail well shows the selected ability. Default selection should be:

- Root if the system is not awakened.
- First purchasable ability if one exists.
- Otherwise the next blocked or insufficient ability in progression order.

Detail content:

- Ability name.
- Mantra, one or two short lines.
- Cost and current state.
- Requirement or effect summary.
- Action hint: hold for unlockable states; tap another ability for locked states.

The detail well is not the purchase confirmation. The existing confirmation modal remains the final purchase gate after hold completion.

## Node States

Keep the six logical states from the current code:

- `unlocked`
- `awakenable`
- `awaiting`
- `blocked`
- `insufficient`
- `purchasable`

Visual rules:

- `unlocked`: warm gold fill, strong border, check mark.
- `purchasable` and `awakenable`: cream fill, strong dark border, grab cursor, subtle pulse or active affordance.
- `insufficient`: cream fill, soft solid border, visible cost in muted gold or dimmed chip.
- `blocked`: paper fill, dashed soft border, small lock or prerequisite marker, dimmed icon.
- `awaiting`: paper fill, dashed soft border, lower opacity, tied to root not awakened.

Do not rely only on opacity. Use border style, fill, icon marker, and text state so the states stay readable in light and dark themes.

## Interaction

Primary interactions:

- Tap or click any node to select it and update the detail well.
- Hold an unlockable node for 2 seconds to begin unlock commitment.
- During hold, fill the selected node with gold progress.
- On completion, open the existing confirmation modal with cost and remaining points.
- Releasing early cancels the progress.

This keeps the current hold-to-unlock behavior while making selection and inspection more direct.

## Implementation Shape

The existing `AbilitiesPage.tsx` can remain the ownership boundary. It should reuse:

- `loadUnlockProgress`
- `purchaseUnlock`
- `useUnlockStore`
- `useHoldToActivate`
- `UnlockHoldConfirmModal`
- `renderUnlockIcon`
- `getUnlockTreeLayout`
- `deriveRowState` logic, either retained locally or renamed for node state

The old `UnlockTree.tsx` radial/SVG view should not be removed as part of this change.

CSS should live near the current `.wd-abilities` styles in `packages/ui-web/src/styles/globals.css`. The no-scroll guarantee should be enforced by container sizing, fixed regions, `overflow: hidden`, and defensive text handling.

## Testing And Verification

Minimum verification:

- Unit or component-level logic tests only if state selection or ordering is extracted into a pure helper.
- Existing unlock tree layout tests should still pass.
- Manual visual verification at `320px x 560px`.
- Verify no horizontal or vertical scrollbar appears inside the AbilitiesPage body.
- Verify long Traditional Chinese and English strings do not widen the layout.
- Verify all six states are visually distinguishable.
- Verify hold-to-confirm still opens the confirmation modal and early release cancels.

## Non-Goals

- Do not redesign backend unlock data.
- Do not remove the desktop radial `UnlockTree`.
- Do not add tabs, bottom navigation, or a traditional app menu.
- Do not turn unlocking into click-to-buy.
- Do not introduce a full game-style skill tree UI.
