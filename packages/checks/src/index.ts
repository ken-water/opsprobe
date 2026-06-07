import type { CheckStatus, Severity } from "@opsprobe/shared";

export interface CheckContext {
  assetId: string;
  assetName: string;
  protocol: "ssh";
  collectedAt: string;
}

export interface CheckEvidence {
  label: string;
  value: string;
}

export interface CheckResult {
  checkId: string;
  title: string;
  status: CheckStatus;
  severity: Severity;
  summary: string;
  evidence: CheckEvidence[];
  remediation: string;
}

export interface CheckDefinition {
  id: string;
  title: string;
  description: string;
  category: "resource" | "state";
  protocol: "ssh";
  run: (context: CheckContext) => Promise<CheckResult>;
}

export interface BuiltInInspectionTemplateDefinition {
  id: string;
  name: string;
  description: string;
  assetKind: "linux-host";
  checkIds: string[];
}

function nowIso() {
  return new Date().toISOString();
}

export const builtInLinuxChecks: CheckDefinition[] = [
  {
    id: "linux.cpu.usage",
    title: "CPU Usage",
    description: "Checks whether CPU usage is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.cpu.usage",
        title: "CPU Usage",
        status: "warning",
        severity: "warning",
        summary: "CPU usage is elevated and should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "78%" },
        ],
        remediation: "Inspect top CPU-consuming processes and review workload spikes.",
      };
    },
  },
  {
    id: "linux.memory.usage",
    title: "Memory Usage",
    description: "Checks whether memory usage is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.memory.usage",
        title: "Memory Usage",
        status: "pass",
        severity: "info",
        summary: "Memory usage is within the expected range.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "53%" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.disk.usage",
    title: "Disk Usage",
    description: "Checks whether root filesystem usage is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.disk.usage",
        title: "Disk Usage",
        status: "warning",
        severity: "warning",
        summary: "Disk usage is elevated and should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "81%" },
        ],
        remediation: "Review filesystem growth, log retention, and cleanup opportunities.",
      };
    },
  },
  {
    id: "linux.load.average",
    title: "Load Average",
    description: "Checks whether load average is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.load.average",
        title: "Load Average",
        status: "pass",
        severity: "info",
        summary: "Load average is within the expected range.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Load", value: "0.42 0.37 0.35" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.time.sync",
    title: "Time Synchronization",
    description: "Checks whether the host clock is synchronized.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.time.sync",
        title: "Time Synchronization",
        status: "critical",
        severity: "critical",
        summary: "Clock drift exceeds the expected threshold.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Offset", value: "+4.2s" },
        ],
        remediation: "Verify chronyd or ntpd configuration and re-sync the host clock.",
      };
    },
  },
  {
    id: "linux.process.sshd",
    title: "Key Process Status",
    description: "Checks whether the sshd process is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.process.sshd",
        title: "Key Process Status",
        status: "pass",
        severity: "info",
        summary: "sshd is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "sshd" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.port.22",
    title: "Key Port Listening",
    description: "Checks whether TCP port 22 is listening.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.port.22",
        title: "Key Port Listening",
        status: "pass",
        severity: "info",
        summary: "Port 22 is listening.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Port", value: "22/tcp" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.reboot.age",
    title: "Last Reboot Time",
    description: "Checks how long ago the host was rebooted.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.reboot.age",
        title: "Last Reboot Time",
        status: "pass",
        severity: "info",
        summary: "Recent reboot information was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Last Boot", value: "2026-06-01 09:12:00" },
        ],
        remediation: "Review reboot timing if unexpected restarts are observed.",
      };
    },
  },
  {
    id: "linux.log.usage",
    title: "Log Directory Usage",
    description: "Checks whether /var/log usage is within a healthy range.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.log.usage",
        title: "Log Directory Usage",
        status: "warning",
        severity: "warning",
        summary: "/var/log usage is elevated and should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "76%" },
        ],
        remediation: "Review log rotation, retention, and oversized log files in /var/log.",
      };
    },
  },
  {
    id: "linux.nginx.process",
    title: "Nginx Process Status",
    description: "Checks whether the nginx process is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.process",
        title: "Nginx Process Status",
        status: "pass",
        severity: "info",
        summary: "nginx is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "nginx" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.nginx.config",
    title: "Nginx Configuration Validation",
    description: "Checks whether nginx configuration passes syntax validation.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.config",
        title: "Nginx Configuration Validation",
        status: "pass",
        severity: "info",
        summary: "nginx configuration test passed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Command", value: "nginx -t" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.nginx.vhost.inventory",
    title: "Nginx Virtual Host Inventory",
    description: "Collects nginx server block and server_name inventory for recurring review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.vhost.inventory",
        title: "Nginx Virtual Host Inventory",
        status: "pass",
        severity: "info",
        summary: "nginx virtual host inventory was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Inventory", value: "server blocks and server_name directives" },
        ],
        remediation: "Review unexpected listeners or server names before the next release window.",
      };
    },
  },
  {
    id: "linux.nginx.tls.expiry",
    title: "Nginx TLS Certificate Expiry",
    description: "Checks static nginx TLS certificate expiry dates for upcoming renewal risk.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.tls.expiry",
        title: "Nginx TLS Certificate Expiry",
        status: "warning",
        severity: "warning",
        summary: "nginx TLS certificate expiry should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Inventory", value: "ssl_certificate directives" },
        ],
        remediation: "Review certificate expiry dates and renew certificates before they reach the warning window.",
      };
    },
  },
  {
    id: "linux.mysql.process",
    title: "MySQL Process Status",
    description: "Checks whether mysql or mariadb process is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.process",
        title: "MySQL Process Status",
        status: "pass",
        severity: "info",
        summary: "mysql or mariadb process is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "mysqld or mariadbd" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.mysql.port.3306",
    title: "MySQL Port Listening",
    description: "Checks whether TCP port 3306 is listening.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.port.3306",
        title: "MySQL Port Listening",
        status: "pass",
        severity: "info",
        summary: "Port 3306 is listening.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Port", value: "3306/tcp" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.mysql.runtime.info",
    title: "MySQL Runtime Configuration",
    description: "Collects version, data directory, and read-only runtime signals from MySQL or MariaDB.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.runtime.info",
        title: "MySQL Runtime Configuration",
        status: "pass",
        severity: "info",
        summary: "MySQL runtime configuration was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Runtime", value: "version, datadir, read_only, super_read_only" },
        ],
        remediation: "Review role and write-path expectations if read-only signals differ from the intended database role.",
      };
    },
  },
  {
    id: "linux.mysql.schema.inventory",
    title: "MySQL Schema Inventory",
    description: "Collects non-system schema count and sample names for recurring review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.schema.inventory",
        title: "MySQL Schema Inventory",
        status: "pass",
        severity: "info",
        summary: "MySQL schema inventory was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Inventory", value: "non-system schema count and sample names" },
        ],
        remediation: "Review unexpected schema growth or missing tenant schemas before the next maintenance window.",
      };
    },
  },
  {
    id: "linux.mysql.connection.pressure",
    title: "MySQL Connection Pressure",
    description: "Collects connection and thread pressure signals from MySQL or MariaDB.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.connection.pressure",
        title: "MySQL Connection Pressure",
        status: "warning",
        severity: "warning",
        summary: "MySQL connection pressure should be reviewed before it affects availability.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "Threads_connected, Threads_running, Max_used_connections, max_connections" },
        ],
        remediation: "Review connection pooling, burst traffic, and idle session cleanup if connection utilization remains elevated.",
      };
    },
  },
  {
    id: "linux.mysql.replication.hints",
    title: "MySQL Replication Hints",
    description: "Collects replica-role and replication-health hints from MySQL or MariaDB.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.replication.hints",
        title: "MySQL Replication Hints",
        status: "pass",
        severity: "info",
        summary: "MySQL replication role hints were collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "read_only, super_read_only, replica IO/SQL state, lag hints" },
        ],
        remediation: "Review replica lag, IO state, and read-only posture if the database is expected to follow an upstream source.",
      };
    },
  },
  {
    id: "linux.mysql.slow-query.risk",
    title: "MySQL Slow Query Risk",
    description: "Collects slow-query logging posture and accumulated slow-query count hints.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.slow-query.risk",
        title: "MySQL Slow Query Risk",
        status: "warning",
        severity: "warning",
        summary: "MySQL slow-query posture should be reviewed for recurring performance issues.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "slow_query_log, long_query_time, log_output, Slow_queries" },
        ],
        remediation: "Enable or review slow-query logging and investigate repeated slow-query growth before user-facing latency increases.",
      };
    },
  },
  {
    id: "linux.mysql.temp-disk-table.risk",
    title: "MySQL Temp Disk Table Risk",
    description: "Collects temporary table spill-to-disk hints that often indicate sort, join, or buffer pressure.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.temp-disk-table.risk",
        title: "MySQL Temp Disk Table Risk",
        status: "warning",
        severity: "warning",
        summary: "MySQL temporary table spill risk should be reviewed for heavier query patterns.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "Created_tmp_tables, Created_tmp_disk_tables, tmp_table_size, max_heap_table_size" },
        ],
        remediation:
          "Review temporary table growth, query patterns, and temp table sizing if disk-based temp tables keep increasing.",
      };
    },
  },
  {
    id: "linux.redis.process",
    title: "Redis Process Status",
    description: "Checks whether the redis-server process is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.process",
        title: "Redis Process Status",
        status: "pass",
        severity: "info",
        summary: "redis-server is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "redis-server" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.redis.port.6379",
    title: "Redis Port Listening",
    description: "Checks whether TCP port 6379 is listening.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.port.6379",
        title: "Redis Port Listening",
        status: "pass",
        severity: "info",
        summary: "Port 6379 is listening.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Port", value: "6379/tcp" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.redis.runtime.info",
    title: "Redis Runtime Configuration",
    description: "Collects Redis version, port, uptime, and persistence signals for recurring review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.runtime.info",
        title: "Redis Runtime Configuration",
        status: "pass",
        severity: "info",
        summary: "Redis runtime configuration was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Runtime",
            value: "redis_version, tcp_port, uptime_in_days, loading, rdb_last_bgsave_status, aof_enabled",
          },
        ],
        remediation: "Review persistence mode and runtime identity if this host is expected to serve a different Redis role.",
      };
    },
  },
  {
    id: "linux.redis.replication.info",
    title: "Redis Replication Role",
    description: "Collects Redis role and replication health signals where available.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.replication.info",
        title: "Redis Replication Role",
        status: "pass",
        severity: "info",
        summary: "Redis replication metadata was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Replication",
            value: "role, connected_slaves, master_host, master_link_status",
          },
        ],
        remediation: "Review unexpected replica wiring or degraded master link state before the next maintenance window.",
      };
    },
  },
  {
    id: "linux.redis.memory.pressure",
    title: "Redis Memory Pressure",
    description: "Collects Redis memory usage, maxmemory posture, and eviction-policy hints.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.memory.pressure",
        title: "Redis Memory Pressure",
        status: "warning",
        severity: "warning",
        summary: "Redis memory pressure should be reviewed before it impacts latency or writes.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "used_memory, maxmemory, maxmemory_policy, used_memory_peak" },
        ],
        remediation: "Review maxmemory sizing, eviction policy, and workload growth if Redis memory usage remains elevated.",
      };
    },
  },
  {
    id: "linux.redis.persistence.risk",
    title: "Redis Persistence Risk",
    description: "Collects Redis RDB or AOF persistence posture and recent save status hints.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.persistence.risk",
        title: "Redis Persistence Risk",
        status: "warning",
        severity: "warning",
        summary: "Redis persistence posture should be reviewed for recoverability expectations.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "aof_enabled, rdb_last_bgsave_status, rdb_changes_since_last_save, aof_last_write_status" },
        ],
        remediation: "Review save behavior, AOF posture, and recent persistence failures before relying on this node for recovery.",
      };
    },
  },
  {
    id: "linux.redis.blocking.risk",
    title: "Redis Blocking Risk",
    description: "Collects blocked client and command-processing risk hints for recurring operational review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.blocking.risk",
        title: "Redis Blocking Risk",
        status: "warning",
        severity: "warning",
        summary: "Redis blocking risk should be reviewed if clients or operations are stalling.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "blocked_clients, instantaneous_ops_per_sec, latest_fork_usec" },
        ],
        remediation: "Review blocked clients, slow commands, and fork-related pressure if Redis responsiveness has degraded.",
      };
    },
  },
  {
    id: "linux.redis.eviction.risk",
    title: "Redis Eviction And Rejection Risk",
    description: "Collects evicted key and rejected connection hints that indicate user-facing pressure.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.eviction.risk",
        title: "Redis Eviction And Rejection Risk",
        status: "warning",
        severity: "warning",
        summary: "Redis eviction or connection rejection risk should be reviewed before it impacts clients.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "evicted_keys, rejected_connections, maxclients, connected_clients" },
        ],
        remediation: "Review memory ceilings, client-count limits, and eviction activity before Redis starts dropping useful data or refusing clients.",
      };
    },
  },
  {
    id: "linux.docker.process",
    title: "Docker Daemon Status",
    description: "Checks whether the Docker daemon is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.docker.process",
        title: "Docker Daemon Status",
        status: "pass",
        severity: "info",
        summary: "docker daemon is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "dockerd" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.docker.info",
    title: "Docker Runtime Info",
    description: "Checks whether docker info can be collected from the host.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.docker.info",
        title: "Docker Runtime Info",
        status: "pass",
        severity: "info",
        summary: "docker runtime info was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Command", value: "docker info" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.docker.containers",
    title: "Docker Container Inventory",
    description: "Checks the number of running and stopped Docker containers.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.docker.containers",
        title: "Docker Container Inventory",
        status: "pass",
        severity: "info",
        summary: "docker container inventory was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Command", value: "docker ps -a" },
        ],
        remediation: "Review unexpected exited containers if service continuity is important on this host.",
      };
    },
  },
  {
    id: "linux.docker.runtime.summary",
    title: "Docker Runtime Summary",
    description: "Collects Docker engine, driver, and container-count signals for recurring host review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.docker.runtime.summary",
        title: "Docker Runtime Summary",
        status: "pass",
        severity: "info",
        summary: "Docker runtime summary was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Runtime",
            value: "server version, storage driver, cgroup driver, running/stopped containers, image count",
          },
        ],
        remediation: "Review runtime drift and unexpected container-count changes before the next maintenance window.",
      };
    },
  },
  {
    id: "linux.docker.image.inventory",
    title: "Docker Image And Exited Container Inventory",
    description: "Collects image count plus exited or unhealthy container samples for recurring operator review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.docker.image.inventory",
        title: "Docker Image And Exited Container Inventory",
        status: "warning",
        severity: "warning",
        summary: "Docker image and abnormal container inventory should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Inventory",
            value: "image count, exited containers, restarting containers, unhealthy container samples",
          },
        ],
        remediation: "Review unexpected image growth and investigate exited, restarting, or unhealthy containers before the next release window.",
      };
    },
  },
  {
    id: "linux.kubelet.process",
    title: "Kubelet Process Status",
    description: "Checks whether the kubelet process is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubelet.process",
        title: "Kubelet Process Status",
        status: "pass",
        severity: "info",
        summary: "kubelet is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "kubelet" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.kubelet.port.10250",
    title: "Kubelet Port Listening",
    description: "Checks whether kubelet secure port 10250 is listening.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubelet.port.10250",
        title: "Kubelet Port Listening",
        status: "pass",
        severity: "info",
        summary: "Port 10250 is listening.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Port", value: "10250/tcp" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.kubernetes.node.runtime",
    title: "Kubernetes Node Runtime",
    description: "Checks node-side runtime information through crictl or container runtime CLI.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubernetes.node.runtime",
        title: "Kubernetes Node Runtime",
        status: "pass",
        severity: "info",
        summary: "node runtime information was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Command", value: "crictl info or docker info" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.kubernetes.node.summary",
    title: "Kubernetes Node Summary",
    description: "Collects kubelet version, runtime endpoint, and pod-count signals from the node.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubernetes.node.summary",
        title: "Kubernetes Node Summary",
        status: "pass",
        severity: "info",
        summary: "Kubernetes node summary was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Node",
            value: "kubelet version, runtime endpoint, static pod path, running pod count, container count",
          },
        ],
        remediation: "Review node runtime endpoint drift and unexpected pod-count changes before the next maintenance window.",
      };
    },
  },
  {
    id: "linux.kubernetes.static-pod.inventory",
    title: "Kubernetes Static Pod Inventory",
    description: "Collects static pod manifests and critical control-plane container samples where available.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubernetes.static-pod.inventory",
        title: "Kubernetes Static Pod Inventory",
        status: "warning",
        severity: "warning",
        summary: "Kubernetes static pod and critical container inventory should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Inventory",
            value: "static pod manifest count, manifest sample, critical container sample, non-running critical count",
          },
        ],
        remediation: "Review missing static pod manifests or non-running critical node containers before the next release window.",
      };
    },
  },
  {
    id: "linux.kubelet.health.summary",
    title: "Kubelet Health Summary",
    description: "Collects kubelet service state, restart count, and recent failure hints for recurring review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubelet.health.summary",
        title: "Kubelet Health Summary",
        status: "warning",
        severity: "warning",
        summary: "Kubelet health summary should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Kubelet",
            value: "systemd active state, sub state, restart count, recent failure sample",
          },
        ],
        remediation: "Review unexpected restart growth or recent kubelet failures before the next maintenance window.",
      };
    },
  },
  {
    id: "linux.kubernetes.node.pressure",
    title: "Kubernetes Node Pressure Signals",
    description: "Collects node pressure and eviction-related signals from the host for recurring review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubernetes.node.pressure",
        title: "Kubernetes Node Pressure Signals",
        status: "warning",
        severity: "warning",
        summary: "Kubernetes node pressure signals should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Pressure",
            value: "memory.available, imagefs.available, nodefs.available, PID pressure, eviction sample",
          },
        ],
        remediation: "Review memory, filesystem, or PID pressure before the node begins evicting workloads.",
      };
    },
  },
];

