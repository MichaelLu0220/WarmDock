import type { UnlockNodeState } from "../../commands/types";
import { UnlockAwakenBurst } from "./UnlockAwakenBurst";
import { UnlockNode } from "./UnlockNode";
import {
  ROOT_NODE_ID,
  TREE_LAYOUT,
  TREE_VIEWBOX,
  findLayout,
} from "./unlockTreeLayout";
import { buildEdgeShape } from "./unlockTreeGeometry";
import { buildNodeMap } from "./unlockTreeSelectors";

type Props = {
  nodes: UnlockNodeState[];
  isRootAwakened: boolean;
  burstActive: boolean;
  onBurstDone: () => void;
  onNodeClick: (nodeId: string, isCenter: boolean) => void;
  onNodeHoverEnter: (nodeId: string, isCenter: boolean) => void;
  onNodeHoverLeave: (nodeId: string, isCenter: boolean) => void;
  highlightedNodeIds?: Set<string>;
  highlightedEdgeIds?: Set<string>;
  justUnlockedId?: string | null;
};

export function UnlockCanvas({
  nodes,
  isRootAwakened,
  burstActive,
  onBurstDone,
  onNodeClick,
  onNodeHoverEnter,
  onNodeHoverLeave,
  highlightedNodeIds = new Set<string>(),
  highlightedEdgeIds = new Set<string>(),
  justUnlockedId = null,
}: Props) {
  const nodeMap = buildNodeMap(nodes);
  const hasHoverPath = highlightedNodeIds.size > 0;

  return (
    <svg
      viewBox={`0 0 ${TREE_VIEWBOX.w} ${TREE_VIEWBOX.h}`}
      style={{
		  width: `${TREE_VIEWBOX.w}px`,
		  height: `${TREE_VIEWBOX.h}px`,
		  display: "block",
		}}
      preserveAspectRatio="xMidYMid meet"
    >
      {TREE_LAYOUT.filter((layout) => layout.node_id !== ROOT_NODE_ID).map((layout) => {
        const state = nodeMap.get(layout.node_id);
        if (!state || !layout.parent_id) return null;

        const parentLayout = findLayout(layout.parent_id);
        const parentState = nodeMap.get(layout.parent_id);

        if (!parentLayout || !parentState) return null;

        const edge = buildEdgeShape({
          layout,
          parentLayout,
          parentUnlocked: parentState.unlocked,
          selfUnlocked: state.unlocked,
        });

        const isHighlighted = highlightedEdgeIds.has(layout.node_id);
        const edgeOpacity = hasHoverPath
          ? isHighlighted
            ? 1
            : 0.18
          : edge.opacity;

        const edgeStroke = isHighlighted ? "var(--wd-gold)" : edge.stroke;
        const edgeStrokeWidth = isHighlighted ? edge.strokeWidth + 1.5 : edge.strokeWidth;

        if (edge.type === "path") {
          return (
            <path
              key={edge.key}
              d={edge.d}
              fill="none"
              stroke={edgeStroke}
              strokeWidth={edgeStrokeWidth}
              strokeDasharray={edge.strokeDasharray}
              opacity={edgeOpacity}
            />
          );
        }

        return (
          <line
            key={edge.key}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={edgeStroke}
            strokeWidth={edgeStrokeWidth}
            strokeDasharray={edge.strokeDasharray}
            opacity={edgeOpacity}
          />
        );
      })}

      {burstActive && <UnlockAwakenBurst onDone={onBurstDone} />}

      {TREE_LAYOUT.map((layout) => {
        const state = nodeMap.get(layout.node_id);
        if (!state) return null;

        const isCenter = layout.node_id === ROOT_NODE_ID;
        const isHighlighted = highlightedNodeIds.has(layout.node_id);

        return (
          <UnlockNode
            key={layout.node_id}
            nodeId={layout.node_id}
            x={layout.x}
            y={layout.y}
            icon={layout.icon}
            state={state}
            isCenter={isCenter}
            isRootAwakened={isRootAwakened}
            onClick={() => onNodeClick(layout.node_id, isCenter)}
            onHoverEnter={() => onNodeHoverEnter(layout.node_id, isCenter)}
            onHoverLeave={() => onNodeHoverLeave(layout.node_id, isCenter)}
            opacity={hasHoverPath ? (isHighlighted ? 1 : 0.28) : 1}
            isJustUnlocked={justUnlockedId === layout.node_id}
            isPathHighlighted={isHighlighted}
          />
        );
      })}

      {!isRootAwakened && (
        <text
          x={TREE_VIEWBOX.w / 2}
          y={TREE_VIEWBOX.h - 30}
          textAnchor="middle"
          fontFamily="var(--wd-font-body)"
          fontSize="18"
          fill="var(--wd-orange)"
        >
          點擊中心覺醒
        </text>
      )}
    </svg>
  );
}