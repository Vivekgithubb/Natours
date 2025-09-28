const mongoose = require('mongoose')
const slugify = require("slugify")
const validator = require("validator")
const User = require("./userModel")
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tours Need to have a name'],
        trim: true,
        unique: true,
        minlength: [10, "Tour mmust have min length of 10"],
        maxlength: [40, "Tour mmust have max length of 40"],
        //this uses the VALIDATOR library to use custom validation
        // validate: [validator.isAlpha, "Tour name must only contain characters"]
    },
    slug: {
        type: String
    },
    duration: {
        type: Number,
        required: [true, "Enter the duration"]
    },
    maxGroupSize: {
        type: Number,
        required: [true, "Needs to have max group size"]
    },
    difficulty: {
        type: String,
        required: [true, "Needs to have difficulty"],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: "Difficulty is easy/medium/difficult"
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Ratings must be above 1.0'],
        max: [5, 'Ratings must be  below 5.0']

    },
    ratingsQuantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        required: [true, "every tour needs a name"]
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                //wont work on updates since it uses the "this" keyword
                return val < this.price;
            },
            message: "Discount price ({VALUE}) should be below regular price"
        },
    },
    summary: {
        type: String,
        trim: true //removes whitespace at start and end 
    },
    description: {
        type: String,
        required: [true, "Needs a description"],
        trim: true //removes whitespace at start and end 
    },
    imageCover: {
        type: String,
        required: [true, "Needs to have an image"]
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        //GeoJson
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ],
}, { //this is to show the virtual schemea in the output
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})
//this is not stored in database nly virtually thus cant be used in actual database queries
tourSchema.virtual('durationInWeeks').get(function () { //dont use arrow cause we need this eyword which is only available in function only
    return this.duration / 7
})

//DOCUMENT middleware
//premiddleware which runs before an actual event like "save"
//runs before .save() .create() but wont run things like .insertMany()


//embedding guides
// tourSchema.pre('save', async function (next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id))
//     this.guides = await promises.all(guidesPromises)
//     next();
// })

// tourSchema.pre("save", function (next) { //this will be called before an document is saved to the database
//     this.slug = slugify(this.name, { lower: true });
//     next()
// })

tourSchema.pre(/^find/, function (next) {
    this.populate({ path: 'guides', select: "-__v  -passwordChangedAt" })
    next()
})

tourSchema.pre(/^find/, function (next) { //this will be called before an query is executed
    this.find({ secretTour: { $ne: true } })
    this.start = Date.now()
    next()
})

// tourSchema.post("save", function (doc, next) { //this will be called after an document is saved to the database , doc is the previously saved document
//     console.log("Post Middleware from tourModel")

// })

//QUERY niddleware
// /^find/ says to trigger this middleware for all functions usiong te find method like findOne findMany etc

tourSchema.post(/^find/, function (docs, next) { //this will be called before an query is executed
    this.find({ secretTour: { $ne: true } })
    console.log(`query took ${Date.now() - this.start} ms`)
    next()
})


//AGGREGATION Middleware
tourSchema.pre('aggregate', function (next) { //this will be called before an query is executed
    //remove all documents from output where secret tours is true 
    //only for the ones using aggregate function 
    // we add a new match statement , unshift is used to add an element to the start of the array 
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
    next()
})

const Tour = mongoose.model('Tour', tourSchema)
module.exports = Tour