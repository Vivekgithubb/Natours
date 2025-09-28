const mongoose = require('mongoose')
const crypto = require('crypto')
const { default: isEmail } = require('validator/lib/isEmail')
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "User needs to have name"],

    },
    email: {
        type: String,
        required: [true, "Every user needs and email"],
        unique: true,
        lowercase: true,
        validate: [isEmail]
    },
    photos: {
        type: String,
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'lead-guide', 'guide'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, "needs to have a password"],
        minlength: 8,
        select: false //doesnt send or show password in logs
    },
    passwordConf: {
        type: String,
        required: [true, "needs to confirm the password"],
        //this only work on save and not update unless we use save() 
        validate: {
            validator: function (el) {
                return el === this.password
            },
            message: "The passwords ned to match"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpired: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})
//Encryption between getting the data and saving the data
userSchema.pre("save", async function (next) {
    if (!this.isModified('password')) return next(); //if the field is not been modified skip and call next midleware

    this.password = await bcrypt.hash(this.password, 12)
    this.passwordConf = undefined //deleting the confirmed password
    this.passwordChangedAt = Date.now() - 1000;
    next()

})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000
    next();

})

userSchema.pre(/^find/, function (next) {
    //this points to current query
    // this.find({ active: false }) //use this but since some users dont have that field we use the below method
    this.find({ active: { $ne: false } })
    return next()
    //return only active users
})


userSchema.methods.changedPasswordAfter = function (JWTtimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTtimestamp < changedTimeStamp  //If JWTtimestamp < changedTimeStamp, that means the token was issued before the password was changed → token is invalid.
        //If not, token is still valid.
    }
    //false means not chnaged
    return false
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex')

    //1. hashing and encryption of resetToken
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    console.log({ resetToken }, this.passwordResetToken)

    this.passwordResetExpired = Date.now() + 10 * 60 * 1000

    return resetToken
}

const User = mongoose.model('User', userSchema)
module.exports = User