const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const db = require('../db/db_utils');
const jwt = require('../utils/jwtUtils');
const time = require('../utils/calculateUtils');

router.use(cookieParser());
router.use(express.json());

router.get('/getBabyInfo', async (req, res) => {
    const accessToken = req.cookies.accessToken;
    try{
        if(jwt.verifyToken(accessToken)){
            const value = await db.findByValue("accessToken", accessToken);

            if (value !== null){
                const baby = await db.findBabyInfoByUserId(value.id);

                if(baby!== null){
                    const babyBirth = baby.babyBirth.split(" ")[0];
                    return res.json({success: true, babyName: baby.babyname, babyBirth: babyBirth});
                }
                else{
                    return res.status(404).json({success: false, message: "해당 데이터가 없습니다."});
                }
            }
        }
        return res.status(400).json({success: false, message: "유효하지 않은 접근수단"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.get('/getBabyEmotionInfo', async (req, res) => {
    const accessToken = req.cookies.accessToken;
    try{
        if(jwt.verifyToken(accessToken)){
            const value = await db.findByValue("accessToken", accessToken);

            if (value !== null){
                const babyEmotion = await db.findBabyEmotionInfoByUserId(value.id);

                if(babyEmotion !== null){
                    const EmotionsMap = babyEmotion.map(emotion => ({
                        babyEmotionTime: emotion.checkTime,
                        babyEmotionNum: emotion.emotion
                    })).reverse();
                    const babyEmotionRecentlyMap = EmotionsMap.slice(0, 15);
                    const groupedEmotions = EmotionsMap.reduce((acc, emotion) => {
                        const hour = parseInt(emotion.babyEmotionTime.split(" ")[1].split(":")[0]);
                        if (!acc[hour])
                            acc[hour] = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, total: 0};
                        acc[hour][emotion.babyEmotionNum]++;
                        acc[hour].total++;
                        return acc;
                    }, {});
                    const sortingEmotions = Object.entries(groupedEmotions).map(([hour, emotions]) => {
                        const {total, ...emotionCounts} = emotions;
                        const sortingEmotion = Object.entries(emotionCounts).reduce((max, [emotion, count]) =>
                            count > max[1] ? [emotion, count] : max, [0, -1]);
                        const ratio = sortingEmotion[1] / total;
                        return {
                            hour: hour,
                            maxEmotion: sortingEmotion[0],
                            ratio: ratio
                        }
                    });
                    sortingEmotions.sort((a, b) => a.hour - b.hour);
                    return res.json({success: true, babyEmotionRecently: babyEmotionRecentlyMap, babyEmotionOrderByTime: sortingEmotions});
                }
                else{
                    return res.status(404).json({success: false, message: "해당 데이터가 없습니다."});
                }
            }
        }
        return res.status(400).json({success: false, message: "유효하지 않은 접근수단"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

module.exports = router;