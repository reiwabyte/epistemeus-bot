import axios from 'axios'
import vm from 'node:vm'

function buildForm(url) {
    const body = new URLSearchParams()
    body.append('sf_url', encodeURI(url))
    body.append('sf_submit', '')
    body.append('new', '2')
    body.append('lang', 'id')
    body.append('app', '')
    body.append('country', 'id')
    body.append('os', 'Windows')
    body.append('browser', 'Chrome')
    body.append('channel', ' main')
    body.append('sf-nomad', '1')
    return body
}

async function savefromFetch(url) {
    const body = buildForm(url)
    const { data } = await axios.post('https://worker.sf-tools.com/savefrom.php', body.toString(), {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            origin: 'https://id.savefrom.net',
            referer: 'https://id.savefrom.net/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36'
        },
        timeout: 30000
    })

    const exec = '[]["filter"]["constructor"](b).call(a);'
    const patched = data.replace(exec, `\ntry {\ni++;\nif (i === 2) scriptResult = ${exec.split('.call')[0]}.toString();\nelse (\n${exec.replace(/;/, '')}\n);\n} catch {}`)

    const context = { scriptResult: '', i: 0 }
    vm.createContext(context)
    new vm.Script(patched).runInContext(context)

    const match = context.scriptResult.match(/window\.parent\.sf\.videoResult\.show\((.*?)\);/)
    return match ? JSON.parse(match[1]) : null
}

export async function savefromDl(url, platform) {
    const result = await savefromFetch(url)
    if (!result) throw new Error('Gagal mendapatkan data dari savefrom')

    const urls = []
    if (result.urls) {
        for (const key of Object.keys(result.urls)) {
            const item = result.urls[key]
            if (typeof item === 'string') urls.push(item)
            else if (item?.url) urls.push(item.url)
        }
    }
    if (result.url) urls.push(result.url)

    return {
        title: result.title || `${platform} Video`,
        thumbnail: result.picture || result.thumb || '',
        duration: result.duration || '',
        urls: urls.filter(Boolean),
        source: platform,
        sd: result.url_sd || null,
        hd: result.url_hd || null
    }
}
