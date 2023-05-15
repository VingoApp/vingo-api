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

router.post('/add', [rateLimit, passport.authenticate('jwt', { session: false })], async (req, res, next) => {
    let combo = JSON.parse(req.query.combo)
    if (!combo) return res.status(400).json({ success: false, msg: "Informations manquantes." });
    let user = await prisma.user.findUnique({
        where: {
            id: req.user.id
        }
    }).catch((err) => {
        console.log(err);
        return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    })
    if (!user) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    newCombo = await prisma.combo.findFirst({
        where: {
            name: combo.name,
            userId: user.id
        }
    }).catch((err) => {
        console.log(err);
        return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    })
    if (!newCombo) {
        newCombo = await prisma.combo.create({
            data: {
                name: combo.name,
                priceUp: parseInt(combo.priceUp),
                priceDown: parseInt(combo.priceDown),
                userId: user.id
            }
        }).catch((err) => {
            console.log(err);
            return res.status(401).json({ success: false, msg: "Informations incorrectes." });
        })
        if (!newCombo) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    }
    res.status(200).json({ success: true, msg: "Combo ajouté avec succès." });
})

router.post('/remove', [rateLimit, passport.authenticate('jwt', { session: false })], async (req, res, next) => {
    let { comboName } = req.query
    if (!comboName) return res.status(400).json({ success: false, msg: "Informations manquantes." });
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
    combo = await prisma.combo.findFirst({
        where: {
            name: comboName,
            userId: user.id
        }
    }).catch((err) => {
        console.log(err);
        return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    })
    if (!combo) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    combo = await prisma.combo.deleteMany({
        where: {
            name: comboName,
            userId: user.id
        }
    }).catch((err) => {
        console.log(err);
        return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    })
    res.status(200).json({ success: true, msg: "Combo supprimé avec succès." });
})

module.exports = router;