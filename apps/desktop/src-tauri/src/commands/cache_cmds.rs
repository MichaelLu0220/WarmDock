//! Encrypted, per-account local cache for offline read-only display.
//!
//! Each account gets a random 32-byte key stored in the OS credential vault
//! (keyring), indexed by the Supabase user id and never derived from tokens or
//! passwords. The cached snapshot is encrypted with AES-256-GCM into a per-account
//! file. Different accounts use different keys + files, so one account cannot read
//! another's cache. Permanent deletion removes both the file and the vault key.

use std::fs;
use std::path::PathBuf;

use aes_gcm::aead::Aead;
use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use tauri::Manager;

const SERVICE: &str = "com.warmdock.app";
const NONCE_LEN: usize = 12;
const KEY_LEN: usize = 32;

fn cache_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn cache_file(app: &tauri::AppHandle, user_id: &str) -> Result<PathBuf, String> {
    Ok(cache_dir(app)?.join(format!("cache_{user_id}.bin")))
}

fn keyring_entry(user_id: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(SERVICE, &format!("cache:{user_id}")).map_err(|e| e.to_string())
}

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn from_hex(s: &str) -> Result<Vec<u8>, String> {
    if s.len() % 2 != 0 {
        return Err("invalid key length".into());
    }
    (0..s.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&s[i..i + 2], 16).map_err(|e| e.to_string()))
        .collect()
}

/// Load the per-account key from the vault, creating a fresh random one on first use.
fn get_or_create_key(user_id: &str) -> Result<[u8; KEY_LEN], String> {
    let entry = keyring_entry(user_id)?;
    let hex = match entry.get_password() {
        Ok(existing) => existing,
        Err(keyring::Error::NoEntry) => {
            let mut buf = [0u8; KEY_LEN];
            getrandom::getrandom(&mut buf).map_err(|e| e.to_string())?;
            let hex = to_hex(&buf);
            entry.set_password(&hex).map_err(|e| e.to_string())?;
            hex
        }
        Err(e) => return Err(e.to_string()),
    };
    let bytes = from_hex(&hex)?;
    let mut key = [0u8; KEY_LEN];
    if bytes.len() != KEY_LEN {
        return Err("corrupt cache key".into());
    }
    key.copy_from_slice(&bytes);
    Ok(key)
}

fn cipher_for(user_id: &str) -> Result<Aes256Gcm, String> {
    let key = get_or_create_key(user_id)?;
    Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cache_write_snapshot(
    app: tauri::AppHandle,
    user_id: String,
    snapshot: String,
) -> Result<(), String> {
    let cipher = cipher_for(&user_id)?;
    let mut nonce_bytes = [0u8; NONCE_LEN];
    getrandom::getrandom(&mut nonce_bytes).map_err(|e| e.to_string())?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, snapshot.as_bytes())
        .map_err(|e| e.to_string())?;

    let mut out = Vec::with_capacity(NONCE_LEN + ciphertext.len());
    out.extend_from_slice(&nonce_bytes);
    out.extend_from_slice(&ciphertext);

    fs::write(cache_file(&app, &user_id)?, out).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cache_read_snapshot(
    app: tauri::AppHandle,
    user_id: String,
) -> Result<Option<String>, String> {
    let path = cache_file(&app, &user_id)?;
    if !path.exists() {
        return Ok(None);
    }
    let blob = fs::read(&path).map_err(|e| e.to_string())?;
    if blob.len() <= NONCE_LEN {
        return Ok(None);
    }
    let (nonce_bytes, ciphertext) = blob.split_at(NONCE_LEN);
    let cipher = cipher_for(&user_id)?;
    let plaintext = cipher
        .decrypt(Nonce::from_slice(nonce_bytes), ciphertext)
        .map_err(|e| e.to_string())?;
    Ok(Some(String::from_utf8(plaintext).map_err(|e| e.to_string())?))
}

/// Remove the encrypted cache file and its vault key (permanent deletion).
#[tauri::command]
pub fn cache_clear(app: tauri::AppHandle, user_id: String) -> Result<(), String> {
    let path = cache_file(&app, &user_id)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    if let Ok(entry) = keyring_entry(&user_id) {
        let _ = entry.delete_credential();
    }
    Ok(())
}