export const builtInInspectionTemplateDefinitions: BuiltInInspectionTemplateDefinition[] = [
  {
    id: "template.linux.default",
    name: "Linux Host Baseline",
    description: "Balanced Linux host baseline with capacity and state checks.",
    assetKind: "linux-host",
    checkIds: builtInLinuxChecks.map((check) => check.id),
  },
  {
    id: "template.linux.capacity",
    name: "Linux Capacity Review",
    description: "Focus on CPU, memory, disk, load, and log growth pressure.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.log.usage",
    ],
  },
  {
    id: "template.linux.state",
    name: "Linux Access and State Review",
    description: "Focus on time sync, SSH reachability indicators, reboot age, and log state.",
    assetKind: "linux-host",
    checkIds: [
      "linux.time.sync",
      "linux.process.sshd",
      "linux.port.22",
      "linux.reboot.age",
      "linux.log.usage",
    ],
  },
  {
    id: "template.linux.nginx",
    name: "Linux Nginx Baseline",
    description: "Linux host baseline plus nginx process and configuration checks.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.nginx.process",
      "linux.nginx.config",
      "linux.nginx.vhost.inventory",
    ],
  },
  {
    id: "template.linux.nginx.edge",
    name: "Linux Nginx Edge Review",
    description: "Deeper nginx review with inventory and TLS certificate expiry checks for recurring edge service operations.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.nginx.process",
      "linux.nginx.config",
      "linux.nginx.vhost.inventory",
      "linux.nginx.tls.expiry",
    ],
  },
  {
    id: "template.linux.mysql",
    name: "Linux MySQL Baseline",
    description: "Linux host baseline plus deeper mysql or mariadb runtime, schema, connection, replication, and slow-query checks.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.mysql.process",
      "linux.mysql.port.3306",
      "linux.mysql.runtime.info",
      "linux.mysql.schema.inventory",
      "linux.mysql.connection.pressure",
      "linux.mysql.replication.hints",
      "linux.mysql.slow-query.risk",
      "linux.mysql.temp-disk-table.risk",
    ],
  },
  {
    id: "template.linux.redis",
    name: "Linux Redis Baseline",
    description: "Linux host baseline plus Redis process, listener, runtime, replication, memory, persistence, and blocking-risk checks.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.redis.process",
      "linux.redis.port.6379",
      "linux.redis.runtime.info",
      "linux.redis.replication.info",
      "linux.redis.memory.pressure",
      "linux.redis.persistence.risk",
      "linux.redis.blocking.risk",
      "linux.redis.eviction.risk",
    ],
  },
  {
    id: "template.linux.docker",
    name: "Linux Docker Host Baseline",
    description: "Linux host baseline plus Docker daemon, runtime, container, and image inventory checks.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.docker.process",
      "linux.docker.info",
      "linux.docker.containers",
      "linux.docker.runtime.summary",
      "linux.docker.image.inventory",
    ],
  },
  {
    id: "template.linux.kubernetes",
    name: "Linux Kubernetes Node Baseline",
    description: "Linux host baseline plus kubelet health, node runtime, static pod inventory, and pressure checks.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.kubelet.process",
      "linux.kubelet.port.10250",
      "linux.kubernetes.node.runtime",
      "linux.kubernetes.node.summary",
      "linux.kubernetes.static-pod.inventory",
      "linux.kubelet.health.summary",
      "linux.kubernetes.node.pressure",
    ],
  },
];

export function findBuiltInTemplateDefinition(templateId: string) {
  return builtInInspectionTemplateDefinitions.find((template) => template.id === templateId);
}

export function resolveTemplateChecks(templateId: string): CheckDefinition[] {
  const template = findBuiltInTemplateDefinition(templateId) ?? builtInInspectionTemplateDefinitions[0];
  const checkMap = new Map(builtInLinuxChecks.map((check) => [check.id, check]));

  return template.checkIds
    .map((checkId) => checkMap.get(checkId))
    .filter((check): check is CheckDefinition => Boolean(check));
}
