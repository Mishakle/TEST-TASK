const passwordValidation = (password) => {
    if (password.length > 8 && upperCaseCheck(password) && lowerCaseCheck(password) && numberCheck(password)) {
        return true;
    } else {
        return false;
    }
}

function upperCaseCheck(password) {
    const upperCaseLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    for (const character of password) {
        if (upperCaseLetters.includes(character)) {
            return true;
        }
    }
    return false;
}

function lowerCaseCheck(password) {
    const lowerCaseLetters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
    for (const character of password) {
        if (lowerCaseLetters.includes(character)) {
            return true;
        }
    }
    return false;
}

function numberCheck(password) {
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (const character of password) {
        if (numbers.includes(character)) {
          return true;
        }
    }
    return false;
}

module.exports = passwordValidation;