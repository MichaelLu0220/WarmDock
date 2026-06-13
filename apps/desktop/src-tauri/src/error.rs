use serde::ser::SerializeMap;
use serde::Serialize;

/// 應用層錯誤。序列化成 `{ code, message, details? }` 給前端,
/// 讓 UI 能依 code 顯示在地化訊息或做分支處理。
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("task not found")]
    TaskNotFound,
    #[error("task already completed")]
    TaskAlreadyCompleted,
    #[error("task setup not completed")]
    TaskSetupIncomplete,
    #[error("task detail already set")]
    TaskDetailAlreadySet,
    #[error("unknown unlock node: {0}")]
    UnknownUnlockNode(String),
    #[error("node already unlocked")]
    AlreadyUnlocked,
    #[error("requirement not met: {0}")]
    RequirementNotMet(String),
    #[error("insufficient points: need {need}, have {have}")]
    InsufficientPoints { need: i64, have: i64 },
    #[error("invalid input: {0}")]
    InvalidInput(String),
    #[error("window error: {0}")]
    Window(String),
    #[error("database error: {0}")]
    Db(#[from] rusqlite::Error),
}

pub type AppResult<T> = Result<T, AppError>;

impl AppError {
    pub fn code(&self) -> &'static str {
        match self {
            AppError::TaskNotFound => "TASK_NOT_FOUND",
            AppError::TaskAlreadyCompleted => "TASK_ALREADY_COMPLETED",
            AppError::TaskSetupIncomplete => "TASK_SETUP_INCOMPLETE",
            AppError::TaskDetailAlreadySet => "TASK_DETAIL_ALREADY_SET",
            AppError::UnknownUnlockNode(_) => "UNKNOWN_UNLOCK_NODE",
            AppError::AlreadyUnlocked => "ALREADY_UNLOCKED",
            AppError::RequirementNotMet(_) => "REQUIREMENT_NOT_MET",
            AppError::InsufficientPoints { .. } => "INSUFFICIENT_POINTS",
            AppError::InvalidInput(_) => "INVALID_INPUT",
            AppError::Window(_) => "WINDOW_ERROR",
            AppError::Db(_) => "DB_ERROR",
        }
    }
}

impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut map = serializer.serialize_map(None)?;
        map.serialize_entry("code", self.code())?;
        map.serialize_entry("message", &self.to_string())?;
        if let AppError::InsufficientPoints { need, have } = self {
            map.serialize_entry(
                "details",
                &serde_json::json!({ "need": need, "have": have }),
            )?;
        }
        map.end()
    }
}
