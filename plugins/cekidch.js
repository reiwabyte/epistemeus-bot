export default async (clients, m) => {
  let targetId = m.chat
  let label = 'Chat'

  if (targetId.endsWith('@newsletter')) {
    label = 'Newsletter / Saluran'
  } else if (m.quoted) {
    const sender = m.quoted.sender || m.quoted.key?.participant || m.quoted.key?.remoteJid
    if (sender?.endsWith('@newsletter') || targetId.endsWith('@newsletter')) {
      targetId = sender || targetId
      label = 'Newsletter / Saluran'
    }
  }

  let text = `*${label} ID*\n\n${targetId}`

  const content = {
    interactiveMessage: {
      title: text,
      footer: 'Epistemeus Bot',
      buttons: [
        {
          name: 'cta_copy',
          buttonParamsJson: JSON.stringify({ display_text: 'Copy ID', copy_code: targetId })
        }
      ]
    }
  }

  try {
    await clients.sendMessage(m.chat, content)
  } catch {
    await m.reply(text)
  }
}
