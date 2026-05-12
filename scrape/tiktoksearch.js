import axios from 'axios'

function fixUrl(url) {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `https://tikwm.com${url}`
}

export async function tiktokSearch(keywords, count = 12) {
    if (!keywords) throw new Error('Keywords diperlukan')

    const payload = new URLSearchParams({ keywords, count, cursor: 0, HD: 1 })

    const { data } = await axios.post('https://tikwm.com/api/feed/search', payload.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 20000
    })

    const videos = data?.data?.videos
    if (!videos?.length) throw new Error('Tidak ada video ditemukan')

    return videos.map(v => ({
        id: v.video_id,
        region: v.region,
        title: v.title || 'No Title',
        cover: fixUrl(v.cover),
        duration: v.duration,
        media: {
            no_watermark: fixUrl(v.play),
            watermark: fixUrl(v.wmplay),
            hd_video: fixUrl(v.hdplay),
            music: fixUrl(v.music)
        },
        stats: {
            play_count: v.play_count,
            digg_count: v.digg_count,
            comment_count: v.comment_count,
            share_count: v.share_count
        },
        author: {
            id: v.author.id,
            unique_id: v.author.unique_id,
            nickname: v.author.nickname,
            avatar: fixUrl(v.author.avatar)
        }
    }))
}
