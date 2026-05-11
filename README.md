# TORJS

WhatsApp bot with interview/approval flow, AI integration, content moderation, and admin commands using [ourin-baileys](https://npmjs.com/package/ourin-baileys).

## Fitur

- Formulir perkenalan bertahap (7 pertanyaan + upload karya)
- Tombol interaktif untuk Ya/Tidak dan Approve/Reject
- Approval flow dengan notifikasi ke owner + tombol aksi
- Auto-moderasi konten: kata kasar, phishing, spam, promosi vulgar, pesan berantai
- Sistem peringatan 3 tingkat (warning -> kick + ban)
- AI Gemini untuk jawab pertanyaan otomatis di chat pribadi
- Manajemen grup terdaftar
- Stealth mode untuk sembunyikan perintah admin
- Custom thumbnail dengan `renderLargerThumbnail` via externalAdReply

## Setup

```bash
npm install
cp .env.example .env
# edit .env with your config
```

## .env

| Variable | Description |
|---|---|
| OWNER_NOMOR | Owner phone number(s), comma-separated |
| OWNER_NAME | Owner display name |
| PREFIX | Command prefix (default: `.`) |
| SELF_MODE | `true` to restrict to owner only |
| PAIR_NOMOR | Phone number for pairing code |
| PAIR_MODE | `false` to show QR instead of pairing |
| SESI | Session folder name (default: `session`) |
| GEMINI_ENABLE | `true` to enable Gemini AI (requires GEMINI_KEY) |
| GEMINI_KEY | Google Gemini API key (required if GEMINI_ENABLE=true) |
| THUMB_URL | Custom thumbnail image URL for bot messages (externalAdReply) |

## Command List

### Interview & Approval
| Command | Description |
|---|---|
| `.test` | Simulasi formulir pendaftaran (bisa di 1:1 atau grup) |
| `.cancel` | Batalkan proses formulir yang sedang berjalan |
| `.cekpending` | Lihat daftar pendaftar yang menunggu approval |
| `.approve @user` | Setujui permintaan pendaftar |
| `.reject @user` | Tolak permintaan pendaftar |

### Group Management
| Command | Description |
|---|---|
| `.setgroup` | Daftarkan grup ini sebagai grup terkelola |
| `.delgroup` | Hapus grup dari daftar terkelola |
| `.listgroups` | Lihat semua grup terdaftar |
| `.stealth` | Sembunyikan/tampilkan perintah admin dari menu publik |

### Moderation
| Command | Description |
|---|---|
| `.warn @user` | Beri peringatan ke anggota |
| `.kick @user` | Keluarkan anggota dari grup |
| `.ban @user` | Blokir anggota permanen |
| `.unban @user` | Buka blokir anggota |
| `.warns` | Lihat daftar blokir dan peringatan |

### Mode
| Command | Description |
|---|---|
| `.self` | Mode sendiri (hanya owner bisa pakai) |
| `.public` | Mode publik (semua orang bisa pakai) |
| `.menu` | Tampilkan menu bantuan |

### Rich Messages via ourin-baileys

ourin-baileys mendukung berbagai jenis rich message yang bisa digunakan:

- **interactiveButtons** — Tombol interaktif (Ya/Tidak, Approve/Reject, dll)
- **interactiveList** — Daftar pilihan (list message)
- **externalAdReply** — Tautan dengan thumbnail, title, dan body di pesan
- **renderLargerThumbnail** — Tampilkan thumbnail lebih besar
- **interactiveResponse** — Menangani respons dari tombol/daftar
- **groupRequestParticipantsUpdate** — Approve/reject join request grup

#### Ide fitur yang bisa pakai rich message:

1. **Polling voting** — Gunakan interactiveButtons untuk voting cepat di grup
2. **Menu interaktif** — interactiveList untuk navigasi menu bertingkat
3. **Konfirmasi aksi** — Tombol konfirmasi sebelum kick/ban
4. **Daftar anggota** — interactiveList untuk milih anggota yang mau di-action
5. **Quiz/teka-teki** — interactiveButtons untuk jawaban multiple choice
6. **Gabung grup via link** — Kirim externalAdReply + tombol untuk approve cepat
7. **Form feedback** — List message untuk rating/pilihan kepuasan

## Auto-moderation

Managed groups are monitored for:
- Bad words / kata kasar
- Phishing links
- Chain messages / pesan berantai
- Spam (pesan duplikat >80% kemiripan)
- Vulgar promotions / promosi tidak senonoh

3 warnings = auto kick + permanent ban.

## Project Structure

```
plugins/        — Command modules (setiap command file sendiri)
  index.js      — Main handler, interview flow, routing
  ai.js         — Gemini AI integration (optional)
  test.js, menu.js, approve.js, ...
src/
  config.js     — Globals, env, AD_REPLY
  utils/
    handler.js  — smsg(), clientConfig(), JID resolution
    database.js — JSON file persistence (groups, banned, warns)
    moderation.js — Bad words, phishing, spam detection
    logger.js   — Chalk-based logger with timestamps
index.js        — Connection, events, message dispatch
```

## Testing

Jalankan `.test` di chat 1:1 dengan bot untuk simulasi formulir tanpa perlu join request sungguhan.
