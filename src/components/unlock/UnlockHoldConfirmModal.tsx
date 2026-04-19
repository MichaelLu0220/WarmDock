import type { TreeNodeLayout, UnlockCategory } from "./unlockTreeLayout";

type Props = {
  layout: TreeNodeLayout;
  cost: number;
  availablePoints: number;
  isPurchasing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function getCategoryLabel(category: UnlockCategory): string {
  switch (category) {
    case "core":
      return "核心";
    case "capacity":
      return "容量";
    case "focus":
      return "焦點";
    case "time":
      return "節奏";
    case "analysis":
      return "分析";
    default:
      return "能力";
  }
}

export function UnlockHoldConfirmModal({
  layout,
  cost,
  availablePoints,
  isPurchasing,
  onConfirm,
  onCancel,
}: Props) {
  const isRoot = layout.node_id === "root.awaken";
  const remainingAfter = Math.max(0, availablePoints - cost);

  return (
    <div
      className="wd-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{ zIndex: 80 }}
    >
      <div
        className="wd-modal"
        style={{ width: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <span
            className={`wd-tag wd-tag-${
              layout.category === "capacity" || layout.category === "core"
                ? "gold"
                : "blue"
            }`}
          >
            {getCategoryLabel(layout.category)}
          </span>
          {!isRoot && (
            <span
              style={{ color: "var(--wd-gold)", fontWeight: 700, fontSize: 16 }}
            >
              ◆ {cost}
            </span>
          )}
        </div>

        <h2 className="wd-modal__title" style={{ fontSize: 18 }}>
          {isRoot ? "確認覺醒?" : `解鎖「${layout.displayName}」?`}
        </h2>

        <p
          className="wd-modal__subtitle"
          style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6 }}
        >
          {layout.description}
        </p>

        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            background: "var(--wd-paper)",
            border: "2px solid var(--wd-border-soft)",
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          {!isRoot && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--wd-ink-soft)",
                }}
              >
                <span>消耗</span>
                <span style={{ color: "var(--wd-gold)", fontWeight: 700 }}>
                  ◆ {cost}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--wd-ink-soft)",
                }}
              >
                <span>解鎖後</span>
                <span style={{ color: "var(--wd-ink)" }}>
                  剩餘 ◆ {remainingAfter}
                </span>
              </div>
            </>
          )}
          {isRoot && (
            <div style={{ color: "var(--wd-ink-soft)" }}>
              覺醒是免費的,但這是一段不會反悔的決定。
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            type="button"
            className="wd-btn"
            style={{ flex: 1 }}
            onClick={onCancel}
            disabled={isPurchasing}
          >
            取消
          </button>
          <button
            type="button"
            className="wd-btn wd-btn-primary"
            style={{ flex: 1 }}
            onClick={onConfirm}
            disabled={isPurchasing}
          >
            {isPurchasing
              ? isRoot
                ? "覺醒中..."
                : "解鎖中..."
              : isRoot
              ? "確認覺醒"
              : "確認解鎖"}
          </button>
        </div>
      </div>
    </div>
  );
}