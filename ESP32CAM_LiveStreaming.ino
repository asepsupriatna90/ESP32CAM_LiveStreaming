#include "esp_camera.h"
#include "FS.h"
#include "SD_MMC.h"
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// GANTI SESUAI WIFI KAMU
const char* ssid = "NAMA_WIFI";
const char* password = "PASSWORD_WIFI";

WebServer server(80);

#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

void startCameraServer();

void setup() {
  Serial.begin(115200);

  // Konfigurasi kamera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = 5;
  config.pin_d1       = 18;
  config.pin_d2       = 19;
  config.pin_d3       = 21;
  config.pin_d4       = 36;
  config.pin_d5       = 39;
  config.pin_d6       = 34;
  config.pin_d7       = 35;
  config.pin_xclk     = 0;
  config.pin_pclk     = 22;
  config.pin_vsync    = 25;
  config.pin_href     = 23;
  config.pin_sscb_sda = 26;
  config.pin_sscb_scl = 27;
  config.pin_pwdn     = 32;
  config.pin_reset    = -1;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Frame size
  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  // Inisialisasi kamera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Kamera Gagal: 0x%x", err);
    return;
  }

  // Inisialisasi SD Card
  if (!SD_MMC.begin()) {
    Serial.println("Gagal mount SD Card");
  } else {
    Serial.println("SD Card siap");
  }

  // Koneksi WiFi
  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWiFi Terhubung. IP: " + WiFi.localIP().toString());

  // Start server
  startCameraServer();
  Serial.println("Server dimulai");
}

void loop() {
  server.handleClient();
}

// Streaming handler
void handle_stream() {
  WiFiClient client = server.client();

  String response = "HTTP/1.1 200 OK\r\n";
  response += "Content-Type: " + String(_STREAM_CONTENT_TYPE) + "\r\n\r\n";
  server.sendContent(response);

  while (true) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) continue;

    client.print(_STREAM_BOUNDARY);
    client.printf(_STREAM_PART, fb->len);
    client.write(fb->buf, fb->len);
    esp_camera_fb_return(fb);

    if (!client.connected()) break;
  }
}

// Snapshot handler
void handle_snapshot() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    server.send(500, "text/plain", "Gagal ambil gambar");
    return;
  }
  server.send(200, "image/jpeg", (char*)fb->buf, fb->len);
  esp_camera_fb_return(fb);
}

// Save snapshot dari JSON body
void handle_save_snapshot() {
  if (server.method() != HTTP_POST) {
    server.send(405, "text/plain", "Method Not Allowed");
    return;
  }

  DynamicJsonDocument doc(2048);
  DeserializationError error = deserializeJson(doc, server.arg("plain"));

  if (error) {
    server.send(400, "text/plain", "Invalid JSON");
    return;
  }

  String imageData = doc["image"];
  int commaIndex = imageData.indexOf(',');
  String encoded = imageData.substring(commaIndex + 1);
  int len = encoded.length() * 3 / 4;

  // Buffer untuk menyimpan hasil decode base64
  std::vector<uint8_t> decoded(len);
  size_t outLen = decode_base64((const char*)encoded.c_str(), decoded.data());

  String filename = "/snap_" + String(millis()) + ".jpg";
  File file = SD_MMC.open(filename, FILE_WRITE);
  if (!file) {
    server.send(500, "text/plain", "Gagal membuka file SD");
    return;
  }

  file.write(decoded.data(), outLen);
  file.close();

  server.send(200, "text/plain", "Snapshot disimpan sebagai " + filename);
}

// Fungsi bantu untuk decode base64
size_t decode_base64(const char* input, uint8_t* output) {
  return base64_decode_chars(input, output);
}

// Setup semua endpoint
void startCameraServer() {
  server.on("/stream", HTTP_GET, handle_stream);
  server.on("/snapshot", HTTP_GET, handle_snapshot);
  server.on("/save_snapshot", HTTP_POST, handle_save_snapshot);
  server.begin();
}
