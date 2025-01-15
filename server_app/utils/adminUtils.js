const db = require('../db/db_utils');
const hutils = require('./hashUtils');
const jwtUtils = require('./jwtUtils');

exports.createAdmin = async () => {

    const password = hutils.hashPassword(process.env.ADMIN_PASS);
    const accessToken = jwtUtils.generateToken(process.env.ADMIN_ID);
    await db.insertAdminInfo({adminId: process.env.ADMIN_ID, password: password, accessToken: accessToken});
    return true;
}