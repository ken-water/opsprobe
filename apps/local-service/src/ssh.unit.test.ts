import { describe, expect, it } from "vitest";
import {
  evaluateMysqlConnectionPressure,
  evaluateMysqlReplicationHints,
  evaluateMysqlSlowQueryRisk,
  evaluateMysqlTempDiskTableRisk,
  evaluateNginxConfigDriftHints,
  evaluateNginxLogRisk,
  evaluateNginxTlsPosture,
  evaluateRedisBlockingRisk,
  evaluateRedisEvictionRisk,
  evaluateRedisMemoryPressure,
  evaluateRedisPersistenceRisk,
} from "./ssh";

describe("MySQL SSH evaluation helpers", () => {
  it("marks connection pressure as critical when peak utilization is high", () => {
    const result = evaluateMysqlConnectionPressure(
      "Threads_connected\t48\nThreads_running\t18\nMax_used_connections\t180\nmax_connections\t200\n",
    );

    expect(result.status).toBe("critical");
    expect(result.summary).toContain("90.0%");
    expect(result.evidence.some((item) => item.label === "Threads Running" && item.value === "18")).toBe(true);
  });

  it("marks replication hints as critical when replica IO is unhealthy", () => {
    const result = evaluateMysqlReplicationHints(
      "read_only\tON\nsuper_read_only\tON\nReplica_IO_Running: No\nReplica_SQL_Running: Yes\nSeconds_Behind_Source: 120\nSource_Host: mysql-primary.internal\n",
    );

    expect(result.status).toBe("critical");
    expect(result.summary).toContain("replica health is degraded");
    expect(result.evidence.some((item) => item.label === "Upstream" && item.value === "mysql-primary.internal")).toBe(
      true,
    );
  });

  it("marks slow-query posture as warning when slow-query logging is disabled", () => {
    const result = evaluateMysqlSlowQueryRisk(
      "slow_query_log\tOFF\nlong_query_time\t10\nlog_output\tFILE\nSlow_queries\t240\n",
    );

    expect(result.status).toBe("warning");
    expect(result.summary).toContain("logging is disabled");
    expect(result.evidence.some((item) => item.label === "slow_query_log" && item.value === "OFF")).toBe(true);
  });

  it("marks temp disk table risk as critical when spill ratio is high", () => {
    const result = evaluateMysqlTempDiskTableRisk(
      "Created_tmp_tables\t2000\nCreated_tmp_disk_tables\t600\ntmp_table_size\t16777216\nmax_heap_table_size\t16777216\n",
    );

    expect(result.status).toBe("critical");
    expect(result.summary).toContain("spill-to-disk risk is high");
    expect(result.evidence.some((item) => item.label === "Disk Spill Ratio" && item.value === "30.0%")).toBe(true);
  });

  it("marks redis memory pressure as warning when maxmemory is not configured", () => {
    const result = evaluateRedisMemoryPressure(
      "used_memory:524288000\nused_memory_peak:734003200\nmaxmemory:0\nmaxmemory_policy:noeviction\n",
    );

    expect(result.status).toBe("warning");
    expect(result.summary).toContain("no maxmemory limit");
  });

  it("marks redis persistence risk as critical when recent persistence failed", () => {
    const result = evaluateRedisPersistenceRisk(
      "aof_enabled:1\nrdb_last_bgsave_status:err\naof_last_write_status:ok\nrdb_changes_since_last_save:250\n",
    );

    expect(result.status).toBe("critical");
    expect(result.summary).toContain("recent save or write failures");
  });

  it("marks redis blocking risk as critical when blocked clients and fork time are high", () => {
    const result = evaluateRedisBlockingRisk(
      "blocked_clients:6\ninstantaneous_ops_per_sec:2500\nlatest_fork_usec:1200000\n",
    );

    expect(result.status).toBe("critical");
    expect(result.summary).toContain("blocking risk is high");
  });

  it("marks redis eviction risk as critical when keys are evicted or clients rejected", () => {
    const result = evaluateRedisEvictionRisk(
      "evicted_keys:12\nrejected_connections:3\nconnected_clients:420\nmaxclients:1000\n",
    );

    expect(result.status).toBe("critical");
    expect(result.summary).toContain("started evicting keys or rejecting connections");
  });

  it("marks nginx log risk as warning when recent error lines exist", () => {
    const result = evaluateNginxLogRisk(
      "2026/06/07 10:00:01 [error] upstream timed out\n2026/06/07 10:00:02 [error] SSL_do_handshake() failed\n",
    );

    expect(result.status).toBe("warning");
    expect(result.summary).toContain("error log activity should be reviewed");
  });

  it("marks nginx TLS posture as warning when stapling is missing", () => {
    const result = evaluateNginxTlsPosture(
      "listen_443:present\nssl_protocols: TLSv1.2 TLSv1.3\nssl_ciphers: HIGH:!aNULL\n",
    );

    expect(result.status).toBe("warning");
    expect(result.summary).toContain("stapling posture should be reviewed");
  });

  it("marks nginx config drift hints as warning when recent config changes exist", () => {
    const result = evaluateNginxConfigDriftHints(
      "2026-06-07 11:20 /etc/nginx/conf.d/site.conf\n2026-06-07 10:45 /etc/nginx/nginx.conf\n",
    );

    expect(result.status).toBe("warning");
    expect(result.summary).toContain("config changes should be reviewed");
  });
});
