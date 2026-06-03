export type Severity = "info" | "warning" | "critical";

export type CheckStatus = "pass" | "warning" | "critical" | "unknown";

export type AssetProtocol = "ssh";

export type AssetKind = "linux-host";

export type AuthenticationMethod = "password" | "private-key";

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}
