import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifySession } from "@/lib/auth";
import * as apiModule from "@/lib/api";

const mockRedirect = vi.fn();
const mockCookieStore = {
  toString: vi.fn().mockReturnValue("store_sid=valid-token"),
};

vi.mock("next/navigation", () => ({
  redirect: (dest: string) => {
    mockRedirect(dest);
    throw new Error(`REDIRECT:${dest}`);
  },
}));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

describe("verifySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns user data when session is valid", async () => {
    vi.spyOn(apiModule, "apiFetch").mockResolvedValue({
      user: { id: 1, username: "owner" },
    });

    const user = await verifySession();
    expect(user).toEqual({ id: 1, username: "owner" });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /login?expired=1 when backend returns 401", async () => {
    vi.spyOn(apiModule, "apiFetch").mockRejectedValue(
      new apiModule.ApiError(401, "UNAUTHENTICATED", "Sesi tidak valid."),
    );

    await expect(verifySession()).rejects.toThrow("REDIRECT:/login?expired=1");
    expect(mockRedirect).toHaveBeenCalledWith("/login?expired=1");
  });

  it("redirects to /login when backend is unreachable or returns other error", async () => {
    vi.spyOn(apiModule, "apiFetch").mockRejectedValue(
      new apiModule.ApiError(0, "NETWORK_ERROR", "Network error"),
    );

    await expect(verifySession()).rejects.toThrow("REDIRECT:/login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
