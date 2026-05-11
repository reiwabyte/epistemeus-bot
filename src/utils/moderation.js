const BAD_WORDS = [
    'anjing', 'anjink', 'anjg', 'anj', 'babi', 'bangsat', 'kontol', 'kontil',
    'memek', 'memeq', 'mmk', 'ngentot', 'entot', 'tolol', 'goblok', 'goblk',
    'bodoh', 'idiot', 'brengsek', 'kampret', 'asu', 'setan', 'iblis', 'perek',
    'lonte', 'pelacur', 'bajingan', 'tai', 'anying', 'keparat', 'bejat',
    'jancok', 'jancuk', 'dancok', 'pantek', 'pantat', 'pepek', 'sial', 'sialan',
    'bego', 'monyet', 'bacot', 'bebal', 'beloon', 'bloon', 'budug', 'cebong',
    'cupu', 'dungu', 'gembel', 'gila', 'edan', 'jablay', 'jalang', 'jamet',
    'jembut', 'kacung', 'kampang', 'kehed', 'kenthir', 'kolor', 'kunyuk',
    'kupret', 'maho', 'ngehe', 'ngewe', 'nyampah', 'peler', 'pukimak', 'kimak',
    'sampah', 'sange', 'sarap', 'sempak', 'sinting', 'sontoloyo', 'tengil',
    'toket', 'udik', 'ndasmu', 'matamu', 'kenthu', 'budeg', 'kere', 'lacur',
    'congor', 'dongo', 'jamban', 'kafir', 'koplak', 'ngawur', 'perjaka',
    'porno', 'porn', 'sundal', 'sundel', 'sodomi', 'perkosa', 'sperma',
    'retard', 'ngacung', 'nano', 'ntot', 'anjrot', 'asw', 'kntl', 'mmk',
    'pukimak', 'jancok', 'titit', 'tete', 'ngawi', 'nyolot', 'otong',
    'palak', 'pecun', 'pejuh', 'pelor', 'pene', 'picek', 'pitek', 'raper',
    'sakau', 'santet', 'setubuhi', 'silit', 'sinting', 'sirik', 'taik',
    'tai', 'tumal', 'bencong', 'banci', 'waria', 'homo', 'lesbi', 'bispak',
    'kontol', 'pepek', 'ngentot', 'coli', 'onani', 'masturbasi', 'ngefk',
    'ngefb', 'ngefl', 'bokep', 'skandal'
]

const PHISHING_DOMAINS = [
    'bit.ly', 'tinyurl.com', 'shorturl.at', 'tiny.cc', 'shorte.st',
    'adf.ly', 'shortlink', 'bitly.com', 'rebrandly', 'buff.ly',
    'goo.gl', 'ow.ly', 'is.gd', 'cli.gs', 'pic.gd',
    'bl.ink', 'tr.im', 'v.gd', 'shortcm.xyz',
]

function hasBadWords(text) {
    if (!text) return false
    let lower = text.toLowerCase()
    return BAD_WORDS.some(word => {
        let regex = new RegExp('\\b' + word + '\\b', 'i')
        return regex.test(lower)
    })
}

function hasPhishingLink(text) {
    if (!text) return false
    let urlRegex = /https?:\/\/([^\s/$.?#].[^\s]*)/gi
    let match
    while ((match = urlRegex.exec(text)) !== null) {
        let url = match[0].toLowerCase()
        if (PHISHING_DOMAINS.some(domain => url.includes(domain))) return true
        if (url.includes('login') || url.includes('verify') || url.includes('secure'))
            if (url.includes('whatsapp') || url.includes('facebook') || url.includes('instagram') || url.includes('google'))
                return true
    }
    return false
}

function isChainMessage(text) {
    if (!text) return false
    let lower = text.toLowerCase()
    let chainPatterns = [
        /bagikan\s+ke\s+\d+/i,
        /forward\s+ke\s+\d+/i,
        /jangan\s+dihapus/i,
        /kalau\s+kamu\s+percaya/i,
        /teruskan\s+ke/i,
        /dapat\s+hadiah/i,
        /menang\s+undian/i,
        /klaim\s+hadiah/i,
        /bagikan\s+pesan\s+ini/i,
    ]
    return chainPatterns.some(p => p.test(lower))
}

function isSpam(text, userHistory) {
    if (!text) return false
    if (!userHistory || userHistory.length < 3) return false
    let recent = userHistory.slice(-5)
    let sameCount = recent.filter(m => {
        if (!m) return false
        let ratio = similarity(m.toLowerCase(), text.toLowerCase())
        return ratio > 0.8
    }).length
    return sameCount >= 3
}

function isVulgarPromotion(text) {
    if (!text) return false
    let lower = text.toLowerCase()
    let promoPatterns = [
        /jual\s+(?=.*(?:murah|diskon|promo))/i,
        /pinjaman\s+(?:online|cepat|tanpa\s+jaminan)/i,
        /investasi\s+(?:bodong|ilegal|cepat\s+kaya)/i,
        /member\s+(?:get\s+member|get\s+rich)/i,
        /bisnis\s+(?:online|digital)\s+(?:tanpa\s+modal|cepat\s+kaya)/i,
        /link\s+ajaib/i,
        /dana\s+(?:cepat|cair)/i,
        /transaksi\s+(?:dari|via)\s+(?:dana|ovo|gopay)/i,
        /naked|telanjang|bugil|vcs|call\s+sex/i,
    ]
    return promoPatterns.some(p => p.test(lower))
}

function similarity(s1, s2) {
    if (s1.length === 0 || s2.length === 0) return 0
    let longer = s1.length > s2.length ? s1 : s2
    let shorter = s1.length > s2.length ? s2 : s1
    let longerLen = longer.length
    if (longerLen === 0) return 1.0
    let cost = []
    for (let i = 0; i <= shorter.length; i++) cost[i] = i
    for (let i = 1; i <= shorter.length; i++) {
        let prev = i
        for (let j = 1; j <= longer.length; j++) {
            let val = longer[j - 1] === shorter[i - 1] ? cost[j - 1] : Math.min(
                Math.min(cost[j] + 1, prev + 1),
                cost[j - 1] + 1
            )
            cost[j - 1] = prev
            prev = val
        }
        cost[longer.length] = prev
    }
    return 1 - cost[shorter.length] / longerLen
}

export function checkMessage(text, userHistory) {
    let reasons = []
    if (hasBadWords(text)) reasons.push('kata kasar')
    if (hasPhishingLink(text)) reasons.push('link phising')
    if (isChainMessage(text)) reasons.push('pesan berantai')
    if (isSpam(text, userHistory)) reasons.push('spam')
    if (isVulgarPromotion(text)) reasons.push('promosi vulgar')
    return reasons.length > 0 ? reasons : null
}
