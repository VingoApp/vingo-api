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

router.get('/login/federated/google', passport.authenticate('google'));

/**
 * -------------- POST ROUTES ----------------
 */

router.get('/protected', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    res.status(200).json({ success: true, msg: "You are successfully authenticated to this route!"});
});

/* // Validate an existing user and issue a JWT
router.post('/login', async function (req, res, next) {
    let { password, email } = req.body.body
    if (!email || !password) return res.status(401).json({ success: false, msg: "Informations incorrectes." })
    let user = await prisma.user.findUnique({
        where: {
            email: email
        }
    }).catch((err) => {
        console.log(err);
        return next(err);
    })
    if (!user) return res.status(401).json({ success: false, msg: "Informations incorrectes." });
    const isValid = utils.validPassword(password, user.hash, user.salt);

    if (isValid) {
        const tokenObject = utils.issueJWT(user);
        res.status(200).json({ success: true, user: user, token: tokenObject.token, expiresIn: tokenObject.expires });
    }else
        res.status(401).json({ success: false, msg: "Informations incorrectes." });

});

// Register a new user
router.post('/register', async function (req, res, next) {
    let { password, username, email } = req.body.body
    const saltHash = utils.genPassword(password);

    const salt = saltHash.salt;
    const hash = saltHash.hash;

    const newUser = await prisma.user.create({
        data: {
            username: username,
            email: email,
            hash: hash,
            salt: salt,
            admin: true
        }
    }).catch((err) => {
        return false
    })
    if (!newUser) return res.status(401).json({ success: false, msg: "Une erreur est survenue." })

    const tokenObject = utils.issueJWT(newUser);
    if (!tokenObject?.token) return res.status(401).json({ success: false, msg: "Une erreur est survenue." })

    res.json({ success: true, user: newUser, token: tokenObject.token, expiresIn: tokenObject.expires });

}); */

router.get('/oauth2/redirect/google', passport.authenticate("google", { session: false }),
    (req, res) => {
        jwt.sign(
            { user: req.user },
            "secretKey",
            (err, token) => {
                if (err) {
                    return res.redirect(process.env.REDIRECT_URL+'/?callback='+null)
                }
                res.redirect(process.env.REDIRECT_URL+'/?callback='+token)
            }
        );
    }
);

passport.use(new GoogleStrategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: '/oauth2/redirect/google',
    scope: ['email', 'profile'],
    prompt: 'consent'
}, async function verify(issuer, profile, cb) {

    let user = await prisma.user.findUnique({
        where: {
            email: profile.emails[0]?.value
        }
    }).catch((err) => {
        console.log(err);
        return cb(err);
    })

    if (user)
        return cb(null, user);
    else {
        user = await prisma.user.create({
            data: {
                username: profile?.displayName || profile.name.givenName,
                email: profile.emails[0]?.value,
                issuer: issuer
            }
        }).catch((err) => {
            return cb(err);
        })
        if (!user) return cb(null, false)
        return cb(null, user);
    }

}));

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: "secretKey",
        },
        async (jwtPayload, done) => {
            try {
                const user = jwtPayload.user;
               done(null, user);
            } catch (error) {
                done(error, false);
            }
        }
    )
);

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, email: user.email, issuer: user.issuer });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

module.exports = router;