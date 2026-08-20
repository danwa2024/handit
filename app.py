import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="Studio — Editor Desain",
    page_icon="🎨",
    layout="wide",
)

# --- Sidebar (native Streamlit, untuk info & roadmap project) ---
with st.sidebar:
    st.markdown("## 🎨 Studio")
    st.caption("MVP editor desain mirip Canva")
    st.divider()

    st.markdown("### Preset kanvas")
    preset = st.selectbox(
        "Pilih ukuran",
        ["Post 1080×1080", "Story 1080×1920", "Banner 1200×628", "A4 Potret 1240×1754"],
    )
    preset_map = {
        "Post 1080×1080": (1080, 1080),
        "Story 1080×1920": (1080, 1920),
        "Banner 1200×628": (1200, 628),
        "A4 Potret 1240×1754": (1240, 1754),
    }
    canvas_w, canvas_h = preset_map[preset]

    st.divider()
    st.markdown("### Roadmap")
    st.markdown(
        """
        - [x] Editor dasar (teks, bentuk, gambar)
        - [x] Export PNG
        - [ ] Simpan desain ke database
        - [ ] Template siap pakai
        - [ ] Integrasi AI assistant
        """
    )
    st.divider()
    st.caption("Elemen di kanvas bisa di-drag, di-resize, dan diputar langsung.")

st.title("Editor Desain")
st.caption(f"Kanvas aktif: {preset} · atur elemen lalu unduh hasilnya sebagai PNG")

