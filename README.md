<div align="center">
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/ourin--baileys-v0.7.14-25D366?logo=whatsapp&logoColor=white" alt="ourin-baileys">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT">
  <img src="https://img.shields.io/badge/ESM-only-F7DF1E?logo=javascript&logoColor=black" alt="ESM">
  <br>
  <img src="https://img.shields.io/github/stars/reiwabyte/epistemeus-bot?style=social" alt="Stars">
  <img src="https://img.shields.io/github/forks/reiwabyte/epistemeus-bot?style=social" alt="Forks">
</div>

<h1 align="center">Epistemeus Bot</h1>

<p align="center">
  <strong>WhatsApp Bot — Downloader, Tools & AI</strong><br>
  Powered by <a href="https://github.com/LuckyArch/ourin-baileys">ourin-baileys</a> & Hugging Face / Groq Inference
</p>

---

## ✨ Features

| Category | Commands |
|----------|----------|
| **Download** | `.tiktok`, `.spotify`, `.play`, `.yt`, `.fb`, `.twitter`, `.ig`, `.mediafire` |
| **AI** | `.hf` (Hugging Face), `.groq` (Groq LPU) |
| **Tools** | `.binary`, `.tourl`, `.removebg`, `.hd` (video upscale), `.lirik`, `.npmstalk`, `.githubstalk`, `.getpl`, `.getscrape` |
| **Group** | `.kick`, `.add`, `.promote`, `.demote`, `.group`, `.link`, `.revoke`, `.setname`, `.setdesc`, `.tagall`, `.hidetag` |
| **Owner** | `.self`, `.public`, `.setgroup`, `.delgroup`, `.listgroups`, `.approve`, `.reject`, `.cekpending`, `.ban`, `.unban`, `.warns`, `.banlist`, `.approvedlist`, `.log` |

---

## Prerequisites

- **Node.js** >= 20 (ESM)
- **npm**
- WhatsApp account (for pairing)

---

## Installation

```bash
git clone https://github.com/reiwabyte/epistemeus-bot.git
cd epistemeus-bot
npm install
```

### Configure `.env`

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# -- AI (Optional) ----------------------------
HF_TOKEN=

