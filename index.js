const express = require('express');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
var session = require('express-session')

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
require('dotenv').config()


/**
 * -------------- GENERAL SETUP ----------------
 */

// Gives us access to variables set in the .env file via `process.env.VARIABLE_NAME` syntax
require('dotenv').config();

// Create the Express application
var app = express();

// Pass the global passport object into the configuration function
require('./config/passport')(passport);

// This will initialize the passport object on every request
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: new PrismaSessionStore(
      new PrismaClient(),
      {
        checkPeriod: 2 * 60 * 1000,  //ms
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      }
    )
}))
app.use(passport.initialize());
app.use(passport.session())

// Instead of using body-parser middleware, use the new Express implementation of the same thing
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Allows our Angular application to make HTTP requests to Express application
app.use(cors());

/**
 * -------------- ROUTES ----------------
 */

// Imports all of the routes from ./routes/index.js
const auth = require('./routes/auth');
const user = require('./routes/user');
const filters = require('./routes/filters');
const notifications = require('./routes/notifications');

app.use(auth);
app.use(user);
app.use('/filters', filters);
app.use('/push', notifications);

/**
 * -------------- SERVER ----------------
 */

// Server listens on http://localhost:3002
app.listen(3002, () => {
    console.log('Server listening on http://localhost:3002');
})