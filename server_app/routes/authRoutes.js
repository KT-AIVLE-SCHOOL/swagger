const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const jwt = require('../utils/jwtUtils');

router.use(express.json());
router.use(express.urlencoded({extended: true}));
router.use(cookieParser());

router.get('/login', (req, res) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    
    if (!accessToken || !refreshToken) {
        return res.status(400).json({success: false, message: "불량 토큰"});
    }

    try {
        const accessResult = jwt.verifyToken(accessToken);
        if (accessResult) {
            return res.json({success: true});
        }

        const refreshResult = jwt.verifyToken(refreshToken);
        if (refreshResult) {
            const newAccessToken = jwt.generateToken(refreshResult.email);
            return res.status(403).json({success: false, message: "토큰 교환", accessToken: newAccessToken});
        }
        return res.status(401).json({success: false, message: "토큰 기한 초과"});
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
});

router.post('/register', (req, res) => {
    const { username, childname, email, password, method } = req.body;

    if (!email || !password) {
        return res.status(400).json({success: false, message: "불량 값"});
    }

    if (method !== 0 && method !== 1) {
        return res.status(400).json({success: false, message: "유효하지 않은 로그인 수단"});
    }

    try {
        const { accessToken, refreshToken } = jwt.generateToken(email);
        return res.json({success: true, accessToken: accessToken, refreshToken: refreshToken});
    } catch (error) {
        console.error('Token generation error:', error);
        return res.status(500).json({message: "Internal server error"});
    }
});

module.exports = router;