import axios from 'axios'

export async function lirikSearch(title) {
    if (!title) throw new Error('Judul tidak boleh kosong')

    const { data } = await axios.get(`https://lrclib.net/api/search?q=${encodeURIComponent(title)}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
    })

    if (!data || !data[0]) throw new Error('Lirik tidak ditemukan')

    const song = data[0]
    const lyricsRaw = song.plainLyrics || song.syncedLyrics
    if (!lyricsRaw) throw new Error('Lirik tidak tersedia')

    const cleanLyrics = lyricsRaw.replace(/\[.*?\]/g, '').trim()

    return {
        trackName: song.trackName,
        artistName: song.artistName,
        albumName: song.albumName,
        duration: song.duration,
        lyrics: cleanLyrics
    }
}