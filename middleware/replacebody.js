
module.exports = (req, res, next) => {
    req.body = req.body.body
    next()
}