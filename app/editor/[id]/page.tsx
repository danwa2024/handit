import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Editor from "@/components/Editor";

export default async function EditorPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const design = await prisma.design.findUnique({ where: { id: params.id } });
  if (!design || design.userId !== (session.user as { id: string }).id) {
    notFound();
  }

  return (
    <Editor
      designId={design.id}
      initialTitle={design.title}
      initialContent={design.content as { objects: unknown[]; background: string }}
      width={design.width}
      height={design.height}
    />
  );
}
