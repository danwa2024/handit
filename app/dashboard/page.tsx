import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const designs = await prisma.design.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, thumbnail: true, width: true, height: true, updatedAt: true },
  });

  return (
    <DashboardClient
      user={{ name: session.user.name ?? "", image: session.user.image ?? "" }}
      initialDesigns={JSON.parse(JSON.stringify(designs))}
    />
  );
}
