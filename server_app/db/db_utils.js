const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
});

exports.createTable = async function() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS UserInfo (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            method INTEGER NOT NULL,
            accesstoken TEXT UNIQUE NOT NULL,
            refreshtoken TEXT UNIQUE NOT NULL,
            aliasname TEXT,
            profileimage BYTEA
        );

        CREATE TABLE IF NOT EXISTS ConfigInfo (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            alarm BOOLEAN NOT NULL,
            dataeliminateduration INTEGER NOT NULL,
            coretimestart INTEGER NOT NULL,
            coretimeend INTEGER NOT NULL,
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES UserInfo(id)
                ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ChatInfo (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            requesttime TIMESTAMP NOT NULL,
            request TEXT ARRAY NOT NULL,
            response TEXT ARRAY NOT NULL,
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES UserInfo(id)
                ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS BabyInfo (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            babyname TEXT NOT NULL,
            babybirth TIMESTAMP NOT NULL,
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES UserInfo(id)
                ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS BabyEmotion (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            baby_id INTEGER,
            checktime TIMESTAMP NOT NULL,
            emotion INTEGER NOT NULL,
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES UserInfo(id)
                ON DELETE CASCADE,
            CONSTRAINT fk_baby
                FOREIGN KEY (baby_id)
                REFERENCES BabyInfo(id)
                ON DELETE CASCADE
        );
    `;

    await pool.query(createTableQuery);
}

exports.createAdminTable = async function() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS AdminInfo (
            id SERIAL PRIMARY KEY,
            adminid TEXT NOT NULL,
            password TEXT NOT NULL,
            accessToken TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS NoticeInfo (
            id SERIAL PRIMARY KEY,
            admin_id INTEGER,
            writetime TIMESTAMP NOT NULL,
            header TEXT NOT NULL,
            body TEXT NOT NULL,
            footer TEXT NOT NULL,
            CONSTRAINT fk_admin
                FOREIGN KEY (admin_id)
                REFERENCES AdminInfo(id)
                ON DELETE CASCADE
        );
    `;

    await pool.query(createTableQuery);
}

exports.createVerificationTable = async function() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS VerificationInfo (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL,
            code TEXT NOT NULL
        );
    `;

    await pool.query(createTableQuery);
}

exports.findByValue = async function(key, val) {
    const query = `SELECT * FROM UserInfo WHERE ${key} = $1`;
    const result = await pool.query(query, [val]);

    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

exports.findByAdmin = async function(key, val) {
    const query = `SELECT * FROM AdminInfo WHERE ${key} = $1`;
    const result = await pool.query(query, [val]);

    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

exports.findByVerification = async function(key, val) {
    const query = `SELECT * FROM VerificationInfo WHERE ${key} = $1`;
    const result = await pool.query(query, [val]);

    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

exports.findNoticeInfo = async function() {
    const query = `
        SELECT n.*
        FROM NoticeInfo n
        JOIN AdminInfo a on a.id = n.admin_id
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0)
        return null;
    return result.rows;
}

exports.findNoticeInfoByHeader = async function(header, writetime) {
    const query = `
        SELECT n.*
        FROM NoticeInfo n
        JOIN AdminInfo a ON a.id = n.admin_id
        WHERE n.header = $1 AND n.writetime = $2
    `;

    const result = await pool.query(query, [header, writetime]);
    return result.rows.length === 0 ? null : result.rows;
}

exports.findConfigInfoByUserId = async function(id) {
    const query = `
        SELECT c.*
        FROM ConfigInfo c
        JOIN UserInfo u on u.id = c.user_id
        where u.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0)
        return null;
    return result.rows[0];
}

exports.findBabyInfoByUserId = async function(id) {
    const query = `
        SELECT b.*
        FROM BabyInfo b
        JOIN UserInfo u ON u.id = b.user_id
        WHERE u.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0)
        return null;
    return result.rows[0];
}

exports.findChatInfoByUserId = async function(id) {
    const query = `
        SELECT c.*
        FROM ChatInfo c
        JOIN UserInfo u ON u.id = c.user_id
        WHERE u.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0)
        return null;
    return result.rows[result.rows.length - 1];
}

exports.updateAdminInfo = async function(accessToken, updateColumns) {
    const columns = Object.keys(updateColumns);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    const updateQuery = `
        UPDATE AdminInfo
        SET ${setClause}
        WHERE accessToken = $${columns.length + 1}
        RETURNING *;
    `;

    const values = [ ...Object.values(updateColumns), accessToken ];
    
    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.updateUserInfo = async function(accessToken, updateColumns) {
    const columns = Object.keys(updateColumns);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    const updateQuery = `
        UPDATE UserInfo
        SET ${setClause}
        WHERE accessToken = $${columns.length + 1}
        RETURNING *;
    `;

    const values = [ ...Object.values(updateColumns), accessToken ];

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.updateConfigInfo = async function(id, updateColumns) {
    const columns = Object.keys(updateColumns);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    const updateQuery = `
        UPDATE ConfigInfo
        SET ${setClause}
        WHERE user_id = $${columns.length + 1}
        RETURNING *
    `;

    const values = [ ...Object.values(updateColumns), id ];

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.updateBabyInfo = async function(id, updateColumns) {
    const columns = Object.keys(updateColumns);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    const updateQuery = `
        UPDATE BabyInfo
        SET ${setClause}
        WHERE user_id = $${columns.length + 1}
        RETURNING *
    `;

    const values = [ ...Object.values(updateColumns), id ];

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0)
        return false;
    return true;  
}

exports.insertVerificationInfo = async function(data) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const query = `INSERT INTO VerificationInfo (${columns}) VALUES (${placeholders}) RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.insertAdminInfo = async function(data) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const query = `INSERT INTO AdminInfo (${columns}) VALUES (${placeholders}) RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.insertChatInfo = async function(accessToken, data) {
    const value = await this.findByValue("accessToken", accessToken);

    if (value !== null) {
        const userId = value.id;
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 2}`).join(', ');
        const query = `
            INSERT INTO ChatInfo (user_id, ${columns})
            VALUES ($1, ${placeholders})
            RETURNING *;
        `;

        const result = await pool.query(query, [ userId, ...values ]);
        if (result.rowCount === 0)
            return false;
        return true;
    }
}

