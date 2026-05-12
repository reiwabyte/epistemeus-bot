export function eBinary(str = '') {
    return str.split('').map(char => char.charCodeAt(0).toString(2)).join(' ')
}

export function dBinary(str) {
    return str.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('')
}
