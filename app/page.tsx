import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginButton from "@/components/LoginButton";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Kalau sudah login, langsung lempar ke dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        textAlign: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "var(--accent)",
        }}
      />
      <h1 style={{ fontSize: 32, margin: 0, letterSpacing: "-0.02em" }}>Studio</h1>
      <p style={{ color: "var(--muted)", maxWidth: 380, margin: 0 }}>
        Buat desain grafis langsung dari browser — poster, banner, story, dan lainnya.
        Masuk dengan Google untuk mulai dan menyimpan hasil desainmu.
      </p>
      <LoginButton />
    </main>
  );
}
