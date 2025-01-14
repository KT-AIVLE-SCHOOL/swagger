const bcrypt = require('bcryptjs');

exports.hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    return password;
}

exports.comparePass = async (plain, hash) => {
    const compareResult = await bcrypt.compare(plain, hash);
    return compareResult;
}