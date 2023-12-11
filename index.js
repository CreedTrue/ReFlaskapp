const express = require('express');
const path = require('path');
const ejs = require('ejs');


const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Use EJS
app.set("view engine", "ejs");

// Initialize Knex
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: 'localhost',
        user: 'postgres',
        password: 'IS403BYU',
        database: 'ReFlask_DB'
    }
});

// Set up routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/landing', (req, res) => {
    res.render('landing');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/product', (req, res) => {
    res.render('product');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