# --- HTML/JS editor (Fabric.js) di-embed lewat components.html ---
editor_html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js"></script>
<style>
  :root{{
    --ink:#1b1a1f;
    --paper:#f6f5f2;
    --panel:#ffffff;
    --line:#e4e1da;
    --accent:#5b5bd6;
    --accent-soft:#eceafd;
    --muted:#8a8781;
    --danger:#d64545;
  }}
  *{{box-sizing:border-box;}}
  body{{
    margin:0;
    font-family:'Segoe UI', system-ui, -apple-system, sans-serif;
    background:var(--paper);
    color:var(--ink);
    height:100vh;
    overflow:hidden;
  }}
  .app{{
    display:grid;
    grid-template-columns:190px 1fr 220px;
    height:96vh;
  }}
  .left{{
    background:var(--panel);
    border-right:1px solid var(--line);
    padding:14px 10px;
    overflow-y:auto;
  }}
  .section-label{{
    font-size:11px;
    text-transform:uppercase;
    letter-spacing:.08em;
    color:var(--muted);
    margin:14px 0 8px 4px;
    font-weight:600;
  }}
  .section-label:first-child{{margin-top:0;}}
  .tool-btn{{
    width:100%;
    display:flex;
    align-items:center;
    gap:8px;
    text-align:left;
    padding:8px 9px;
    margin-bottom:4px;
    border:1px solid transparent;
    background:transparent;
    border-radius:8px;
    cursor:pointer;
    font-size:13px;
  }}
  .tool-btn:hover{{background:var(--accent-soft);color:var(--accent);}}
  .shape-row{{display:flex;gap:6px;}}
  .shape-row button{{flex:1;padding:12px 0;}}
  button{{
    font-family:inherit;cursor:pointer;border:1px solid var(--line);
    background:var(--panel);color:var(--ink);border-radius:8px;
    padding:7px 12px;font-size:13px;
  }}
  button:hover{{border-color:var(--accent);color:var(--accent);}}
  button.primary{{background:var(--ink);color:#fff;border-color:var(--ink);}}
  button.primary:hover{{background:var(--accent);border-color:var(--accent);color:#fff;}}
  .canvas-wrap{{
    display:flex;align-items:center;justify-content:center;overflow:auto;position:relative;
    background:radial-gradient(circle, #dedbd2 1px, transparent 1px) 0 0/16px 16px;
  }}
  .canvas-shadow{{background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.12);}}
  .right{{
    background:var(--panel);border-left:1px solid var(--line);
    padding:14px 12px;overflow-y:auto;
  }}
  .empty-hint{{color:var(--muted);font-size:12.5px;line-height:1.5;margin-top:6px;}}
  .field{{margin-bottom:12px;}}
  .field label{{
    display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;
    color:var(--muted);margin-bottom:5px;font-weight:600;
  }}
  input[type=color]{{width:100%;height:32px;border:1px solid var(--line);border-radius:6px;padding:2px;}}
  input[type=range]{{width:100%;}}
  .swatches{{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;}}
  .swatch{{width:20px;height:20px;border-radius:5px;cursor:pointer;border:1px solid rgba(0,0,0,.08);}}
  .layer-btns{{display:flex;gap:6px;margin-top:6px;}}
  .layer-btns button{{flex:1;padding:6px 0;font-size:12px;}}
  .danger-btn{{color:var(--danger);border-color:#f1d3d3;width:100%;margin-top:16px;}}
  .danger-btn:hover{{background:#fdecec;border-color:var(--danger);color:var(--danger);}}
  #fileInput{{display:none;}}
  .topbar{{display:flex;gap:8px;justify-content:flex-end;padding:8px 12px;}}
  .zoom-controls{{
    position:absolute;bottom:12px;left:12px;display:flex;align-items:center;gap:6px;
    background:var(--panel);border:1px solid var(--line);border-radius:20px;
    padding:5px 10px;font-size:12px;color:var(--muted);
  }}
  .zoom-controls button{{border:none;background:transparent;padding:0 4px;font-size:14px;}}
</style>
</head>
<body>
<div class="topbar">
  <button id="clearBtn">Kosongkan</button>
  <button class="primary" id="exportBtn">Unduh PNG</button>
</div>
<div class="app">
  <div class="left">
    <div class="section-label">Tambah elemen</div>
    <button class="tool-btn" id="addTextBtn">🅣  Teks</button>
    <button class="tool-btn" id="addImageBtn">🖼️  Gambar</button>
    <input type="file" id="fileInput" accept="image/*">

    <div class="section-label">Bentuk</div>
    <div class="shape-row">
      <button id="addRectBtn" title="Kotak">▭</button>
      <button id="addCircleBtn" title="Lingkaran">◯</button>
      <button id="addTriangleBtn" title="Segitiga">△</button>
      <button id="addLineBtn" title="Garis">╱</button>
    </div>
  </div>

  <div class="canvas-wrap">
    <div class="canvas-shadow"><canvas id="c"></canvas></div>
    <div class="zoom-controls">
      <button id="zoomOut">–</button>
      <span id="zoomLabel">100%</span>
      <button id="zoomIn">+</button>
    </div>
  </div>

  <div class="right" id="rightPanel">
    <div class="section-label">Properti</div>
    <div class="empty-hint">Pilih elemen di kanvas untuk mengatur warna, ukuran, dan layer-nya.</div>
  </div>
</div>

<script>
const CANVAS_W = {canvas_w};
const CANVAS_H = {canvas_h};

const canvas = new fabric.Canvas('c', {{
  width: CANVAS_W,
  height: CANVAS_H,
  backgroundColor: '#ffffff',
  preserveObjectStacking: true
}});

function fitCanvasToView(){{
  const wrap = document.querySelector('.canvas-wrap');
  const scale = Math.min(
    (wrap.clientWidth - 60) / canvas.getWidth(),
    (wrap.clientHeight - 60) / canvas.getHeight(),
    1
  );
  canvas.setZoom(scale);
  document.querySelector('.canvas-shadow').style.width = (canvas.getWidth()*scale)+'px';
  document.querySelector('.canvas-shadow').style.height = (canvas.getHeight()*scale)+'px';
  document.getElementById('zoomLabel').textContent = Math.round(scale*100)+'%';
}}

document.getElementById('addTextBtn').onclick = () => {{
  const text = new fabric.IText('Ketik di sini', {{
    left: 100, top: 100, fontSize: 48, fontFamily: 'Segoe UI', fill: '#1b1a1f'
  }});
  canvas.add(text).setActiveObject(text);
}};

document.getElementById('addRectBtn').onclick = () => {{
  const rect = new fabric.Rect({{ left: 120, top: 120, width: 200, height: 140, fill: '#5b5bd6', rx: 8, ry: 8 }});
  canvas.add(rect).setActiveObject(rect);
}};

document.getElementById('addCircleBtn').onclick = () => {{
  const circle = new fabric.Circle({{ left: 150, top: 150, radius: 90, fill: '#e08a3c' }});
  canvas.add(circle).setActiveObject(circle);
}};

document.getElementById('addTriangleBtn').onclick = () => {{
  const tri = new fabric.Triangle({{ left: 150, top: 150, width: 160, height: 140, fill: '#3ca66b' }});
  canvas.add(tri).setActiveObject(tri);
}};

document.getElementById('addLineBtn').onclick = () => {{
  const line = new fabric.Line([50, 50, 300, 50], {{ left: 150, top: 150, stroke: '#1b1a1f', strokeWidth: 6 }});
  canvas.add(line).setActiveObject(line);
}};

document.getElementById('addImageBtn').onclick = () => document.getElementById('fileInput').click();
document.getElementById('fileInput').onchange = (e) => {{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (f) => {{
    fabric.Image.fromURL(f.target.result, (img) => {{
      img.scaleToWidth(300);
      img.set({{left:100, top:100}});
      canvas.add(img).setActiveObject(img);
    }});
  }};
  reader.readAsDataURL(file);
  e.target.value = '';
}};

const rightPanel = document.getElementById('rightPanel');

function renderPanelFor(obj){{
  if(!obj){{
    rightPanel.innerHTML = `<div class="section-label">Properti</div>
      <div class="empty-hint">Pilih elemen di kanvas untuk mengatur warna, ukuran, dan layer-nya.</div>`;
    return;
  }}
  let extra = '';
  if(obj.type === 'i-text'){{
    extra = `<div class="field"><label>Ukuran teks</label>
      <input type="range" id="fontSizeRange" min="10" max="160" value="${{obj.fontSize}}"></div>`;
  }}
  const swatchColors = ['#1b1a1f','#5b5bd6','#e08a3c','#3ca66b','#d64545','#ffffff','#f6f5f2'];
  rightPanel.innerHTML = `
    <div class="section-label">Properti</div>
    <div class="field">
      <label>Warna</label>
      <input type="color" id="colorPicker" value="${{(obj.fill && obj.fill[0]==='#') ? obj.fill : '#1b1a1f'}}">
      <div class="swatches">
        ${{swatchColors.map(c => `<span class="swatch" style="background:${{c}}" data-color="${{c}}"></span>`).join('')}}
      </div>
    </div>
    <div class="field">
      <label>Transparansi</label>
      <input type="range" id="opacityRange" min="0" max="1" step="0.05" value="${{obj.opacity}}">
    </div>
    ${{extra}}
    <div class="field">
      <label>Susunan layer</label>
      <div class="layer-btns">
        <button id="bringFront">Depan</button>
        <button id="sendBack">Belakang</button>
      </div>
    </div>
    <button class="danger-btn" id="deleteBtn">Hapus elemen</button>
  `;
  document.getElementById('colorPicker').oninput = (e) => {{ obj.set('fill', e.target.value); canvas.renderAll(); }};
  rightPanel.querySelectorAll('.swatch').forEach(s => {{
    s.onclick = () => {{
      obj.set('fill', s.dataset.color);
      document.getElementById('colorPicker').value = s.dataset.color;
      canvas.renderAll();
    }};
  }});
  document.getElementById('opacityRange').oninput = (e) => {{ obj.set('opacity', parseFloat(e.target.value)); canvas.renderAll(); }};
  if(obj.type === 'i-text'){{
    document.getElementById('fontSizeRange').oninput = (e) => {{ obj.set('fontSize', parseInt(e.target.value)); canvas.renderAll(); }};
  }}
  document.getElementById('bringFront').onclick = () => {{ obj.bringToFront(); canvas.renderAll(); }};
  document.getElementById('sendBack').onclick = () => {{ obj.sendToBack(); canvas.renderAll(); }};
  document.getElementById('deleteBtn').onclick = () => {{ canvas.remove(obj); renderPanelFor(null); }};
}}

canvas.on('selection:created', (e) => renderPanelFor(e.selected[0]));
canvas.on('selection:updated', (e) => renderPanelFor(e.selected[0]));
canvas.on('selection:cleared', () => renderPanelFor(null));

document.addEventListener('keydown', (e) => {{
  if((e.key === 'Delete' || e.key === 'Backspace') && canvas.getActiveObject() && !canvas.getActiveObject().isEditing){{
    canvas.remove(canvas.getActiveObject());
    renderPanelFor(null);
  }}
}});

document.getElementById('clearBtn').onclick = () => {{
  canvas.clear();
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
}};

document.getElementById('exportBtn').onclick = () => {{
  const zoom = canvas.getZoom();
  canvas.setZoom(1);
  const dataURL = canvas.toDataURL({{format:'png', quality:1}});
  canvas.setZoom(zoom);
  const link = document.createElement('a');
  link.download = 'desain.png';
  link.href = dataURL;
  link.click();
}};

let zoomLevel = 1;
document.getElementById('zoomIn').onclick = () => {{ zoomLevel = Math.min(zoomLevel + 0.1, 2); applyZoom(); }};
document.getElementById('zoomOut').onclick = () => {{ zoomLevel = Math.max(zoomLevel - 0.1, 0.2); applyZoom(); }};
function applyZoom(){{
  document.querySelector('.canvas-shadow').style.width = (canvas.getWidth()*zoomLevel)+'px';
  document.querySelector('.canvas-shadow').style.height = (canvas.getHeight()*zoomLevel)+'px';
  canvas.setZoom(zoomLevel);
  document.getElementById('zoomLabel').textContent = Math.round(zoomLevel*100)+'%';
}}

window.addEventListener('load', () => {{ fitCanvasToView(); zoomLevel = canvas.getZoom(); }});
fitCanvasToView();
</script>
</body>
</html>
"""

components.html(editor_html, height=800, scrolling=False)

st.info(
    "Tombol **Unduh PNG** akan mengunduh langsung lewat browser (proses di sisi client, "
    "jadi tetap jalan meskipun di-embed di Streamlit)."
)
