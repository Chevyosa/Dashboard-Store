import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "./api";
import { SESSION_COOKIE } from "./session-cookie";

export interface AuthUser {
  id: number;
  username: string;
}

export const verifySession = cache(async (): Promise<AuthUser> => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  try {
    const res = await apiFetch<{ user: AuthUser }>("/api/v1/auth/me", {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });
    return res.user;
  } catch (err) {
    try {
      cookieStore.delete(SESSION_COOKIE);
    } catch {
      // Ignore if headers already sent or read-only
    }

    if (err instanceof ApiError && err.status === 401) {
      redirect("/login?expired=1");
    }
    // Any other error (network down, etc.)
    redirect("/login");
  }
});
