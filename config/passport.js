const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt;
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const pathToKey = path.join(__dirname, '..', 'id_rsa_pub.pem');
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');

// At a minimum, you must pass the `jwtFromRequest` and `secretOrKey` properties
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ['RS256']
};

module.exports = (passport) => {
    passport.use(new JwtStrategy(options, async function(jwt_payload, done) {
        let user = await prisma.user.findUnique({
            where: {
                id: jwt_payload.sub
            }
        }).catch((err) => {
            console.log(err);
            return done(err, false);
        })
        if (!user) { return done(null, false) }

        return done(null, user);
    }));
}