import { compareSync } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/proj-arte/auth";
import { getAdminConfig } from "@/lib/proj-arte/env";
import { loginSchema } from "@/lib/proj-arte/schemas";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const config = getAdminConfig();
  const emailOk = parsed.data.email.trim().toLowerCase() === config.email.trim().toLowerCase();
  if (!emailOk) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const password = parsed.data.password.trim();
  const plainPassword = config.passwordPlain.trim();
  const passwordHash = config.passwordHash.trim();
  const passwordOk = plainPassword
    ? password === plainPassword
    : passwordHash
      ? compareSync(password, passwordHash)
      : false;

  if (!passwordOk) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await createAdminSession(config.email);
  return NextResponse.json({ ok: true, email: config.email });
}
