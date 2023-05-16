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
const webpush = require('web-push')
const { getSubscription, registerSubscription } = require('../lib/notifs');
require('dotenv').config()

webpush.setVapidDetails(
    'mailto:vingo.app@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const rateLimit = require('../middleware/rateLimit')

router.get('/key', [rateLimit, passport.authenticate('jwt', { session: false })], async (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    let vapidPublicKey = process.env.VAPID_PUBLIC_KEY
    console.log(vapidPublicKey)
    if (!vapidPublicKey) return res.json({ error: 'Impossible de récupérer la clé' })
    res.status(200).json(vapidPublicKey);
});

router.post('/register', [rateLimit, passport.authenticate('jwt', { session: false })], async (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    const subscription = req.body
    console.log(subscription)
    const user = await prisma.user.findUnique({
        where: {
            id: req.user.id
        }
    }).catch((err) => {
        console.log(err);
        return false
    })
    if (!user) return res.status(404).json({ success: false, msg: "Utilisateur introuvable." });
    let currentSubscriptions = await getSubscription(subscription)
    if (currentSubscriptions) return res.status(200).json({ success: true, msg: "Abonnement déjà existant." });
    let newSubscription = await registerSubscription(user, subscription)
    if (!newSubscription) return res.status(500).json({ success: false, msg: "Erreur lors de l'ajout de l'abonnement." });
    res.status(200).json({ success: true, msg: "Abonnement mis à jour." });
})

module.exports = router;