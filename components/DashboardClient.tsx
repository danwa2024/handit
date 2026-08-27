"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";

type DesignSummary = {
  id: string;
  title: string;
  thumbnail: string | null;
  width: number;
  height: number;
  updatedAt: string;
};

const PRESET_GROUPS: { group: string; items: { label: string; w: number; h: number }[] }[] = [
  {
    group: "Media sosial",
    items: [
      { label: "Instagram Post", w: 1080, h: 1080 },
      { label: "Instagram Story", w: 1080, h: 1920 },
      { label: "Facebook Post", w: 1200, h: 630 },
      { label: "Facebook Cover", w: 820, h: 312 },
      { label: "Twitter / X Post", w: 1600, h: 900 },
      { label: "YouTube Thumbnail", w: 1280, h: 720 },
    ],
  },
  {
    group: "Dokumen & cetak",
    items: [
      { label: "A4 Potret", w: 1240, h: 1754 },
      { label: "A4 Lanskap", w: 1754, h: 1240 },
      { label: "Letter (US)", w: 850, h: 1100 },
    ],
  },
  {
    group: "Presentasi",
    items: [{ label: "Slide 16:9", w: 1920, h: 1080 }],
  },
];

export default function DashboardClient({
  user,
  initialDesigns,
}: {
  user: { name: string; image: string };
  initialDesigns: DesignSummary[];
}) {
  const router = useRouter();
  const [designs, setDesigns] = useState(initialDesigns);
  const [creating, setCreating] = useState(false);
  const [customW, setCustomW] = useState(1000);
  const [customH, setCustomH] = useState(1000);

  async function createDesign(w: number, h: number) {
    setCreating(true);
    const res = await fetch("/api/designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ width: w, height: h }),
    });
    const design = await res.json();
    setCreating(false);
    router.push(`/editor/${design.id}`);
  }

  async function deleteDesign(id: string) {
    if (!confirm("Hapus desain ini?")) return;
    await fetch(`/api/designs/${id}`, { method: "DELETE" });
    setDesigns((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "var(--accent)" }} />
          <strong style={{ fontSize: 17 }}>Studio</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user.image && (
            <Image src={user.image} alt={user.name} width={32} height={32} style={{ borderRadius: "50%" }} />
          )}
          <span style={{ fontSize: 14 }}>{user.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/" })}>Keluar</button>
        </div>
      </header>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 10 }}>Buat desain baru</h2>

        {PRESET_GROUPS.map((group) => (
          <div key={group.group} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 6px 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {group.group}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {group.items.map((p) => (
                <button
                  key={p.label}
                  className="primary"
                  disabled={creating}
                  onClick={() => createDesign(p.w, p.h)}
                >
                  + {p.label} ({p.w}×{p.h})
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 6px 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Ukuran custom
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="number"
              value={customW}
              min={100}
              max={5000}
              onChange={(e) => setCustomW(parseInt(e.target.value) || 100)}
              style={{ width: 90, padding: "7px 8px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 13 }}
            />
            <span style={{ color: "var(--muted)" }}>×</span>
            <input
              type="number"
              value={customH}
              min={100}
              max={5000}
              onChange={(e) => setCustomH(parseInt(e.target.value) || 100)}
              style={{ width: 90, padding: "7px 8px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 13 }}
            />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>px</span>
            <button disabled={creating} onClick={() => createDesign(customW, customH)}>
              + Buat custom
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 10 }}>Desain kamu</h2>
        {designs.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Belum ada desain. Buat yang pertama lewat tombol di atas.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            {designs.map((d) => (
              <div
                key={d.id}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "var(--panel)",
                }}
              >
                <div
                  onClick={() => router.push(`/editor/${d.id}`)}
                  style={{
                    aspectRatio: `${d.width} / ${d.height}`,
                    background: d.thumbnail ? `url(${d.thumbnail}) center/cover` : "#f0efe9",
                    cursor: "pointer",
                  }}
                />
                <div style={{ padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13 }}>{d.title}</span>
                  <button
                    style={{ padding: "4px 8px", fontSize: 11, color: "var(--danger)" }}
                    onClick={() => deleteDesign(d.id)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
