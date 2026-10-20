import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/app/(auth)/login/login-form";
import * as apiModule from "@/lib/api";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders username, password inputs and submit button", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Masuk" })).toBeInTheDocument();
  });

  it("displays validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitBtn = screen.getByRole("button", { name: "Masuk" });
    await user.click(submitBtn);

    expect(await screen.findByText("Isi username.")).toBeInTheDocument();
    expect(await screen.findByText("Isi password.")).toBeInTheDocument();
  });

  it("displays expired session notice when expired=1", () => {
    mockSearchParams = new URLSearchParams("expired=1");
    render(<LoginForm />);

    expect(screen.getByText(/sesi anda telah berakhir/i)).toBeInTheDocument();
  });

  it("toggles password visibility when eye button is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/^Password$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", {
      name: /tampilkan password/i,
    });
    await user.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /sembunyikan password/i }),
    ).toBeInTheDocument();
  });

  it("submits credentials and redirects on success", async () => {
    const user = userEvent.setup();
    const apiSpy = vi.spyOn(apiModule, "apiFetch").mockResolvedValue({
      user: { id: 1, username: "owner" },
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/username/i), "owner");
    await user.type(screen.getByLabelText(/^Password$/i), "secretpassword123");
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith("/api/v1/auth/login", {
        method: "POST",
        body: { username: "owner", password: "secretpassword123" },
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("redirects to sanitized destination from next param", async () => {
    mockSearchParams = new URLSearchParams("next=/produk");
    const user = userEvent.setup();
    vi.spyOn(apiModule, "apiFetch").mockResolvedValue({
      user: { id: 1, username: "owner" },
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/username/i), "owner");
    await user.type(screen.getByLabelText(/^Password$/i), "secretpassword123");
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/produk");
    });
  });

  it("displays server error message on 401 invalid credentials", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiModule, "apiFetch").mockRejectedValue(
      new apiModule.ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Username atau password salah.",
      ),
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/username/i), "owner");
    await user.type(screen.getByLabelText(/^Password$/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Username atau password salah.",
    );
  });

  it("displays rate limited error message on 429", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiModule, "apiFetch").mockRejectedValue(
      new apiModule.ApiError(429, "RATE_LIMITED", "Rate limit exceeded"),
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/username/i), "owner");
    await user.type(screen.getByLabelText(/^Password$/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit.",
    );
  });
});
