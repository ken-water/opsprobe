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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CheckEvidence {
    label: String,
    value: String,
}

#[derive(Debug, Serialize)]
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

    if auth_method != "private-key" {
        return Err(
            "Password mode is not implemented yet. Use private-key for the first SSH workflow."
                .into(),
        );
    }

    if secret_ref.trim().is_empty() {
        return Err("Private key path is required for private-key authentication.".into());
    }

    if !Path::new(secret_ref).exists() {
        return Err(format!("Private key file not found: {}", secret_ref));
    }

    Ok(())
}

fn ssh_output(input: &RunLinuxCheckInput, remote_command: &str) -> Result<String, String> {
    validate_ssh_input(
        &input.host,
        &input.username,
        &input.auth_method,
        &input.secret_ref,
    )?;

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
        .arg(remote_command)
        .output()
        .map_err(|error| format!("Failed to execute ssh command: {error}"))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if stdout.is_empty() {
            return Err("Remote command returned empty output.".into());
        }
        return Ok(stdout);
    }

    let stderr = String::from_utf8_lossy(&output.stderr);
    let message = stderr.trim();

    Err(if message.is_empty() {
        format!("SSH command failed for {}.", input.check_id)
    } else {
        message.to_string()
    })
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
            message: format!(
                "SSH connectivity to {}:{} succeeded.",
                input.host, input.port
            ),
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
        .invoke_handler(tauri::generate_handler![
            test_ssh_connection,
            run_linux_check
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
