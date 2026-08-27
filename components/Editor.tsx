"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type FabricCanvas = any;
type FabricObject = any;

type Props = {
  designId: string;
  initialTitle: string;
  initialContent: { objects: unknown[]; background: string };
  width: number;
  height: number;
};

const SWATCHES = ["#1b1a1f", "#5b5bd6", "#e08a3c", "#3ca66b", "#d64545", "#ffffff", "#f6f5f2"];

const FONTS = [
  { label: "Default", value: "Segoe UI, system-ui, sans-serif" },
  { label: "Poppins", value: "Poppins" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Roboto Slab", value: "Roboto Slab" },
  { label: "Oswald", value: "Oswald" },
  { label: "Merriweather", value: "Merriweather" },
  { label: "Bebas Neue", value: "Bebas Neue" },
  { label: "Pacifico", value: "Pacifico" },
];

export default function Editor({ designId, initialTitle, initialContent, width, height }: Props) {
  const router = useRouter();
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(initialTitle);
  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [saveState, setSaveState] = useState<"tersimpan" | "menyimpan" | "belum disimpan">("tersimpan");
  const [, forceRerender] = useState(0);
  const [removingBg, setRemovingBg] = useState(false);

  // --- Inisialisasi canvas Fabric.js sekali saat mount ---
  useEffect(() => {
    let disposed = false;

    import("fabric").then(({ fabric }) => {
      if (disposed || !canvasElRef.current) return;

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width,
        height,
        backgroundColor: initialContent.background || "#ffffff",
        preserveObjectStacking: true,
      });
      fabricRef.current = canvas;

      if (initialContent.objects?.length) {
        canvas.loadFromJSON({ objects: initialContent.objects, background: initialContent.background }, () => {
          canvas.renderAll();
        });
      }

      const onSelection = () => {
        setSelected(canvas.getActiveObject() ?? null);
      };
      const onModified = () => scheduleSave();

      canvas.on("selection:created", onSelection);
      canvas.on("selection:updated", onSelection);
      canvas.on("selection:cleared", () => setSelected(null));
      canvas.on("object:modified", onModified);
      canvas.on("object:added", onModified);
      canvas.on("object:removed", onModified);

      fitToView();
    });

    function fitToView() {
      const wrap = document.getElementById("canvas-wrap");
      const canvas = fabricRef.current;
      if (!wrap || !canvas) return;
      const scale = Math.min((wrap.clientWidth - 60) / canvas.getWidth(), (wrap.clientHeight - 60) / canvas.getHeight(), 1);
      canvas.setZoom(scale);
      const el = canvas.getElement().parentElement;
      if (el) {
        el.style.width = `${canvas.getWidth() * scale}px`;
        el.style.height = `${canvas.getHeight() * scale}px`;
      }
    }

    window.addEventListener("resize", fitToView);
    return () => {
      disposed = true;
      window.removeEventListener("resize", fitToView);
      fabricRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Autosave (debounced) ---
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = useCallback(() => {
    setSaveState("belum disimpan");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(doSave, 1200);
  }, []);

  async function doSave() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setSaveState("menyimpan");
    const json = canvas.toJSON();
    const thumbnail = canvas.toDataURL({ format: "png", quality: 0.5, multiplier: 0.2 });

    await fetch(`/api/designs/${designId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content: json, thumbnail }),
    });
    setSaveState("tersimpan");
  }

  function onTitleBlur() {
    scheduleSave();
  }

  // --- Alat tambah elemen ---
  function addText() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    import("fabric").then(({ fabric }) => {
      const text = new fabric.IText("Ketik di sini", { left: 100, top: 100, fontSize: 48, fill: "#1b1a1f" });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    });
  }

  function addShape(kind: "rect" | "circle" | "triangle") {
    const canvas = fabricRef.current;
    if (!canvas) return;
    import("fabric").then(({ fabric }) => {
      let shape: FabricObject;
      if (kind === "rect") shape = new fabric.Rect({ left: 120, top: 120, width: 200, height: 140, fill: "#5b5bd6", rx: 8, ry: 8 });
      else if (kind === "circle") shape = new fabric.Circle({ left: 150, top: 150, radius: 90, fill: "#e08a3c" });
      else shape = new fabric.Triangle({ left: 150, top: 150, width: 160, height: 140, fill: "#3ca66b" });
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    });
  }

  function onUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const canvas = fabricRef.current;
    if (!file || !canvas) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      import("fabric").then(({ fabric }) => {
        fabric.Image.fromURL(f.target?.result as string, (img) => {
          img.scaleToWidth(300);
          img.set({ left: 100, top: 100 });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        });
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function setFill(color: string) {
    selected?.set("fill", color);
    fabricRef.current?.renderAll();
    forceRerender((n) => n + 1);
    scheduleSave();
  }

  function setOpacity(v: number) {
    selected?.set("opacity", v);
    fabricRef.current?.renderAll();
    scheduleSave();
  }

  function bringFront() {
    selected?.bringToFront();
    fabricRef.current?.renderAll();
    scheduleSave();
  }

  function sendBack() {
    selected?.sendToBack();
    fabricRef.current?.renderAll();
    scheduleSave();
  }

  function deleteSelected() {
    if (!selected) return;
    fabricRef.current?.remove(selected);
    setSelected(null);
    scheduleSave();
  }

  function setFontFamily(fontFamily: string) {
    if (!selected) return;
    (selected as any).set("fontFamily", fontFamily);
    fabricRef.current?.renderAll();
    forceRerender((n) => n + 1);
    scheduleSave();
  }

  // --- Hapus background gambar otomatis (AI, jalan di browser) ---
  async function removeBackgroundFromSelected() {
    const canvas = fabricRef.current;
    if (!selected || !canvas || selected.type !== "image") return;

    setRemovingBg(true);
    try {
      // Di-load langsung dari CDN saat runtime (bukan lewat bundler Next.js) karena
      // library ini berisi kode WASM (ort-wasm) yang tidak kompatibel dengan cara
      // webpack Next.js mem-bundle kode server. Komentar /* webpackIgnore: true */
      // memberi tahu webpack untuk melewati file ini sepenuhnya saat build.
      // @ts-ignore - dynamic import dari CDN, tidak ada type declaration
      Sconst { removeBackground } = await import(/* webpackIgnore: true */ "https://esm.sh/@imgly/background-removal@1.5.7");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imageObj = selected as any;
      const sourceUrl: string = imageObj.getSrc();

      const resultBlob = await removeBackground(sourceUrl);
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(resultBlob);
      });

      imageObj.setSrc(dataUrl, () => {
        canvas.renderAll();
        scheduleSave();
      });
    } catch (err) {
      console.error("Gagal menghapus background:", err);
      alert("Gagal menghapus background. Coba gambar lain atau ulangi sebentar lagi.");
    } finally {
      setRemovingBg(false);
    }
  }

  function exportPng() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const zoom = canvas.getZoom();
    canvas.setZoom(1);
    const dataURL = canvas.toDataURL({ format: "png", quality: 1 });
    canvas.setZoom(zoom);
    const link = document.createElement("a");
    link.download = `${title || "desain"}.png`;
    link.href = dataURL;
    link.click();
  }

  return (
    <div style={{ display: "grid", gridTemplateRows: "56px 1fr", height: "100vh" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid var(--line)",
          background: "var(--panel)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/dashboard")}>← Dashboard</button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={onTitleBlur}
            style={{ border: "none", fontSize: 14, fontWeight: 600, background: "transparent" }}
          />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{saveState}</span>
        </div>
        <button className="primary" onClick={exportPng}>
          Unduh PNG
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 220px" }}>
        <div style={{ borderRight: "1px solid var(--line)", padding: 14, background: "var(--panel)" }}>
          <p style={sectionLabel}>Tambah elemen</p>
          <button style={toolBtn} onClick={addText}>🅣 Teks</button>
          <button style={toolBtn} onClick={() => fileInputRef.current?.click()}>🖼️ Gambar</button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onUploadImage} />

          <p style={sectionLabel}>Bentuk</p>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => addShape("rect")}>▭</button>
            <button onClick={() => addShape("circle")}>◯</button>
            <button onClick={() => addShape("triangle")}>△</button>
          </div>
        </div>

        <div
          id="canvas-wrap"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "auto",
            background: "radial-gradient(circle, #dedbd2 1px, transparent 1px) 0 0/16px 16px",
          }}
        >
          <div style={{ background: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
            <canvas ref={canvasElRef} />
          </div>
        </div>

        <div style={{ borderLeft: "1px solid var(--line)", padding: 14, background: "var(--panel)" }}>
          <p style={sectionLabel}>Properti</p>
          {!selected ? (
            <p style={{ fontSize: 12.5, color: "var(--muted)" }}>Pilih elemen di kanvas untuk mengatur warna dan layer-nya.</p>
          ) : (
            <>
              {selected.type === "i-text" && (
                <div style={{ marginBottom: 12 }}>
                  <p style={fieldLabel}>Font</p>
                  <select
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value={(selected as any).fontFamily ?? FONTS[0].value}
                    onChange={(e) => setFontFamily(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 13 }}
                  >
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selected.type === "image" && (
                <div style={{ marginBottom: 12 }}>
                  <p style={fieldLabel}>AI</p>
                  <button
                    style={{ width: "100%" }}
                    disabled={removingBg}
                    onClick={removeBackgroundFromSelected}
                  >
                    {removingBg ? "Memproses…" : "✂️ Hapus Background"}
                  </button>
                  {removingBg && (
                    <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                      Pertama kali dipakai perlu download model AI (~beberapa detik/menit tergantung koneksi).
                    </p>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <p style={fieldLabel}>Warna</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SWATCHES.map((c) => (
                    <span
                      key={c}
                      onClick={() => setFill(c)}
                      style={{ width: 20, height: 20, borderRadius: 5, background: c, cursor: "pointer", border: "1px solid rgba(0,0,0,.08)" }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <p style={fieldLabel}>Transparansi</p>
                <input type="range" min={0} max={1} step={0.05} defaultValue={selected.opacity ?? 1} onChange={(e) => setOpacity(parseFloat(e.target.value))} style={{ width: "100%" }} />
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                <button style={{ flex: 1 }} onClick={bringFront}>Depan</button>
                <button style={{ flex: 1 }} onClick={sendBack}>Belakang</button>
              </div>
              <button style={{ color: "var(--danger)", width: "100%" }} onClick={deleteSelected}>
                Hapus elemen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--muted)",
  fontWeight: 600,
  margin: "10px 0 8px 2px",
};

const fieldLabel: React.CSSProperties = { ...sectionLabel, margin: "0 0 6px 0" };

const toolBtn: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  marginBottom: 4,
  border: "1px solid transparent",
  background: "transparent",
};
