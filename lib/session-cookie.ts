export const SESSION_COOKIE = "store_sid";

export interface RedirectDecision {
  redirect: boolean;
  destination: string;
}

export function sanitizeRedirectPath(
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  // Must start with '/' and not '//' to prevent open redirects (e.g. //attacker.com)
  if (path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return null;
}

export function decideRedirect(params: {
  hasSession: boolean;
  pathname: string;
  searchParams?: URLSearchParams;
}): RedirectDecision {
  const { hasSession, pathname, searchParams } = params;

  const isLoginPage = pathname === "/login";

  if (!hasSession) {
    if (!isLoginPage) {
      const nextParam =
        pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      return {
        redirect: true,
        destination: `/login${nextParam}`,
      };
    }
    return { redirect: false, destination: "" };
  }

  // User has active session
  if (isLoginPage) {
    const rawNext = searchParams?.get("next");
    const safeNext = sanitizeRedirectPath(rawNext);
    return {
      redirect: true,
      destination: safeNext || "/dashboard",
    };
  }

  if (pathname === "/") {
    return {
      redirect: true,
      destination: "/dashboard",
    };
  }

  return { redirect: false, destination: "" };
}
