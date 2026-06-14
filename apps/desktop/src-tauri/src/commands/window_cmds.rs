use tauri::{PhysicalPosition, PhysicalSize, Window};

fn werr(e: tauri::Error) -> String {
    e.to_string()
}

/// Set window position and size in one IPC call.
/// Doing both back-to-back in Rust avoids the visible gap (and flicker) between
/// two separate set_size / set_position calls from the frontend. Order depends on
/// grow/shrink so the transient overflow lands off the right screen edge:
/// growing -> resize first (overflow right) then move; shrinking -> move first then resize.
#[tauri::command]
pub fn set_window_rect(window: Window, x: i32, y: i32, width: u32, height: u32) -> Result<(), String> {
    let current = window.outer_size().map_err(werr)?;
    let growing = width >= current.width;

    if growing {
        window.set_size(PhysicalSize::new(width, height)).map_err(werr)?;
        window.set_position(PhysicalPosition::new(x, y)).map_err(werr)?;
    } else {
        window.set_position(PhysicalPosition::new(x, y)).map_err(werr)?;
        window.set_size(PhysicalSize::new(width, height)).map_err(werr)?;
    }
    Ok(())
}
