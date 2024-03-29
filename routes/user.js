const router = require('express').Router();
const passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
const utils = require('../lib/utils');
const JwtStrategy = require("passport-jwt").Strategy;
const { ExtractJwt } = require("passport-jwt");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken")
const fetch = require('node-fetch')
require('dotenv').config()

const rateLimit = require('../middleware/rateLimit');
const filterCombo = require('../lib/filterCombo');

router.get('/user', [rateLimit, passport.authenticate('jwt', { session: false })], async (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    let user = await prisma.user.findUnique({
        where: {
            id: req.user.id
        },
        include: {
            combo: true
        }
    }).catch((err) => {
        console.log(err);
        return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    })
    if (!user) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    res.status(200).json({ success: true, user: user });
});

router.get('/feed', [rateLimit, passport.authenticate('jwt', { session: false })], async (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, msg: "User incorrect." });
    console.log('get feed', req.query?.from, req.query?.to)
    let user = await prisma.user.findUnique({
        where: {
            id: req.user.id
        },
        include: {
            combo: true
        }
    }).catch((err) => {
        console.log(err);
        return res.status(404).json({ success: false, msg: "Utilisateur introuvable." });
    })
    let comboList = user.combo.map(c => { return c.name }).join(', ')
    let response = await fetch(process.env.VINTED_API_URL + `/filters/combo?comboList=${comboList}`, {
        headers: {
            /* "Content-Type": "application/json", */
            "Authorization": "Bearer " + req.headers.authorization.split(" ")[1]
        },
    }).catch((err) => {
        console.log(err);
        return false
    })
    if (!response) return res.status(404).json({ success: false, msg: "Informations incorrectes." });
    response = await response.json()
    if (!response?.length) return res.status(404).json({ success: false, msg: "Informations incorrectes." });
    response = await filterCombo(user, response, req.query?.from || 0, req.query?.to || 20, req.query?.search || '')
    res.status(200).json({ success: true, feed: response });
})


module.exports = router;