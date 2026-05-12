import fs from 'fs'
import os from 'os'
import { execSync } from 'child_process'

const clockString = (ms) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

const formatBytes = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

export default async (clients, m, { isOwner, isGroup }) => {
    if (!isOwner) return

    let totalMem = os.totalmem()
    let freeMem = os.freemem()
    let usedMem = totalMem - freeMem
    let cpuModel = os.cpus()[0]?.model || '-'
    let cpuCores = os.cpus().length
    let disk = ''
    try {
        let df = execSync('df -h /', { encoding: 'utf8' }).trim().split('\n')
        let parts = df[1].split(/\s+/)
        disk = parts[2] + ' / ' + parts[1] + ' (' + parts[4] + ')'
    } catch { disk = '-' }

    let teks = ''
    teks += 'Selamat Datang\n'
    teks += 'Halo ' + (m.pushName || m.sender.split('@')[0]) + '\n'
    teks += '\n'
    teks += 'Informasi Bot:\n'
    teks += 'Runtime : ' + clockString(process.uptime() * 1000) + '\n'
    teks += 'Node.js : ' + process.version + '\n'
    teks += 'Platform: ' + process.platform + '\n'
    teks += 'RAM : ' + formatBytes(usedMem) + ' / ' + formatBytes(totalMem) + '\n'
    teks += 'CPU : ' + cpuModel + ' (' + cpuCores + ' core)\n'
    teks += 'Disk : ' + disk + '\n'
    teks += '\n'
    teks += 'Waktu:\n'
    teks += new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '\n'
    teks += new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })

    let img
    try { img = fs.readFileSync(process.cwd() + '/media/menu.jpeg') } catch { img = null }

    await clients.sendMessage(m.chat, {
        text: teks,
        contextInfo: {
            externalAdReply: {
                title: 'Epistemeus Bot',
                body: 'Forum Diskusi Ilmiah',
                mediaType: 1,
                thumbnail: img || undefined,
                showAdAttribution: false,
                renderLargerThumbnail: true
            }
        }
    })

    await clients.sendMessage(m.chat, {
        interactiveMessage: {
            title: 'Pilih menu:',
            footer: 'Epistemeus Bot',
            header: 'MENU',
            buttons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: 'Menu',
                        sections: [
                            {
                                title: 'Manajemen Grup',
                                rows: [
                                    { title: 'Daftarkan Grup', id: '.setgroup', description: isGroup ? 'Daftarkan grup ini' : 'Pilih grup untuk didaftarkan' },
                                    { title: 'Hapus Grup', id: '.delgroup', description: isGroup ? 'Hapus grup dari daftar' : 'Pilih grup untuk dihapus' },
                                    { title: 'Lihat Grup', id: '.listgroups', description: 'Lihat grup terdaftar' }
                                ]
                            },
                            {
                                title: 'Mode',
                                rows: [
                                    { title: 'Mode Sendiri', id: '.self', description: 'Hanya owner' },
                                    { title: 'Mode Publik', id: '.public', description: 'Semua orang' }
                                ]
                            },
                            {
                                title: 'Moderasi & Log',
                                rows: [
                                    { title: 'Cek Peringatan', id: '.warns', description: 'Lihat peringatan member' },
                                    { title: 'Daftar Blokir', id: '.banlist', description: 'Lihat user yg dibanned' },
                                    { title: 'Cek Proses', id: '.cekpending', description: 'Lihat formulir tertunda' },
                                    { title: 'Cek Riwayat', id: '.log', description: 'Lihat riwayat approve/reject' }
                                ]
                            },
                            {
                                title: 'Fitur Grup',
                                rows: [
                                    { title: 'Group Menu', id: '.groupmenu', description: 'Lihat daftar fitur grup' }
                                ]
                            },
                            {
                                title: 'Download',
                                rows: [
                                    { title: 'Download Menu', id: '.downloadmenu', description: 'Lihat daftar download' }
                                ]
                            }
                        ]
                    })
                }
            ]
        }
    })
}
