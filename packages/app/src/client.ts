/**
 * Gateway injection. The shared UI/app layer is platform-agnostic; each host
 * (web cloud client, or the in-memory demo) configures the gateways once at
 * startup. Mirrors the desktop data/index.ts assembly point, but injectable.
 */
import type {
  RealtimeGateway,
  SessionGateway,
  SettingsGateway,
  TaskGateway,
  UnlockGateway,
} from "@warmdock/api";

export interface UiGateways {
  task: TaskGateway;
  session: SessionGateway;
  unlock: UnlockGateway;
  settings: SettingsGateway;
  /** optional — the demo (offline fake data) has no realtime. */
  realtime?: RealtimeGateway;
}

let configured: UiGateways | null = null;

export function configureGateways(gateways: UiGateways): void {
  configured = gateways;
}

export function getGateways(): UiGateways {
  if (!configured) {
    throw new Error("@warmdock/ui-web: gateways not configured — call configureGateways() first");
  }
  return configured;
}
