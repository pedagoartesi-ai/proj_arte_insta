import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteProduct, updateProduct } from "@/lib/proj-arte/store";
import { productInputSchema } from "@/lib/proj-arte/schemas";
import { requireAdminSession } from "@/lib/proj-arte/auth";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await updateProduct(id, parsed.data);
    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: "update_failed", detail: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  try {
    await deleteProduct(id);
    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "delete_failed", detail: String(error) }, { status: 500 });
  }
}
