# Mamas Expedition (`pakeett` 3D Landscape Edition)

Website interaktif 3D statis (HTML, CSS, JS + Three.js + GSAP) siap deploy ke **GitHub Pages**.

## Fitur Utama
- **Rotate Device Gate:** Animasi panduan memiringkan HP ke landscape (dengan tombol fallback jika *auto-rotate* dikunci).
- **Quick Boot `MamasOS v2`:** Transisi terminal singkat tanpa PIN.
- **Kotak Paket 3D (`pakeett`):** Bisa diputar 360° dan dibuka secara 3D untuk memunculkan 3 objek interaktif:
  1. **Buket Bunga 3D** (4 bunga interaktif + makna + copy penutup `ini buat kamu ya / no_flower_blooms_as_beautifully_as_you`).
  2. **Surat Permintaan Maaf** (*staged typing animation* + tombol skip).
  3. **Voucher Klaim Jajan** (3 pilihan: *Matcha Frappe*, *Sushi Moy*, *Mie Sapi*) yang langsung mengarah ke WhatsApp.
- **Procedural SFX (Web Audio API):** Efek suara interaksi tanpa butuh file audio eksternal, lengkap dengan tombol mute/unmute.

## Cara Mengedit Teks Surat / Voucher / Nomor WA
Buka satu file saja: `js/config.js` — semua teks personal, pilihan voucher, makna bunga, dan nomor WhatsApp berada di sana.

## Cara Menjalankan Lokal
Karena menggunakan ES Modules, jalankan lewat static HTTP server ringan (misal `npx serve .` atau `python -m http.server 8080`) lalu buka di browser.

## Cara Deploy ke GitHub Pages
1. Push isi folder `mamas-expedition` ke repository GitHub.
2. Buka **Settings → Pages → Build and deployment → Source: Deploy from a branch (`main` / `/root`)**.
3. Semua path sudah relatif (`./css/...`, `./js/...`) sehingga aman berjalan di subpath GitHub Pages.
