import { compareSync } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/proj-arte/auth";
import { getSupabaseAdminClient } from "@/lib/proj-arte/supabase";
import { loginSchema } from "@/lib/proj-arte/schemas";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "admin_auth_not_configured" }, { status: 503 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("email,password_hash")
    .eq("email", email)
    .maybeSingle();

  if (error || !adminUser) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const passwordOk = compareSync(password, adminUser.password_hash);

  if (!passwordOk) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await createAdminSession(adminUser.email);
  return NextResponse.json({ ok: true, email: adminUser.email });
}
