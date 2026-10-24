import { describe, expect, it, vi } from "vitest";
import { api, getToken, setToken } from "../api";

describe("API client", () => {
  it("clears an expired token and signals the auth provider", async () => {
    setToken("expired-token");
    const onUnauthorized = vi.fn();
    window.addEventListener("applytrack:unauthorized", onUnauthorized);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Invalid or missing authentication credentials" }), { status: 401 }),
    ));

    await expect(api.me()).rejects.toThrow("Invalid or missing authentication credentials");
    expect(getToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
    window.removeEventListener("applytrack:unauthorized", onUnauthorized);
  });

  it("reports API connection failures clearly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(api.stats()).rejects.toThrow("Could not connect to ApplyTrack");
  });
});
