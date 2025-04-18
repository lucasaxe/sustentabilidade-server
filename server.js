const express = require('express');
const pool = require('./db-config');  // importa o pool
const cors = require('cors');
const moment = require('moment-timezone');
require('dotenv').config();           // carrega o .env também aqui

const app = express();
const port = 3000;

app.listen(port, () => console.log('Servidor iniciado na porta', port));

app.use(cors());
app.use(express.json());

// Rotas

app.get('/current-count', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT quantidade FROM registros ORDER BY id DESC LIMIT 1');
        const count1 = rows.length > 0 ? rows[0].quantidade : 0;
        res.json({ count: count1 });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/current-econo', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT quantidade FROM economizados ORDER BY id DESC LIMIT 1');
        const countEcono = rows.length > 0 ? rows[0].quantidade : 0;
        res.json({ countEcono });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/increment', async (req, res) => {
    try {
        const agora = moment().tz('America/Sao_Paulo');
        const { rows } = await pool.query('SELECT quantidade FROM registros ORDER BY id DESC LIMIT 1');
        const currentCount = rows.length > 0 ? rows[0].quantidade : 0;
        const newCount = currentCount + 1;

        await pool.query('INSERT INTO registros (quantidade, data) VALUES ($1, (NOW() AT TIME ZONE \'America/Sao_Paulo\'))', [newCount]);
        res.json({ count: newCount });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/increment_econo', async (req, res) => {
    try {
        const agora = new Date();
        const horas = agora.getHours();
        const minutos = agora.getMinutes();

        const { rows } = await pool.query('SELECT quantidade FROM economizados ORDER BY id DESC LIMIT 1');
        const currentCount = rows.length > 0 ? rows[0].quantidade : 0;
        const newCount = currentCount + 1;

        await pool.query('INSERT INTO economizados (quantidade, data) VALUES ($1, (NOW() AT TIME ZONE \'America/Sao_Paulo\'))', [newCount]);
        res.json({ count: newCount });
    } catch (err) {
        res.status(500).send(err);
    }
});


function getCountQuery(period) {
    const timezone = `'America/Sao_Paulo'`;
    const now = `CURRENT_TIMESTAMP AT TIME ZONE ${timezone}`;
    const data = `data AT TIME ZONE ${timezone}`;

    switch (period) {
        case 'day':
            return `
                SELECT COUNT(*) AS total FROM registros WHERE CAST(${data} AS DATE) = (${now})::date`;
        case 'week':
            return `
                SELECT COUNT(*) AS total FROM registros WHERE EXTRACT(WEEK FROM ${data}) = EXTRACT(WEEK FROM ${now})
                AND EXTRACT(YEAR FROM ${data}) = EXTRACT(YEAR FROM ${now})`;
        case 'month':
            return `
                SELECT COUNT(*) AS total FROM registros WHERE EXTRACT(MONTH FROM ${data}) = EXTRACT(MONTH FROM ${now})
                AND EXTRACT(YEAR FROM ${data}) = EXTRACT(YEAR FROM ${now})`;
        case 'year':
            return `
                SELECT COUNT(*) AS total FROM registros WHERE EXTRACT(YEAR FROM ${data}) = EXTRACT(YEAR FROM ${now})`;
        default:
            throw new Error('Invalid period');
    }
}

app.get('/current-day', async (req, res) => {
    try {
        const { rows } = await pool.query(getCountQuery('day'));
        res.json({ count_today: rows[0].total });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/current-week', async (req, res) => {
    try {
        const { rows } = await pool.query(getCountQuery('week'));
        res.json({ count_week: rows[0].total });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/current-month', async (req, res) => {
    try {
        const { rows } = await pool.query(getCountQuery('month'));
        res.json({ count_month: rows[0].total });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/current-year', async (req, res) => {
    try {
        const { rows } = await pool.query(getCountQuery('year'));
        res.json({ count_year: rows[0].total });
    } catch (err) {
        res.status(500).send(err);
    }
});
