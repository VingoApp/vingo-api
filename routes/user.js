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

router.get('/user', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
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
    console.log(user)
    if (!user) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    res.status(200).json({ success: true, user: user });
});

router.get('/feed', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    console.log(req.user)
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
    console.log(user.combo.map(c => { return c.name }).join(', '))
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
    if (!response) return res.status(404).json({ success: false, msg: "Informations incorrectes." })
    response = await response.json()

    if (!response) return res.status(404).json({ success: false, msg: "Informations incorrectes." });
    res.status(200).json({ success: true, feed: response });
})


module.exports = router;