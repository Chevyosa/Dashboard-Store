export interface ApiErrorDetail {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.API_URL || "http://localhost:5050";
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("X-Requested-With", "XMLHttpRequest");

  let serializedBody: BodyInit | undefined;
  if (body !== undefined) {
    if (typeof body === "string") {
      serializedBody = body;
    } else {
      serializedBody = JSON.stringify(body);
      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: serializedBody,
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
    );
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let data: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "object" &&
      (data as { error: unknown }).error !== null
    ) {
      const err = (
        data as {
          error: {
            code?: string;
            message?: string;
            details?: ApiErrorDetail[];
          };
        }
      ).error;
      throw new ApiError(
        response.status,
        err.code || "UNKNOWN_ERROR",
        err.message || "Terjadi kesalahan pada server.",
        err.details || [],
      );
    }

    throw new ApiError(
      response.status,
      "HTTP_ERROR",
      `Permintaan gagal dengan status ${response.status}.`,
    );
  }

  return data as T;
}
