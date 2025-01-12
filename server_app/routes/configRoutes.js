const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const jwt = require('../utils/jwtUtils');

router.use(express.json());
router.use(express.urlencoded({extended: true}));
router.use(cookieParser());

router.get('/getSettingInfo', (req, res) => {
    const accessToken = req.cookies.accessToken;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 accessToken 존재 여부 확인
            // accessToken을 동일한 정보를 찾았을 경우, 정보를 넘겨준다
            res.setHeader('settingInfo', JSON.stringify({alarm: true, babyName: "abc", babyBirth: "2023-01-01", dataEliminateDuration: 15, coreTimeStart: 13, coreTimeEnd: 17}));
            return res.json({success: true});
        } else {
            return res.json({success: false, message: "유효하지 않은 접근수단"});
        }
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.post('/setSettingInfo', (req, res) => {
    const {accessToken, alarm, babyName, babyBirth, dataEliminateDuration, coreTimeStart, coreTimeEnd} = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 accessToken 존재 여부 확인
            // accessToken을 동일한 정보를 찾았을 경우, body를 통해 받은 설정 정보를 DB에 저장
            return res.json({success: true});
        } else {
            return res.json({success: false, message: "유효하지 않은 접근수단"});
        }
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});


router.post('/logout', (req, res) => {
    const { accessToken } = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 해당 토큰 존재 여부 확인
            // DB에서 accessToken 항목 비우기
            return res.json({success: true});
        }
        return res.status(400).json({success: false, message: "유효하지 않은 로그아웃 수단입니다"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류입니다"});
    }
});

router.post('/deleteUser', (req, res) => {
    const { accessToken } = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 해당 토큰 존재 여부 확인
            // DB에서 회원 삭제
            return res.json({success: true});
        }
        return res.status(400).json({success: false, message: "유효하지 않은 회원탈퇴 수단입니다"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류입니다"});
    }
});

router.get('/getProfileImage', (req, res) => {
    const accessToken = req.cookies.accessToekn;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 해당 토큰 존재 여부 확인
            // DB에서 이미지 불러오기
            return res.json({success: true, profileImage: null});
        }
        return res.status(400).json({success: false, message: "유효하지 않은 인증수단"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.post('/setProfileImage', (req, res) => {
    const {accessToken, profileImage} = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 해당 토큰 존재 여부 확인
            // DB에 이미지 저장
            return res.json({success: true, profileImage: null});
        }
        return res.status(400).json({success: false, message: "유효하지 않은 인증수단"})
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
})

module.exports = router;