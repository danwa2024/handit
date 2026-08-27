# Studio — Editor Desain (Canva-clone MVP)

Next.js + TypeScript + Fabric.js + Prisma + NextAuth (login Google). Siap deploy ke Vercel.

## Struktur

```
app/
  page.tsx                → landing + tombol login Google
  dashboard/page.tsx      → daftar desain user
  editor/[id]/page.tsx    → halaman editor per desain
  api/auth/[...nextauth]  → login Google (NextAuth)
  api/designs/            → simpan/ambil/hapus desain (Prisma)
components/
  Editor.tsx              → canvas Fabric.js + autosave
  DashboardClient.tsx      → grid desain + tombol buat baru
  LoginButton.tsx
prisma/schema.prisma      → model User, Design, dll
```

## 1. Setup lokal

```bash
npm install
cp .env.example .env
```

### a. Bikin OAuth credential Google
1. Buka [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Buat **OAuth 2.0 Client ID** tipe "Web application"
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   (nanti tambahkan juga versi domain Vercel-nya setelah deploy)
4. Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di `.env`

### b. Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```
Isi ke `NEXTAUTH_SECRET` di `.env`.

### c. Setup database
Pakai salah satu (gratis untuk mulai): **Vercel Postgres**, **Supabase**, atau **Neon**.
Isi `DATABASE_URL` di `.env`, lalu:

```bash
npm run db:push
```

Ini akan membuat semua tabel (User, Design, dll) sesuai `prisma/schema.prisma`.

### d. Jalankan
```bash
npm run dev
```
Buka `http://localhost:3000`.

## 2. Deploy ke Vercel

1. Push project ini ke GitHub
2. Import repo di [vercel.com/new](https://vercel.com/new)
3. Di **Environment Variables**, isi: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (isi dengan URL Vercel kamu, misal
   `https://nama-app.vercel.app`), dan `DATABASE_URL`
4. Tambahkan redirect URI produksi di Google Cloud Console:
   `https://nama-app.vercel.app/api/auth/callback/google`
5. Deploy

## 3. Cara kerja penyimpanan data

- Setiap kali kamu geser/tambah/ubah elemen di kanvas, editor menunggu ~1.2 detik
  (debounce) lalu kirim state kanvas (format JSON dari Fabric.js) ke
  `PUT /api/designs/:id`, disimpan ke kolom `content` (tipe JSON) di Postgres.
- Saat desain dibuka lagi, `content` itu di-load balik ke canvas lewat
  `canvas.loadFromJSON(...)`.
- Login pakai NextAuth strategy `database`, jadi session tersimpan di tabel
  `Session`, bukan cuma cookie — lebih mudah di-revoke kalau perlu.

## 4. Fitur yang baru ditambahkan

### Preset ukuran lebih lengkap
Dashboard sekarang punya preset dikelompokkan (Media sosial, Dokumen & cetak,
Presentasi) plus opsi **ukuran custom** (isi angka width × height sendiri).
Lihat `PRESET_GROUPS` di `components/DashboardClient.tsx` kalau mau nambah lagi.

### Pilihan font
Saat elemen teks dipilih, panel kanan menampilkan dropdown font (Poppins,
Montserrat, Playfair Display, Bebas Neue, dll — dari Google Fonts, di-load
lewat `<link>` di `app/layout.tsx`). Tambah font baru dengan: (1) tambahkan ke
URL Google Fonts di layout.tsx, (2) tambahkan ke array `FONTS` di
`components/Editor.tsx`.

### Hapus background otomatis (AI)
Saat gambar dipilih, tombol **"✂️ Hapus Background"** muncul di panel kanan.
Fitur ini pakai `@imgly/background-removal` — sebuah model AI yang jalan
**sepenuhnya di browser** (tidak kirim gambar ke server manapun, tidak butuh
API key, gratis). Model di-download otomatis saat pertama kali dipakai
(sekali per browser, lalu di-cache).

Cara kerja di `components/Editor.tsx`:
```
selected image → getSrc() → removeBackground(url) → blob → data URL → setSrc()
```

## 5. Roadmap lanjutan (belum ada di MVP ini)

- [ ] Template siap pakai
- [ ] Upload aset ke object storage (Vercel Blob / S3) — saat ini gambar
      disimpan sebagai base64 langsung di JSON, oke untuk MVP tapi tidak
      efisien untuk file besar / banyak
- [ ] Fitur AI lain (generate teks/copywriting, generate gambar dari prompt)
      — ini butuh API key ke provider AI (misal Anthropic/OpenAI/Stability),
      jadi perlu API route server-side baru, beda dari hapus background yang
      client-side
- [ ] Kolaborasi real-time (butuh websocket / Pusher / Liveblocks)
- [ ] Undo/redo history
