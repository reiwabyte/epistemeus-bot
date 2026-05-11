# TORJS

WhatsApp bot with interview/approval flow, AI integration, content moderation, and admin commands using ourin-baileys.

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

## Commands

### Interview & Approval
- `.test` — Simulate interview flow
- `.cancel` — Cancel active form
- `.cekpending` — Show pending submissions
- `.approve @user` — Approve applicant
- `.reject @user` — Reject applicant

### Group Management
- `.setgroup` — Register this group
- `.delgroup` — Unregister group
- `.listgroups` — List managed groups
- `.stealth` — Toggle admin command visibility

### Moderation
- `.warn @user` — Warn a member
- `.kick @user` — Kick a member
- `.ban @user` — Permanently ban
- `.unban @user` — Unban
- `.warns` — List banned/warned users

### Mode
- `.self` — Owner-only mode
- `.public` — Public mode
- `.menu` — Show help menu

## Auto-moderation

Managed groups are monitored for: bad words, phishing links, chain messages, spam, vulgar promotions. 3 warnings = auto kick + ban.

## Structure

```
plugins/     — Command modules
src/
  utils/
    handler.js   — Message parsing & client config
    database.js  — JSON file persistence
    moderation.js — Content filter
    logger.js    — Chalk logger
  config.js      — Globals from .env
index.js         — Connection & event handlers
```
