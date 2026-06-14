const crypto = require('crypto');

const KEY_LENGTH = 64;

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
    return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedPassword) {
    if (!storedPassword.startsWith('scrypt$')) {
        return password === storedPassword;
    }

    const [, salt, expectedHex] = storedPassword.split('$');
    const actual = crypto.scryptSync(password, salt, KEY_LENGTH);
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };
