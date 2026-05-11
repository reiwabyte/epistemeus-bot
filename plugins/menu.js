export default async (clients, m, { isOwner }) => {
    let ad = { ...AD_REPLY, renderLargerThumbnail: true, mediaUrl: process.env.THUMB_URL || 'https://files.covenant.sbs/6e029a06-04b3-413f-8f48-d97440a3a279.jpeg' }

    if (!isOwner) {
        await clients.sendMessage(m.chat, {
            text: 'Pilih perintah di bawah',
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
                                },
                                {
                                    title: 'Lainnya',
                                    rows: [
                                        { title: 'Menu', id: '.menu', description: 'Tampilkan menu ini' }
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

    let aiStatus = process.env.GEMINI_ENABLE === 'true' ? 'Aktif' : 'Nonaktif'
    let stealthStatus = set.stealth ? 'AKTIF' : 'Nonaktif'

    await clients.sendMessage(m.chat, {
        text: `AI: ${aiStatus} | Stealth: ${stealthStatus}\n\nKetik manual jika ada parameter (reply/mention)`,
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
                                title: 'Formulir Pendaftaran',
                                rows: [
                                    { title: 'Test Formulir', id: '.test', description: 'Simulasi formulir' },
                                    { title: 'Batalkan', id: '.cancel', description: 'Batalkan formulir' },
                                    { title: 'Cek Pending', id: '.cekpending', description: 'Lihat pendaftar tertunda' },
                                    { title: 'Setujui', id: '.approve', description: 'Setujui pendaftar' },
                                    { title: 'Tolak', id: '.reject', description: 'Tolak pendaftar' }
                                ]
                            },
                            {
                                title: 'Manajemen Grup',
                                rows: [
                                    { title: 'Daftarkan Grup', id: '.setgroup', description: 'Daftarkan grup ini' },
                                    { title: 'Hapus Grup', id: '.delgroup', description: 'Hapus grup dari daftar' },
                                    { title: 'Lihat Grup', id: '.listgroups', description: 'Lihat grup terdaftar' }
                                ]
                            },
                            {
                                title: 'Moderasi',
                                rows: [
                                    { title: 'Peringatan', id: '.warn', description: 'Beri peringatan anggota' },
                                    { title: 'Keluarkan', id: '.kick', description: 'Keluarkan anggota' },
                                    { title: 'Blokir', id: '.ban', description: 'Blokir permanen' },
                                    { title: 'Buka Blokir', id: '.unban', description: 'Buka blokir' },
                                    { title: 'Daftar Blokir', id: '.warns', description: 'Lihat blokir/peringatan' }
                                ]
                            },
                            {
                                title: 'Mode',
                                rows: [
                                    { title: 'Mode Sendiri', id: '.self', description: 'Hanya owner' },
                                    { title: 'Mode Publik', id: '.public', description: 'Semua orang' },
                                    { title: 'Siluman', id: '.stealth', description: 'Sembunyikan menu admin' },
                                    { title: 'Menu', id: '.menu', description: 'Tampilkan menu ini' }
                                ]
                            }
                        ]
                    })
                }
            ]
        }
    })
}
