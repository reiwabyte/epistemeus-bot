const VULGAR = [
    'anjing', 'anjink', 'anjg', 'ajig', 'ajg', 'anying', 'anjay',
    'bangsat', 'bangsad', 'bangset',
    'kontol', 'kntl', 'kont0l', 'kondol',
    'memek', 'mmek', 'memed',
    'ngentot', 'ngent0t', 'ntot', 'entot', 'gentot',
    'jancuk', 'jancok', 'jncok', 'cuk', 'janc0k',
    'asu', 'asuu', 'asoe', 'as0',
    'tai', 'taek', 't4i',
    'pantat', 'pant4t',
    'pepek', 'p3p3k',
    'peler', 'p3l3r',
    'pukimak', 'pukima', 'puki', 'pukim4k',
    'lonte', 'pelacur', 'l0nte',
    'sundal', 'sund4l',
    'tempek', 'temp3k',
    'jembut',
    'kenthu', 'kentu',
    'ndasmu',
]

const VULGAR_PROMO = [
    'judi', 'slot', 'togel', 'casino', 'poker',
    'pinjol', 'pinjam', 'utang', 'hutang',
    'bodong', 'investasi', 'skema', 'ponzi',
    'bf', 'bokep', 'sange', 'colong',
    'vcs', 'live', 'bugil', 'telanjang', 'viral',
    'open', 'order', 'dm', 'chat me',
    'admin slot', 'agen', 'bonus new member',
    'deposit', 'withdraw', 'maxwin',
    'gacor', 'scatter', 'free spin',
    'modal kecil', 'hasil jutaan', 'uang cepat',
    'rahasia dapat uang', 'kerja online', 'bisnis online',
    'daftar gratis', 'no ribet', 'tanpa modal',
    'komisi', 'afiliasi', 'reseller',
    'bigo', 'show', 'streaming', 'pay',
    'sange', 'horny', 'coli',
]

const PHISHING = [
    'https?://(?:[^\\s]*)?(?:login|verify|secure|update|confirm|reset|klaim|hadiah|menang)\\w*(?:\\.(?:com|xyz|top|club|site|info|online|fun|link|id|cf|ml|gq|tk))',
    'https?://(?:[^\\s]*)?(?:bit\\.ly|tinyurl|shorturl|rebrandly|shortlink)\\S+',
    '(?:bagikan|sebarkan|share)\\s*ke\\s*\\d+\\s*(?:grup|kontak|teman|orang)',
    '(?:dapatkan|klaim|ambil)\\s*(?:hadiah|bonus|uang|saldo|pulsa|voucher)',
    '(?:daftar|registrasi|mendaftar)\\s*(?:sekarang|gratis|tanpa\\s*modal)',
    '(?:transfer|kirim|bayar)\\s*(?:uang|dana|pulsa|saldo)\\s*(?:ke|di)\\s*\\d+',
    '(?:pinjam|dana|kredit|modal)\\s*(?:cepat|cair|tanpa\\s*jaminan|online)',
    'https?://\\S+\\.(?:xyz|top|club|site|info|online|fun|link|cf|ml|gq|tk)/\\S+',
    'https?://(?:\\S+\\.)?(?:matahari|makmur|sejahtera|berkah|sukses)(?:\\S+)?\\..{2,}/\\S*',
]

const CHAIN = [
    'forwarded many times',
    'jangan lupa share', 'jangan lupa di share', 'jangan lupa di sebarkan',
    'kirim ke 10', 'kirim ke 20', 'kirim ke 5',
    'bagikan ke', 'teruskan ke',
    'dapatkan keberuntungan',
    'putuskan rantai',
    'jika tidak share',
    'akan terjadi', 'akan menimpa',
    'dosa jika tidak',
    'dapat musibah', 'dapat celaka', 'dapat sial',
    'dapat karma',
    'tolong sebarkan', 'tolong disebarkan', 'mohon bantu sebarkan',
    'viralkan', 'viralin',
    'demi allah', 'demi tuhan',
    'sumpah', 'demi apa pun',
    'ini nyata', 'sudah terbukti', 'terbukti nyata',
    'bukan hoax', 'bukan hoaks',
    'jangka waktu', 'batas waktu',
    'dalam 24 jam', 'hari ini juga',
    'sekarang juga', 'detik ini juga',
    'copas jangan lupa', 'jangan lupa copas',
    'stop chain', 'chain message',
    'dimohon', 'diharapkan',
    'saya hanya numpang', 'tolong disebar',
    'tolong bantu', 'share ya',
    'sebarkan ke', 'forward ke',
    'jangan diabaikan',
    'klo gk share', 'kalau tidak disebar',
    'gk bakal dapat', 'nggak bakalan',
    'dijamin', 'pasti dapat',
    'udah terbukti', 'ga percaya?',
]

