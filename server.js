const express = require('express');
const pool = require('./db-config');  // importa o pool
const cors = require('cors');
const moment = require('moment-timezone');
require('dotenv').config();           // carrega o .env também aqui

const app = express();
const port = 3000;

app.listen(port, () => console.log('Servidor iniciado na porta', port));


const corsOptions = {
    origin: 'https://www.unicopos.com.br', // Permitindo somente requisições do seu domínio
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};


app.use(cors(corsOptions));
app.use(express.json());

// Rotas

app.get('/current-count', async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT COUNT(*) AS quantidade FROM registros`);
        const count1 = rows.length > 0 ? rows[0].quantidade : 0;
        res.json({ count: count1 });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/current-econo', async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT COUNT(*) AS quantidade FROM economizados`);
        const countEcono = rows.length > 0 ? rows[0].quantidade : 0;
        res.json({ countEcono });
    } catch (err) {
        res.status(500).send(err);
    }
});



const estaNoIntervalo = (horaAtual, horaInicial, horaFinal) => {
    return horaAtual >= horaInicial && horaAtual < horaFinal;
};

app.post('/increment', async (req, res) => {
    try {
        const agora = moment().tz('America/Sao_Paulo');
        const horaAtual = agora.format('HH:mm'); // Formato "HH:mm"

        // Verificar se está dentro de algum horário permitido
        const emHorarioPermitido = 
            estaNoIntervalo(horaAtual, "07:00", "08:30") ||   // Café da manhã
            estaNoIntervalo(horaAtual, "10:30", "14:00") ||   // Almoço
            estaNoIntervalo(horaAtual, "17:30", "19:45");     // Jantar

        if (!emHorarioPermitido) {
            return res.status(400).json({ message: "Horário não permitido para registro." });
        }

        // Para /increment
        const { rows } = await pool.query(`SELECT COUNT(*) AS quantidade FROM registros`);
        const currentCount = rows.length > 0 ? rows[0].quantidade : 0;
        const newCount = currentCount + 1;

        await pool.query('INSERT INTO registros (quantidade, data) VALUES ($1, (NOW() AT TIME ZONE \'America/Sao_Paulo\'))', [newCount]);
        
        res.json({ count: newCount });

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro interno do servidor.');
    }
});

app.post('/increment_econo', async (req, res) => {
    try {
        const agora = moment().tz('America/Sao_Paulo');
        const horaAtual = agora.format('HH:mm'); // Formato "HH:mm"

        // Verificar se está dentro de algum horário permitido
        const emHorarioPermitido = 
            estaNoIntervalo(horaAtual, "07:00", "08:30") ||   // Café da manhã
            estaNoIntervalo(horaAtual, "10:30", "14:00") ||   // Almoço
            estaNoIntervalo(horaAtual, "17:30", "19:45");     // Jantar

        if (!emHorarioPermitido) {
            return res.status(400).json({ message: "Horário não permitido para registro." });
        }
        // Para /increment_econo
        const { rows } = await pool.query(`SELECT COUNT(*) AS quantidade FROM economizados`);
        const currentCount = rows.length > 0 ? rows[0].quantidade : 0;
        const newCount = currentCount + 1;

        await pool.query('INSERT INTO economizados (quantidade, data) VALUES ($1, (NOW() AT TIME ZONE \'America/Sao_Paulo\'))', [newCount]);
        
        res.json({ count: newCount });

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro interno do servidor.');
    }
});


function getCountQuery(period) {
    const timezone = `'America/Sao_Paulo'`;
    const now = `CURRENT_TIMESTAMP AT TIME ZONE ${timezone}`;
    const data = `data AT TIME ZONE ${timezone}`;

    switch (period) {
        case 'day':
            return `
                SELECT COUNT(*) AS total
                FROM registros
                WHERE CAST(${data} AS DATE) = CURRENT_DATE`; // Comparação com a data atual
        case 'week':
            return `
                SELECT COUNT(*) AS total
                FROM registros
                WHERE EXTRACT(WEEK FROM ${data}) = EXTRACT(WEEK FROM ${now})
                AND EXTRACT(YEAR FROM ${data}) = EXTRACT(YEAR FROM ${now})`;
        case 'month':
            return `
                SELECT COUNT(*) AS total
                FROM registros
                WHERE EXTRACT(MONTH FROM ${data}) = EXTRACT(MONTH FROM ${now})
                AND EXTRACT(YEAR FROM ${data}) = EXTRACT(YEAR FROM ${now})`;
        case 'year':
            return `
                SELECT COUNT(*) AS total
                FROM registros
                WHERE EXTRACT(YEAR FROM ${data}) = EXTRACT(YEAR FROM ${now})`;
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
