import { NextResponse } from "next/server";
import { listCategories } from "@/lib/proj-arte/store";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json({ data: categories });
}
