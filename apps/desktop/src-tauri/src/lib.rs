use serde::{Deserialize, Serialize};
use serde_json::Value;
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

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct AssetCredentialPayload {
    method: String,
    username: String,
    secret_ref: String,
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
fn get_local_service_inspection_history() -> Result<Value, String> {
    run_local_service_json_command(
        "inspection-history",
        None,
        "local service inspection history command",
    )
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
            let output = ssh_output(
                &input,
                "sh -lc \"if command -v ss >/dev/null 2>&1; then ss -ltn '( sport = :22 )' | tail -n +2 | wc -l; elif command -v netstat >/dev/null 2>&1; then netstat -ltn | awk '$4 ~ /:22$/ {count++} END {print count+0}'; else echo unsupported; fi\"",
            )?;

            if output == "unsupported" {
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

            let listeners = output
                .parse::<u32>()
                .map_err(|_| format!("Unable to parse port listener output: {}", output))?;

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
            run_linux_check,
            get_local_service_status,
            start_local_service,
            stop_local_service,
            bootstrap_local_service_postgres,
            start_local_service_postgres,
            stop_local_service_postgres,
            get_local_service_inspection_preview,
            run_local_service_inspection,
            get_local_service_inspection_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
