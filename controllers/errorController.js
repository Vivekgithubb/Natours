const appError = require("../utils/appError")

const handleCastErrorDB = (err, res) => {
    const message = `Invalid ${err.path} : ${err.value}` //check these values in postman 
    return new appError(message, 400)
}
const handleDuplicateFieldDB = (err, res) => {
    const text = err.keyValue.name//from google
    const message = `Duplicate field value: ${text}, Please use another value`
    return new appError(message, 400)
}
const handleValidationerrorDB = (err, res) => {
    const error = Object.values(err.errors).map(value => value.message)
    const message = `Invalid Input Data. ${error.join('. ')}`
    return new appError(message, 400)
}
const handleJWTerror = err => {
    return new appError("Invalid json web token.Please login again", 401)
}
const handleJWTExpired = err => {
    return new appError("Token expired. Please login again", 401)
}


const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
}
const sendErrorProd = (err, res) => {
    //operational eror , trusted : therefore send to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    }
    //unkown error or programming error : dont send to client
    else {
        //1)Log error
        console.error('Error😅')

        //2) generic message
        res.status(500).json({
            status: "Error",
            message: "Something went Wrong"
        })
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error'
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res)

    }
    else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }
        if (err.name === 'CastError') {
            // We check err.name instead of error.name because { ...err } only copies enumerable properties.
            // Non-enumerable properties like 'name', 'message', and 'stack' from the Error object are lost in the copy.
            error = handleCastErrorDB(error)
        }
        if (error.code === 11000) error = handleDuplicateFieldDB(error)
        if (err.name === 'ValidationError') error = handleValidationerrorDB(error)

        if (err.name === 'JsonWebTokenError') error = handleJWTerror(error)
        if (err.name === 'TokenExpiredError') error = handleJWTExpired(error)

        sendErrorProd(error, res)
    }
}