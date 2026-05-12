import sharp from 'sharp'
import { removeBackground } from '@imgly/background-removal-node'

export async function removeBg(buffer) {
    const png = await sharp(buffer).png().toBuffer()
    const blob = new Blob([png], { type: 'image/png' })
    const result = await removeBackground(blob)
    const ab = await result.arrayBuffer()
    return Buffer.from(ab)
}
