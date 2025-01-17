const WebSocket = require('ws');
const axios = require('axios');
const db = require('../db/db_utils');
const cal = require('../utils/calculateUtils')

exports.startWebSocket = () => {
    const wss = new WebSocket.Server({port: 8002});
    const ai_protocol = process.env.AI_PROTOCOLS;
    const chatai_host = process.env.CHATAI_HOST;
    const chatai_port = process.env.CHATAI_PORT;

    wss.on('connection', (ws) => {
        console.log("Connecting Websocket");

        const time = cal.calculateDateTime();
        let accessToken;
        let que = new Array();
        let ans = new Array();

        ws.on('message', async (message) => {
            const questionMes = JSON.parse(message);
            let data;

            if (questionMes.header === "Greeting") {
                // DB에서 가장 최근 채팅이력을 뽑아서 보내주기
                accessToken = questionMes.accessToken;
                const value = await db.findByValue("accessToken", questionMes.accessToken);
                if (value === null)
                    return ws.close();
                const info = await db.findChatInfoByUserId(value.id);
                if (info !== null) {
                    data = {
                        request: info.request,
                        response: info.response,
                    };
                } else {
                    data = {
                        request: [],
                        response: []
                    };
                }
                const sendMes = {
                    type: "message",
                    header: "Greeting",
                    data: data,
                    time: cal.calculateDateTime(),
                };
                ws.send(JSON.stringify(sendMes));
            }

            if (questionMes.header === "Question") {
                await axios.get(
                    `${ai_protocol}://${chatai_host}:${chatai_port}/api/getAnswer`, 
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    params: {
                        question: questionMes.data,
                    }
                })
                .then(function (response) {
                    que.push(questionMes.data);
                    ans.push(response.data.answer);

                    const sendMes = {
                        type: "message",
                        header: "Answer",
                        data: response.data.answer,
                        time: cal.calculateDateTime(),
                    }
                    ws.send(JSON.stringify(sendMes));
                })
                .catch(function (error) {
                    console.log(error);
                });
            }

            if (questionMes.header === "Goodbye") {
                return ws.close();
            }
        });

        ws.on('error', () => {
            ws.close();
        });

        ws.on('close', async () => {
            if (que.length && ans.length)
                await db.insertChatInfo(accessToken, {requesttime: time, request: que, response: ans});
            console.log("Closed websocket");
        });
    });
}
