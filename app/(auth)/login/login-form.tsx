"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  RiEyeLine,
  RiEyeOffLine,
  RiAlertLine,
  RiInformationLine,
} from "@remixicon/react";
import { apiFetch, ApiError } from "@/lib/api";
import { sanitizeRedirectPath } from "@/lib/session-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Isi username."),
  password: z.string().min(1, "Isi password."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isExpired = searchParams.get("expired") === "1";
  const rawNext = searchParams.get("next");
  const destination = sanitizeRedirectPath(rawNext) || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await apiFetch<{ user: { id: number; username: string } }>(
        "/api/v1/auth/login",
        {
          method: "POST",
          body: data,
        },
      );
      router.push(destination);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setServerError("Username atau password salah.");
          return;
        }
        if (err.status === 429) {
          setServerError(
            "Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit.",
          );
          return;
        }
        setServerError(err.message || "Gagal masuk. Silakan coba lagi.");
        return;
      }
      setServerError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {isExpired && !serverError && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded border border-[#D97757]/30 bg-[#FDF6F3] p-3 text-xs text-[#8A3B21]"
        >
          <RiInformationLine className="size-4 shrink-0 text-[#D97757] mt-0.5" />
          <span>
            Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.
          </span>
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <RiAlertLine className="size-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <span className="leading-snug">{serverError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="username"
          className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Username
        </Label>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? "username-error" : undefined}
          className="h-10 text-sm border-zinc-300 focus-visible:ring-[#D97757] focus-visible:border-[#D97757] dark:border-zinc-700"
          {...register("username")}
        />
        {errors.username && (
          <p
            id="username-error"
            className="text-xs font-medium text-red-600 dark:text-red-400"
          >
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="password"
          className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="h-10 text-sm pr-10 border-zinc-300 focus-visible:ring-[#D97757] focus-visible:border-[#D97757] dark:border-zinc-700"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={
              showPassword ? "Sembunyikan password" : "Tampilkan password"
            }
            className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-zinc-400 hover:text-zinc-700 focus:outline-none focus-visible:text-[#D97757] dark:hover:text-zinc-200"
          >
            {showPassword ? (
              <RiEyeOffLine className="size-4" />
            ) : (
              <RiEyeLine className="size-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p
            id="password-error"
            className="text-xs font-medium text-red-600 dark:text-red-400"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-10 text-sm font-medium bg-[#161616] text-white hover:bg-zinc-800 active:bg-black focus-visible:ring-[#D97757] transition-colors"
      >
        {isSubmitting ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
