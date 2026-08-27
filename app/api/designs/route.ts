import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/designs -> daftar semua desain milik user yang login
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const designs = await prisma.design.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      thumbnail: true,
      width: true,
      height: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(designs);
}

// POST /api/designs -> buat desain kosong baru, balikin id-nya
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const width = body.width ?? 1080;
  const height = body.height ?? 1080;

  const design = await prisma.design.create({
    data: {
      title: body.title ?? "Desain tanpa judul",
      width,
      height,
      content: { objects: [], background: "#ffffff" },
      userId: (session.user as { id: string }).id,
    },
  });

  return NextResponse.json(design);
}
