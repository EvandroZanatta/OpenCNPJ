const express = require('express');
const path = require('path');
const { ClickHouse } = require('clickhouse');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = 5001;

// ClickHouse configuration with authentication using environment variables
const clickhouse = new ClickHouse({
    url: 'http://localhost',
    port: 8123,
    debug: false,
    basicAuth: {
        username: 'default',
        password: process.env.CLICKHOUSE_PASSWORD, // Use the environment variable for password
    },
    isUseGzip: false,
    format: 'json',
    raw: false,
    config: {
        database: 'cnpjdb', // Replace with your ClickHouse database name
    },
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for querying by CNPJ
app.get('/cnpj/:cnpj', (req, res) => {
    const cnpj = req.params.cnpj;

    // SQL Query
    const query = `
        SELECT *
        FROM empresas
        WHERE cnpj = '${cnpj}'
        LIMIT 1;
    `;

    clickhouse.query(query, (err, results) => {
        if (err) {
            console.error('Query error:', err);
            res.status(500).json({ error: 'Query error' });
            return;
        }

        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`API running on port ${port}`);
});
