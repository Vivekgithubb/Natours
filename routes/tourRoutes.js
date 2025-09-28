const express = require('express')
const router = express.Router()
const tourController = require("../controllers/tourController")
const authController = require("../controllers/authController")


const { getAllTours, createTour, getTour, updateTour, deleteTour, aliasTopTours, getTourStats, getMonthlyPlan } = tourController

const { protect, restrictTo } = authController
// this is middleware for incase there is is specified else no 
// router.param('id', checkId)
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats)
router.route('/monthly-plan/:year').get(getMonthlyPlan)

router
    .route('/')
    .get(protect, getAllTours)
    .post(createTour);
// .post(checkBody, createTour); //checkBody is the middleware its called chaining of middle ware
router
    .route('/:id')
    .get(getTour)
    .patch(updateTour)
    .delete(protect,
        restrictTo('admin', 'lead-guide'),
        deleteTour)

module.exports = router