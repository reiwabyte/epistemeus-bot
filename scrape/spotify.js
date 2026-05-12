import axios from 'axios'

const client_id = 'eafbc7b558274975be58df0026f22260'
const client_secret = '79f20d1353954c968fda33a00aba5235'

let tokenCache = { token: null, expiresAt: 0 }

async function getToken() {
    const now = Date.now()
    if (tokenCache.token && now < tokenCache.expiresAt) return tokenCache.token
    const basic = Buffer.from(client_id + ':' + client_secret).toString('base64')
    const { data } = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
        headers: { Authorization: 'Basic ' + basic, 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 20000
    })
    if (!data?.access_token) throw new Error('Gagal mendapat token Spotify')
    tokenCache.token = data.access_token
    tokenCache.expiresAt = Date.now() + (Math.max(60, (data.expires_in || 3600) - 60) * 1000)
    return data.access_token
}

function extractId(text) {
    if (!text) return null
    if (/^[a-zA-Z0-9]{22}$/.test(text)) return text
    let m = text.match(/track\/([a-zA-Z0-9]{22})/)
    return m ? m[1] : null
}

function formatDuration(ms) {
    if (!ms) return '-'
    const totalSec = Math.floor(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return min + ':' + String(sec).padStart(2, '0')
}

export async function spotifySearch(query) {
    const token = await getToken()
    const { data } = await axios.get('https://api.spotify.com/v1/search', {
        params: { q: query, type: 'track', limit: 10 },
        headers: { Authorization: 'Bearer ' + token },
        timeout: 20000
    })
    if (!data?.tracks?.items?.length) throw new Error('Lagu tidak ditemukan')
    return data.tracks.items.map(t => ({
        id: t.id,
        title: t.name,
        artist: t.artists?.map(a => a.name).join(', ') || 'Unknown',
        album: t.album?.name || '',
        thumbnail: t.album?.images?.[0]?.url || '',
        duration: formatDuration(t.duration_ms),
        url: t.external_urls?.spotify || 'https://open.spotify.com/track/' + t.id
    }))
}

async function fetchAudio(trackId, title, artist, thumbnail, duration) {
    const headers = {
        origin: 'https://spotdown.org',
        referer: 'https://spotdown.org/',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
    }

    const trackUrl = 'https://open.spotify.com/track/' + trackId
    const { data: details } = await axios.get('https://spotdown.org/api/song-details?url=' + encodeURIComponent(trackUrl), { headers, timeout: 20000 })

    const song = details?.songs?.[0]
    if (!song?.url) throw new Error('Track tidak ditemukan')

    const { data: audio } = await axios.post('https://spotdown.org/api/download', { url: song.url }, { headers, responseType: 'arraybuffer', timeout: 60000 })

    return { title, artist, thumbnail, duration, audioBuffer: Buffer.from(audio) }
}

export async function spotifyDl(url) {
    let trackId = extractId(url)
    if (!trackId) throw new Error('Link Spotify tidak valid')

    const token = await getToken()
    const { data: track } = await axios.get('https://api.spotify.com/v1/tracks/' + trackId, {
        headers: { Authorization: 'Bearer ' + token },
        timeout: 20000
    })

    const title = track?.name || 'Spotify Audio'
    const artist = track?.artists?.map(a => a.name).join(', ') || 'Unknown Artist'
    const thumbnail = track?.album?.images?.[0]?.url || ''
    const duration = formatDuration(track?.duration_ms)

    return fetchAudio(trackId, title, artist, thumbnail, duration)
}

export async function spotifyDlByName(query) {
    const results = await spotifySearch(query)
    const best = results[0]
    return fetchAudio(best.id, best.title, best.artist, best.thumbnail, best.duration)
}
