use crate::error::{AppError, AppResult};
use tauri::{PhysicalPosition, PhysicalSize, Window};

fn werr(e: tauri::Error) -> AppError {
    AppError::Window(e.to_string())
}

/// 一次設定視窗位置與尺寸。
/// 前端分兩次 IPC 呼叫 set_size / set_position 之間有可見空隙,
/// 造成模式切換時視窗在舊位置閃爍;在 Rust 端背靠背執行就沒有空隙。
/// 順序依放大/縮小調整,讓過渡瞬間的溢出落在螢幕右緣外(不可見):
/// 放大 → 先變大(往右溢出)再移位;縮小 → 先移位(往右溢出)再變小。
#[tauri::command]
pub fn set_window_rect(window: Window, x: i32, y: i32, width: u32, height: u32) -> AppResult<()> {
    let current = window.outer_size().map_err(werr)?;
    let growing = width >= current.width;

    if growing {
        window
            .set_size(PhysicalSize::new(width, height))
            .map_err(werr)?;
        window
            .set_position(PhysicalPosition::new(x, y))
            .map_err(werr)?;
    } else {
        window
            .set_position(PhysicalPosition::new(x, y))
            .map_err(werr)?;
        window
            .set_size(PhysicalSize::new(width, height))
            .map_err(werr)?;
    }
    Ok(())
}
