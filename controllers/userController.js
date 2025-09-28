const User = require("../models/userModel");
const appError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const filterObj = (obj, ...allowedField) => {
    const newObj = {};
    Object.keys(obj).forEach(el => { // loops through all keys of the obj like name,email etc and makes and array of them 
        if (allowedField.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}


exports.getAllUsers = catchAsync(async (req, res) => {
    const Users = await User.find()
    res.status(200).json({
        status: 'success',
        results: Users.length,
        data: {
            Users,
        },
    });
})

exports.updateMe = catchAsync(async (req, res, next) => {
    //1 creat error if user POST password data
    if (req.body.password || req.body.passwordConf) return next(new appError("Cant include password or password Confirm, Not for password update. Please use upadte-passsword", 400))


    //2 FIlter out unwanted field
    const filterBody = filterObj(req.body, 'name', 'email') //allowing to update only 2 rows


    //3 update user document
    //use findbyidAndUpdate only when dealing with non sensitive data like valuues and not passwords etc
    const UpdatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, { new: true, runValidators: true });


    res.status(200).json({
        status: 'success',
        data: {
            user: UpdatedUser
        }

    })
})

exports.getUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not done yet'
    })
}
exports.updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not done yet'
    })
}
exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not done yet'
    })
}
exports.deleteMe = catchAsync(async (req, res, next) => {

    await User.findByIdAndUpdate(req.user.id, { active: false })

    res.status(204).json({
        status: 'success',
        data: null
    })
})
exports.deleteUser = (req, res) => {
    res.status(204).json({
        status: 'error',
        message: 'Route not implemented yet'
    })
}
