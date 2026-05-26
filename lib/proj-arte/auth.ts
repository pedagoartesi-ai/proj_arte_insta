import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getAdminConfig } from "./env";

const COOKIE_NAME = "proj_arte_admin";

type SessionPayload = {
  email: string;
  role: "admin";
  exp: number;
  iat: number;
};

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function unbase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: SessionPayload, secret: string) {
  const body = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verify(token: string, secret: string) {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", secret).update(body).digest();
  const got = Buffer.from(signature, "base64url");
  if (expected.length !== got.length) return null;
  if (!timingSafeEqual(expected, got)) return null;

  const payload = JSON.parse(unbase64Url(body)) as SessionPayload;
  if (payload.exp < Date.now()) return null;
  return payload;
}

export async function createAdminSession(email: string) {
  const config = getAdminConfig();
  const now = Date.now();
  const payload: SessionPayload = {
    email,
    role: "admin",
    iat: now,
    exp: now + config.sessionTtlSeconds * 1000,
  };

  const value = sign(payload, config.sessionSecret);
  const jar = await cookies();
  jar.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: config.sessionTtlSeconds,
  });
  return payload;
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const config = getAdminConfig();
  try {
    return verify(token, config.sessionSecret);
  } catch {
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("unauthorized");
  }
  return session;
}
