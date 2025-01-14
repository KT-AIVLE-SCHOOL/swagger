const bcrypt = require('bcryptjs');
const hutils = require('../../utils/hashUtils');

exports.hashPasswordToPost = async (req, res, next) => {
    if (req.body.password) {
        try {
            req.body.password = await hutils.hashPassword(req.body.password);
        } catch (error) {
            return res.status(500).json({success: false, message: "내부 서버 오류"});
        }
    }
    next();
}