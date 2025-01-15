const express = require('express');
const cookieParser = require('cookie-parser');
const hutils = require('../utils/hashUtils');
const nodemailer = require('nodemailer');
const router = express.Router();
const jwt = require('../utils/jwtUtils');
const chk = require('../utils/checkUtils');
const db = require('../db/db_utils');
const midWare = require('../middleware/auth/passToHash');

router.use(cookieParser());
router.use(express.json());
router.use(express.urlencoded({extended: true}));

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const value = await db.findByValue("email", email);
        const adminValue = await db.findByAdmin("email", email);
        const passwordMatch = await hutils.comparePass(password, value.password);
        const isAdmin = (adminValue !== null) ? true : false;

        if ((value !== null || adminValue !== null) && passwordMatch) {
            const { accessToken, refreshToken } = jwt.generateToken(email);
            if (value !== null)
                await db.updateUserInfo(value.accessToken, {accessToken: accessToken, refreshToken: refreshToken});
            else
                await db.updateAdminInfo(adminValue.accessToken, {accessToken: accessToken});
            return res.json({success: true, admin: isAdmin, accessToken: accessToken, refreshToken: refreshToken});
        }
        return res.status(404).json({success: false, message: "이메일 또는 비밀번호 오류"});
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.get('/socialLoginKakao', async (req, res) => {
    // try {
    //     const { code } = req.query;
    //     const tokenResponse = await axios.post(
    //         "https://kauth.kakao/oauth/token",
    //         null,
    //         {
    //             params: {
    //                 grant_type: "authorization_code",
    //                 client_id: REST_API_KET,
    //                 redirect_uri: REDIRECT_URI,
    //                 code: code,
    //             },
    //             headers: {
    //                 "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    //             },
    //         }
    //     );
    //     const { accessToken } = tokenResponse.data;

    //     const userResponse = await axios.get(
    //         "https://kapi.kakao.com/v2/user/me", {
    //             headers: {
    //                 Authorization: `Bearer ${accessToken}`,
    //                 "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    //             },
    //     });

    //     const userData = userResponse.data;

    //     return res.json({success: true, user: userData.data});
    // } catch (error) {
    //     return res.status(500).json({success: false, message: "내부 서버 오류"});
    // }
});

router.get('/socialLoginNaver', async (req, res) => {

});

router.post('/register', midWare.hashPasswordToPost, async (req, res) => {
    const { username, email, password, method } = req.body;

    if (!email || !password) {
        return res.status(400).json({success: false, message: "불량 값"});
    }

    if (method !== 0 && method !== 1) {
        return res.status(400).json({success: false, message: "유효하지 않은 로그인 수단"});
    }

    try {
        // DB에 동일한 이메일 존재 확인 필요
        const value = await db.findByValue("email", email);
        if (value === null) {
            const { accessToken, refreshToken } = jwt.generateToken(email);
            await db.insertUserInfo({username: username, email: email, password: password, method: method, accessToken: accessToken, refreshToken: refreshToken, aliasname: null, profileimage: null});
            await db.insertConfigInfo(accessToken, {alarm: false, dataeliminateduration: 10, coretimestart: 9, coretimeend: 18});
            await db.insertBabyInfo(accessToken, {babyname: "입력해주세요", babybirth: "1990-01-01"});
            return res.json({success: true, accessToken: accessToken, refreshToken: refreshToken});
        }
        return res.status(400).json({success: false, message: "이미 가입한 회원입니다"});
    } catch (error) {
        console.error('Token generation error:', error);
        return res.status(500).json({message: "Internal server error"});
    }
});

router.post('/checkEmail', (req, res) => {
    const email = req.body.email;

    try {
        if (chk.checkEmail(email))
            return res.json({success: true});
        return res.status(400).json({success: false, message: "이메일 양식에 맞지 않음"});
    } catch (error) {
        return res.json({success: false, message: "Internal Server Error"});
    }
});

router.post('/checkPass', (req, res) => {
    const password = req.body.password;
    const comb = chk.checkPass(password);

    try {
        if (!comb)
            return res.json({success: true});
        if (comb == 1)
            return res.status(400).json({success: false, checkCharacters: true, checkPassLen: false, message: "양식에 맞지 않는 비밀번호입니다"});
        if (comb == 2)
            return res.status(400).json({success: false, checkCharacters: false, checkPassLen: true, message: "양식에 맞지 않는 비밀번호입니다"});
        return res.status(400).json({success: false, checkCharacters: false, checkPassLen: false, message: "양식에 맞지 않는 비밀번호입니다"});
    } catch (error) {
        return res.status(500).json({success: false, message: "Internal Server Error"});
    }
});

router.get('/findEmail', async (req, res) => {
    const email = req.query.email;

    if (!chk.checkEmail(email)) {
        return res.status(400).json({success: false, message: "잘못된 형식의 이메일입니다"});
    }

    try {
        // DB 작업을 해서 이메일 존재 여부 확인
        const value = await db.findByValue("email", email);
        if (value !== null)
            return res.json({success: true});
        return res.status(404).json({success: false, message: "존재하지 않는 이메일입니다"})
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"})
    }
});

router.get('/findPass', async (req, res) => {
    const accessToken = req.cookies.accessToken;

    try {
        const accessResult = jwt.verifyToken(accessToken);
        if (!accessResult)
            return res.status(400).json({success: false, message: "유효하지 않은 인증수단"});
        // DB에서 accessToken 존재 여부를 찾는다
        const value = await db.findByValue("accessToken", accessToken);
        if (!value)
            return res.status(404).json({success: false, message: "존재하지 않는 이메일입니다"});
        // accessToken이 존재하면 해당 db의 이메일로 신규 비밀번호를 보내준다
        const transporter = nodemailer.createTransport({
            host: "smtp.naver.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAILUSER,
                pass: process.env.MAILPASS,
            },
        });
        // password를 난수 설정하는 함수 필요
        password = "string@123";
        const info = await transporter.sendMail({
            from: `${process.env.MAILNAME} <${process.env.MAILADDR}>`,
            to: `${value.email}`,
            subject: "[나비잠] 안녕하십니까 고객님. 임시 비밀번호 안내입니다.",
            html: `
                <h3>나비잠을 사용해주시는 고객님. 대단히 감사합니다.</h3>
                <p>신청하신 임시 비밀번호는 다음과 같습니다.</p>
                <h4>${password}</h4>
                <p>임시 비밀번호로 로그인 하신 후, 반드시 비밀번호 변경을 통해 비밀번호를 바꿔주시면 대단히 감사하겠습니다.</p>
            `
        });
        const hashPass = await hutils.hashPassword(password);
        await db.updateUserInfo(accessToken, {password: hashPass});
        return res.json({success: true});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

module.exports = router;