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
    // docked 節點刻意比放大版小,但仍維持可讀/可點的下限,且中心節點最大
    expect(compact.nodeSize).toBeGreaterThanOrEqual(56);
    expect(compact.nodeSize).toBeLessThan(expanded.nodeSize);
    expect(compact.centerSize).toBeGreaterThan(compact.nodeSize);
  });

  it("selects the requested mode", () => {
    expect(getUnlockTreeLayout("compact")).toBe(UNLOCK_TREE_LAYOUTS.compact);
    expect(getUnlockTreeLayout("expanded")).toBe(UNLOCK_TREE_LAYOUTS.expanded);
  });
});
