import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";

describe("apiFetch", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sends X-Requested-With header on every request", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    global.fetch = mockFetch;

    await apiFetch("/api/v1/test");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0];
    const headers = new Headers(init.headers);
    expect(headers.get("X-Requested-With")).toBe("XMLHttpRequest");
  });

  it("serializes objects to JSON body and sets Content-Type", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 1 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    global.fetch = mockFetch;

    await apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: { username: "owner", password: "secret-password" },
    });

    const [, init] = mockFetch.mock.calls[0];
    const headers = new Headers(init.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init.body).toBe(
      JSON.stringify({ username: "owner", password: "secret-password" }),
    );
  });

  it("handles 204 No Content response gracefully", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    global.fetch = mockFetch;

    const res = await apiFetch("/api/v1/auth/logout", { method: "POST" });
    expect(res).toBeUndefined();
  });

  it("parses server error response into ApiError", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Username atau password salah.",
            details: [],
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    global.fetch = mockFetch;

    await expect(
      apiFetch("/api/v1/auth/login", { method: "POST", body: {} }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Username atau password salah.",
    });
  });

  it("handles network failure with clear Indonesian message", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    await expect(apiFetch("/api/v1/health")).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      code: "NETWORK_ERROR",
      message: "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
    });
  });
});
