const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Tour = require("../../models/tourModel")
const fs = require('fs')
dotenv.config({ path: './config.env' })



const db = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose.connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() =>
    console.log("connected to backend")
)

//Read json file

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))

//import data into db
const importData = async () => {
    try {
        await Tour.create(tours)
        console.log("laoded")
    }
    catch (err) {
        console.log(err)
    }
}

//delete exisiing data from collection
const deleteData = async () => {
    try {
        await Tour.deleteMany()
        console.log('deleted')
        process.exit()
    }
    catch (err) {
        console.log(err)
    }
}

if (process.argv[2] == '--import') {
    importData()
}
else if (process.argv[2] == '--delete') {
    deleteData()
}