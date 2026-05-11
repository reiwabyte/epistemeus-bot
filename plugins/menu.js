export default async (clients, m, { isOwner }) => {
    let menu = ''

    if (!isOwner) {
        menu = `*Epistemeia Bot - Daftar Fitur*

.test - Simulasi formulir pendaftaran grup
.cancel - Batalkan proses formulir
Ketik pertanyaan apa saja untuk bertanya ke AI`
    } else {
        menu = `*Epistemeia Bot - Panel Admin*

*Formulir Pendaftaran*
.test - Uji coba simulasi formulir
.cancel - Batalkan proses formulir
.cekpending - Lihat daftar pending
.approve @user - Setujui pendaftar
.reject @user - Tolak pendaftar

*Manajemen Grup*
.setgroup - Daftarkan grup ini
.delgroup - Hapus grup dari daftar
.listgroups - Lihat grup terdaftar

*Moderasi*
.warn @user - Beri peringatan
.kick @user - Keluarkan anggota
.ban @user - Blokir anggota permanen
.unban @user - Hapus blokir
.warns - Lihat daftar blokir

*Sistem*
.self - Mode sendiri (hanya owner)
.public - Mode publik
.menu - Tampilkan menu ini`

        if (set.stealth) {
            menu += '\n\nMode siluman sedang AKTIF. Menu disembunyikan dari pengguna biasa.'
        }
    }

    await m.reply(menu)
}
