import 'dotenv/config'
import * as bail from 'ourin-baileys'
import chalk from 'chalk'
import logger from './utils/logger.js'
import { db, reload, saveDb } from './utils/database.js'
import sharp from 'sharp'

let ownerNumbers = (process.env.OWNER_NOMOR || '6283891882373').split(',').map(n => n.trim())

global.owner = {
    no: ownerNumbers,
    name: process.env.OWNER_NAME || 'Owner'
}

global.set = {
    prefix: [process.env.PREFIX || '.'],
    self: process.env.SELF_MODE === 'true',
    stealth: false
}

global.pair = {
    no: process.env.PAIR_NOMOR || '6283891882373',
    isPair: process.env.PAIR_MODE !== 'false',
    sesi: process.env.SESI || 'session'
}

global.geminiKey = process.env.GEMINI_KEY || ''
global.geminiEnable = process.env.GEMINI_ENABLE === 'true'

global.db = db
global.grup = db
global.logger = logger

global.pendingVerification = new Map()

global.bail = bail
global.chalk = chalk
global.start = Date.now()

global.reloadDb = reload
global.saveDb = saveDb

const THUMB_URL = process.env.THUMB_URL || 'https://files.covenant.sbs/bc5d34c2-ca8d-4c94-a69c-1e48d0ded206.jpeg'

global.AD_REPLY = {
    title: 'Epistemeia',
    body: 'Forum Diskusi Ilmiah',
    mediaType: 1,
    sourceUrl: THUMB_URL,
    mediaUrl: THUMB_URL,
    showAdAttribution: false,
    renderLargerThumbnail: true,
    thumbnail: null
}

try {
    fetch(THUMB_URL).then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.arrayBuffer()
    }).then(buf => {
        if (!buf) return
        return sharp(Buffer.from(buf)).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
    }).then(buf => {
        if (buf) global.AD_REPLY.thumbnail = buf
    }).catch(() => {})
} catch (e) {}
