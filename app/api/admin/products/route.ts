import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createProduct, listProducts } from "@/lib/proj-arte/store";
import { productInputSchema, productQuerySchema } from "@/lib/proj-arte/schemas";
import { requireAdminSession } from "@/lib/proj-arte/auth";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return unauthorized();
  }

  const parsed = productQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get("page") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    category: request.nextUrl.searchParams.get("category") ?? undefined,
    search: request.nextUrl.searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const result = await listProducts({
    page: parsed.data.page,
    limit: parsed.data.limit,
    categorySlug: parsed.data.category,
    search: parsed.data.search || undefined,
    onlyActive: false,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const created = await createProduct(parsed.data);
    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "create_failed", detail: String(error) }, { status: 500 });
  }
}