exports.insertNoticeInfo = async function(accessToken, data) {
    const value = await this.findByAdmin("accessToken", accessToken);

    if (value !== null) {
        const adminId = value.id;
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 2}`).join(', ');
        const query = `
            INSERT INTO NoticeInfo (admin_id, ${columns})
            VALUES ($1, ${placeholders})
            RETURNING *;
        `;

        const result = await pool.query(query, [ adminId, ...values ]);
        if (result.rowCount === 0)
            return false
        return true;
    }
}

exports.insertUserInfo = async function(data) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const query = `INSERT INTO UserInfo (${columns}) VALUES (${placeholders}) RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.insertConfigInfo = async function(accessToken, data) {
    const value = await this.findByValue("accessToken", accessToken);
    
    if (value !== null) {
        const userId = value.id;
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 2}`).join(', ');
        const query = `
            INSERT INTO ConfigInfo (user_id, ${columns})
            VALUES ($1, ${placeholders})
            RETURNING *
        `;

        const result = await pool.query(query, [ userId, ...values ]);
        if (result.rowCount === 0)
            return false;
        return true;
    }
}

exports.insertBabyInfo = async function(accessToken, data) {
    const value = await this.findByValue("accessToken", accessToken);

    if (value !== null) {
        const userId = value.id;
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 2}`).join(', ');
        const query = `
            INSERT INTO BabyInfo (user_id, ${columns})
            VALUES ($1, ${placeholders})
            RETURNING *
        `;

        const result = await pool.query(query, [ userId, ...values ]);
        if (result.rowCount === 0)
            return false;
        return true;
    }
}

// BabyEmotion에서 값 가져오기, LIMIT 지정, e.checkTime 내림차순 정렬
exports.findBabyEmotionInfoByUserId = async function(id) {
    const query = `
        SELECT e.checkTime, e.emotion
        FROM BabyEmotion e
        JOIN UserInfo u ON u.id = e.user_id
        WHERE u.id = $1
        ORDER BY e.checkTime DESC
        LIMIT 3
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0){
        return null;
    } else {
        return result.rows;
    }
        // 1개일 때는 그냥 그냥 전달하고 2대부터 Array형태로 전달?
//    } else if (result.row.length === 1){
//        return result.row[0];
//    } else {
//        return result.rows;
//    }
}

// 집중 관찰 시간의 아기 감정과 시간 데이터 가져오기 # 이거는 한번 더 확인 필요!!!!
exports.findCoreTimeBabyInfoByUserId = async function(id) {
    const query = `
        SELECT e.emotion, e.checkTime
        FROM BabyEmotion e
        JOIN UserInfo u ON u.id = e.user_id
        JOIN ConfigInfo c ON u.id = c.user_id
        WHERE u.id = $1
          AND (
            (c.coretimestart <= c.coretimeend AND EXTRACT(HOUR FROM e.checkTime)::INTEGER BETWEEN c.coretimestart AND c.coretimeend)
            OR
            (c.coretimestart > c.coretimeend AND
             (EXTRACT(HOUR FROM e.checkTime)::INTEGER >= c.coretimestart OR EXTRACT(HOUR FROM e.checkTime)::INTEGER < c.coretimeend))
          )
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0){
        return null;
    } else {
        return result.rows;
    }
}

// 집중 관찰 시간 데이터 가져오기
exports.findCoreTimeInfoByUserId = async function(id) {
    const query = `
        SELECT c.coretimestart, c.coretimeend
        FROM ConfigInfo c
        JOIN UserInfo u ON u.id = c.user_id
        WHERE u.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0){
        return null;
    } else {
        return result.rows[0];
    }
}

// 감정 데이터 가져오기
exports.findBabyFrequencyInfoByUserId = async function(id) {
    const query = `
        SELECT e.emotion
        FROM BabyEmotion e
        JOIN UserInfo u ON u.id = e.user_id
        WHERE u.id = $1
        ORDER BY e.checkTime DESC
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0){
        return null;
    } else {
        return result.rows.map(row => row.emotion);
    }
}

exports.deleteVerificationInfo = async function(email) {
    const query = `DELETE FROM VerificationInfo WHERE email = $1`;

    const result = await pool.query(query, [email]);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.deleteNoticeInfo = async function(header, writetime) {
    const query = `DELETE FROM NoticeInfo WHERE header = $1 AND writetime = $2`;

    const result = await pool.query(query, [header, writetime]);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.deleteUserInfo = async function(accessToken) {
    const query = `DELETE FROM UserInfo WHERE accessToken = $1`;

    const result = await pool.query(query, [accessToken]);

    if (result.rowCount === 0)
        return false;
    return true;
}