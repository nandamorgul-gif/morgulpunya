# SEMEISTVO TECH — sinkronisasi harga pemasok otomatis (Cloudflare Pages)

Website tidak menghasilkan atau menebak harga pasar. Perubahan harga otomatis **baru aktif setelah** toko memiliki feed/API katalog resmi dari pemasok yang diperbolehkan untuk digunakan.

## Konfigurasi produksi

Cloudflare → Workers & Pages → `semeistvotech` → Settings → Production → Variables and secrets:

- `PRICE_FEED_URL` (**Text**): URL HTTPS JSON katalog pemasok, misalnya `https://api.pemasok-anda.example/catalog.json`. Alamat ini hanya contoh dan **jangan digunakan**.
- `PRICE_FEED_TOKEN` (**Secret**): token autentikasi pemasok, jika feed membutuhkan header `Authorization: Bearer <token>`.
- D1 binding `DB` tetap terhubung ke database SEMEISTVO TECH.

Setelah variabel ditambahkan, buat deployment baru dari branch `feature/semeistvo-cloudflare-pages-d1`.

## Format feed

Gunakan ID produk yang persis ada di `js/data.js`. Harga dalam rupiah (bilangan bulat), stok opsional. Contoh format berikut menggunakan nilai dummy untuk ilustrasi struktur, **bukan harga pasar**:

```json
{
  "currency": "IDR",
  "updated_at": "2026-11-23T08:00:00.000Z",
  "products": [
    {
      "id": "gpu-rtx5060ti16",
      "price": 12345678,
      "stock": 4
    }
  ]
}
```

Untuk memperbarui **seluruh** katalog, pemasok harus menyediakan seluruh ID aktif. Format ini menolak harga nol/negatif, harga tidak valid, ID duplikat, mata uang selain IDR, atau feed yang sudah berumur lebih dari 60 menit.

## Perilaku sistem

1. Browser memuat API `/api/products` dari Cloudflare Pages setiap dua menit saat halaman aktif.
2. Server mengambil feed HTTPS resmi dengan token privat yang tidak dikirim ke browser.
3. Harga yang cocok berdasarkan ID diterapkan sementara pada respons API dan disinkronkan ke katalog, keranjang, serta PC Builder. Tabel D1 asli tidak ditimpa oleh feed.
4. Respons menampilkan `pricing.status`, `pricing.updated_at`, `live_products`, dan `total_products`. Status menjadi `live` untuk feed valid dan terkini.
5. Bila sumber harga belum ada, tidak valid, atau tidak bisa dijangkau, harga D1 tetap tampil sebagai **estimasi**, bukan diklaim real-time.
6. Permintaan checkout masih melalui konsultasi WhatsApp, bukan pembayaran otomatis.

**Catatan:** Ini pembaruan *near real-time* dengan jeda cache server hingga 60 detik dan polling browser 120 detik, bukan streaming harga per detik. Frekuensi efektif mengikuti pembaruan dari pemasok.

## Admin

Halaman Login Admin dan endpoint `/api/admin/*` dinonaktifkan sesuai permintaan pemilik website. `admin.html` tidak disertakan dalam output `dist/`.

## Deployment

- Production branch: `feature/semeistvo-cloudflare-pages-d1`
- Build command: `npm run build:pages`
- Output: `dist`
- D1: `DB`

Pastikan branch tersebut ditetapkan sebagai **Production** di Cloudflare bila ingin pembaruan tampil pada `semeistvotech.pages.dev`, bukan hanya URL Preview.
