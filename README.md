# Silsilah Keluarga

Pohon silsilah berbasis Next.js. Data disimpan di **Google Spreadsheet** lewat Google Apps Script (tanpa database).

## Fitur UI
- Kartu orang dengan inisial, warna per gender, penanda wafat
- Klik kartu → panel detail (orang tua, pasangan, anak, saudara) yang bisa diklik untuk berpindah
- Tombol cepat **+ Tambah anak** dan **+ Tambah pasangan** (relasi terisi otomatis)
- Pencarian nama (Enter untuk melompat ke hasil), tema terang/gelap otomatis, tampilan HP

## Install
1. **Spreadsheet**: buat Google Sheet → Extensions → Apps Script → tempel `apps-script/Code.gs` → Deploy → New deployment → Web app (Execute as: Me, Access: Anyone) → salin URL `/exec`.
2. **Lokal**:
   ```bash
   npm install
   cp .env.example .env.local     # isi APPS_SCRIPT_URL
   npm run dev                    # http://localhost:3000
   ```
3. **Produksi**: `npm run build && npm start`, atau deploy ke Vercel dengan env `APPS_SCRIPT_URL`.

Kolom sheet `silsilah`: `id, nama, gender, ayah_id, ibu_id, pasangan_id, lahir, wafat, catatan`.
Setelah mengubah `Code.gs`, buat **New version** di Manage deployments.
