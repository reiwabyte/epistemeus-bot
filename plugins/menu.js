export default async (clients, m, { isOwner }) => {
    let menu = `*Epistemeia Bot - Daftar Fitur*

*Interview & Join Request*
.test - Simulasi interview
.setgroup - Daftarkan grup untuk join request
.delgroup - Hapus grup dari daftar
.listgroups - Lihat daftar grup terdaftar
.approve @user - Setujui join request
.reject @user - Tolak join request
.cekpending - Lihat pending verification
.cancel - Batalkan proses interview

*Moderasi Grup (otomatis)*
Deteksi: kata kasar, link phising, spam, pesan berantai, promosi vulgar
Mekanisme: Peringatan -> Kick & Ban (3 peringatan)

*Perintah Moderasi*
.warn @user - Beri peringatan manual
.kick @user - Keluarkan anggota
.ban @user - Ban anggota permanen
.unban @user - Hapus ban
.warns - Lihat daftar banned & peringatan

*Mode Bot*
.self - Hanya respon owner
.public - Respon semua orang`

    if (!isOwner) {
        menu = `*Epistemeia Bot - Daftar Fitur*

.test - Simulasi interview grup
.cancel - Batalkan proses interview`
    }

    await m.reply(menu)
}
