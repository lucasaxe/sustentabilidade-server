//importacoes
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const moment = require('moment-timezone');

//conexoes
const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'bd_tasks'
});
const app = new express();
app.listen(3000, () => console.log('Servidor iniciado.'));
app.use(cors());
app.use(express.json());


//rotas

// Endpoint para obter o número atual
app.get('/current-count', (req, res) => {
    connection.query('SELECT quantidade FROM registros ORDER BY id DESC LIMIT 1', (err, result) => {
        if (err) return res.status(500).send(err);
        const count1 = result.length > 0 ? result[0].quantidade : 0;
        res.json({ count: count1 });
    });
});

// Endpoint para obter o número atual
app.get('/current-econo', (req, res) => {
    connection.query('SELECT quantidade FROM economizados ORDER BY id DESC LIMIT 1', (err, result) => {
        if (err) return res.status(500).send(err);
        const countEcono = result.length > 0 ? result[0].quantidade : 0;
        res.json({ countEcono });
    });
});

// Endpoint para incrementar o número e registrar a data
app.post('/increment', (req, res) => {
    // Obter a hora atual
    const agora = moment().tz('America/Sao_Paulo');
    const intervaloPermitido1 = moment().set({ hour: 6, minute: 30, second: 0 }), intervaloPermitido2 = moment().set({ hour: 8, minute: 0, second: 0 });
    const intervaloPermitido3 = moment().set({ hour: 10, minute: 30, second: 0 }), intervaloPermitido4 = moment().set({ hour: 14, minute: 0, second: 0 });
    const intervaloPermitido5 = moment().set({ hour: 17, minute: 30, second: 0 }), intervaloPermitido6 = moment().set({ hour: 19, minute: 45, second: 0 });

    // Verificar se estamos no intervalo permitido (12:00 às 14:00)
    if(!(agora.isBetween(intervaloPermitido1, intervaloPermitido2, null, '[)') || agora.isBetween(intervaloPermitido3, intervaloPermitido4, null, '[)') || agora.isBetween(intervaloPermitido5, intervaloPermitido6, null, '[)'))) {
        console.log("Horário não permitido.");
        console.log(agora);

        connection.query('SELECT quantidade FROM registros ORDER BY id DESC LIMIT 1', (err, result) => {
            if (err) return res.status(500).send(err);
            const currentCount = result.length > 0 ? result[0].quantidade : 0;
            res.json({ count: currentCount });
        });
    }else{
        connection.query('SELECT quantidade FROM registros ORDER BY id DESC LIMIT 1', (err, result) => {
            if (err) return res.status(500).send(err);

            const currentCount = result.length > 0 ? result[0].quantidade : 0;
            const newCount = currentCount + 1;

            connection.query('INSERT INTO registros (quantidade, data) VALUES (?, NOW())', [newCount], (err) => {
                if (err) return res.status(500).send(err);
                res.json({ count: newCount });
            });
        });
    }
});

// Endpoint para incrementar o número e registrar a data
app.post('/increment_econo', (req, res) => {
    // Obter a hora atual
    const agora = new Date();
    const horas = agora.getHours(); // Horas no formato 24h
    const minutos = agora.getMinutes(); // Minutos (não usado aqui, mas disponível)

    // Verificar se estamos no intervalo permitido (12:00 às 14:00)
    if((horas<=6) || (horas<7 && minutos<30) || (horas>8 && horas<10) || (horas<11 && minutos<30) || (horas>14 && horas<17) || (horas<18 && minutos<30) || (horas>19 && minutos>40) || (horas>=20)) {
        console.log("Horário não permitido.");

        connection.query('SELECT quantidade FROM economizados ORDER BY id DESC LIMIT 1', (err, result) => {
            if (err) return res.status(500).send(err);
            const currentCount = result.length > 0 ? result[0].quantidade : 0;
            res.json({ count: currentCount });
        });
    }else{
        connection.query('SELECT quantidade FROM economizados ORDER BY id DESC LIMIT 1', (err, result) => {
            if (err) return res.status(500).send(err);

            const currentCount = result.length > 0 ? result[0].quantidade : 0;
            const newCount = currentCount + 1;

            connection.query('INSERT INTO economizados (quantidade, data) VALUES (?, NOW())', [newCount], (err) => {
                if (err) return res.status(500).send(err);
                res.json({ count: newCount });
            });
        });
    }
});

// Endpoint para obter o número atual
app.get('/current-day', (req, res) => {
    connection.query('SELECT COUNT(*) AS total FROM registros WHERE DAY(data) = DAY(CURRENT_DATE)  AND MONTH(data) = MONTH(CURRENT_DATE) AND YEAR(data) = YEAR(CURRENT_DATE)', (err, result) => {
        if (err) return res.status(500).send(err);
        const count_today = result.length > 0 ? result[0].total : 0;
        res.json({ count_today });
    });
});

// Endpoint para obter o número atual
app.get('/current-week', (req, res) => {
    connection.query('SELECT COUNT(*) AS total FROM registros WHERE WEEK(data) = WEEK(CURRENT_DATE) AND MONTH(data) = MONTH(CURRENT_DATE) AND YEAR(data) = YEAR(CURRENT_DATE)', (err, result) => {
        const count_week = result.length > 0 ? result[0].total : 0;
        res.json({ count_week });
    });
});

// Endpoint para obter o número atual
app.get('/current-month', (req, res) => {
    connection.query('SELECT COUNT(*) AS total FROM registros WHERE MONTH(data) = MONTH(CURRENT_DATE) AND YEAR(data) = YEAR(CURRENT_DATE)', (err, result) => {
        if (err) return res.status(500).send(err);
        const count_month = result.length > 0 ? result[0].total : 0;
        res.json({ count_month });
    });
});

// Endpoint para obter o número atual
app.get('/current-year', (req, res) => {
    connection.query('SELECT COUNT(*) AS total FROM registros WHERE YEAR(data) = YEAR(CURRENT_DATE)', (err, result) => {
        if (err) return res.status(500).send(err);
        const count_year = result.length > 0 ? result[0].total : 0;
        res.json({ count_year });
    });
});