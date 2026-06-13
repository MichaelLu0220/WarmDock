use std::sync::Mutex;
use warmdock_lib::domain::clock::Clock;

/// 可變的假時鐘:測試跨日情境用。
pub struct FakeClock {
    today: Mutex<String>,
}

impl FakeClock {
    pub fn new(today: &str) -> Self {
        FakeClock {
            today: Mutex::new(today.to_string()),
        }
    }

    pub fn set_today(&self, today: &str) {
        *self.today.lock().unwrap() = today.to_string();
    }
}

impl Clock for FakeClock {
    fn today(&self) -> String {
        self.today.lock().unwrap().clone()
    }

    fn now(&self) -> String {
        format!("{}T12:00:00+08:00", self.today.lock().unwrap())
    }
}
