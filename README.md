# 📷 ESP32-CAM Live Streaming Plus dengan Web Server

Sistem kamera live streaming portabel berbasis **ESP32-CAM** dengan antarmuka web intuitif. Dirancang untuk digunakan tanpa aplikasi tambahan, sistem ini mendukung perekaman video dan audio, visibilitas malam otomatis, manajemen file, dan pengendalian penuh melalui browser.

---

## 📖 Deskripsi Umum

Proyek ini mengubah ESP32-CAM menjadi sistem kamera mandiri yang dapat digunakan untuk:
- 📹 Live streaming real-time langsung di browser
- 📸 Snapshot dan rekaman manual
- 🌙 Visibilitas malam otomatis
- 🎙️ Perekaman audio-video sinkron
- 💾 Pengelolaan file di kartu SD
- 🔐 Sistem login berbasis web

---

## 🔧 Hardware yang Digunakan

| Komponen | Fungsi |
|---------|--------|
| ESP32-CAM | Kamera utama & web server |
| Baterai 18650 + TP4056 | Catu daya portabel dengan pengisian ulang |
| INMP441 | Mikrofon digital untuk rekaman audio |
| BH1750 | Sensor cahaya untuk IR otomatis |
| IR LED + Transistor Driver | Penglihatan malam |
| microSD Card | Penyimpanan video/snapshot/audio |
| Modul Web Server Internal | Antarmuka kontrol melalui browser |

---

## 🌐 Fitur Web Server

- **🔴 Live Streaming** – Format MJPEG langsung di browser
- **📸 Snapshot / 🎥 Rekam** – Tombol kendali manual via web
- **🗂️ Manajemen File** – Lihat, unduh, dan hapus file SD card
- **🌙 IR Otomatis** – Menyesuaikan dengan pencahayaan sekitar
- **🎚️ Pengaturan Audio** – Kendali volume (jika tersedia)
- **🔐 Login Web UI** – Proteksi akses dengan kata sandi
- **📊 Status** – Memori SD, baterai, dan sensor cahaya

---

## 🚀 Cara Instalasi & Penggunaan

### 1. Persiapan
- Unduh dan instal [Arduino IDE](https://www.arduino.cc/en/software)
- Tambahkan ESP32 Board ke Board Manager:
  - Board URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
- Instal Library yang dibutuhkan melalui Library Manager:
  - `ESPAsyncWebServer`, `AsyncTCP`, `BH1750`, dll

### 2. Unggah Kode
- Buka file `ESP32CAM_LiveStreaming.ino`
- Konfigurasikan SSID dan password Wi-Fi
- Upload ke board ESP32-CAM

### 3. Unggah File Web UI
- Gunakan [ESP32 Sketch Data Upload Tool](https://randomnerdtutorials.com/install-esp32-filesystem-uploader-arduino-ide/)
- Upload isi folder `data/` ke SPIFFS atau LittleFS

### 4. Akses Web Server
- Hubungkan perangkat ke Wi-Fi ESP32 atau jaringan lokal
- Buka alamat IP ESP32-CAM di browser (lihat dari Serial Monitor)

---
