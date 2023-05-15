
module.exports = function rateLimit(req, res, next) {
    const rateLimit = require('express-rate-limit');
    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 5 // 5 requests,
    });
    limiter(req, res, next);
}