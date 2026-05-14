import fs from 'fs'

export default async (clients, m) => {
  let img
  try { img = fs.readFileSync(process.cwd() + '/media/menu.jpeg') } catch { img = null }

  await clients.sendMessage(m.chat, {
    interactiveMessage: {
      title: 'E P I S T E M E U S',
      footer: 'Forum Diskusi Ilmiah',
      buttons: [
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Download',
            sections: [{
              title: 'Media Downloader',
              rows: [
                { title: 'Play', id: '.play', description: 'Download audio dari YouTube' },
                { title: 'YouTube', id: '.yt', description: 'Download video/audio YouTube' },
                { title: 'Spotify', id: '.spotify', description: 'Download track / lihat playlist' },
                { title: 'TikTok', id: '.tiktok', description: 'Download video TikTok (no WM)' },
                { title: 'Instagram', id: '.ig', description: 'Download postingan Instagram' },
                { title: 'Facebook', id: '.fb', description: 'Download video Facebook' },
                { title: 'Twitter', id: '.twitter', description: 'Download video Twitter/X' },
                { title: 'MediaFire', id: '.mediafire', description: 'Download file MediaFire' }
              ]
            }]
          })
        },
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Journal',
            sections: [{
              title: 'Paper Akademik',
              rows: [
                { title: 'Cari Paper', id: '.jurnal', description: 'Cari paper dari 12 sumber' },
                { title: 'Detail Paper', id: '.paper', description: 'Lihat detail paper via DOI' },
                { title: 'Download PDF', id: '.getpdf', description: 'Download PDF paper via DOI' }
              ]
            }]
          })
        },
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Tools & AI',
            sections: [{
              title: 'Tools & Utility',
              rows: [
                { title: 'Groq AI', id: '.groq', description: 'Tanya AI cepat (Groq)' },
                { title: 'Lirik', id: '.lirik', description: 'Cari lirik lagu' },
                { title: 'NPM Stalk', id: '.npmstalk', description: 'Info package NPM' },
                { title: 'GitHub Stalk', id: '.githubstalk', description: 'Info user GitHub' },
                { title: 'Binary', id: '.binary', description: 'Encode/decode binary' },
                { title: 'Tourl', id: '.tourl', description: 'Upload media ke URL' },
                { title: 'RemoveBG', id: '.removebg', description: 'Hapus background foto' },
                { title: 'HD Video', id: '.hd', description: 'Enhancer kualitas video' },
                { title: 'Cek ID Channel', id: '.cekidch', description: 'Lihat ID channel WhatsApp' }
              ]
            }]
          })
        },
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Group',
            sections: [{
              title: 'Manajemen Grup',
              rows: [
                { title: 'Daftarkan Grup', id: '.setgroup', description: 'Daftarkan grup untuk verifikasi' },
                { title: 'Kustom Soal', id: '.pertanyaangroup', description: 'Atur pertanyaan verifikasi kustom' },
                { title: 'Group Menu', id: '.groupmenu', description: 'Semua fitur grup' }
              ]
            }]
          })
        },
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Owner',
            sections: [{
              title: 'Owner Only',
              rows: [
                { title: 'Owner Menu', id: '.ownermenu', description: 'Semua perintah owner' },
                { title: 'Download Menu', id: '.downloadmenu', description: 'Menu download lengkap' },
                { title: 'Tools Menu', id: '.toolsmenu', description: 'Menu tools lengkap' }
              ]
            }]
          })
        }
      ]
    }
  })
}
