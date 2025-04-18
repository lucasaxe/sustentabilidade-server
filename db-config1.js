const { Client } = require('pg');
require('dotenv').config();

const getConnection = () => {
    return new Client({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'mypassword',
        database: process.env.DB_DATABASE || 'mydatabase',
        port: process.env.DB_PORT || 5432,
    });
};

module.exports = getConnection;