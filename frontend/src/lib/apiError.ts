import { AxiosError } from "axios";

/**
 * Turns an unknown thrown value into one readable line.
 *
 * The services used to catch errors and rethrow `new Error("Failed to fetch
 * X")`, which discarded the status code and response body — the part that
 * actually says what went wrong. This keeps that detail.
 */
export function describeApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const url = [error.config?.baseURL, error.config?.url]
      .filter(Boolean)
      .join("");

    // A 5xx from Nest still carries a JSON body with the real reason.
    const body = error.response?.data;
    const detail =
      typeof body === "string"
        ? body.slice(0, 200)
        : body && typeof body === "object" && "message" in body
          ? String((body as { message: unknown }).message)
          : undefined;

    return [
      status ? `HTTP ${status}` : error.code ?? "network error",
      url && `at ${url}`,
      detail && `— ${detail}`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return error instanceof Error ? error.message : String(error);
}
