# SUNYI: Lembah Terakhir

**Original 3D Horror Survival — Web & Android Browser**  
Developer: **Muhammad Hafizd Anshari**

> “Jika hutan berhenti bersuara, jangan ikut diam.”

SUNYI: Lembah Terakhir adalah game horror survival 3D original yang dibuat dari nol menggunakan Three.js. Pemain menjelajahi lembah terpencil, mencari catatan dan baterai, menghindari makhluk yang berpatroli, lalu mengaktifkan pemancar radio.

## Fitur yang tersedia

- Dunia hutan malam prosedural dengan terrain berbukit, pepohonan, bebatuan, rumah desa, jalan setapak, kabut, cahaya bulan dan lentera.
- Karakter utama 3D prosedural dengan animasi gerak dasar.
- Kamera first-person dan third-person (tekan `V`).
- Kontrol keyboard dan mouse, plus joystick dan tombol touchscreen.
- Musuh dengan patroli, deteksi jarak, pengejaran, dan serangan.
- Quest berurutan: menuju desa, mengumpulkan catatan, menemukan pemancar, mengaktifkan pemancar.
- Item baterai dan catatan yang bisa dikumpulkan.
- Health, stamina, sprint, senter, interaksi.
- Ambient audio sintetis dan efek suara berbasis Web Audio API.
- Menu utama, pause, pengaturan sensitivitas/volume/inversi Y, save/load lokal.
- Tidak membutuhkan backend atau server database.

## Cara menjalankan

### Opsi 1 — lokal

Karena proyek memakai JavaScript ES Modules, jalankan melalui server lokal (jangan membuka `index.html` langsung sebagai `file://`).

Dengan Python:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.

Atau gunakan ekstensi Live Server pada VS Code.

### Opsi 2 — GitHub Pages

1. Buat repository GitHub baru.
2. Upload seluruh isi folder proyek ini ke root repository.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/ (root)`, lalu klik Save.
6. Tunggu proses deployment selesai. URL game akan tampil pada halaman Pages.

Tidak ada build step. Three.js dimuat dari jsDelivr CDN, sehingga browser harus memiliki koneksi internet saat pertama kali membuka game.

## Kontrol

| Aksi | Desktop | Android / Touch |
|---|---|---|
| Bergerak | WASD / tombol panah | Joystick kiri |
| Melihat | Mouse | Geser area kanan |
| Lari | Shift | Tahan LARI |
| Interaksi | E | AKSI |
| Senter | F | SENTER |
| Ganti kamera | V | KAMERA |
| Pause | Esc | Tombol kembali perangkat / sembunyikan tab |

Klik area game untuk mengaktifkan pointer lock pada desktop. Tekan `Esc` untuk melepas pointer lock dan membuka pause.

## Struktur proyek

```text
sunyi-lembah-terakhir/
├── index.html
├── README.md
└── src/
    ├── game.js
    └── style.css
```

## Catatan teknis dan batasan versi awal

Versi ini adalah fondasi game yang playable dan dapat dikembangkan. Model karakter, lingkungan, dan musuh dibangun secara prosedural menggunakan geometri Three.js; belum menggunakan rig humanoid profesional, motion-capture, voice acting, atau aset audio rekaman. AI musuh menggunakan deteksi jarak dan steering sederhana, bukan pathfinding navmesh. Dunia dibuat sebagai area eksplorasi terbuka berbatas dengan objek prosedural, bukan dunia tak terbatas.

Penyimpanan menggunakan `localStorage` pada browser/perangkat yang sama. Progress tidak otomatis tersinkron antar perangkat. Kinerja pada Android bergantung pada kemampuan GPU dan browser; untuk perangkat kelas bawah, turunkan resolusi atau jumlah objek saat pengembangan lanjutan.

## Roadmap pengembangan

- [ ] Model karakter dan musuh rigged dengan animasi skeletal
- [ ] Navmesh/pathfinding dan perilaku AI berbasis state machine
- [ ] Interior bangunan yang bisa dimasuki
- [ ] Sistem cuaca, siklus siang-malam, dan kejadian horor dinamis
- [ ] Audio spasial dan soundscape rekaman
- [ ] Inventori grid, crafting, dan lebih banyak item
- [ ] Quest bercabang, NPC ramah, dialog, dan cutscene
- [ ] PWA/offline cache dan optimasi grafis Android
- [ ] Pengujian lintas browser dan perangkat nyata

## Lisensi dan hak cipta

© 2026 Muhammad Hafizd Anshari. All Rights Reserved.

Source code proyek ini disediakan untuk pengembangan dan publikasi oleh pemilik proyek. Three.js merupakan proyek pihak ketiga dan tetap tunduk pada lisensinya masing-masing.
