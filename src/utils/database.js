import { readFileSync, writeFileSync, existsSync } from 'fs'

const DB_PATH = 'database.json'

function load() {
    if (!existsSync(DB_PATH)) {
        let initial = { groups: [], banned: [], warnings: {}, history: [] }
        writeFileSync(DB_PATH, JSON.stringify(initial, null, 2))
        return initial
    }
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
}

function save(data) {
    writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

export let db = load()

export function reload() {
    db = load()
}

export function saveDb() {
    save(db)
}
