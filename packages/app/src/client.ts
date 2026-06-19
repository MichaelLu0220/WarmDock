/**
 * Gateway injection. The shared UI/app layer is platform-agnostic; each host
 * configures gateways once at startup.
 */
import type {
  AiGateway,
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
  ai?: AiGateway;
  /** optional: the demo/offline fake data has no realtime. */
  realtime?: RealtimeGateway;
}

let configured: UiGateways | null = null;

export function configureGateways(gateways: UiGateways): void {
  configured = gateways;
}

export function getGateways(): UiGateways {
  if (!configured) {
    throw new Error("@warmdock/ui-web: gateways not configured; call configureGateways() first");
  }
  return configured;
}
