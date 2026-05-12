import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'

export async function uploadFile(Path) {
    if (!fs.existsSync(Path)) throw new Error('File not Found')

    const form = new FormData()
    form.append('file', fs.createReadStream(Path))

    const { data } = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
        timeout: 60000
    })

    const url = data?.data?.url
    if (!url) throw new Error('Upload gagal')

    const id = url.match(/\/(\w+?)(?:\/|$)/)?.[1]
    if (!id) throw new Error('Gagal parsing URL')
    const filename = Path.split('/').pop()

    return `https://tmpfiles.org/dl/${id}/${filename}`
}
