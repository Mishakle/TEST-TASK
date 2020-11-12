const emailValidation = (email) => {
    if (!letterCheck(email)) {
        return false;
    }
    if (!russianCheck(email)) {
        return false;
    }
    if (!dogCheck(email)) {
        return false;
    }
    return true;
}

function letterCheck(user) {
    if (user === '') {
        return false;
    }
    return true;
}

function russianCheck(word) {
    const whiteList = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2','3', '4', '5', '6', '7', '8', '9', '-', '_', '@', '.'];
    for (const character of word) {
        if (!whiteList.includes(character.toLowerCase())) {
            return false;
        }
    }
    return true;
}

function dogCheck(mailText) {
    let dog = 0;
    for (const character of mailText) {
        if (character === '@') {
            dog++;
        }
    }
    return dog === 1 ? true : false;
}

module.exports = emailValidation;