const express = require('express')
const router = express.Router()
const userController = require("../controllers/userController")
const authController = require("../controllers/authController")

const { getAllUsers, createUser, getUser, updateUser, deleteUser, deleteMe, updateMe } = userController

const { signUp, login, forgotPassword, resetPassword, updatePassword, protect } = authController

router.post("/signup", signUp)
router.post("/login", login)
router.post("/forgot-password", forgotPassword)
router.patch("/reset-password/:token", resetPassword)
router.patch("/update-password", protect, updatePassword)
router.patch("/update-user", protect, updateMe)
router.delete("/deleteMe", protect, deleteMe)

router
    .route("/")
    .get(getAllUsers)
    .post(createUser)

router
    .route("/:id")
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser)

module.exports = router