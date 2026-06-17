interface JwtPayload {
  exp?: number;
}

function decodePayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [, payloadPart] = parts;
  if (!payloadPart) return null;
  try {
    const json = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
    const payload: unknown = JSON.parse(json);
    if (typeof payload !== "object" || payload === null) return null;
    const exp = (payload as { exp?: unknown }).exp;
    return { exp: typeof exp === "number" ? exp : undefined };
  } catch {
    return null;
  }
}

// Client-side expiry check only — the server remains the source of truth.
// Malformed tokens or those without `exp` are treated as expired.
export function isTokenExpired(token: string): boolean {
  const payload = decodePayload(token);
  if (!payload || payload.exp === undefined) return true;
  return Date.now() >= payload.exp * 1000;
}
