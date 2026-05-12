export default async (clients, m, { isOwner, isGroup }) => {
    if (!isOwner) return

    let ad = { ...AD_REPLY }

    let approved = db.history?.filter(h => h.status === 'approved') || []
    let rejected = db.history?.filter(h => h.status === 'rejected') || []
    let recentApproved = approved.slice(-5).reverse()
    let recentRejected = rejected.slice(-5).reverse()

    let grupInfo = ''
    if (isGroup) {
        let isManaged = db.groups?.some(g => g.id === m.chat)
        grupInfo = `\n*Grup ini:* ${isManaged ? 'TERDAFTAR' : 'BELUM TERDAFTAR'}\n`
    }

    let riwayatText = `*Daftar Peserta*${grupInfo}\n\n`
    riwayatText += `*Diterima:*\n`
    if (recentApproved.length) {
        riwayatText += recentApproved.map(h => `${h.name} (${h.number})`).join('\n')
    } else {
        riwayatText += '(kosong)'
    }
    riwayatText += `\n\n*Ditolak:*\n`
    if (recentRejected.length) {
        riwayatText += recentRejected.map(h => `${h.name} (${h.number})`).join('\n')
    } else {
        riwayatText += '(kosong)'
    }

    await clients.sendMessage(m.chat, {
        text: riwayatText,
        contextInfo: { externalAdReply: ad },
        interactiveMessage: {
            title: 'Panel Admin',
            footer: 'Epistemeia Bot',
            header: 'Bot Menu',
            buttons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: 'Panel Admin',
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
                                    { title: 'Cek Proses', id: '.cekpending', description: 'Lihat formulir tertunda' }
                                ]
                            }
                        ]
                    })
                }
            ]
        }
    })
}
