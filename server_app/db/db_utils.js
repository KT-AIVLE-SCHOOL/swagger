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
            username VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            method INTEGER NOT NULL,
            accessToken TEXT UNIQUE NOT NULL,
            refreshToken TEXT UNIQUE NOT NULL,
            aliasname VARCHAR(100),
            profileimage BYTEA
        );

        CREATE TABLE IF NOT EXISTS ConfigInfo (
            id SERIAL PRIMARY KEY,
            alarm BOOLEAN NOT NULL,
            dataeliminateduration INTEGER NOT NULL,
            coretimestart INTEGER NOT NULL,
            coretimeend INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ChatInfo (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            requesttime DATE NOT NULL,
            request JSON NOT NULL,
            response json NOT NULL,
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES UserInfo(id)
        );
        
        CREATE TABLE IF NOT EXISTS BabyInfo (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            babyname VARCHAR(100) NOT NULL,
            babybirth DATE NOT NULL,
            babyimage BYTEA,
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES UserInfo(id)
        );

        CREATE TABLE IF NOT EXISTS BabyEmotion (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            baby_id INTEGER,
            checktime DATE NOT NULL,
            emotion INTEGER NOT NULL,
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES UserInfo(id),
            CONSTRAINT fk_baby
                FOREIGN KEY (baby_id)
                REFERENCES BabyInfo(id)
        );
    `;

    await pool.query(createTableQuery);
}

exports.findByValue = async function(key, val) {
    const query = `SELECT * FROM UserInfo WHERE ${key} = $1`;
    const result = await pool.query(query, [val]);
    console.log(result.rows);

    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

exports.updateUserInfo = async function(accessToken, updateColumns) {
    const updateQuery = `
        UPDATE UserInfo
        SET ${Object.keys(updateColumns).map(col => `${col} = $${col}`).join(', ')}
        WHERE accessToken = $accessToken
        RETURNING *;
    `;

    const values = { ...updateColumns, accessToken };

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.insertUserInfo = async function(data) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const query = `INSERT INTO UserInfo (${columns}) VALUES (${placeholders}) RETURNING *`;

    const result = await pool.query(query, values);
    console.log('UserInfo 신규 추가: ', result.rows[0]);
    if (result.rowCount === 0)
        return false;
    return true;
}