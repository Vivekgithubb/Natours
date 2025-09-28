const express = require('express');
const app = express();
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const http = require('http');
const port = 3000;
const morgan = require('morgan')
const tourRouter = require("./routes/tourRoutes")
const userRouter = require("./routes/userRoutes")
const appError = require("./utils/appError")
const globalErrorHandler = require("./controllers/errorController")


//1. Global Middlewares

//security hhtp headers
app.use(helmet())

//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

//requrests limit from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //100 requests from same ip in a hour
  message: 'too many requests from this IP , please try again in an hour'
})
app.use('/api', limiter); //onlyfor all routes starting with api


//body parser , reading data into req.body
app.use(express.json({ limit: '10kb' })); //max size of body

//Data sanitizaion against noSQL query injection 
app.use(mongoSanitize())

//data sanitiation against cross side scripting attacks
app.use(xss())

//to prevent parameter pollution
app.use(hpp({
  whitelist: ['duration',
    'ratingsQuantity',
    "maxGroupSize",
    "ratingsAverage",
    "difficulty",
    "price"]
}))

//serving static files
app.use(express.static(`${__dirname}/public`))


//test middleware
app.use((req, res, next) => {
  console.log("hello");
  next()
})
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString()
  next()
})


// '/api/v1/tours/:id?' means that id is optional
//use patch to only update part of the ans
//use push to update entire object


// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);

// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//when method is get "getAllTours" is called
//when method is post "createTour" is called
// short hand way of writing



app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)


//this runs if no routes are found, always write at end or else will just enter this route everytime
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: "failed",
  //   message: `cant find that ${req.originalUrl}`
  // })
  // const err = new Error(`cant find that ${req.originalUrl}`)
  // err.status = "failed"
  // err.statusCode = 404
  // next(err) // if we pass anything in next it will consider it as an error

  next(new appError(`cant find that ${req.originalUrl}`, 404))
})

//Error handling middleware
app.use(globalErrorHandler)

module.exports = app
