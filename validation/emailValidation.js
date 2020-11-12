const WHITELIST_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz0123456789-_@.';

module.exports =  (email) => {
    if (!email) {
        return false;
    }
    for (const character of email) {
        if (!WHITELIST_CHARACTERS.includes(character)) {
            return false;
        }
    }
    const dogCount = email.split('@').length - 1;
    if (dogCount !== 1) {
        return false;
    }
    return true;
}