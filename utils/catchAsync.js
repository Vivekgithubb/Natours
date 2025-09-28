module.exports = fn => {
    return (req, res, next) => { fn(req, res, next).catch(next) } //next ensures that error is sent to error middlewares 
}