GROQ_API_KEY=
```

> **Note:** `.hf` dan `.groq` bersifat opsional. Jika tidak ada API key, fitur tersebut tidak bisa digunakan, namun bot tetap berjalan normal untuk fitur lainnya.

### Configure Owner Number

Edit `src/config.js`:

```js
let ownerNumbers = ['628xxxxxxxxxx']  // ganti dengan nomor kamu
```

---

## Running

```bash
npm start
```

Pairing code akan muncul di terminal. Masukkan kode tersebut di WhatsApp > Linked Devices.

Untuk development dengan auto-restart:

```bash
npm run dev
```

---

## AI Features

### `.hf` -- Hugging Face

Menggunakan Hugging Face Inference Providers API (`Qwen2.5-72B-Instruct` untuk teks, `Qwen3.6-35B-A3B` untuk gambar).

```
.hf apa itu black hole?
.hf analisis gambar ini  (reply foto dengan caption)
```

**Setup:** `HF_TOKEN=` di `.env` -- dapatkan di https://huggingface.co/settings/tokens

### `.groq` -- Groq LPU

Menggunakan Groq API dengan inference cepat (LPU). Default model: `llama-3.3-70b-versatile`.

```
.groq                         -> lihat daftar model + cara pakai
.groq list                    -> lihat semua model
.groq setmodel [nama]         -> ganti model default
.groq jelaskan AI             -> tanya groq
.groq apa ini? (reply foto)   -> tanya dengan gambar
```

**Setup:** `GROQ_API_KEY=` di `.env` -- dapatkan gratis di https://console.groq.com/keys

> Tip: Groq tidak perlu kartu kredit. Gratis 30 req/menit, 14.400 req/hari.

---

## Download Commands

| Command | Deskripsi |
|---------|-----------|
| `.tiktok [url]` | Download TikTok tanpa watermark |
| `.spotify [url/judul]` | Info lagu Spotify |
| `.play [judul]` | Cari & download audio YouTube |
| `.yt [url]` | Download video YouTube |
| `.fb [url]` | Download video Facebook |
| `.twitter [url]` | Download media Twitter/X |
| `.ig [url]` | Download postingan Instagram |
| `.mediafire [url]` | Download file MediaFire |

---

## Tools

| Command | Deskripsi |
|---------|-----------|
| `.binary encode [teks]` | Encode teks ke biner |
| `.binary decode [biner]` | Decode biner ke teks |
| `.tourl` (reply media) | Upload media ke tmpfiles |
| `.removebg` (reply gambar) | Hapus latar belakang gambar |
| `.hd` (reply video) | Upscale video ke 2K AI |
| `.lirik [judul]` | Cari lirik lagu |
| `.npmstalk [package]` | Info package npm |
| `.githubstalk [username]` | Info profil GitHub |
| `.getpl [nama]` | Lihat source code plugin |
| `.getscrape [nama]` | Lihat source code scraper |

---

## Group Management

| Command | Deskripsi |
|---------|-----------|
| `.kick @user` | Keluarkan anggota |
| `.add 628xx` | Tambah anggota |
| `.promote @user` | Jadikan admin |
| `.demote @user` | Cabut admin |
| `.group open/close` | Buka/tutup grup |
| `.link` | Dapatkan link undangan |
| `.revoke` | Reset link undangan |
| `.setname [nama]` | Ganti nama grup |
| `.setdesc [deskripsi]` | Ganti deskripsi grup |
| `.tagall` | Tag semua anggota |
| `.hidetag [pesan]` | Tag semua tanpa notif |

---

## Owner Commands

### Mode
| Command | Deskripsi |
|---------|-----------|
| `.self` | Hanya owner yang bisa pakai bot |
| `.public` | Semua orang bisa pakai bot |

### Manajemen Grup
| Command | Deskripsi |
|---------|-----------|
| `.setgroup` | Daftarkan grup ke bot |
| `.delgroup` | Hapus grup dari daftar |
| `.listgroups` | Lihat grup terdaftar |

### Verifikasi & Moderasi
| Command | Deskripsi |
|---------|-----------|
| `.approve [@user]` | Setujui permintaan bergabung |
| `.reject [@user]` | Tolak permintaan bergabung |
| `.cekpending` | Lihat permintaan tertunda |
| `.cancel` | Batalkan proses formulir |
| `.ban @user` | Blokir user dari semua grup |
| `.unban [nomor]` | Buka blokir user |
| `.warns` | Lihat peringatan member |
| `.banlist` | Daftar user diblokir |
| `.approvedlist` | Daftar user terverifikasi per komunitas |
| `.log` | Riwayat approve/reject |

---

## Community Auto-Approve

Jika grup-grup terdaftar dalam **satu komunitas WhatsApp** yang sama, maka:

1. User yang mengisi formulir dan disetujui di satu grup akan otomatis di-acc di semua grup dalam komunitas tersebut
2. User yang sudah terverifikasi bergabung ke grup lain di komunitas yang sama akan langsung masuk tanpa formulir

Grup yang tidak tergabung dalam komunitas akan menggunakan approval per-grup.

---

## Project Structure

```
epistemeus-bot/
├── index.js                 # Entry point
├── src/
│   ├── config.js            # Config (owner, prefix, dll)
│   ├── utils/
│   │   ├── database.js      # Database JSON
│   │   ├── handler.js       # Message handler (smsg)
│   │   ├── logger.js        # Logger
│   │   ├── huggingface.js   # Hugging Face API
│   │   ├── groq.js          # Groq API
│   │   ├── richmessage.js   # Rich message builder
│   │   └── moderation.js    # Auto-moderation
│   └── ...
├── plugins/
│   ├── index.js             # Command router
│   ├── menu.js              # Main menu
│   ├── ownermenu.js         # Owner menu
│   ├── groupmenu.js         # Group menu
│   ├── toolsmenu.js         # Tools menu
│   ├── downloadmenu.js      # Download menu
│   ├── hf.js                # .hf command
│   ├── groq.js              # .groq command
│   ├── approve.js           # .approve
│   ├── approvedlist.js      # .approvedlist
│   └── ...                  # 30+ commands
├── scrape/                  # Scrapers
│   ├── spotify.js
│   ├── youtube.js
│   ├── instagram.js
│   └── ...
├── media/
│   └── menu.jpeg            # Default thumbnail
├── tmp/                     # Temp files
├── session/                 # Auth session (gitignored)
├── .env                     # Environment (gitignored)
└── database.json            # Database (gitignored)
```

---

## Configuration

Semua konfigurasi di `src/config.js`:

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `ownerNumbers` | `['6283891882373']` | Nomor owner |
| `set.prefix` | `['.']` | Prefix commands |
| `set.self` | `false` | Mode self/public |
| `pair.no` | `'6283891882373'` | Nomor untuk pairing |


