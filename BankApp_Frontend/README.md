# PT Sun Menara Mandiri - Website Perusahaan

Website resmi PT Sun Menara Mandiri, perusahaan terkemuka yang bergerak di bidang keuangan dan properti.

## Tentang Perusahaan

PT Sun Menara Mandiri adalah konglomerat yang didirikan pada tahun 1998 dengan fokus pada:
- **Layanan Perbankan Digital** melalui BG Bank
- **Pengembangan Properti** dengan berbagai proyek strategis
- **Solusi Keuangan Terintegrasi** untuk bisnis dan individu

## Struktur Website

### Halaman Utama (index.html)
- Profil perusahaan
- Layanan keuangan (transfer SWIFT, e-Statement, keamanan multi-faktor)
- Portofolio properti (pusat perbelanjaan, perumahan, gedung perkantoran)
- Akses login untuk user dan admin

### Halaman Properti (properties.html)
- Detail portofolio properti lengkap
- Informasi proyek: Sun Plaza Mall, Sun Garden Residence, Sun Tower Office, dll.
- Keunggulan properti: legalitas jelas, kualitas terjamin, lokasi strategis

### Halaman Tentang Kami (about.html)
- Sejarah perusahaan
- Visi dan misi
- Nilai-nilai perusahaan (integritas, kolaborasi, inovasi, peduli)
- Struktur organisasi
- Informasi kontak

## Teknologi yang Digunakan

- **HTML5** - Struktur website
- **CSS3** - Styling dengan Bootstrap 5
- **Bootstrap 5** - Framework CSS responsif
- **Font Awesome** - Ikon dan simbol
- **JavaScript** - Interaktivitas (Bootstrap JS)

## Cara Menjalankan

1. Pastikan Python terinstall di sistem
2. Buka terminal dan navigasi ke folder project
3. Jalankan server lokal:
   ```bash
   python -m http.server 8000
   ```
4. Buka browser dan akses: `http://localhost:8000`

## File Struktur

```
BankApp_Frontend/
├── index.html          # Halaman utama
├── about.html          # Tentang perusahaan
├── properties.html     # Portofolio properti
├── login.html          # Halaman login
├── admin.html          # Dashboard admin
├── user.html           # Dashboard user
├── css/
│   └── main.css        # Styling utama
├── js/
│   ├── admin_app.js    # JavaScript admin
│   ├── login.js        # JavaScript login
│   ├── swift_forms.js  # Form SWIFT
│   └── user_app.js     # JavaScript user
└── img/
    └── ptsun.png       # Logo perusahaan
```

## Fitur

- **Responsif**: Kompatibel dengan desktop, tablet, dan mobile
- **Aksesibilitas**: Navigasi mudah dan informasi jelas
- **Keamanan**: Sistem login terpisah untuk user dan admin
- **Modern UI**: Desain clean dengan tema biru profesional

## Kontak

PT Sun Menara Mandiri
Jl. Sudirman No. 123
Jakarta Pusat 10220
Indonesia

Email: info@sunmenaramandiri.com
Telepon: +62 21 1234 5678