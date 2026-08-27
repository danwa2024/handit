import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

async function getOwnedDesign(id: string, userId: string) {
  const design = await prisma.design.findUnique({ where: { id } });
  if (!design || design.userId !== userId) return null;
  return design;
}

// GET /api/designs/:id
export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const design = await getOwnedDesign(params.id, (session.user as { id: string }).id);
  if (!design) {
    return NextResponse.json({ error: "Desain tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(design);
}

// PUT /api/designs/:id -> simpan perubahan (autosave dari editor)
export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const existing = await getOwnedDesign(params.id, (session.user as { id: string }).id);
  if (!existing) {
    return NextResponse.json({ error: "Desain tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json();

  const updated = await prisma.design.update({
    where: { id: params.id },
    data: {
      title: body.title ?? existing.title,
      content: body.content ?? existing.content,
      thumbnail: body.thumbnail ?? existing.thumbnail,
      width: body.width ?? existing.width,
      height: body.height ?? existing.height,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/designs/:id
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const existing = await getOwnedDesign(params.id, (session.user as { id: string }).id);
  if (!existing) {
    return NextResponse.json({ error: "Desain tidak ditemukan" }, { status: 404 });
  }

  await prisma.design.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
