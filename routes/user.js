const router = require('express').Router();
const passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
const utils = require('../lib/utils');
const JwtStrategy = require("passport-jwt").Strategy;
const { ExtractJwt } = require("passport-jwt");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken")
require('dotenv').config()

router.get('/user', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    res.status(200).json({ success: true, user: req.user });
});


module.exports = router;