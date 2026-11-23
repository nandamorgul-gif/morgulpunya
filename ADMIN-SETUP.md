# SEMEISTVOTECH — Admin & Cloudflare D1

Website: https://semeistvotech.pages.dev/
Login: https://semeistvotech.pages.dev/admin.html

## 1. Cloudflare Pages

Workers & Pages -> semeistvotech -> Settings:
- Build command: kosong
- Build output directory: `.` (satu titik, bukan tanda minus)
- Production branch: main
- D1 binding: `DB` -> `semeistvotech-db`

Variables and secrets (Production):
- `ADMIN_USERNAME` — username admin (text/secret; minimal 3 karakter)
- `ADMIN_PASSWORD` — password admin sendiri, minimal 12 karakter, set sebagai **Secret**
- `ADMIN_SESSION_SECRET` — kunci acak panjang minimal 32 karakter, set sebagai **Secret**; jangan pakai password yang sama
- `PRICE_FEED_URL` — opsional, URL HTTPS JSON feed pemasok untuk otomatisasi harga (jangan pakai URL contoh)
- `PRICE_FEED_TOKEN` — opsional, Secret untuk autentikasi ke feed pemasok
- `PRICE_SYNC_TOKEN` — opsional, Secret acak minimal 32 karakter untuk memicu endpoint sinkronisasi

Jangan pernah simpan password atau token di GitHub, `index.html`, atau JS browser.

Setelah mengisi Secrets, redeploy Production dan buka halaman admin.
Tabel `catalog_overrides` dan `admin_login_attempts` dibuat otomatis saat API digunakan.

## 2. Harga 2026

Harga awal pada `js/data.js` masih **estimasi**, bukan harga live dan tidak boleh dipromosikan sebagai data pasar 2026.
Admin dapat mengedit harga, stok, dan URL foto produk. Simpan -> D1 -> situs mengambil override via `/api/catalog/prices`.

### Otomatis dengan pemasok yang sudah disepakati

Feed harus URL HTTPS yang mengirim JSON, misalnya:

```json
{
  "updated_at": "2026-11-23T00:00:00.000Z",
  "products": [
    {
      "id": "cpu-1",
      "price": 3250000,
      "stock": 4,
      "source_url": "https://seller.example.com/product/example"
    }
  ]
}
```

Contoh angka di atas hanya menunjukkan format, bukan harga saat ini.
Server menolak feed yang lebih lama dari 7 hari atau data tidak valid tanpa mengubah harga.

Atur GitHub Actions secret `SEMEISTVOTECH_SYNC_TOKEN` sama persis dengan Cloudflare `PRICE_SYNC_TOKEN`.
Workflow `.github/workflows/daily-price-sync.yml` memanggil sinkronisasi sekitar 07:15 WIB setiap hari; jadwal GitHub Actions tidak dijamin presisi.

**Harga otomatis belum aktif sebelum sumber feed terpercaya dan token dikonfigurasi.** 
Jika tidak ada feed, harga manual/estimasi tetap ditampilkan. Jangan scrape marketplace tanpa otorisasi.

## 3. Keamanan

- Tidak ada password admin default.
- API admin menggunakan cookie HttpOnly + Secure + SameSite Strict, HMAC sign 8 jam, pemeriksaan origin dan pembatasan percobaan login.
- Login page boleh dibuka publik, tapi API pengelolaan membutuhkan sesi valid.
- Lakukan HTTPS melalui Cloudflare (jangan pernah coba login via HTTP).
- Pertimbangkan Cloudflare Access sebagai perlindungan tambahan untuk `/admin.html` jika tersedia.

## 4. Foto dan layanan

- Foto barang pihak ketiga dapat berubah atau memblokir hotlinking. Saat gagal, komponen mendapat placeholder berlabel, bukan gambar barang lain.
- Visual GTA Roleplay adalah contoh screenshot komunitas FiveM, bukan bukti proyek penyedia. Cek izin pemakaian komersial sebelum menjadikannya aset produksi.
- Foto asli yang memiliki izin sebaiknya diunggah ke `images/` dan disetel dari halaman admin agar lebih stabil.
