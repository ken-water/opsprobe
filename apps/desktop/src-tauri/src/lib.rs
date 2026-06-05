use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RunLinuxCheckInput {
    host: String,
    port: u16,
    username: String,
    auth_method: String,
    secret_ref: String,
    check_id: String,
    title: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct CheckEvidence {
    label: String,
    value: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct CheckResult {
    check_id: String,
    title: String,
    status: String,
    severity: String,
    summary: String,
    evidence: Vec<CheckEvidence>,
    remediation: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct AssetCredentialPayload {
    method: String,
    username: String,
    secret_ref: String,
    binding_status: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct AssetPayload {
    id: String,
    name: String,
    kind: String,
    protocol: String,
    host: String,
    port: u16,
    tags: Vec<String>,
    credential: AssetCredentialPayload,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalServiceInspectionPreviewInput {
    asset: AssetPayload,
    template_id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalServiceInspectionHistoryInput {
    asset_id: Option<String>,
    date_from: Option<String>,
    date_to: Option<String>,
    limit: Option<u32>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalServiceScheduleUpsertInput {
    id: Option<String>,
    asset: AssetPayload,
    template_id: String,
    interval_minutes: u32,
    enabled: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalServiceScheduleDeleteInput {
    id: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalServiceAssetUpsertInput {
    asset: AssetPayload,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalServiceSettingsPayload {
    active_asset: Option<AssetPayload>,
    selected_template_id: Option<String>,
    onboarding_mode: Option<String>,
    report_audience: Option<String>,
    history_asset_filter: Option<String>,
    history_date_from: Option<String>,
    history_date_to: Option<String>,
    schedule_interval_minutes: Option<String>,
    migration_path: Option<String>,
    report_path: Option<String>,
    pdf_report_path: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalServiceSettingsUpsertInput {
    settings: LocalServiceSettingsPayload,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalServiceFilePathInput {
    path: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct InspectionRunSummaryPayload {
    total: u32,
    passed: u32,
    warning: u32,
    critical: u32,
    unknown: u32,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct InspectionRunPayload {
    id: String,
    task_id: String,
    asset_id: String,
    template_id: String,
    status: String,
    results: Vec<CheckResult>,
    summary: InspectionRunSummaryPayload,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalServiceHtmlReportExportInput {
    path: String,
    run: InspectionRunPayload,
    asset: Option<AssetPayload>,
    audience: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaveExportFileInput {
    path: String,
    base64_data: String,
}

fn run_local_service_json_command(
    mode: &str,
    payload: Option<String>,
    error_prefix: &str,
) -> Result<Value, String> {
    let local_service_entry =
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../local-service/src/main.ts");

    let mut command = Command::new("node");
    command
        .arg("--experimental-strip-types")
        .arg(local_service_entry)
        .arg(mode)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    if payload.is_some() {
        command.stdin(std::process::Stdio::piped());
    }

    let mut child = command
        .spawn()
        .map_err(|error| format!("Failed to start {error_prefix}: {error}"))?;

    if let Some(payload) = payload {
        if let Some(mut stdin) = child.stdin.take() {
            use std::io::Write;
            stdin
                .write_all(payload.as_bytes())
                .map_err(|error| format!("Failed to write payload to {error_prefix}: {error}"))?;
        }
    }

    let output = child
        .wait_with_output()
        .map_err(|error| format!("Failed to read {error_prefix} output: {error}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let message = stderr.trim();
        return Err(if message.is_empty() {
            format!("{error_prefix} failed.")
        } else {
            message.to_string()
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str::<Value>(&stdout)
        .map_err(|error| format!("Failed to parse {error_prefix} output: {error}"))
}

#[tauri::command]
fn get_local_service_status() -> Result<Value, String> {
    let local_service_entry =
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../local-service/src/main.ts");

    let output = Command::new("node")
        .arg("--experimental-strip-types")
        .arg(local_service_entry)
        .output()
        .map_err(|error| format!("Failed to execute local service status command: {error}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let message = stderr.trim();
        return Err(if message.is_empty() {
            "Local service status command failed.".into()
        } else {
            message.to_string()
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str::<Value>(&stdout)
        .map_err(|error| format!("Failed to parse local service status output: {error}"))
}

#[tauri::command]
fn start_local_service() -> Result<String, String> {
    let local_service_entry =
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../local-service/src/main.ts");

    let child = Command::new("node")
        .arg("--experimental-strip-types")
        .arg(local_service_entry)
        .arg("serve")
        .spawn()
        .map_err(|error| format!("Failed to start local service: {error}"))?;

    Ok(format!(
        "Local service start requested with pid {}.",
        child.id()
    ))
}

#[tauri::command]
fn stop_local_service() -> Result<Value, String> {
    let local_service_entry =
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../local-service/src/main.ts");

    let output = Command::new("node")
        .arg("--experimental-strip-types")
        .arg(local_service_entry)
        .arg("stop")
        .output()
        .map_err(|error| format!("Failed to execute local service stop command: {error}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let message = stderr.trim();
        return Err(if message.is_empty() {
            "Local service stop command failed.".into()
        } else {
            message.to_string()
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str::<Value>(&stdout)
        .map_err(|error| format!("Failed to parse local service stop output: {error}"))
}

#[tauri::command]
fn bootstrap_local_service_postgres() -> Result<Value, String> {
    run_local_service_json_command(
        "postgres-bootstrap",
        None,
        "local service postgres bootstrap command",
    )
}

#[tauri::command]
fn start_local_service_postgres() -> Result<Value, String> {
    run_local_service_json_command(
        "postgres-start",
        None,
        "local service postgres start command",
    )
}

#[tauri::command]
fn stop_local_service_postgres() -> Result<Value, String> {
    run_local_service_json_command(
        "postgres-stop",
        None,
        "local service postgres stop command",
    )
}

#[tauri::command]
fn get_local_service_inspection_preview(
    input: LocalServiceInspectionPreviewInput,
) -> Result<Value, String> {
    let payload = serde_json::to_string(&input)
        .map_err(|error| format!("Failed to serialize local service preview input: {error}"))?;

    run_local_service_json_command("inspect-preview", Some(payload), "local service preview command")
}

#[tauri::command]
fn run_local_service_inspection(
    input: LocalServiceInspectionPreviewInput,
) -> Result<Value, String> {
    let payload = serde_json::to_string(&input)
        .map_err(|error| format!("Failed to serialize local service run input: {error}"))?;

    run_local_service_json_command("inspect-run", Some(payload), "local service inspection command")
}

#[tauri::command]
fn get_local_service_inspection_history(
    input: Option<LocalServiceInspectionHistoryInput>,
) -> Result<Value, String> {
    let payload = input
        .map(|value| serde_json::to_string(&value))
        .transpose()
        .map_err(|error| format!("Failed to serialize local service history input: {error}"))?;

    run_local_service_json_command(
        "inspection-history",
        payload,
        "local service inspection history command",
    )
}

#[tauri::command]
fn get_local_service_schedules() -> Result<Value, String> {
    run_local_service_json_command("schedules-list", None, "local service schedules list command")
}

#[tauri::command]
fn upsert_local_service_schedule(input: LocalServiceScheduleUpsertInput) -> Result<Value, String> {
    let payload = serde_json::to_string(&input)
        .map_err(|error| format!("Failed to serialize local service schedule input: {error}"))?;

    run_local_service_json_command(
        "schedules-upsert",
        Some(payload),
        "local service schedule upsert command",
    )
}

#[tauri::command]
fn delete_local_service_schedule(input: LocalServiceScheduleDeleteInput) -> Result<Value, String> {
    let payload = serde_json::to_string(&input)
        .map_err(|error| format!("Failed to serialize local service schedule delete input: {error}"))?;

    run_local_service_json_command(
        "schedules-delete",
        Some(payload),
        "local service schedule delete command",
    )
}

#[tauri::command]
fn get_local_service_assets() -> Result<Value, String> {
    run_local_service_json_command("assets-list", None, "local service assets list command")
}

#[tauri::command]
fn upsert_local_service_asset(input: LocalServiceAssetUpsertInput) -> Result<Value, String> {
    let payload = serde_json::to_string(&input)
        .map_err(|error| format!("Failed to serialize local service asset input: {error}"))?;

    run_local_service_json_command(
        "assets-upsert",
        Some(payload),
        "local service asset upsert command",
    )
}

#[tauri::command]
fn get_local_service_settings() -> Result<Value, String> {
    run_local_service_json_command("settings-get", None, "local service settings get command")
}

#[tauri::command]
fn upsert_local_service_settings(input: LocalServiceSettingsUpsertInput) -> Result<Value, String> {
    let payload = serde_json::to_string(&input)
        .map_err(|error| format!("Failed to serialize local service settings input: {error}"))?;

    run_local_service_json_command(
        "settings-upsert",
        Some(payload),
        "local service settings upsert command",
    )
}

#[tauri::command]
fn export_local_service_config(input: LocalServiceFilePathInput) -> Result<Value, String> {
    let payload = serde_json::to_string(&input)
        .map_err(|error| format!("Failed to serialize local service export path input: {error}"))?;

    run_local_service_json_command(
        "config-export",
        Some(payload),
        "local service config export command",
    )
}

#[tauri::command]
fn import_local_service_config(input: LocalServiceFilePathInput) -> Result<Value, String> {
    let payload = serde_json::to_string(&input)
        .map_err(|error| format!("Failed to serialize local service import path input: {error}"))?;

    run_local_service_json_command(
        "config-import",
        Some(payload),
        "local service config import command",
    )
}

#[tauri::command]
fn export_local_service_html_report(input: LocalServiceHtmlReportExportInput) -> Result<Value, String> {
    let payload = serde_json::to_string(&input)
        .map_err(|error| format!("Failed to serialize local service HTML report export input: {error}"))?;

    run_local_service_json_command(
        "report-export-html",
        Some(payload),
        "local service HTML report export command",
    )
}

#[tauri::command]
fn save_export_file(input: SaveExportFileInput) -> Result<String, String> {
    let bytes = STANDARD
        .decode(input.base64_data.trim())
        .map_err(|error| format!("Failed to decode export data: {error}"))?;

    if let Some(parent) = Path::new(&input.path).parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create export directory: {error}"))?;
    }

    fs::write(&input.path, bytes).map_err(|error| format!("Failed to write export file: {error}"))?;
    Ok(input.path)
}

fn validate_ssh_input(
    host: &str,
    username: &str,
    auth_method: &str,
    secret_ref: &str,
) -> Result<(), String> {
    if host.trim().is_empty() {
        return Err("Host is required.".into());
    }

    if username.trim().is_empty() {
        return Err("Username is required.".into());
    }

    if secret_ref.trim().is_empty() {
        return Err(match auth_method {
            "private-key" => "Private key path is required for private-key authentication.".into(),
            "password" => "Password is required for password authentication.".into(),
            _ => "Unsupported SSH authentication method.".into(),
        });
    }

    match auth_method {
        "private-key" => {
            if !Path::new(secret_ref).exists() {
                return Err(format!("Private key file not found: {}", secret_ref));
            }
        }
        "password" => {
            let sshpass_available = Command::new("sshpass").arg("-V").output().is_ok();
            if !sshpass_available {
                return Err(
                    "Password mode requires sshpass to be installed on the local machine.".into(),
                );
            }
        }
        _ => {
            return Err("Unsupported SSH authentication method.".into());
        }
    }

    Ok(())
}

fn format_ssh_failure(
    host: &str,
    port: u16,
    username: &str,
    auth_method: &str,
    secret_ref: &str,
    stderr: &str,
) -> String {
    let message = stderr.trim();
    let lower = message.to_lowercase();

    if lower.contains("permission denied") {
        return match auth_method {
            "private-key" => format!(
                "SSH authentication failed for {username}@{host}:{port}. Verify that {secret_ref} is the correct private key, that it is allowed on the remote host, and that its permissions are restricted, for example with `chmod 600`."
            ),
            "password" => format!(
                "SSH authentication failed for {username}@{host}:{port}. Recheck the password or confirm that password authentication is enabled on the remote host."
            ),
            _ => "SSH authentication failed.".into(),
        };
    }

    if lower.contains("connection refused") {
        return format!(
            "SSH reached {host}:{port}, but the connection was refused. Confirm that sshd is running, listening on port {port}, and not blocked by a firewall."
        );
    }

    if lower.contains("operation timed out") || lower.contains("connection timed out") {
        return format!(
            "SSH connection to {host}:{port} timed out. Verify routing, firewall rules, VPN access, and whether the host is reachable from this machine."
        );
    }

    if lower.contains("no route to host") || lower.contains("network is unreachable") {
        return format!(
            "SSH cannot reach {host}:{port} from this machine. Check network path, VPN connectivity, and whether the target segment is accessible."
        );
    }

    if lower.contains("could not resolve hostname") || lower.contains("name or service not known")
    {
        return format!(
            "SSH could not resolve host `{host}`. Recheck the hostname or use a direct IP address if DNS is not available in this environment."
        );
    }

    if lower.contains("unprotected private key file") {
        return format!(
            "SSH rejected the private key at {secret_ref} because its file permissions are too open. Restrict the file permissions, for example with `chmod 600`, and retry."
        );
    }

    if lower.contains("identity file") && lower.contains("not accessible") {
        return format!(
            "SSH could not read the private key at {secret_ref}. Verify that the file exists and is readable by the current desktop user."
        );
    }

    if message.is_empty() {
        format!(
            "SSH connectivity to {host}:{port} failed. Retry with a manual `ssh` command from the same machine to capture the underlying network or authentication error."
        )
    } else {
        message.to_string()
    }
}

fn run_ssh_command(
    host: &str,
    port: u16,
    username: &str,
    auth_method: &str,
    secret_ref: &str,
    remote_command: &str,
) -> Result<std::process::Output, String> {
    validate_ssh_input(host, username, auth_method, secret_ref)?;

    let target = format!("{}@{}", username, host);

    let mut command = if auth_method == "password" {
        let mut command = Command::new("sshpass");
        command.arg("-p").arg(secret_ref).arg("ssh");
        command
    } else {
        Command::new("ssh")
    };

    command
        .arg("-o")
        .arg("StrictHostKeyChecking=no")
        .arg("-o")
        .arg("ConnectTimeout=5")
        .arg("-p")
        .arg(port.to_string());

    if auth_method == "private-key" {
        command
            .arg("-o")
            .arg("BatchMode=yes")
            .arg("-i")
            .arg(secret_ref);
    } else {
        command
            .arg("-o")
            .arg("PreferredAuthentications=password")
            .arg("-o")
            .arg("PubkeyAuthentication=no");
    }

    command
        .arg(target)
        .arg(remote_command)
        .output()
        .map_err(|error| format!("Failed to execute ssh command: {error}"))
}

fn ssh_output(input: &RunLinuxCheckInput, remote_command: &str) -> Result<String, String> {
    validate_ssh_input(
        &input.host,
        &input.username,
        &input.auth_method,
        &input.secret_ref,
    )?;

    let output = run_ssh_command(
        &input.host,
        input.port,
        &input.username,
        &input.auth_method,
        &input.secret_ref,
        remote_command,
    )?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if stdout.is_empty() {
            return Err("Remote command returned empty output.".into());
        }
        return Ok(stdout);
    }

    let stderr = String::from_utf8_lossy(&output.stderr);
    Err(format_ssh_failure(
        &input.host,
        input.port,
        &input.username,
        &input.auth_method,
        &input.secret_ref,
        &stderr,
    ))
}

fn combined_command_output(output: &std::process::Output) -> String {
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if stdout.is_empty() {
        stderr
    } else if stderr.is_empty() {
        stdout
    } else {
        format!("{stdout} {stderr}")
    }
}

fn tcp_listener_count(input: &RunLinuxCheckInput, port: u16) -> Result<Option<u32>, String> {
    let output = ssh_output(
        input,
        &format!(
            "sh -lc \"if command -v ss >/dev/null 2>&1; then ss -ltn '( sport = :{port} )' | tail -n +2 | wc -l; elif command -v netstat >/dev/null 2>&1; then netstat -ltn | awk '$4 ~ /:{port}$/ {{count++}} END {{print count+0}}'; else echo unsupported; fi\""
        ),
    )?;

    if output == "unsupported" {
        return Ok(None);
    }

    let listeners = output
        .parse::<u32>()
        .map_err(|_| format!("Unable to parse port listener output: {}", output))?;

    Ok(Some(listeners))
}

fn normalized_result(
    input: &RunLinuxCheckInput,
    status: &str,
    severity: &str,
    summary: String,
    evidence: Vec<CheckEvidence>,
    remediation: &str,
) -> CheckResult {
    CheckResult {
        check_id: input.check_id.clone(),
        title: input.title.clone(),
        status: status.into(),
        severity: severity.into(),
        summary,
        evidence,
        remediation: remediation.into(),
    }
}

#[tauri::command]
fn run_linux_check(input: RunLinuxCheckInput) -> Result<CheckResult, String> {
    match input.check_id.as_str() {
        "linux.cpu.usage" => {
            let output = ssh_output(
                &input,
                "sh -lc \"if command -v vmstat >/dev/null 2>&1; then vmstat 1 2 | tail -1 | awk '{print 100-$15}'; elif command -v top >/dev/null 2>&1; then top -bn2 | grep 'Cpu(s)' | tail -1 | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100-$1}'; else echo unsupported; fi\"",
            )?;

            if output == "unsupported" {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "CPU usage could not be collected because neither vmstat nor top is available."
                        .into(),
                    vec![CheckEvidence {
                        label: "Collector".into(),
                        value: "missing vmstat/top".into(),
                    }],
                    "Install procps or provide a supported CPU metrics command on the host.",
                ));
            }

            let usage = output
                .parse::<f64>()
                .map_err(|_| format!("Unable to parse CPU usage output: {}", output))?;
            let (status, severity, summary) = if usage >= 85.0 {
                (
                    "critical",
                    "critical",
                    format!("CPU usage is high at {:.1}%.", usage),
                )
            } else if usage >= 70.0 {
                (
                    "warning",
                    "warning",
                    format!("CPU usage is elevated at {:.1}%.", usage),
                )
            } else {
                (
                    "pass",
                    "info",
                    format!("CPU usage is within range at {:.1}%.", usage),
                )
            };

            Ok(normalized_result(
                &input,
                status,
                severity,
                summary,
                vec![CheckEvidence {
                    label: "Usage".into(),
                    value: format!("{:.1}%", usage),
                }],
                "Inspect top CPU-consuming processes and review workload spikes.",
            ))
        }
        "linux.memory.usage" => {
            let output = ssh_output(
                &input,
                "sh -lc \"free -m | awk '/Mem:/ {printf \\\"%s %s %s\\\", $2, $3, ($3*100)/$2}'\"",
            )?;
            let parts: Vec<&str> = output.split_whitespace().collect();
            if parts.len() != 3 {
                return Err(format!("Unexpected memory output: {}", output));
            }
            let total = parts[0];
            let used = parts[1];
            let usage = parts[2]
                .parse::<f64>()
                .map_err(|_| format!("Unable to parse memory usage output: {}", output))?;
            let (status, severity, summary) = if usage >= 90.0 {
                (
                    "critical",
                    "critical",
                    format!("Memory usage is high at {:.1}%.", usage),
                )
            } else if usage >= 75.0 {
                (
                    "warning",
                    "warning",
                    format!("Memory usage is elevated at {:.1}%.", usage),
                )
            } else {
                (
                    "pass",
                    "info",
                    format!("Memory usage is within range at {:.1}%.", usage),
                )
            };

            Ok(normalized_result(
                &input,
                status,
                severity,
                summary,
                vec![
                    CheckEvidence {
                        label: "Usage".into(),
                        value: format!("{:.1}%", usage),
                    },
                    CheckEvidence {
                        label: "Used Memory".into(),
                        value: format!("{} MiB", used),
                    },
                    CheckEvidence {
                        label: "Total Memory".into(),
                        value: format!("{} MiB", total),
                    },
                ],
                "Review large processes, memory leaks, and swap activity if usage remains elevated.",
            ))
        }
        "linux.disk.usage" => {
            let output = ssh_output(
                &input,
                "sh -lc \"df -P / | awk 'NR==2 {gsub(/%/, \\\"\\\", $5); printf \\\"%s %s %s\\\", $2, $3, $5}'\"",
            )?;
            let parts: Vec<&str> = output.split_whitespace().collect();
            if parts.len() != 3 {
                return Err(format!("Unexpected disk output: {}", output));
            }
            let total = parts[0];
            let used = parts[1];
            let usage = parts[2]
                .parse::<f64>()
                .map_err(|_| format!("Unable to parse disk usage output: {}", output))?;
            let (status, severity, summary) = if usage >= 90.0 {
                (
                    "critical",
                    "critical",
                    format!("Root filesystem usage is high at {:.1}%.", usage),
                )
            } else if usage >= 80.0 {
                (
                    "warning",
                    "warning",
                    format!("Root filesystem usage is elevated at {:.1}%.", usage),
                )
            } else {
                (
                    "pass",
                    "info",
                    format!("Root filesystem usage is within range at {:.1}%.", usage),
                )
            };

            Ok(normalized_result(
                &input,
                status,
                severity,
                summary,
                vec![
                    CheckEvidence {
                        label: "Usage".into(),
                        value: format!("{:.1}%", usage),
                    },
                    CheckEvidence {
                        label: "Used Blocks".into(),
                        value: used.into(),
                    },
                    CheckEvidence {
                        label: "Total Blocks".into(),
                        value: total.into(),
                    },
                ],
                "Review filesystem growth, log retention, and cleanup opportunities on the root volume.",
            ))
        }
        "linux.load.average" => {
            let output = ssh_output(
                &input,
                "sh -lc \"cat /proc/loadavg | awk '{printf \\\"%s %s %s\\\", $1, $2, $3}'\"",
            )?;
            let parts: Vec<&str> = output.split_whitespace().collect();
            if parts.len() != 3 {
                return Err(format!("Unexpected load output: {}", output));
            }
            let load1 = parts[0]
                .parse::<f64>()
                .map_err(|_| format!("Unable to parse load output: {}", output))?;
            let load5 = parts[1]
                .parse::<f64>()
                .map_err(|_| format!("Unable to parse load output: {}", output))?;
            let load15 = parts[2]
                .parse::<f64>()
                .map_err(|_| format!("Unable to parse load output: {}", output))?;
            let (status, severity, summary) = if load1 >= 4.0 {
                (
                    "critical",
                    "critical",
                    format!("Load average is high at {:.2}.", load1),
                )
            } else if load1 >= 2.0 {
                (
                    "warning",
                    "warning",
                    format!("Load average is elevated at {:.2}.", load1),
                )
            } else {
                (
                    "pass",
                    "info",
                    format!("Load average is within range at {:.2}.", load1),
                )
            };

            Ok(normalized_result(
                &input,
                status,
                severity,
                summary,
                vec![
                    CheckEvidence {
                        label: "Load 1m".into(),
                        value: format!("{:.2}", load1),
                    },
                    CheckEvidence {
                        label: "Load 5m".into(),
                        value: format!("{:.2}", load5),
                    },
                    CheckEvidence {
                        label: "Load 15m".into(),
                        value: format!("{:.2}", load15),
                    },
                ],
                "Review CPU saturation, blocked IO, and queued work if load remains elevated.",
            ))
        }
        "linux.time.sync" => {
            let output = ssh_output(
                &input,
                "sh -lc \"if command -v timedatectl >/dev/null 2>&1; then timedatectl show -p NTPSynchronized --value; else echo unknown; fi\"",
            )?;

            let lowered = output.to_lowercase();
            if lowered == "yes" {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "Host clock is synchronized.".into(),
                    vec![CheckEvidence {
                        label: "NTPSynchronized".into(),
                        value: output,
                    }],
                    "No action required.",
                ));
            }

            if lowered == "no" {
                return Ok(normalized_result(
                    &input,
                    "critical",
                    "critical",
                    "Host clock is not synchronized.".into(),
                    vec![CheckEvidence {
                        label: "NTPSynchronized".into(),
                        value: output,
                    }],
                    "Verify chronyd or systemd-timesyncd configuration and re-sync the host clock.",
                ));
            }

            Ok(normalized_result(
                &input,
                "unknown",
                "warning",
                "Time synchronization state could not be determined.".into(),
                vec![CheckEvidence {
                    label: "Collector".into(),
                    value: output,
                }],
                "Verify whether timedatectl is available and confirm the host time service status.",
            ))
        }
        "linux.process.sshd" => {
            let output = ssh_output(
                &input,
                "sh -lc \"pgrep -x sshd >/dev/null && echo running || echo stopped\"",
            )?;
            if output == "running" {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "sshd is running.".into(),
                    vec![CheckEvidence {
                        label: "Process".into(),
                        value: "sshd".into(),
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "critical",
                "critical",
                "sshd is not running.".into(),
                vec![CheckEvidence {
                    label: "Process".into(),
                    value: "sshd".into(),
                }],
                "Start sshd and verify the service is enabled if remote access is expected.",
            ))
        }
        "linux.port.22" => {
            let listeners = tcp_listener_count(&input, 22)?;

            if listeners.is_none() {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "Listening port state could not be collected because ss/netstat is unavailable.".into(),
                    vec![CheckEvidence {
                        label: "Collector".into(),
                        value: "missing ss/netstat".into(),
                    }],
                    "Install iproute2 or net-tools to allow port inspection.",
                ));
            }
            let listeners = listeners.unwrap_or(0);

            if listeners > 0 {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "Port 22 is listening.".into(),
                    vec![CheckEvidence {
                        label: "Port".into(),
                        value: "22/tcp".into(),
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "critical",
                "critical",
                "Port 22 is not listening.".into(),
                vec![CheckEvidence {
                    label: "Port".into(),
                    value: "22/tcp".into(),
                }],
                "Verify sshd is running and listening on the expected interface and port.",
            ))
        }
        "linux.reboot.age" => {
            let output = ssh_output(
                &input,
                "sh -lc \"if command -v who >/dev/null 2>&1; then who -b | sed 's/.*system boot  *//'; else uptime -s; fi\"",
            )?;
            Ok(normalized_result(
                &input,
                "pass",
                "info",
                "Recent reboot information was collected successfully.".into(),
                vec![CheckEvidence {
                    label: "Last Boot".into(),
                    value: output,
                }],
                "Review reboot timing if unexpected restarts are observed.",
            ))
        }
        "linux.log.usage" => {
            let output = ssh_output(
                &input,
                "sh -lc \"df -P /var/log | awk 'NR==2 {gsub(/%/, \\\"\\\", $5); printf \\\"%s %s %s\\\", $2, $3, $5}'\"",
            )?;
            let parts: Vec<&str> = output.split_whitespace().collect();
            if parts.len() != 3 {
                return Err(format!("Unexpected /var/log output: {}", output));
            }
            let total = parts[0];
            let used = parts[1];
            let usage = parts[2]
                .parse::<f64>()
                .map_err(|_| format!("Unable to parse /var/log usage output: {}", output))?;
            let (status, severity, summary) = if usage >= 85.0 {
                (
                    "critical",
                    "critical",
                    format!("/var/log usage is high at {:.1}%.", usage),
                )
            } else if usage >= 70.0 {
                (
                    "warning",
                    "warning",
                    format!("/var/log usage is elevated at {:.1}%.", usage),
                )
            } else {
                (
                    "pass",
                    "info",
                    format!("/var/log usage is within range at {:.1}%.", usage),
                )
            };

            Ok(normalized_result(
                &input,
                status,
                severity,
                summary,
                vec![
                    CheckEvidence {
                        label: "Usage".into(),
                        value: format!("{:.1}%", usage),
                    },
                    CheckEvidence {
                        label: "Used Blocks".into(),
                        value: used.into(),
                    },
                    CheckEvidence {
                        label: "Total Blocks".into(),
                        value: total.into(),
                    },
                ],
                "Review log rotation, retention, and oversized log files in /var/log.",
            ))
        }
        "linux.nginx.process" => {
            let output = ssh_output(
                &input,
                "sh -lc \"if pgrep -x nginx >/dev/null 2>&1 || pgrep -f 'nginx: master process' >/dev/null 2>&1; then echo running; else echo stopped; fi\"",
            )?;
            if output == "running" {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "nginx is running.".into(),
                    vec![CheckEvidence {
                        label: "Process".into(),
                        value: "nginx".into(),
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "critical",
                "critical",
                "nginx is not running.".into(),
                vec![CheckEvidence {
                    label: "Process".into(),
                    value: "nginx".into(),
                }],
                "Start nginx and verify the service is enabled if HTTP traffic is expected.",
            ))
        }
        "linux.nginx.config" => {
            let output = run_ssh_command(
                &input.host,
                input.port,
                &input.username,
                &input.auth_method,
                &input.secret_ref,
                "sh -lc \"if command -v nginx >/dev/null 2>&1; then nginx -t 2>&1; else echo missing-nginx; fi\"",
            )?;

            let combined = combined_command_output(&output);

            if combined.contains("missing-nginx") {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "nginx is not installed, so configuration validation was skipped.".into(),
                    vec![CheckEvidence {
                        label: "Command".into(),
                        value: "nginx -t".into(),
                    }],
                    "Install nginx or switch to a template that matches the services deployed on this host.",
                ));
            }

            if output.status.success() {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "nginx configuration test passed.".into(),
                    vec![CheckEvidence {
                        label: "Command Output".into(),
                        value: combined,
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "critical",
                "critical",
                "nginx configuration test failed.".into(),
                vec![CheckEvidence {
                    label: "Command Output".into(),
                    value: combined,
                }],
                "Run `nginx -t`, fix the reported configuration errors, and reload nginx after validation passes.",
            ))
        }
        "linux.nginx.vhost.inventory" => {
            let output = run_ssh_command(
                &input.host,
                input.port,
                &input.username,
                &input.auth_method,
                &input.secret_ref,
                "sh -lc \"if ! command -v nginx >/dev/null 2>&1; then echo missing-nginx; else nginx -T 2>/dev/null | awk 'BEGIN {count=0} /^[[:space:]]*server[[:space:]]*\\{/ {count++} /^[[:space:]]*server_name[[:space:]]+/ {line=$0; sub(/^[[:space:]]*server_name[[:space:]]+/, \\\"\\\", line); sub(/;[[:space:]]*$/, \\\"\\\", line); print line} END {print \\\"__COUNT__=\\\" count}' ; fi\"",
            )?;
            let combined = combined_command_output(&output);

            if combined.contains("missing-nginx") {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "nginx is not installed, so virtual host inventory was skipped.".into(),
                    vec![CheckEvidence {
                        label: "Command".into(),
                        value: "nginx -T".into(),
                    }],
                    "Install nginx or switch to a template that matches the services deployed on this host.",
                ));
            }

            let lines = combined
                .lines()
                .map(|line| line.trim())
                .filter(|line| !line.is_empty())
                .collect::<Vec<_>>();
            let server_count = lines
                .iter()
                .find_map(|line| line.strip_prefix("__COUNT__="))
                .and_then(|value| value.parse::<u32>().ok())
                .unwrap_or(0);
            let server_names = lines
                .iter()
                .filter(|line| !line.starts_with("__COUNT__="))
                .take(4)
                .cloned()
                .collect::<Vec<_>>();

            if server_count == 0 {
                return Ok(normalized_result(
                    &input,
                    "warning",
                    "warning",
                    "nginx configuration was read, but no server blocks were detected.".into(),
                    vec![
                        CheckEvidence {
                            label: "Server Blocks".into(),
                            value: "0".into(),
                        },
                        CheckEvidence {
                            label: "Command".into(),
                            value: "nginx -T".into(),
                        },
                    ],
                    "Review the active nginx configuration and confirm the expected site inventory is loaded on this host.",
                ));
            }

            Ok(normalized_result(
                &input,
                "pass",
                "info",
                format!(
                    "nginx inventory includes {server_count} server block(s){}.",
                    if server_names.is_empty() {
                        "".into()
                    } else {
                        format!(" and {} named server entries", server_names.len())
                    }
                ),
                vec![
                    CheckEvidence {
                        label: "Server Blocks".into(),
                        value: server_count.to_string(),
                    },
                    CheckEvidence {
                        label: "Named Servers".into(),
                        value: if server_names.is_empty() {
                            "none detected".into()
                        } else {
                            server_names.join(" | ")
                        },
                    },
                ],
                "Review unexpected listeners or server names before the next release window.",
            ))
        }
        "linux.nginx.tls.expiry" => {
            let output = run_ssh_command(
                &input.host,
                input.port,
                &input.username,
                &input.auth_method,
                &input.secret_ref,
                "sh -lc \"if ! command -v nginx >/dev/null 2>&1; then echo missing-nginx; elif ! command -v openssl >/dev/null 2>&1; then echo missing-openssl; else nginx -T 2>/dev/null | awk '/^[[:space:]]*ssl_certificate[[:space:]]+/ {path=$0; sub(/^[[:space:]]*ssl_certificate[[:space:]]+/, \\\"\\\", path); sub(/;[[:space:]]*$/, \\\"\\\", path); if (path !~ /\\$/) print path}' | sort -u | while read cert; do [ -n \\\"$cert\\\" ] || continue; if [ -f \\\"$cert\\\" ]; then end=$(openssl x509 -enddate -noout -in \\\"$cert\\\" 2>/dev/null | cut -d= -f2-); if [ -n \\\"$end\\\" ]; then epoch=$(date -d \\\"$end\\\" +%s 2>/dev/null || true); now=$(date +%s); if [ -n \\\"$epoch\\\" ]; then days=$(( (epoch - now) / 86400 )); printf '%s|%s|%s\\n' \\\"$cert\\\" \\\"$days\\\" \\\"$end\\\"; else printf '%s|parse-error|%s\\n' \\\"$cert\\\" \\\"$end\\\"; fi; else printf '%s|inspect-error|unknown\\n' \\\"$cert\\\"; fi; fi; done; fi\"",
            )?;
            let combined = combined_command_output(&output);

            if combined.contains("missing-nginx") {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "nginx is not installed, so TLS certificate review was skipped.".into(),
                    vec![CheckEvidence {
                        label: "Command".into(),
                        value: "nginx -T".into(),
                    }],
                    "Install nginx or switch to a template that matches the services deployed on this host.",
                ));
            }

            if combined.contains("missing-openssl") {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "openssl is not available, so nginx certificate expiry could not be reviewed.".into(),
                    vec![CheckEvidence {
                        label: "Command".into(),
                        value: "openssl x509 -enddate".into(),
                    }],
                    "Install openssl on the inspected host or use another certificate inspection path before relying on this review.",
                ));
            }

            let rows = combined
                .lines()
                .map(|line| line.trim())
                .filter(|line| !line.is_empty())
                .collect::<Vec<_>>();

            if rows.is_empty() {
                return Ok(normalized_result(
                    &input,
                    "warning",
                    "warning",
                    "No static nginx ssl_certificate directives were detected.".into(),
                    vec![CheckEvidence {
                        label: "Inventory".into(),
                        value: "no ssl_certificate directives".into(),
                    }],
                    "If this host should terminate TLS, review the active nginx configuration and certificate loading strategy.",
                ));
            }

            let mut status = "pass";
            let mut severity = "info";
            let mut summary = format!("Reviewed {} nginx certificate file(s).", rows.len());
            let mut evidence = Vec::new();

            for row in rows.iter().take(4) {
                let mut parts = row.splitn(3, '|');
                let cert = parts.next().unwrap_or("unknown");
                let days = parts.next().unwrap_or("unknown");
                let end = parts.next().unwrap_or("unknown");
                evidence.push(CheckEvidence {
                    label: "Certificate".into(),
                    value: format!("{cert} expires in {days} day(s) at {end}"),
                });

                if let Ok(days_left) = days.parse::<i64>() {
                    if days_left < 0 {
                        status = "critical";
                        severity = "critical";
                        summary = "At least one nginx TLS certificate has already expired.".into();
                    } else if days_left <= 14 && status != "critical" {
                        status = "critical";
                        severity = "critical";
                        summary =
                            "At least one nginx TLS certificate expires within 14 days.".into();
                    } else if days_left <= 30 && status == "pass" {
                        status = "warning";
                        severity = "warning";
                        summary =
                            "At least one nginx TLS certificate expires within 30 days.".into();
                    }
                } else if status == "pass" {
                    status = "warning";
                    severity = "warning";
                    summary =
                        "Some nginx TLS certificates were detected, but expiry parsing was incomplete."
                            .into();
                }
            }

            if rows.len() > 4 {
                evidence.push(CheckEvidence {
                    label: "Additional Certificates".into(),
                    value: format!("{}", rows.len() - 4),
                });
            }

            Ok(normalized_result(
                &input,
                status,
                severity,
                summary,
                evidence,
                "Renew certificates before the warning window closes and confirm nginx is serving the expected certificate set after reload.",
            ))
        }
        "linux.mysql.process" => {
            let output = ssh_output(
                &input,
                "sh -lc \"if pgrep -x mysqld >/dev/null 2>&1; then echo mysqld; elif pgrep -x mariadbd >/dev/null 2>&1; then echo mariadbd; else echo stopped; fi\"",
            )?;
            if output != "stopped" {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    format!("{output} is running."),
                    vec![CheckEvidence {
                        label: "Process".into(),
                        value: output,
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "critical",
                "critical",
                "mysql or mariadb process is not running.".into(),
                vec![CheckEvidence {
                    label: "Process".into(),
                    value: "mysqld or mariadbd".into(),
                }],
                "Start the database service and confirm the expected mysql or mariadb daemon is healthy.",
            ))
        }
        "linux.mysql.port.3306" => {
            let listeners = tcp_listener_count(&input, 3306)?;

            if listeners.is_none() {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "MySQL listener state could not be collected because ss/netstat is unavailable.".into(),
                    vec![CheckEvidence {
                        label: "Collector".into(),
                        value: "missing ss/netstat".into(),
                    }],
                    "Install iproute2 or net-tools to allow port inspection.",
                ));
            }
            let listeners = listeners.unwrap_or(0);

            if listeners > 0 {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "Port 3306 is listening.".into(),
                    vec![CheckEvidence {
                        label: "Port".into(),
                        value: "3306/tcp".into(),
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "warning",
                "warning",
                "Port 3306 is not listening.".into(),
                vec![CheckEvidence {
                    label: "Port".into(),
                    value: "3306/tcp".into(),
                }],
                "If external or local TCP access is expected, verify bind-address, listener settings, and service status.",
            ))
        }
        "linux.mysql.runtime.info" => {
            let output = run_ssh_command(
                &input.host,
                input.port,
                &input.username,
                &input.auth_method,
                &input.secret_ref,
                "sh -lc \"if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo missing-client; exit 0; fi; \\\"$client\\\" --batch --skip-column-names -e 'SHOW VARIABLES WHERE Variable_name IN (\\\"version\\\",\\\"version_comment\\\",\\\"datadir\\\",\\\"read_only\\\",\\\"super_read_only\\\")' 2>&1\"",
            )?;
            let combined = combined_command_output(&output);

            if combined.contains("missing-client") {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "MySQL client is not installed, so runtime configuration could not be collected.".into(),
                    vec![CheckEvidence {
                        label: "Command".into(),
                        value: "mysql -e SHOW VARIABLES".into(),
                    }],
                    "Install mysql or mariadb client tooling on the host if local instance inspection is part of the expected workflow.",
                ));
            }

            if !output.status.success() {
                return Ok(normalized_result(
                    &input,
                    "warning",
                    "warning",
                    "MySQL runtime configuration could not be collected through the local client.".into(),
                    vec![CheckEvidence {
                        label: "Command Output".into(),
                        value: combined,
                    }],
                    "Verify local socket access, client availability, and database permissions for the SSH user used by OpsProbe.",
                ));
            }

            let mut evidence = Vec::new();
            let mut role_hint = "write-capable";

            for line in combined.lines().map(|line| line.trim()).filter(|line| !line.is_empty()) {
                let parts = line.split_whitespace().collect::<Vec<_>>();
                if parts.is_empty() {
                    continue;
                }
                let key = parts[0];
                let value = parts[1..].join(" ");

                match key {
                    "version" => evidence.push(CheckEvidence {
                        label: "Version".into(),
                        value,
                    }),
                    "version_comment" => evidence.push(CheckEvidence {
                        label: "Flavor".into(),
                        value,
                    }),
                    "datadir" => evidence.push(CheckEvidence {
                        label: "Datadir".into(),
                        value,
                    }),
                    "read_only" => {
                        if value.eq_ignore_ascii_case("ON") {
                            role_hint = "read-only";
                        }
                        evidence.push(CheckEvidence {
                            label: "read_only".into(),
                            value,
                        });
                    }
                    "super_read_only" => evidence.push(CheckEvidence {
                        label: "super_read_only".into(),
                        value,
                    }),
                    _ => {}
                }
            }

            if evidence.is_empty() {
                evidence.push(CheckEvidence {
                    label: "Command Output".into(),
                    value: combined.clone(),
                });
            }

            Ok(normalized_result(
                &input,
                "pass",
                "info",
                format!("MySQL runtime configuration was collected successfully and the instance appears {role_hint}."),
                evidence,
                "Review role and write-path expectations if read-only signals differ from the intended database role.",
            ))
        }
        "linux.mysql.schema.inventory" => {
            let output = run_ssh_command(
                &input.host,
                input.port,
                &input.username,
                &input.auth_method,
                &input.secret_ref,
                "sh -lc \"if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo missing-client; exit 0; fi; count=$(\\\"$client\\\" --batch --skip-column-names -e \\\"SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema','mysql','performance_schema','sys');\\\" 2>/dev/null || echo client-error); if [ \\\"$count\\\" = client-error ]; then echo client-error; exit 0; fi; sample=$(\\\"$client\\\" --batch --skip-column-names -e \\\"SELECT GROUP_CONCAT(schema_name ORDER BY schema_name SEPARATOR ', ') FROM (SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema','mysql','performance_schema','sys') ORDER BY schema_name LIMIT 5) sample;\\\" 2>/dev/null); printf 'count=%s\\nsample=%s\\n' \\\"$count\\\" \\\"${sample:-none}\\\"\"",
            )?;
            let combined = combined_command_output(&output);

            if combined.contains("missing-client") {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "MySQL client is not installed, so schema inventory could not be collected.".into(),
                    vec![CheckEvidence {
                        label: "Command".into(),
                        value: "mysql -e SELECT FROM information_schema.schemata".into(),
                    }],
                    "Install mysql or mariadb client tooling on the host if local schema inventory is part of the expected workflow.",
                ));
            }

            if combined.contains("client-error") || !output.status.success() {
                return Ok(normalized_result(
                    &input,
                    "warning",
                    "warning",
                    "MySQL schema inventory could not be collected through the local client.".into(),
                    vec![CheckEvidence {
                        label: "Command Output".into(),
                        value: combined,
                    }],
                    "Verify local socket access and metadata query permissions for the SSH user used by OpsProbe.",
                ));
            }

            let mut count = 0_u32;
            let mut sample = String::from("none");
            for line in combined.lines().map(|line| line.trim()).filter(|line| !line.is_empty()) {
                if let Some(value) = line.strip_prefix("count=") {
                    count = value.parse::<u32>().unwrap_or(0);
                } else if let Some(value) = line.strip_prefix("sample=") {
                    sample = value.to_string();
                }
            }

            if count == 0 {
                return Ok(normalized_result(
                    &input,
                    "warning",
                    "warning",
                    "No non-system MySQL schemas were detected.".into(),
                    vec![
                        CheckEvidence {
                            label: "Schema Count".into(),
                            value: "0".into(),
                        },
                        CheckEvidence {
                            label: "Schema Sample".into(),
                            value: sample,
                        },
                    ],
                    "If this host should hold tenant or application schemas, review instance role and data presence before the next maintenance window.",
                ));
            }

            Ok(normalized_result(
                &input,
                "pass",
                "info",
                format!("MySQL schema inventory found {count} non-system schema(s)."),
                vec![
                    CheckEvidence {
                        label: "Schema Count".into(),
                        value: count.to_string(),
                    },
                    CheckEvidence {
                        label: "Schema Sample".into(),
                        value: sample,
                    },
                ],
                "Review unexpected schema growth or missing tenant schemas before the next maintenance window.",
            ))
        }
        "linux.redis.process" => {
            let output = ssh_output(
                &input,
                "sh -lc \"pgrep -x redis-server >/dev/null 2>&1 && echo running || echo stopped\"",
            )?;
            if output == "running" {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "redis-server is running.".into(),
                    vec![CheckEvidence {
                        label: "Process".into(),
                        value: "redis-server".into(),
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "critical",
                "critical",
                "redis-server is not running.".into(),
                vec![CheckEvidence {
                    label: "Process".into(),
                    value: "redis-server".into(),
                }],
                "Start redis and confirm the service is enabled if this host is expected to provide Redis.",
            ))
        }
        "linux.redis.port.6379" => {
            let listeners = tcp_listener_count(&input, 6379)?;

            if listeners.is_none() {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "Redis listener state could not be collected because ss/netstat is unavailable.".into(),
                    vec![CheckEvidence {
                        label: "Collector".into(),
                        value: "missing ss/netstat".into(),
                    }],
                    "Install iproute2 or net-tools to allow port inspection.",
                ));
            }
            let listeners = listeners.unwrap_or(0);

            if listeners > 0 {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "Port 6379 is listening.".into(),
                    vec![CheckEvidence {
                        label: "Port".into(),
                        value: "6379/tcp".into(),
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "warning",
                "warning",
                "Port 6379 is not listening.".into(),
                vec![CheckEvidence {
                    label: "Port".into(),
                    value: "6379/tcp".into(),
                }],
                "If Redis should accept TCP connections, verify the bind, protected-mode, and listener settings.",
            ))
        }
        "linux.docker.process" => {
            let output = ssh_output(
                &input,
                "sh -lc \"pgrep -x dockerd >/dev/null 2>&1 && echo running || echo stopped\"",
            )?;
            if output == "running" {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "docker daemon is running.".into(),
                    vec![CheckEvidence {
                        label: "Process".into(),
                        value: "dockerd".into(),
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "critical",
                "critical",
                "docker daemon is not running.".into(),
                vec![CheckEvidence {
                    label: "Process".into(),
                    value: "dockerd".into(),
                }],
                "Start Docker and verify the service is enabled if this host is expected to run containers.",
            ))
        }
        "linux.docker.info" => {
            let output = run_ssh_command(
                &input.host,
                input.port,
                &input.username,
                &input.auth_method,
                &input.secret_ref,
                "sh -lc \"if command -v docker >/dev/null 2>&1; then docker info --format 'ServerVersion={{.ServerVersion}} Driver={{.Driver}} CgroupDriver={{.CgroupDriver}}' 2>/dev/null; else echo missing-docker; fi\"",
            )?;

            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            let combined = if stdout.is_empty() { stderr } else { stdout };

            if combined.contains("missing-docker") {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "docker CLI is not installed, so runtime info could not be collected.".into(),
                    vec![CheckEvidence {
                        label: "Command".into(),
                        value: "docker info".into(),
                    }],
                    "Install Docker or use a template that matches the runtime available on this host.",
                ));
            }

            if output.status.success() {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "docker runtime info was collected successfully.".into(),
                    vec![CheckEvidence {
                        label: "Runtime".into(),
                        value: combined,
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "warning",
                "warning",
                "docker runtime info could not be collected.".into(),
                vec![CheckEvidence {
                    label: "Command Output".into(),
                    value: combined,
                }],
                "Verify docker socket access, daemon health, and runtime configuration.",
            ))
        }
        "linux.docker.containers" => {
            let output = run_ssh_command(
                &input.host,
                input.port,
                &input.username,
                &input.auth_method,
                &input.secret_ref,
                "sh -lc \"if command -v docker >/dev/null 2>&1; then printf 'running=%s exited=%s' \\\"$(docker ps --format '{{.ID}}' 2>/dev/null | wc -l)\\\" \\\"$(docker ps -a --filter status=exited --format '{{.ID}}' 2>/dev/null | wc -l)\\\"; else echo missing-docker; fi\"",
            )?;
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            let combined = if stdout.is_empty() { stderr } else { stdout };

            if combined.contains("missing-docker") {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "docker CLI is not installed, so container inventory could not be collected.".into(),
                    vec![CheckEvidence {
                        label: "Command".into(),
                        value: "docker ps -a".into(),
                    }],
                    "Install Docker or switch to a template that matches the runtime available on this host.",
                ));
            }

            if output.status.success() {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "docker container inventory was collected successfully.".into(),
                    vec![CheckEvidence {
                        label: "Inventory".into(),
                        value: combined,
                    }],
                    "Review unexpected exited containers if service continuity is important on this host.",
                ));
            }

            Ok(normalized_result(
                &input,
                "warning",
                "warning",
                "docker container inventory could not be collected.".into(),
                vec![CheckEvidence {
                    label: "Command Output".into(),
                    value: combined,
                }],
                "Verify docker CLI access and daemon health on the host.",
            ))
        }
        "linux.kubelet.process" => {
            let output = ssh_output(
                &input,
                "sh -lc \"pgrep -x kubelet >/dev/null 2>&1 && echo running || echo stopped\"",
            )?;
            if output == "running" {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "kubelet is running.".into(),
                    vec![CheckEvidence {
                        label: "Process".into(),
                        value: "kubelet".into(),
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "critical",
                "critical",
                "kubelet is not running.".into(),
                vec![CheckEvidence {
                    label: "Process".into(),
                    value: "kubelet".into(),
                }],
                "Start kubelet and verify the node bootstrap/runtime configuration if this host should be a Kubernetes node.",
            ))
        }
        "linux.kubelet.port.10250" => {
            let listeners = tcp_listener_count(&input, 10250)?;

            if listeners.is_none() {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "Kubelet listener state could not be collected because ss/netstat is unavailable.".into(),
                    vec![CheckEvidence {
                        label: "Collector".into(),
                        value: "missing ss/netstat".into(),
                    }],
                    "Install iproute2 or net-tools to allow port inspection.",
                ));
            }
            let listeners = listeners.unwrap_or(0);

            if listeners > 0 {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "Port 10250 is listening.".into(),
                    vec![CheckEvidence {
                        label: "Port".into(),
                        value: "10250/tcp".into(),
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "warning",
                "warning",
                "Port 10250 is not listening.".into(),
                vec![CheckEvidence {
                    label: "Port".into(),
                    value: "10250/tcp".into(),
                }],
                "Verify kubelet listener settings and node bootstrap state if secure kubelet access is expected.",
            ))
        }
        "linux.kubernetes.node.runtime" => {
            let output = run_ssh_command(
                &input.host,
                input.port,
                &input.username,
                &input.auth_method,
                &input.secret_ref,
                "sh -lc \"if command -v crictl >/dev/null 2>&1; then crictl info 2>/dev/null | awk -F': ' '/runtimeType|storageDriver/ {print $1\"=\"$2}' | tr '\n' ' '; elif command -v docker >/dev/null 2>&1; then docker info --format 'Runtime={{.DefaultRuntime}} CgroupDriver={{.CgroupDriver}}' 2>/dev/null; else echo missing-runtime; fi\"",
            )?;
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            let combined = if stdout.is_empty() { stderr } else { stdout };

            if combined.contains("missing-runtime") {
                return Ok(normalized_result(
                    &input,
                    "unknown",
                    "warning",
                    "Neither crictl nor docker CLI is available, so node runtime info could not be collected.".into(),
                    vec![CheckEvidence {
                        label: "Command".into(),
                        value: "crictl info or docker info".into(),
                    }],
                    "Install crictl for Kubernetes nodes or ensure a supported container runtime CLI is available.",
                ));
            }

            if output.status.success() {
                return Ok(normalized_result(
                    &input,
                    "pass",
                    "info",
                    "node runtime information was collected successfully.".into(),
                    vec![CheckEvidence {
                        label: "Runtime".into(),
                        value: combined,
                    }],
                    "No action required.",
                ));
            }

            Ok(normalized_result(
                &input,
                "warning",
                "warning",
                "node runtime information could not be collected.".into(),
                vec![CheckEvidence {
                    label: "Command Output".into(),
                    value: combined,
                }],
                "Verify container runtime CLI access and node runtime health on this host.",
            ))
        }
        _ => Ok(normalized_result(
            &input,
            "unknown",
            "warning",
            format!(
                "Check {} is not implemented in the SSH runner yet.",
                input.check_id
            ),
            vec![CheckEvidence {
                label: "Check".into(),
                value: input.check_id.clone(),
            }],
            "Implement the missing SSH command mapping for this check.",
        )),
    }
}

#[tauri::command]
fn test_ssh_connection(input: SshConnectionTestInput) -> Result<SshConnectionTestResult, String> {
    validate_ssh_input(
        &input.host,
        &input.username,
        &input.auth_method,
        &input.secret_ref,
    )?;

    let output = run_ssh_command(
        &input.host,
        input.port,
        &input.username,
        &input.auth_method,
        &input.secret_ref,
        "exit",
    )?;

    if output.status.success() {
        return Ok(SshConnectionTestResult {
            ok: true,
            message: format!(
                "SSH connectivity to {}:{} succeeded.",
                input.host, input.port
            ),
        });
    }

    let stderr = String::from_utf8_lossy(&output.stderr);

    Ok(SshConnectionTestResult {
        ok: false,
        message: format_ssh_failure(
            &input.host,
            input.port,
            &input.username,
            &input.auth_method,
            &input.secret_ref,
            &stderr,
        ),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            test_ssh_connection,
            run_linux_check,
            get_local_service_status,
            start_local_service,
            stop_local_service,
            bootstrap_local_service_postgres,
            start_local_service_postgres,
            stop_local_service_postgres,
            get_local_service_inspection_preview,
            run_local_service_inspection,
            get_local_service_inspection_history,
            get_local_service_schedules,
            upsert_local_service_schedule,
            delete_local_service_schedule,
            get_local_service_assets,
            upsert_local_service_asset,
            get_local_service_settings,
            upsert_local_service_settings,
            export_local_service_config,
            import_local_service_config,
            export_local_service_html_report,
            save_export_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
