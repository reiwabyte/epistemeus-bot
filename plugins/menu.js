export default async (clients, m, { isOwner, isGroup }) => {
    if (!isGroup) return

    let ad = { ...AD_REPLY }

    if (!isOwner) {
        let isManaged = db.groups?.some(g => g.id === m.chat)
        let status = isManaged ? 'Grup Terdaftar' : 'Grup Belum Terdaftar'

        await clients.sendMessage(m.chat, {
            text: status,
            contextInfo: { externalAdReply: ad },
            interactiveMessage: {
                title: 'Menu Publik',
                footer: 'Epistemeia Bot',
                header: 'Bot Menu',
                buttons: [
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: 'Menu Publik',
                            sections: [
                                {
                                    title: 'Formulir Pendaftaran',
                                    rows: [
                                        { title: 'Batalkan Formulir', id: '.cancel', description: 'Batalkan proses yang berjalan' }
                                    ]
                                }
                            ]
                        })
                    }
                ]
            }
        })
        return
    }

    let approved = db.history?.filter(h => h.status === 'approved') || []
    let rejected = db.history?.filter(h => h.status === 'rejected') || []
    let recentApproved = approved.slice(-5).reverse()
    let recentRejected = rejected.slice(-5).reverse()

    let isManaged = db.groups?.some(g => g.id === m.chat)
    let grupInfo = `\n*Grup ini:* ${isManaged ? 'TERDAFTAR' : 'BELUM TERDAFTAR'}\n`

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
                                    { title: 'Daftarkan Grup', id: '.setgroup', description: 'Daftarkan grup ini' },
                                    { title: 'Hapus Grup', id: '.delgroup', description: 'Hapus grup dari daftar' },
                                    { title: 'Lihat Grup', id: '.listgroups', description: 'Lihat grup terdaftar' }
                                ]
                            },
                            {
                                title: 'Mode',
                                rows: [
                                    { title: 'Mode Sendiri', id: '.self', description: 'Hanya owner' },
                                    { title: 'Mode Publik', id: '.public', description: 'Semua orang' }
                                ]
                            }
                        ]
                    })
                }
            ]
        }
    })
}
