export default async (clients, m, { isGroup }) => {
    let groupName = 'Epistemeia'
    if (isGroup) {
        let meta = await clients.groupMetadata(m.chat).catch(() => null)
        if (meta?.subject) groupName = meta.subject
    }
    let opening = `Halo! Sebelumnya kami mengucapkan terimakasih telah meminta bergabung ke grup ${groupName}.

Kami perlu melakukan proses perkenalan singkat. Silakan jawab pertanyaan berikut satu per satu.

1. Nama / Nama Panggilan / Nama Samaran:`
    await clients.sendMessage(m.chat, {
        text: opening,
        contextInfo: { externalAdReply: AD_REPLY }
    })

    pendingVerification.set(m.sender.split('@')[0], {
        groupJid: m.chat,
        status: 'waiting_answer',
        step: 0,
        answers: [],
        timestamp: Date.now(),
        isTest: true
    })
}
