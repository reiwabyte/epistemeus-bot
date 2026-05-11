export default async (clients, m, { isOwner }) => {
    let menu = ''
    let aiStatus = process.env.GEMINI_ENABLE === 'true' ? 'Aktif' : 'Nonaktif'

    if (!isOwner) {
        menu = `*Epistemeia Bot - Fitur Publik*

*Formulir Pendaftaran*
.test - Simulasi formulir pendaftaran
.cancel - Batalkan proses formulir

*Lainnya*
.menu - Tampilkan menu ini
AI ${aiStatus} - Ketik pertanyaan untuk bertanya ke AI`
    } else {
        menu = `*Epistemeia Bot - Panel Admin*

*Formulir Pendaftaran*
.test - Simulasi formulir pendaftaran
.cancel - Batalkan proses formulir
.cekpending - Lihat daftar pendaftar tertunda
.approve @user - Setujui permintaan pendaftar
.reject @user - Tolak permintaan pendaftar

*Manajemen Grup*
.setgroup - Daftarkan grup ini sebagai grup terkelola
.delgroup - Hapus grup dari daftar terkelola
.listgroups - Lihat semua grup terdaftar

*Moderasi Anggota*
.warn @user - Beri peringatan ke anggota
.kick @user - Keluarkan anggota dari grup
.ban @user - Blokir anggota (tidak bisa bergabung lagi)
.unban @user - Buka blokir anggota
.warns - Lihat daftar blokir dan peringatan

*Mode Bot*
.self - Mode sendiri (hanya owner)
.public - Mode publik (semua orang)
.stealth - Sembunyikan/tampilkan menu admin publik
.menu - Tampilkan menu ini`

        if (set.stealth) {
            menu += '\n\nMode siluman sedang AKTIF. Menu admin disembunyikan dari pengguna biasa.'
        }
        menu += `\nAI ${aiStatus}`
    }

    await m.reply(menu)
}
