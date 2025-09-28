const { promisify } = require("util")
const jwt = require("jsonwebtoken")
const User = require("../models/userModel")
const catchAsync = require("../utils/catchAsync")
const appError = require("../utils/appError")
const sendEmail = require("../utils/email")
const crypto = require('crypto')
const bcrypt = require("bcrypt")
const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}


const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        // secure: true, //for https
        httpOnly: true,
    }
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true
    res.cookie('jwt', token, {
        cookieOptions
    })

    //removes password from the output 
    user.password = undefined

    res.status(statusCode).json({
        status: "Success",
        token,
        data: {
            user
        }
    })
}

exports.signUp = catchAsync(async (req, res) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: req.body.password,
        passwordConf: req.body.passwordConf,
        passwordChangedAt: req.body.passwordChangedAt
    })
    createSendToken(newUser, 200, res)
    // const token = signToken(newUser._id)
    // res.status(200).json({
    //     status: "Success",
    //     token,
    //     data: {
    //         user: newUser
    //     }
    // })
})

exports.login = catchAsync(async (req, res, next) => {
    const { name, email, password, passwordConf } = req.body;
    //1) check is email and password exists
    if (!email || !password) {
        return new appError("Please provide and email and a password", 400)
    }

    //2) check if user exists and password is correct

    const user = await User.findOne({ email: email }).select('+password') //to include the password since we made select:true in userMOdel
    if (!user) {
        return next(new appError("No user found", 400))
    }
    //defined in userModel to compare current entered password and existsing password
    const correct = await user.correctPassword(password, user.password)
    if (!correct) {
        return next(new appError("Wrong email or password", 401))
    }

    //3)is all ok Then send the token 
    createSendToken(user, 200, res)
    // const token = signToken(user._id)
    // res.status(200).json({
    //     status: "success",
    //     token,
    //     message: "loging in"
    // })
})

exports.protect = catchAsync(async (req, res, next) => {

    let token;
    //1)Get token and checck if its there/exists
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return next(new appError("Token not verified thus U are not logged in", 401))

    //2)Verification/ Validate the token
    ///we convert the verification to a promise so we can then call it and use async await
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    console.log(decoded)


    //3)Check if user still exists
    const curUser = await User.findById(decoded.id)
    if (!curUser)
        return next(new appError("The user does no longer exists", 401))


    //4)Check if user changed password after jwt was issued
    if (curUser.changedPasswordAfter(decoded.iat)) {
        return next(new appError("recently the password was changed .. Please login again", 401))
    }
    //5) call next() and grant access to proteted route
    req.user = curUser;
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        //roles is an array 
        if (!roles.includes(req.user.role)) {
            return next(new appError("U do not have permissions to do this", 401))
        }
        next()
    }
}


exports.forgotPassword = catchAsync(async (req, res, next) => {

    //1. get user bvased on email
    const user = await User.findOne({ email: req.body.email })
    if (!user) return next(new appError("No user with that address", 404))

    //2. generate random req token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false }) //orelse we will get error since we wont add the required fields from the schema

    //3. send it to user email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`

    const message = `Forgot Your password?. Submit a patch req with ur new password and passwordConfirmation to ${resetURL}.If your didnt forget your password ignore this message`
    console.log("will send mail now")
    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset Token (for 10 mins only)',
            message,

        })
        console.log("User found:", user.email);
        console.log("Reset token generated:", resetToken);

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        })
    }
    catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpired = undefined;
        await user.save({ validateBeforeSave: false })
        return next(new appError("There was an error sending an email, try again later", 500))
    }


})
exports.resetPassword = catchAsync(async (req, res, next) => {

    //1. get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpired: { $gt: Date.now() } }).select('+password')

    if (!user) {
        return next(new appError("No such user , or expired reset token", 404))
    }

    //2. set password only if user is there and token not expired
    const isSame = await bcrypt.compare(req.body.password, user.password)
    if (isSame) {
        return next(new appError("New and old passwords cant be the same"))
    }
    user.password = req.body.password;
    user.passwordConf = req.body.passwordConf;
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    await user.save()

    //3 update the changes passwordAt property for user
    //in userMOdel.js


    //4 log the user in 
    createSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    //1 get user
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return next(new appError("No user with such email.Try again"))

    //2 check if password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new appError("Curent password is incorrect", 401))
    }

    //3 then allow to update the pasword
    user.password = req.body.password;
    user.passwordConf = req.body.passwordConf;
    await user.save();

    //log the user in, send the jwt
    createSendToken(user, 200, res)

})


