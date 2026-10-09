// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct LocalAgentStatus {
    connected: bool,
    agent_url: String,
}

#[tauri::command]
fn check_local_agent() -> LocalAgentStatus {
    LocalAgentStatus {
        connected: true,
        agent_url: "http://127.0.0.1:8008".into(),
    }
}

#[tauri::command]
fn notify_desktop(title: String, body: String) {
    use tauri::api::notification::Notification;
    let _ = Notification::new("io.chainproof.desktop")
        .title(title)
        .body(body)
        .show();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![check_local_agent, notify_desktop])
        .run(tauri::generate_context!())
        .expect("error while running ChainProof Tauri Desktop application");
}
