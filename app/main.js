const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const { performance } = require('perf_hooks');
const path = require('path');
require('dotenv').config()

const app = express();
const port = process.env.SERVER_PORT || 3004;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    port: process.env.DB_PORT,
});

app.use((req, res, next) => {
    req.pool = pool;
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET unique CNPJ data
app.get('/api/cnpj/:cnpj', async (req, res) => {
    
    cnpj = req.params.cnpj || '';

    cnpj = cnpj.replace(/\D/g, '');

    if(cnpj.length != 14){
        res.status(400).json({ error: 'CNPJ inválido' });
        return false;
    }

    nCompany = cnpj.substring(0, 8);
    nEstabe = cnpj.substring(8, 12);
    nDV = cnpj.substring(12, 14);

    const queryEstabe = `
        SELECT * 
        FROM public.estabelecimentos
        WHERE 
            cnpj_basico_numero_base = $1
            AND
            cnpj_ordem = $2
            AND
            cnpj_dv = $3
        LIMIT 1
    `;

    const queryEmpresas = `SELECT * FROM public.empresas WHERE cnpj = $1 LIMIT 1`
    const querySocios = `SELECT * FROM public.socios WHERE cnpj_basico = $1`
    const querySimples = `SELECT * FROM public.simples WHERE cnpj_basico = $1 LIMIT 1`
    
    try {
        const startTime = performance.now();

        const resultEstabe = await req.pool.query(queryEstabe, [nCompany, nEstabe, nDV]);

        let ips = (
            req.headers['cf-connecting-ip'] ||
            req.headers['x-real-ip'] ||
            req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress || 
            req.connection.remoteAddress || ''
        ).split(',');

        if (resultEstabe.rows.length === 0) {
            res.status(404).json({ error: 'CNPJ não encontrado' });

            const endTime = performance.now();
            const timeQuery = endTime - startTime;

            const query = `
                INSERT INTO public.events (cnpj, time_ms, ip, status)
                VALUES ($1, $2, $3, $4);
            `;

            req.pool.query(query, [cnpj,timeQuery.toFixed(2),ips[0],0]);
        } else {
            const resultEmpresas = await req.pool.query(queryEmpresas, [nCompany]);
            const resultSocios = await req.pool.query(querySocios, [nCompany]);
            const resultSimples = await req.pool.query(querySimples, [nCompany]);

            const endTime = performance.now();
            const timeQuery = endTime - startTime;

            res.json({
                'q_cnpj': nCompany+nEstabe+nDV,
                'q_time_ms': timeQuery.toFixed(2),
                'q_ip': ips[0],
                'empresa': resultEmpresas.rows,
                'estabelecimento': resultEstabe.rows,
                'socios': resultSocios.rows,
                'simples': resultSimples.rows,
            });

            const query = `
                INSERT INTO public.events (cnpj, time_ms, ip, status)
                VALUES ($1, $2, $3, $4);
            `;

            req.pool.query(query, [cnpj,timeQuery.toFixed(2),ips[0],1]);
        }
    } catch (error) {
        console.error('Erro ao consultar o banco de dados', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/statistic', async (req, res) => {
    const query = `select count(distinct(cnpj)) as cnpjs, count(cnpj) as qtde, avg(time_ms) as avg_time from public.events where status = 1;`
    const result = await req.pool.query(query);

    res.json(result.rows[0])
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
});
