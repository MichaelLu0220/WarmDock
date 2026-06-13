//! 解鎖節點的靜態目錄。定義是版本控制的一部分,不存進 DB。

use crate::domain::points::DEFAULT_MAX_SLOTS;
use crate::error::{AppError, AppResult};
use serde::Serialize;
use std::collections::HashSet;

#[derive(Debug)]
pub struct UnlockNode {
    pub id: &'static str,
    pub category: &'static str,
    pub cost: i64,
    pub requires: &'static [&'static str],
    pub effect: UnlockEffect,
}

#[derive(Debug)]
pub enum UnlockEffect {
    /// 純解鎖儀式,不改變 UnlockStatus(中心覺醒節點,作為其他節點的前置)。
    None,
    MaxSlots(i64),
    FocusTaskFeature,
    CustomRefreshTime,
    WeeklyAnalysis,
}

/// 中心節點 root.awaken 是所有路徑的入口(cost=0,但需主動點擊)。
pub const UNLOCK_CATALOG: &[UnlockNode] = &[
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
    UnlockNode {
        id: "focus.basic",
        category: "focus",
        cost: 50,
        requires: &["root.awaken"],
        effect: UnlockEffect::FocusTaskFeature,
    },
    UnlockNode {
        id: "time.custom_refresh",
        category: "time",
        cost: 20,
        requires: &["root.awaken"],
        effect: UnlockEffect::CustomRefreshTime,
    },
    UnlockNode {
        id: "analysis.weekly",
        category: "analysis",
        cost: 120,
        requires: &["root.awaken"],
        effect: UnlockEffect::WeeklyAnalysis,
    },
];

#[derive(Debug, Clone, Serialize)]
pub struct UnlockStatus {
    pub max_visible_task_slots: i64,
    pub focus_task_feature_unlocked: bool,
    pub custom_refresh_time_unlocked: bool,
    pub weekly_analysis_unlocked: bool,
}

/// 從已解鎖節點 ID 集合推導 UnlockStatus。
/// MaxSlots 取最大值,其他 feature 是 OR。
pub fn compute_unlock_status(unlocked_ids: &HashSet<String>) -> UnlockStatus {
    let mut status = UnlockStatus {
        max_visible_task_slots: DEFAULT_MAX_SLOTS,
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
                status.max_visible_task_slots = status.max_visible_task_slots.max(n)
            }
            UnlockEffect::FocusTaskFeature => status.focus_task_feature_unlocked = true,
            UnlockEffect::CustomRefreshTime => status.custom_refresh_time_unlocked = true,
            UnlockEffect::WeeklyAnalysis => status.weekly_analysis_unlocked = true,
        }
    }

    status
}

pub fn find_node(node_id: &str) -> Option<&'static UnlockNode> {
    UNLOCK_CATALOG.iter().find(|n| n.id == node_id)
}

/// 購買驗證的所有分支集中在這裡(可測)。
pub fn validate_purchase(
    node_id: &str,
    unlocked_ids: &HashSet<String>,
    available_points: i64,
) -> AppResult<&'static UnlockNode> {
    let node =
        find_node(node_id).ok_or_else(|| AppError::UnknownUnlockNode(node_id.to_string()))?;

    if unlocked_ids.contains(node_id) {
        return Err(AppError::AlreadyUnlocked);
    }
    for req in node.requires {
        if !unlocked_ids.contains(*req) {
            return Err(AppError::RequirementNotMet((*req).to_string()));
        }
    }
    if available_points < node.cost {
        return Err(AppError::InsufficientPoints {
            need: node.cost,
            have: available_points,
        });
    }
    Ok(node)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ids(list: &[&str]) -> HashSet<String> {
        list.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn status_defaults_to_three_slots() {
        let s = compute_unlock_status(&ids(&[]));
        assert_eq!(s.max_visible_task_slots, DEFAULT_MAX_SLOTS);
        assert!(!s.focus_task_feature_unlocked);
    }

    #[test]
    fn max_slots_takes_maximum() {
        let s = compute_unlock_status(&ids(&["root.awaken", "slots.4", "slots.5"]));
        assert_eq!(s.max_visible_task_slots, 5);
    }

    #[test]
    fn purchase_validation_branches() {
        // unknown node
        assert_eq!(
            validate_purchase("nope", &ids(&[]), 999)
                .unwrap_err()
                .code(),
            "UNKNOWN_UNLOCK_NODE"
        );
        // already unlocked
        assert_eq!(
            validate_purchase("root.awaken", &ids(&["root.awaken"]), 0)
                .unwrap_err()
                .code(),
            "ALREADY_UNLOCKED"
        );
        // requirement not met
        assert_eq!(
            validate_purchase("slots.5", &ids(&["root.awaken"]), 999)
                .unwrap_err()
                .code(),
            "REQUIREMENT_NOT_MET"
        );
        // insufficient points
        let err = validate_purchase("slots.4", &ids(&["root.awaken"]), 10).unwrap_err();
        assert_eq!(err.code(), "INSUFFICIENT_POINTS");
        // happy path
        let node = validate_purchase("slots.4", &ids(&["root.awaken"]), 30).unwrap();
        assert_eq!(node.cost, 30);
    }

    #[test]
    fn catalog_requirements_reference_existing_nodes() {
        for node in UNLOCK_CATALOG {
            for req in node.requires {
                assert!(
                    find_node(req).is_some(),
                    "{} requires unknown {}",
                    node.id,
                    req
                );
            }
        }
    }
}
