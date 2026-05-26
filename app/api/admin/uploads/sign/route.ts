import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/proj-arte/auth";
import { getSupabaseConfig } from "@/lib/proj-arte/env";
import { uploadSignSchema } from "@/lib/proj-arte/schemas";
import { getSupabaseAdminClient } from "@/lib/proj-arte/supabase";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = uploadSignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const config = getSupabaseConfig();
  if (!supabase || !config.configured) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const safeFileName = parsed.data.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const objectPath = `${parsed.data.folder}/${randomUUID()}-${safeFileName}`;
  const { data, error } = await supabase.storage.from(config.bucket).createSignedUploadUrl(objectPath);

  if (error || !data) {
    return NextResponse.json({ error: "sign_failed", detail: String(error) }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      ...data,
      bucket: config.bucket,
      path: objectPath,
    },
  });
}
