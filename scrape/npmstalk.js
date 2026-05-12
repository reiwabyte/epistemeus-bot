import axios from 'axios'

export async function npmstalk(packageName) {
    const { data } = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`)
    const versions = data.versions
    const allver = Object.keys(versions)
    const verLatest = allver[allver.length - 1]
    const verPublish = allver[0]
    const packageLatest = versions[verLatest]

    return {
        name: packageName,
        versionLatest: verLatest,
        versionPublish: verPublish,
        versionUpdate: allver.length,
        latestDependencies: Object.keys(packageLatest.dependencies || {}).length,
        publishDependencies: Object.keys((versions[verPublish].dependencies) || {}).length,
        publishTime: data.time.created,
        latestPublishTime: data.time[verLatest]
    }
}