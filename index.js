const express = require('express');

const path = require('path');

const ejs = require('ejs');

const app = express();

const port = process.env.PORT || 3000;

const bodyParser = require("body-parser")

app.use(bodyParser.json()); // Parse JSON data

const session = require("express-session")

// Session and parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use true if your app is served over HTTPS
        httpOnly: true,
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Use EJS
app.set("view engine", "ejs");

// Initialize Knex
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: 'localhost',
        user: 'postgres',
        password: 'IAmElonMuskrat',
        database: 'ReFlask_DB'
    }
});

knex.raw('SELECT 1+1 as result')
.then(() => {
    console.log('Database is connected');
})
.catch((err) => {
    console.error('Error connecting to the database:', err);
})
.finally(() => {
    // Ensure to destroy the database connection
});

// Middleware to check if the user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.username) {
        res.redirect('/login');
    } else {
        next();
    }
};

// Set up routes
app.get('/', requireLogin, (req, res) => {
    // Check if the user is logged in
    const isLoggedIn = !!req.session.username;

    // Additional data to pass to the view if the user is logged in
    const extraData = {
        username: req.session.username,
        user_first_name: req.session.user_first_name,
        // Add more data as needed
    };

    // Render the index.ejs view and pass data
    res.render(path.join(__dirname + '/index.ejs'), { isLoggedIn, extraData });
});


// Login
app.get('/login', (req, res) => {
    res.render('login');
});

// Login
app.post("/login", (req, res) => {
    console.log('Username:', req.body.username);
    console.log('Password:', req.body.password);

    // Check if user exists in the database
    knex('user_login')
    .where({
      username: req.body.username,
      password: req.body.password,
      admin_permission: true
    })
    .select()
    .then((users) => {
        if (users.length > 0) {
            console.log('Login successful');
            req.session.username = req.body.username;
            req.session.user_first_name = users[0].user_first_name;
            res.redirect('/');
        } else {
            console.log('Login failed');
            res.redirect('/login');
        }
    })
    .catch((error) => {
        console.error('Error querying the database:', error);
        res.status(500).send('Internal Server Error');
    });
});

// Products
app.get('/product', (req, res) => {
    res.render('product');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

