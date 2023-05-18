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
const webpush = require('web-push');
require('dotenv').config()

const rateLimit = require('../middleware/rateLimit');
const filterCombo = require('../lib/filterCombo');

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
                priceUp: parseInt(combo.priceUp) || 0,
                priceDown: parseInt(combo.priceDown) || 10000000,
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

router.post('/notify', [rateLimit], async (req, res, next) => {
    if (!req.body?.headers) return res.status(400).json({ success: false, msg: "Informations manquantes." });
    let authorization = req.body?.headers['Authorization']?.split(' ')[1]
    if (!authorization) return res.status(400).json({ success: false, msg: "Informations manquantes." });
    let token = jwt.verify(authorization, process.env.SECRET)
    if (token != process.env.SECRET) return res.status(401).json({ success: false, msg: "Informations incorrectes." });

    let comboList = req.body?.body?.comboList
    if (!comboList) return res.status(400).json({ success: false, msg: "Informations manquantes." });

    let notifications = await prisma.notification.findMany().catch(e => {
        console.log(e)
        return { error: 'Impossible de trouver les notifications' }
    })

    for (let i = 0; i < notifications.length; i++) {
        let notifUser = await prisma.user.findUnique({
            where: {
                id: notifications[i].userId
            },
            include: {
                combo: true
            }
        }).catch(e => {
            console.log(e)
            return { error: 'Impossible de trouver l\'utilisateur' }
        })
        if (!notifUser) return
        if (comboList.length == 0) return
        if (!notifUser.combo.find(c => c.name == comboList[0].comboId)) return
        comboList = await filterCombo(notifUser, comboList)
        if (comboList.length == 0) return
        let subscription = {
            endpoint: notifications[i].endpoint,
            keys: {
                auth: notifications[i].auth_token,
                p256dh: notifications[i].public_key
            }
        }

        try {
            let content;
            if (comboList.length == 1) {
                content = {
                    title: comboList[0].title,
                    body: comboList[0].brand + ' (' + comboList[0].size + ') - ' + comboList[0].price + '€',
                    icon: comboList[0].thumbnail,
                    vibrate: [100, 50, 100],
                    data: {
                        url: comboList[0].url
                    },
                    actions: [
                        {
                            action: comboList[0].url, title: 'Voir',
                        },
                    ]

                }
            } else {
                content = {
                    title: comboList.length + ' nouveaux articles',
                    body: comboList[0].brand + ' (' + comboList[0].size + ')',
                    icon: comboList[0].thumbnail,
                    vibrate: [100, 50, 100],
                    data: {
                        url: comboList[0].url
                    },
                    actions: [
                        {
                            action: comboList[0].url, title: 'Voir',
                        },
                    ]

                }
            }
            webpush.sendNotification(subscription, JSON.stringify(
                content
            ))
        }
        catch (e) {
            console.log(e)
            await prisma.notification.delete({
                where: {
                    id: notifications[i].id
                }
            }).catch(e => {
                console.log(e)
                return { error: 'Impossible de supprimer la notification' }
            })
        }
    }

})
module.exports = router;