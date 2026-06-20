import type { LocalWarmAiGatewayConfig } from "@warmdock/api";

export function warmAiConfigFromEnv(
  env: Record<string, string | undefined>
): Required<Pick<LocalWarmAiGatewayConfig, "baseUrl" | "apiKey" | "timeoutMs">> {
  const timeout = Number(env.VITE_WARMAI_TIMEOUT_MS ?? "5000");
  return {
    baseUrl: env.VITE_WARMAI_BASE_URL ?? "http://127.0.0.1:8000",
    apiKey: env.VITE_WARMAI_API_KEY ?? "dev-secret",
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 5000,
  };
}
