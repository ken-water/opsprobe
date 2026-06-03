use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SshConnectionTestInput {
    host: String,
    port: u16,
    username: String,
    auth_method: String,
    secret_ref: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SshConnectionTestResult {
    ok: bool,
    message: String,
}

#[tauri::command]
fn test_ssh_connection(input: SshConnectionTestInput) -> Result<SshConnectionTestResult, String> {
    if input.host.trim().is_empty() {
        return Err("Host is required.".into());
    }

    if input.username.trim().is_empty() {
        return Err("Username is required.".into());
    }

    if input.auth_method != "private-key" {
        return Ok(SshConnectionTestResult {
            ok: false,
            message: "Password mode is not implemented yet. Use private-key for the first SSH workflow.".into(),
        });
    }

    if input.secret_ref.trim().is_empty() {
        return Err("Private key path is required for private-key authentication.".into());
    }

    if !Path::new(&input.secret_ref).exists() {
        return Ok(SshConnectionTestResult {
            ok: false,
            message: format!("Private key file not found: {}", input.secret_ref),
        });
    }

    let target = format!("{}@{}", input.username, input.host);
    let output = Command::new("ssh")
        .arg("-o")
        .arg("BatchMode=yes")
        .arg("-o")
        .arg("StrictHostKeyChecking=no")
        .arg("-o")
        .arg("ConnectTimeout=5")
        .arg("-i")
        .arg(&input.secret_ref)
        .arg("-p")
        .arg(input.port.to_string())
        .arg(target)
        .arg("exit")
        .output()
        .map_err(|error| format!("Failed to execute ssh command: {error}"))?;

    if output.status.success() {
        return Ok(SshConnectionTestResult {
            ok: true,
            message: format!("SSH connectivity to {}:{} succeeded.", input.host, input.port),
        });
    }

    let stderr = String::from_utf8_lossy(&output.stderr);
    let message = stderr.trim();

    Ok(SshConnectionTestResult {
        ok: false,
        message: if message.is_empty() {
            format!("SSH connectivity to {}:{} failed.", input.host, input.port)
        } else {
            message.to_string()
        },
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![test_ssh_connection])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
