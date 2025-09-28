const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })
const app = require("./app")
// console.log(process.env)

//5.Server
const db = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

//online db
mongoose.connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() =>
    console.log("connected to backend")
)
//local db
// mongoose.connect(process.env.DATABASE_LOCAL, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false
// }).then(() =>
//     console.log("connected to backend"))

process.on('unhandledException', err => { //like undefined variables etc or any other uncaught exceptions
    console.log(err)
    process.exit(1) //will close the app
})
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`running at ${port}`);
});
process.on('unhandledRejection', err => { //like wrong password etc
    console.log(err.name, err.message)
    server.close(() => { //server closes only when all requests are over
        process.exit(1) //will close the app

    })
})
