import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/proj-arte/store";
import { productQuerySchema } from "@/lib/proj-arte/schemas";

export async function GET(request: NextRequest) {
  const parsed = productQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get("page") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    category: request.nextUrl.searchParams.get("category") ?? undefined,
    search: request.nextUrl.searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query", issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await listProducts({
    page: parsed.data.page,
    limit: parsed.data.limit,
    categorySlug: parsed.data.category,
    search: parsed.data.search || undefined,
  });

  return NextResponse.json(result);
}
