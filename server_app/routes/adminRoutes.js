const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('../utils/jwtUtils');
const db = require('../db/db_utils');

router.use(cookieParser());
router.use(express.json());
router.use(express.urlencoded({extended: true}));

router.post('/createNotice', async (req, res) => {
    const { accessToken } = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            const value = await db.findByAdmin("accessToken", accessToken);
            if (value !== null)
                return res.json({success: true});
            return res.status(401).json({success: false, message: "권한이 없는 사용자입니다"});
        }
        return res.status(400).json({success: false, message: "유효하지 않은 인증수단"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.post('/updateNotice', async (req, res) => {
    const { accessToken, header, body, footer } = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            const value = await db.findByAdmin("accessToken", accessToken);
            if (value !== null) {
                await db.insertNotice(accessToken, {header: header, body: body, footer: footer});
                return res.json({success: true});
            }
            return res.status(401).json({success: false, message: "권한이 없는 사용자입니다"});
        }
        return res.status(400).json({success: false, message: "유효하지 않은 인증수단"});
    } catch {error} {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.get('/getNoticeList', async (req, res) => {
    try {
        const originList = await db.findNoticeInfo();

        if (originList === null)
            return res.status(404).json({success: false, message: "기록된 공지사항이 없습니다"})

        const reversedList = originList.reverse();
        const sendList = reversedList.map(item => ({
            header: item.header,
            time: writetime,
        }));
        return res.json({success: true, data: sendList});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.get('/readNotice', async (req, res) => {
    const { header, writetime } = req.query;

    try {
        const noticeList = await db.findNoticeInfoByHeader(header, writetime);

        if (noticeList !== null)
            return res.json({success: true, header: noticeList[0].header, body: noticeList[0].body, footer: noticeList[0].footer});
        return res.status(404).json({success: false, message: "내용물이 존재하지 않음"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.post('/deleteNotice', async (req, res) => {
    const { accessToken, header, writetime } = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            const admin = await db.findByAdmin("accessToken", accessToken);

            if (admin !== null) {
                const notice = await db.deleteNoticeInfo(header, writetime);
                return res.json({success: true});
            }
            return res.status(404).json({success: false, message: "존재하지 않는 관리자"});
        }
        return res.status(400).json({success: false, message: "유효하지 않은 인증수단"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});
