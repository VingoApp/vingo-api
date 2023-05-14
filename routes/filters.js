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

router.post('/add', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    let { comboId } = req.query
    if (!comboId) return res.status(400).json({ success: false, msg: "Informations manquantes." });
    let user = await prisma.user.findUnique({
        where: {
            id: req.user.id
        }
    }).catch((err) => {
        console.log(err);
        return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    })
    if (!user) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    console.log(user.comboId)
    if (!user.comboId[comboId])
        user.comboId.push(comboId)
    let newCombo = await prisma.user.update({
        where: {
            id: req.user.id
        },
        data: {
            comboId: user.comboId
        }
    }).catch((err) => {
        console.log(err);
        return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    })
    if (!newCombo) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    res.status(200).json({ success: true, msg: "Combo ajouté avec succès." });
})

router.post('/remove', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    let { comboId } = req.body
    if (!comboId) return res.status(400).json({ success: false, msg: "Informations manquantes." });
    let user = await prisma.user.findUnique({
        where: {
            id: req.user.id
        }
    }).catch((err) => {
        console.log(err);
        return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    })
    if (!user) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    comboId = user.comboId.filter((id) => id != comboId)
    let newCombo = await prisma.user.update({
        where: {
            id: req.user.id
        },
        data: {
            comboId: comboId
        }
    }).catch((err) => {
        console.log(err);
        return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    })
    if (!newCombo) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    res.status(200).json({ success: true, msg: "Combo supprimé avec succès." });
})

module.exports = router;