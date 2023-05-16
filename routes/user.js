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

const rateLimit = require('../middleware/rateLimit')

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
        return res.status(404).json({ success: false, msg: "Utilisateur introuvable." });
    })
    let comboList = user.combo.map(c => { return c.name }).join(', ')
    let response = await fetch(process.env.VINTED_API_URL + '/filters/combo?comboList='+comboList, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + req.headers.authorization.split(" ")[1]
        },
    }).catch((err) => {
        console.log(err);
        return false
    })
    response = await response?.json()
    if (!response) return res.status(404).json({ success: false, msg: "Informations incorrectes." });
    response = response?.filter((item) => {
        return item.price >= user.combo.find(c => { return c.name == item.comboId }).priceDown && item.price <= user.combo.find(c => { return c.name == item.comboId }).priceUp
    })
    res.status(200).json({ success: true, feed: response });
})


module.exports = router;