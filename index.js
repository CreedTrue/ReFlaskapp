// Creed garner, Payton Womack, Landon Webb, and Jarom Mollinet
// 12/14/2023
// This is the index.js file for the ReFlask site which helps people connect witha  business that recylces old hydroflasks.

// Import required modules
const express = require("express");

const path = require("path");

const ejs = require("ejs");

const app = express();

// Set up port
const port = process.env.PORT || 3000;

const bodyParser = require("body-parser");

app.use(bodyParser.json()); // Parse JSON data

// session storage library
const session = require("express-session");

// Session and parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use true if your app is served over HTTPS
      httpOnly: true,
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));

// Use EJS
app.set("view engine", "ejs");

// Initialize Knex
const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "postgres",
    password: process.env.RDS_PASSWORD || "IAmElonMuskrat",
    database: process.env.RDS_DB_NAME || "ReFlask_DB",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
  },
});
// Check if the connection is successful
knex
  .raw("SELECT 1+1 as result")
  .then(() => {
    console.log("Database is connected");
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  })
  .finally(() => {
    // Ensure to destroy the database connection
  });

// Middleware to check if the user is logged in
const requireLogin = (req, res, next) => {
  if (!req.session.customer_username) {
    res.redirect("/login");
  } else {
    next();
  }
};

// Set up routes
app.get("/", requireLogin, (req, res) => {
  // Check if the user is logged in
  const isLoggedIn = !!req.session.customer_username;

  // Additional data to pass to the view if the user is logged in
  const extraData = {
    customer_username: req.session.customer_username,
    customer_first_name: req.session.customer_first_name,
    // Add more data as needed
  };

  // Render the index.ejs view and pass data
  res.render(path.join(__dirname + "/index.ejs"), { isLoggedIn, extraData });
});

// Login Get
app.get("/login", (req, res) => {
  res.render("login");
});

// Login Post
app.post("/login", (req, res) => {
  console.log("Username:", req.body.customer_username);
  console.log("Password:", req.body.customer_password);

  // Check if user exists in the database
  knex("customer")
    .where({
      customer_username: req.body.customer_username,
      customer_password: req.body.customer_password,
    })
    .select()
    .then((users) => {
      if (users.length > 0) {
        console.log("Login successful");
        req.session.customer_username = req.body.customer_username;
        req.session.customer_first_name = users[0].customer_first_name;
        res.redirect("/");
      } else {
        console.log("Login failed");
        res.redirect("/login");
      }
    })
    .catch((error) => {
      console.error("Error querying the database:", error);
      res.status(500).send("Internal Server Error");
    });
});

// Signup get
app.get("/signup", (req, res) => {
  res.render("signup")
});

app.post('/signup', async (req, res) => {
  const {
    customer_username,
    customer_password,
    customer_first_name, 
    customer_last_name,
    customer_email,
    customer_phone_number,
    customer_street_address,
    customer_city,
    customer_state,
    customer_zip,
  } = req.body;

  try {
    // Insert into 'customer' table using Knex.js
    await knex('customer').insert({
      customer_username: customer_username,
      customer_password: customer_password,
      customer_first_name: customer_first_name,
      customer_last_name: customer_last_name,
      customer_email: customer_email,
      customer_phone_number: customer_phone_number,
      customer_street_address: customer_street_address,
      customer_city: customer_city,
      customer_state: customer_state,
      customer_zip: customer_zip,
    });

    // Send a success response
    res.redirect("/login");
  } catch (error) {
    // Handle errors
    console.error('Error inserting into database:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Products page
app.get("/product", (req, res) => {
  // Get all products from the database
  knex
    .select("*")
    .from("bottle")
    .then((data) => {
      const products = data; // Save the data to the "products" variable
      console.log(products);
      // Render the product.ejs view and pass data for all products so they can be dinamically displayed
      res.render("product", { products: products }); 
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    });
});

// Define a route for the product details page
app.get('/product-details', (req, res) => {
  // Extract the bottle_id from the query parameters
  const bottleId = req.query.bottle_id;

    // Get this products from the database
    knex
    .select("*")
    .from("bottle")
    .where({ bottle_id: bottleId })
    .then((data) => {
      const products = data; // Save the data to the "products" variable
      console.log(products);
      // Render the product.ejs view and pass data for all products so they can be dinamically displayed
      res.render("product-details", { products: products }); 
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
