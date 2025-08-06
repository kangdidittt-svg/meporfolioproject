# Portfolio Ilustrator

Portfolio website responsif untuk menampilkan karya ilustrasi dengan desain yang modern dan fleksibel.

## Fitur

- **Responsive Design**: Tampilan yang optimal di semua perangkat
- **Grid Layout Fleksibel**: Menampilkan karya dengan berbagai aspect ratio
- **Navigasi Smooth**: Transisi halus antar section
- **WhatsApp Integration**: Tombol kontak langsung ke WhatsApp
- **Digital Product Store**: Section khusus untuk menjual aset digital
- **Admin Panel**: Halaman admin untuk mengelola portfolio dan produk
- **Dynamic Content**: Konten yang dapat diupdate melalui admin panel
- **Modern UI**: Desain clean dengan animasi yang halus

## Struktur File

```
Rap Porfolio/
├── index.html          # File HTML utama
├── styles.css          # Styling CSS
├── script.js           # JavaScript untuk interaktivitas
├── admin.html          # Halaman admin panel
├── admin-styles.css    # Styling untuk admin panel
├── admin-script.js     # JavaScript untuk admin panel
└── README.md           # Dokumentasi
```

## Cara Menjalankan

1. Buka terminal di folder project
2. Jalankan server lokal:
   ```bash
   python -m http.server 8000
   ```
3. Buka browser dan akses: `http://localhost:8000`

## Menggunakan Admin Panel

### Akses Admin Panel

1. Buka `http://localhost:8000/admin.html` di browser
2. Login dengan kredensial:
   - **Username**: admin
   - **Password**: admin123
3. Atau klik link "Admin" di navigation bar website utama

### Fitur Admin Panel

#### 1. Kelola Portfolio
- Tambah, edit, dan hapus karya portfolio
- Upload gambar dan atur ukuran tampilan (normal, lebar, tinggi)
- Kategorisasi karya (ilustrasi, character design, editorial, dll)
- Preview langsung di website utama

#### 2. Kelola Digital Produk
- Tambah, edit, dan hapus produk digital
- Atur harga, deskripsi, dan gambar produk
- Status aktif/tidak aktif untuk kontrol visibilitas
- Integrasi otomatis dengan WhatsApp untuk pembelian

#### 3. Pengaturan Website
- Edit judul dan subtitle hero section
- Update teks "Tentang Saya"
- Ganti nomor WhatsApp
- Ubah nama website

### Data Storage

Semua data disimpan di localStorage browser, termasuk:
- Data portfolio dan produk
- Pengaturan website
- Session login admin

## Kustomisasi Manual

### Mengganti Konten (Alternatif)

1. **Informasi Personal**: Gunakan admin panel atau edit `index.html`
2. **Karya Portfolio**: Gunakan admin panel untuk manajemen yang mudah
3. **Digital Products**: Gunakan admin panel untuk update produk dan harga
4. **Nomor WhatsApp**: Update melalui pengaturan di admin panel

### Menambah Karya Baru

Tambahkan item baru di dalam `.portfolio-grid`:
```html
<div class="portfolio-item">
    <img src="path/to/your/image.jpg" alt="Deskripsi karya">
</div>
```

Untuk variasi ukuran, gunakan class:
- `wide`: untuk gambar landscape (2x lebar)
- `tall`: untuk gambar portrait (2x tinggi)

### Mengubah Warna

Edit variabel warna di `styles.css`:
- Primary: `#3498db`
- Secondary: `#2c3e50`
- Accent: `#e74c3c`

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Tips Optimasi

1. **Gambar**: Gunakan format WebP untuk performa terbaik
2. **Ukuran**: Kompres gambar sebelum upload
3. **Loading**: Implementasikan lazy loading untuk gambar
4. **SEO**: Tambahkan meta tags dan alt text

## Deployment

Untuk hosting online, Anda bisa menggunakan:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

Cukup upload semua file ke platform pilihan Anda.

---

**Catatan**: Ganti semua placeholder dengan konten asli Anda sebelum go live.