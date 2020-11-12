const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+\'";,.|';

module.exports = (password) => {
    if (password.length < 8) {
        return false;
    }
    let containsNumber = false;
    let containsSymbol = false;

    for (const character of password) {
        if (NUMBERS.include(character)) {
            containsNumber = true;
        }
        if (SYMBOLS.include(character)) {
            containsSymbol = true;
        }
    }
    return containsNumber && containsSymbol;
}