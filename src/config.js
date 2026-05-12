import 'dotenv/config'
import * as bail from 'ourin-baileys'
import chalk from 'chalk'
import logger from './utils/logger.js'
import { db, reload, saveDb } from './utils/database.js'

let ownerNumbers = ['6283891882373']

global.owner = {
    no: ownerNumbers,
    name: 'Owner'
}

global.set = {
    prefix: ['.'],
    self: false
}

global.pair = {
    no: '6283891882373',
    isPair: true,
    sesi: 'session'
}

global.db = db
global.grup = db
global.logger = logger

global.pendingVerification = new Map()

global.bail = bail
global.chalk = chalk
global.start = Date.now()

global.reloadDb = reload
global.saveDb = saveDb

global.AD_REPLY = {
    title: 'Epistemeia',
    body: 'Forum Diskusi Ilmiah',
    showAdAttribution: false
}
