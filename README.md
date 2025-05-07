# 📷 Sistem Kamera Live Streaming ESP32-CAM Plus

## 📖 Deskripsi Umum
Sistem ini adalah kamera live streaming berbasis **ESP32-CAM** yang mendukung perekaman video dan audio secara manual, visibilitas malam otomatis, serta antarmuka web tanpa memerlukan aplikasi tambahan. Cukup gunakan browser untuk mengakses semua fitur dari perangkat yang terhubung ke jaringan Wi-Fi ESP32.

## 🔧 Hardware yang Digunakan
- **ESP32-CAM** – Unit utama kamera dan pengendali sistem
- **Baterai Li-ion 18650 + Modul TP4056** – Sumber daya portabel
- **Modul Mikrofon Digital (INMP441)** – Perekaman audio sinkron
- **Sensor Cahaya (BH1750)** – Mengatur pencahayaan otomatis
- **IR LED + Driver Transistor** – Visibilitas malam
- **Kartu microSD** – Penyimpanan data
- **Web Server Internal (ESP32)** – Antarmuka kendali via browser

## 🌐 Fitur Web Server & Antarmuka
- **Live Streaming** (format MJPEG)
- **Snapshot & Rekaman Manual**
- **Pengelolaan File** (lihat, unduh, hapus)
- **Pengaturan IR & Audio**
- **Login & Keamanan**
- **Status Sensor** (cahaya, memori SD, level baterai)

## 🎯 Fitur Utama & Cara Kerja
1. **Live Streaming Real-Time** – Tanpa aplikasi tambahan
2. **Snapshot & Rekaman Manual** – Format file: `.jpg`, `.mp4`
3. **Rekaman Video & Audio** – Sinkronisasi audio-video ke microSD
4. **Visibilitas Malam Otomatis** – IR LED aktif saat gelap
5. **Web UI Ringan** – Dibuat dengan HTML & JavaScript, tersimpan di SPIFFS/LittleFS

## 💡 Keunggulan Sistem
✅ Tanpa aplikasi tambahan  
✅ Portabel dan hemat daya  
✅ Mudah digunakan  
✅ Cocok untuk CCTV, dokumentasi proyek, dan pemantauan lingkungan

---
