//! 點數規則的唯一定義處。

use crate::error::{AppError, AppResult};

pub const DIFFICULTY_MIN: i64 = 1;
pub const DIFFICULTY_MAX: i64 = 5;
pub const FOCUS_BONUS: i64 = 1;
pub const DEFAULT_MAX_SLOTS: i64 = 3;

pub fn validate_difficulty(difficulty: i64) -> AppResult<()> {
    if (DIFFICULTY_MIN..=DIFFICULTY_MAX).contains(&difficulty) {
        Ok(())
    } else {
        Err(AppError::InvalidInput(format!(
            "difficulty must be {}..={}, got {}",
            DIFFICULTY_MIN, DIFFICULTY_MAX, difficulty
        )))
    }
}

pub fn base_points(difficulty: i64) -> i64 {
    difficulty
}

pub fn final_reward(difficulty: i64, is_focus: bool) -> i64 {
    base_points(difficulty) + if is_focus { FOCUS_BONUS } else { 0 }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reward_table() {
        for d in DIFFICULTY_MIN..=DIFFICULTY_MAX {
            assert_eq!(final_reward(d, false), d);
            assert_eq!(final_reward(d, true), d + FOCUS_BONUS);
        }
    }

    #[test]
    fn difficulty_bounds() {
        assert!(validate_difficulty(DIFFICULTY_MIN).is_ok());
        assert!(validate_difficulty(DIFFICULTY_MAX).is_ok());
        assert!(validate_difficulty(DIFFICULTY_MIN - 1).is_err());
        assert!(validate_difficulty(DIFFICULTY_MAX + 1).is_err());
    }
}
