/**
 * Wrapper around fetch that redirects to /login on 401 (expired session).
 * Use instead of raw fetch() for all API calls in client components.
 */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (res.status === 401) {
    window.location.href = "/login";
  }
  return res;
}
