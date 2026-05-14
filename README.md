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
| **Academic** | `.jurnal [judul]` (cari + auto PDF dari Google Scholar/Zenodo), `.paper [doi]`, `.getpdf [doi]`, `.setgscookies` |
| **Tools** | `.binary`, `.tourl`, `.removebg`, `.hd` (video upscale), `.lirik`, `.npmstalk`, `.githubstalk`, `.getpl`, `.getscrape` |
| **Group** | `.kick`, `.add`, `.promote`, `.demote`, `.group`, `.link`, `.revoke`, `.setname`, `.setdesc`, `.tagall`, `.hidetag` |
| **Owner** | `.self`, `.public`, `.setgroup`, `.delgroup`, `.listgroups`, `.approve`, `.reject`, `.cekpending`, `.ban`, `.unban`, `.warns`, `.banlist`, `.approvedlist`, `.log` |

---

## Prerequisites

- **Node.js** >= 20 (ESM)
- **npm**
- **Google Chrome / Chromium** (wajib untuk Google Scholar scraping via Puppeteer)
- WhatsApp account (for pairing)

---

## Installation

```bash
# Clone repo
git clone https://github.com/reiwabyte/epistemeus-bot.git
cd epistemeus-bot

# Install Node.js dependencies (termasuk puppeteer-extra, ourin-baileys, dll)
npm install

# Install Chrome (wajib!)
sudo apt install google-chrome-stable -y

# Copy & edit environment
cp .env.example .env
nano .env
```

### Daftar Package (Node.js)

| Package | Version | Kegunaan |
|---------|---------|----------|
| `ourin-baileys` | ^0.7.14 | WhatsApp API (WebSocket) |
| `axios` | ^1.16.0 | HTTP client untuk download & API calls |
| `cheerio` | ^1.2.0 | HTML parsing untuk scraping |
| `puppeteer-core` | ^24.43.1 | Browser automation untuk Google Scholar |
| `puppeteer-extra` | ^3.3.6 | Plugin system untuk puppeteer |
| `puppeteer-extra-plugin-stealth` | ^2.11.2 | Bypass deteksi bot di Google Scholar |
| `chalk` | ^5.4.1 | Terminal colored output |
| `dotenv` | ^17.4.2 | Environment variables (.env) |
| `pino` | ^9.6.0 | Logger |
| `sharp` | ^0.34.5 | Image processing (removebg, HD) |
| `@imgly/background-removal-node` | ^1.4.5 | Remove background AI |
| `@google/generative-ai` | ^0.24.1 | Google Gemini AI |
| `form-data` | ^4.0.5 | Multipart form data |
| `yt-search` | ^2.13.1 | YouTube search |

### Configure `.env`

```env
# -- Wajib --
CHANNEL_ID=                # ID channel WhatsApp untuk .upch
                           # Contoh: 120363425402680588@newsletter

# -- AI (Opsional) ------------------------
GROQ_API_KEY=              # Untuk .groq — dapatkan di https://console.groq.com/keys
```

> **Note:** Tanpa API key, fitur AI tidak bisa digunakan, tapi bot tetap berjalan normal.

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

## Academic Features

Bot mencari paper dari **Google Scholar** (via Puppeteer stealth). Jika Google Scholar terblokir, fallback ke **Zenodo API**. PDF didownload langsung dari sumber asli (publisher, Zenodo, dll) tanpa generate ulang.

### `.jurnal [judul]`

Cari paper dari Google Scholar (fallback Zenodo). Ambil paper terbaik otomatis, download PDF langsung.

```
.jurnal Is Justified True Belief Knowledge?
.jurnal FILSAFAT ILMU GEOGRAFI PEMBANGUNAN WILAYAH
```

### `.paper [doi/url]`

Lihat detail paper (abstrak, penulis, tahun, dll). Jika PDF tersedia, otomatis dikirim.

```
.paper 10.5281/zenodo.17919425
```

### `.getpdf [doi/url]`

Download PDF dari DOI atau URL. Multi-layer fallback:

1. **PDF URL dari hasil pencarian** (Google Scholar / Zenodo)
2. **findPdf()** — CrossRef, OpenAlex, Semantic Scholar, Europe PMC, PubMed + Unpaywall
3. **getPaper()** — semua sumber (CrossRef, OpenAlex, Semantic Scholar, Europe PMC, PubMed, arXiv, Zenodo, SciELO, DOAJ, BASE, CORE, HAL)
4. **Direct URL** — jika input adalah URL langsung
5. **Scrape HTML** — 12 regex patterns untuk ekstrak link PDF dari halaman publisher (Springer, Elsevier, IEEE, Taylor & Francis, Wiley, Zenodo, dll)

```
.getpdf 10.5281/zenodo.17919425
.getpdf https://zenodo.org/records/17919425
```

### `.setgscookies`

Google Scholar terkadang memblokir akses otomatis. Untuk menghindari limit, import cookies dari browser:

1. Buka Google Scholar di Chrome
2. Install ekstensi "Get cookies.txt" (Netscape format)
3. Export cookies → kirim ke bot:
```
.setgscookies [paste cookies]
```

Cek status:
```
.setgscookies
```

---

## AI Features

### `.hf` -- Hugging Face

Menggunakan Hugging Face Inference Providers API (`Qwen2.5-72B-Instruct` untuk teks).

```
.hf apa itu black hole?
.hf analisis gambar ini  (reply foto dengan caption)
```

**Setup:** `HF_TOKEN=` di `.env` — dapatkan di https://huggingface.co/settings/tokens

### `.groq` -- Groq LPU

Menggunakan Groq API dengan inference cepat (LPU). Default model: `llama-3.3-70b-versatile`.

```
.groq                         -> lihat daftar model + cara pakai
.groq list                    -> lihat semua model
.groq setmodel [nama]         -> ganti model default
.groq jelaskan AI             -> tanya groq
.groq apa ini? (reply foto)   -> tanya dengan gambar
```

**Setup:** `GROQ_API_KEY=` di `.env` — gratis di https://console.groq.com/keys

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
├── index.js                     # Entry point
├── package.json
├── src/
│   ├── config.js                # Config (owner, prefix, dll)
│   └── utils/
│       ├── database.js          # Database JSON
│       ├── handler.js           # Message handler (smsg)
│       ├── logger.js            # Logger
│       ├── huggingface.js       # Hugging Face API
│       ├── groq.js              # Groq API
│       ├── richmessage.js       # Rich message builder
│       └── moderation.js        # Auto-moderation
├── plugins/
│   ├── index.js                 # Command router
│   ├── cekidch.js               # Chat identifier (.cekidch)
│   ├── rvo.js                   # Reveal view-once (.rvo)
│   ├── upch.js                  # Channel updater (.upch)
│   ├── searchjurnal.js          # .jurnal, .paper, .getpdf
│   ├── ... (30+ plugins)
├── scrape/
│   ├── googlescholar.js         # Google Scholar via Puppeteer
│   ├── zenodo.js                # Zenodo API
│   ├── unified.js               # 12 fallback sources
│   ├── crossref.js, openalex.js, semantic.js, ...
│   └── (scraper per platform)
├── media/
│   └── menu.jpeg                # Default thumbnail
├── session/                     # Auth session (gitignored)
├── .env                         # Environment (gitignored)
└── database.json                # Database (gitignored)
```

---

## Configuration

Di `src/config.js`:

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `ownerNumbers` | `['6283891882373']` | Nomor owner |
| `set.prefix` | `['.']` | Prefix commands |
| `set.self` | `false` | Mode self/public |
| `pair.no` | `'6283891882373'` | Nomor untuk pairing |


