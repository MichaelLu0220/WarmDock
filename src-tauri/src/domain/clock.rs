/// 時間來源抽象,讓 refresh/streak 邏輯可以在測試裡注入假時鐘。
pub trait Clock: Send + Sync {
    /// 本地日期 "YYYY-MM-DD"
    fn today(&self) -> String;
    /// 本地時間 RFC3339
    fn now(&self) -> String;
}

pub struct SystemClock;

impl Clock for SystemClock {
    fn today(&self) -> String {
        chrono::Local::now().format("%Y-%m-%d").to_string()
    }

    fn now(&self) -> String {
        chrono::Local::now().to_rfc3339()
    }
}
