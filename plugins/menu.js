export default async (clients, m, { isOwner }) => {
    let ad = { ...AD_REPLY, thumbnail: global.MENU_THUMB, renderLargerThumbnail: true, mediaUrl: process.env.THUMB_URL || 'https://files.covenant.sbs/bc5d34c2-ca8d-4c94-a69c-1e48d0ded206.jpeg' }

    if (!isOwner) {
        await clients.sendMessage(m.chat, {
            text: '*Epistemeia Bot - Menu Publik*',
            footer: 'Pilih perintah di bawah',
            title: 'Menu Publik',
            buttonText: 'Buka Menu',
            sections: [
                {
                    title: 'Formulir Pendaftaran',
                    rows: [
                        { title: '.test', rowId: '.test', description: 'Simulasi formulir pendaftaran' },
                        { title: '.cancel', rowId: '.cancel', description: 'Batalkan proses formulir' }
                    ]
                },
                {
                    title: 'Lainnya',
                    rows: [
                        { title: '.menu', rowId: '.menu', description: 'Tampilkan menu ini' }
                    ]
                }
            ],
            contextInfo: { externalAdReply: ad }
        })
        return
    }

    let aiStatus = process.env.GEMINI_ENABLE === 'true' ? 'Aktif' : 'Nonaktif'
    let stealthStatus = set.stealth ? 'AKTIF' : 'Nonaktif'

    await clients.sendMessage(m.chat, {
        text: `*Epistemeia Bot - Panel Admin*\nAI: ${aiStatus} | Stealth: ${stealthStatus}`,
        footer: 'Ketik manual jika ada parameter (reply/mention)',
        title: 'Panel Admin',
        buttonText: 'Buka Menu',
        sections: [
            {
                title: 'Formulir Pendaftaran',
                rows: [
                    { title: '.test', rowId: '.test', description: 'Simulasi formulir' },
                    { title: '.cancel', rowId: '.cancel', description: 'Batalkan formulir' },
                    { title: '.cekpending', rowId: '.cekpending', description: 'Lihat pendaftar tertunda' },
                    { title: '.approve', rowId: '.approve', description: 'Setujui pendaftar' },
                    { title: '.reject', rowId: '.reject', description: 'Tolak pendaftar' }
                ]
            },
            {
                title: 'Manajemen Grup',
                rows: [
                    { title: '.setgroup', rowId: '.setgroup', description: 'Daftarkan grup ini' },
                    { title: '.delgroup', rowId: '.delgroup', description: 'Hapus grup dari daftar' },
                    { title: '.listgroups', rowId: '.listgroups', description: 'Lihat grup terdaftar' }
                ]
            },
            {
                title: 'Moderasi Anggota',
                rows: [
                    { title: '.warn', rowId: '.warn', description: 'Beri peringatan' },
                    { title: '.kick', rowId: '.kick', description: 'Keluarkan anggota' },
                    { title: '.ban', rowId: '.ban', description: 'Blokir permanen' },
                    { title: '.unban', rowId: '.unban', description: 'Buka blokir' },
                    { title: '.warns', rowId: '.warns', description: 'Lihat daftar blokir' }
                ]
            },
            {
                title: 'Mode Bot',
                rows: [
                    { title: '.self', rowId: '.self', description: 'Mode sendiri (owner only)' },
                    { title: '.public', rowId: '.public', description: 'Mode publik' },
                    { title: '.stealth', rowId: '.stealth', description: 'Sembunyikan menu admin' },
                    { title: '.menu', rowId: '.menu', description: 'Tampilkan menu ini' }
                ]
            }
        ],
        contextInfo: { externalAdReply: ad }
    })
}
