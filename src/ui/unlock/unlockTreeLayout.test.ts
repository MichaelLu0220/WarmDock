import { describe, expect, it } from "vitest";
import { getUnlockTreeLayout, UNLOCK_TREE_LAYOUTS } from "./unlockTreeLayout";

describe("unlock tree layout modes", () => {
  it("provides every node in compact and expanded modes", () => {
    const compactIds = UNLOCK_TREE_LAYOUTS.compact.nodes.map(
      (node) => node.node_id
    );
    const expandedIds = UNLOCK_TREE_LAYOUTS.expanded.nodes.map(
      (node) => node.node_id
    );

    expect(compactIds).toEqual(expandedIds);
    expect(compactIds).toHaveLength(8);
  });

  it("uses a compact geometry that keeps docked nodes readable", () => {
    const compact = getUnlockTreeLayout("compact");
    const expanded = getUnlockTreeLayout("expanded");

    expect(compact.viewBox.h).toBeLessThan(expanded.viewBox.h);
    expect(compact.nodeSize).toBeGreaterThanOrEqual(80);
    expect(compact.centerSize).toBeGreaterThan(compact.nodeSize);
  });

  it("selects the requested mode", () => {
    expect(getUnlockTreeLayout("compact")).toBe(UNLOCK_TREE_LAYOUTS.compact);
    expect(getUnlockTreeLayout("expanded")).toBe(UNLOCK_TREE_LAYOUTS.expanded);
  });
});
