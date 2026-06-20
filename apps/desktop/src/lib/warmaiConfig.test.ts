import { describe, expect, it } from "vitest";
import { warmAiConfigFromEnv } from "./warmaiConfig";

describe("warmAiConfigFromEnv", () => {
  it("uses local development defaults", () => {
    expect(warmAiConfigFromEnv({})).toEqual({
      baseUrl: "http://127.0.0.1:8000",
      apiKey: "dev-secret",
      timeoutMs: 5000,
    });
  });

  it("uses Vite environment overrides", () => {
    expect(
      warmAiConfigFromEnv({
        VITE_WARMAI_BASE_URL: "http://localhost:9000",
        VITE_WARMAI_API_KEY: "local-key",
        VITE_WARMAI_TIMEOUT_MS: "2500",
      })
    ).toEqual({
      baseUrl: "http://localhost:9000",
      apiKey: "local-key",
      timeoutMs: 2500,
    });
  });
});
