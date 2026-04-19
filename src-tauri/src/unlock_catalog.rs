use crate::models::UnlockStatus;
use std::collections::HashSet;

/// 單一解鎖節點的靜態定義。
/// 這些定義是版本控制的一部分,不存進 DB。
pub struct UnlockNode {
    pub id: &'static str,
    pub category: &'static str,
    pub cost: i64,
    pub requires: &'static [&'static str],
    pub effect: UnlockEffect,
}

pub enum UnlockEffect {
    /// 純解鎖儀式,不改變 UnlockStatus。
    /// 用於中心覺醒節點 — 它的作用是作為其他節點的前置。
    None,
    MaxSlots(i64),
    FocusTaskFeature,
    CustomRefreshTime,
    WeeklyAnalysis,
}

/// MVP 節點表。
/// 中心節點 root.awaken 是所有路徑的入口(cost=0,但需主動點擊)。
/// 線性鏈版本,之後若要改交錯直接改這張。
pub const UNLOCK_CATALOG: &[UnlockNode] = &[
    // 中心覺醒 — 0 cost,4 條路的前置
    UnlockNode {
        id: "root.awaken",
        category: "root",
        cost: 0,
        requires: &[],
        effect: UnlockEffect::None,
    },
    // capacity 流派 — 線性鏈
    UnlockNode {
        id: "slots.4",
        category: "capacity",
        cost: 30,
        requires: &["root.awaken"],
        effect: UnlockEffect::MaxSlots(4),
    },
    UnlockNode {
        id: "slots.5",
        category: "capacity",
        cost: 80,
        requires: &["slots.4"],
        effect: UnlockEffect::MaxSlots(5),
    },
    UnlockNode {
        id: "slots.6",
        category: "capacity",
        cost: 160,
        requires: &["slots.5"],
        effect: UnlockEffect::MaxSlots(6),
    },
    UnlockNode {
        id: "slots.7",
        category: "capacity",
        cost: 280,
        requires: &["slots.6"],
        effect: UnlockEffect::MaxSlots(7),
    },
    // focus 流派 — MVP 只有一個節點,未來擴充成線性鏈
    UnlockNode {
        id: "focus.basic",
        category: "focus",
        cost: 50,
        requires: &["root.awaken"],
        effect: UnlockEffect::FocusTaskFeature,
    },
    // time 流派
    UnlockNode {
        id: "time.custom_refresh",
        category: "time",
        cost: 20,
        requires: &["root.awaken"],
        effect: UnlockEffect::CustomRefreshTime,
    },
    // analysis 流派
    UnlockNode {
        id: "analysis.weekly",
        category: "analysis",
        cost: 120,
        requires: &["root.awaken"],
        effect: UnlockEffect::WeeklyAnalysis,
    },
];

/// 從已解鎖節點 ID 集合推導 UnlockStatus。
/// MaxSlots 取最大值(解鎖 slots.7 自動等於解鎖 4/5/6),其他 feature 是 OR。
pub fn compute_unlock_status(unlocked_ids: &HashSet<String>) -> UnlockStatus {
    let mut status = UnlockStatus {
        max_visible_task_slots: 3,
        focus_task_feature_unlocked: false,
        custom_refresh_time_unlocked: false,
        weekly_analysis_unlocked: false,
    };

    for node in UNLOCK_CATALOG {
        if !unlocked_ids.contains(node.id) {
            continue;
        }
        match node.effect {
            UnlockEffect::None => {}
            UnlockEffect::MaxSlots(n) => {
                if n > status.max_visible_task_slots {
                    status.max_visible_task_slots = n;
                }
            }
            UnlockEffect::FocusTaskFeature => status.focus_task_feature_unlocked = true,
            UnlockEffect::CustomRefreshTime => status.custom_refresh_time_unlocked = true,
            UnlockEffect::WeeklyAnalysis => status.weekly_analysis_unlocked = true,
        }
    }

    status
}

/// 查詢節點定義(給 purchase_unlock / get_unlock_progress 用)。
pub fn find_node(node_id: &str) -> Option<&'static UnlockNode> {
    UNLOCK_CATALOG.iter().find(|n| n.id == node_id)
}