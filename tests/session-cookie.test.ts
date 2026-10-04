import { describe, expect, it } from "vitest";
import { decideRedirect, sanitizeRedirectPath } from "@/lib/session-cookie";

describe("sanitizeRedirectPath", () => {
  it("allows relative internal paths", () => {
    expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/produk/123")).toBe("/produk/123");
  });

  it("rejects open redirects and external URLs", () => {
    expect(sanitizeRedirectPath("//evil.com")).toBeNull();
    expect(sanitizeRedirectPath("https://evil.com")).toBeNull();
    expect(sanitizeRedirectPath("javascript:alert(1)")).toBeNull();
    expect(sanitizeRedirectPath("")).toBeNull();
    expect(sanitizeRedirectPath(null)).toBeNull();
    expect(sanitizeRedirectPath(undefined)).toBeNull();
  });
});

describe("decideRedirect", () => {
  it("redirects unauthenticated user to /login with next param", () => {
    const res = decideRedirect({
      hasSession: false,
      pathname: "/dashboard",
    });
    expect(res).toEqual({
      redirect: true,
      destination: "/login?next=%2Fdashboard",
    });
  });

  it("redirects unauthenticated user at root to /login without next param", () => {
    const res = decideRedirect({
      hasSession: false,
      pathname: "/",
    });
    expect(res).toEqual({
      redirect: true,
      destination: "/login",
    });
  });

  it("does not redirect unauthenticated user already at /login", () => {
    const res = decideRedirect({
      hasSession: false,
      pathname: "/login",
    });
    expect(res).toEqual({
      redirect: false,
      destination: "",
    });
  });

  it("redirects authenticated user at /login to /dashboard", () => {
    const res = decideRedirect({
      hasSession: true,
      pathname: "/login",
    });
    expect(res).toEqual({
      redirect: true,
      destination: "/dashboard",
    });
  });

  it("redirects authenticated user at /login to safe next destination", () => {
    const searchParams = new URLSearchParams("next=/produk");
    const res = decideRedirect({
      hasSession: true,
      pathname: "/login",
      searchParams,
    });
    expect(res).toEqual({
      redirect: true,
      destination: "/produk",
    });
  });

  it("ignores unsafe next param and falls back to /dashboard", () => {
    const searchParams = new URLSearchParams("next=//attacker.com");
    const res = decideRedirect({
      hasSession: true,
      pathname: "/login",
      searchParams,
    });
    expect(res).toEqual({
      redirect: true,
      destination: "/dashboard",
    });
  });

  it("does not redirect authenticated user accessing protected page", () => {
    const res = decideRedirect({
      hasSession: true,
      pathname: "/dashboard",
    });
    expect(res).toEqual({
      redirect: false,
      destination: "",
    });
  });
});