const LOGICAL_FALLACIES = [
    'kaum sana|kalian ini|dasar kalian',
    'nggak usah mikir|dasar goblok|otak kamu',
    'kamu pikir kamu paling',
    'emang kamu siapa',
    'daripada ngomong gitu',
    'ngapain repot|urusan lu',
    'gak penting|nggak penting',
    'dasar pendukung|dasar pembela|dasar fanatik',
    'lu belain terus|kok dibela',
    'cupu|dasar cupu|dasar noob',
    'kamu ngerti nggak sih',
    'ngapain lu baper',
    'alay banget sih',
    'gak usah sok',
    'sok pintar|sok tahu|sok suci',
    'ngomong doang|bisa ngomong doang',
    'mikir pake otak',
    'diem lo|diam lo',
    'ngerti dikit aja',
    'edukasi dong',
    'sana belajar dulu',
]

const userMessageHistory = new Map()

function getWarnDb(groupId) {
    if (!db.warnings) db.warnings = {}
    if (!db.warnings[groupId]) db.warnings[groupId] = {}
    return db.warnings[groupId]
}

export function trackMessage(userNum, text) {
    if (!userMessageHistory.has(userNum)) {
        userMessageHistory.set(userNum, [])
    }
    let hist = userMessageHistory.get(userNum)
    hist.push({ text, time: Date.now() })
    if (hist.length > 10) hist.shift()
}

export function checkSpamDuplicate(userNum, text) {
    let hist = userMessageHistory.get(userNum)
    if (!hist || hist.length < 3) return false
    let recent = hist.slice(-3)
    let uniqueTexts = new Set(recent.map(h => h.text.trim().toLowerCase()))
    return uniqueTexts.size === 1
}

export function checkRapidFire(userNum) {
    let hist = userMessageHistory.get(userNum)
    if (!hist || hist.length < 5) return false
    let recent = hist.slice(-5)
    let timeWindow = recent[recent.length - 1].time - recent[0].time
    return timeWindow < 1000
}

function normalizeText(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

function checkVulgar(text) {
    let lower = text.toLowerCase()
    let cleaned = lower.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
    let tokens = cleaned.split(/\s+/)
    for (let word of VULGAR) {
        let base = word.toLowerCase()
        if (tokens.some(t => t === base)) return true
        if (tokens.some(t => t.replace(/[0-9]/g, '') === base)) return true
    }
    return false
}

function checkPhishing(text) {
    for (let pattern of PHISHING) {
        let regex = new RegExp(pattern, 'i')
        if (regex.test(text)) return true
    }
    return false
}

function checkChain(text) {
    let lower = text.toLowerCase()
    for (let phrase of CHAIN) {
        if (lower.includes(phrase)) return true
    }
    return false
}

function checkPromo(text) {
    let lower = text.toLowerCase()
    let promoCount = 0
    for (let word of VULGAR_PROMO) {
        let idx = lower.indexOf(word)
        if (idx !== -1) {
            promoCount++
            if (promoCount >= 2) return true
        }
    }
    return false
}

function checkFallacy(text) {
    let lower = text.toLowerCase()
    for (let pattern of LOGICAL_FALLACIES) {
        let regex = new RegExp(pattern, 'i')
        if (regex.test(lower)) return true
    }
    return false
}

function checkSpam(text) {
    let lower = text
    if (/([A-Za-z0-9])\1{15,}/.test(lower)) return true
    if (/\b(?:grub|gup|grop|grp|grup|group)\s*(?:wa|whatsapp|telegram|line|discord)\b/i.test(lower)) return true
    if ((text.match(/#/g) || []).length > 10) return true
    if ((text.match(/[\u{1F000}-\u{1FFFF}]/gu) || []).length > 20) return true
    return false
}

export function checkMessage(text, userNum) {
    if (!text || !text.trim()) return null

    trackMessage(userNum, text)

    let reasons = []

    if (checkVulgar(text)) reasons.push('Kata kasar')
    if (checkPhishing(text)) reasons.push('Link mencurigakan / phising')
    if (checkChain(text)) reasons.push('Pesan berantai')
    if (checkPromo(text)) reasons.push('Promosi tidak pantas')
    if (checkFallacy(text)) reasons.push('Logical fallacy / Serangan pribadi')
    if (checkSpam(text)) reasons.push('Spam')
    if (checkSpamDuplicate(userNum, text)) {
        let r = 'Spam (pesan duplikat)'
        if (!reasons.includes(r)) reasons.push(r)
    }
    if (checkRapidFire(userNum)) {
        let r = 'Spam (ngebut)'
        if (!reasons.includes(r)) reasons.push(r)
    }

    return reasons.length > 0 ? reasons : null
}

export function getWarningCount(groupId, userNum) {
    let warnData = getWarnDb(groupId)
    return warnData[userNum]?.count || 0
}

export function incrementWarning(groupId, userNum, reasons) {
    let warnData = getWarnDb(groupId)
    if (!warnData[userNum]) {
        warnData[userNum] = { count: 0, reasons: [], lastTime: 0 }
    }
    warnData[userNum].count++
    warnData[userNum].reasons.push(...reasons)
    warnData[userNum].lastTime = Date.now()
    return warnData[userNum].count
}

export function resetWarnings(groupId, userNum) {
    if (db.warnings && db.warnings[groupId]) {
        delete db.warnings[groupId][userNum]
    }
}
