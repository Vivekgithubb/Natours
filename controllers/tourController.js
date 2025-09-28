const fs = require('fs');
const Tour = require("../models/tourModel")
const APIfeatures = require("../utils/APIfeatures")
const catchAsync = require("../utils/catchAsync");
const appError = require('../utils/appError');

//2. Document storing 
//json.parse to automatically convert it to js object

// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
//     //${__dirname} current directry name
// );
// exports.checkId = (req, res ,next, next, val) => {
//     if (req.params.id * 1 > tours.length) { //*1 to convert to int
//         return res.status(404).json({
//             status: 'Failed',
//             message: 'Invalid ID',
//         });
//     }
//     console.log(val)
//     next()
// }
// exports.checkBody = (req, res ,next, next) => {
//     if (!req.body.name) {
//         return res.status(400).json({
//             status: 'Failed',
//             message: 'No Name ',
//         });
//     }
//     if (!req.body.price) {
//         return res.status(400).json({
//             status: 'Failed',
//             message: 'No price',
//         });
//     }
//     next()
// }
// alias middleware
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = '-ratingsAverage,price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next()
}



//3. Route handlers
exports.getAllTours = catchAsync(async (req, res, next) => {

    //1filtering
    //  const tours = await tours.find().where('difficulty').equals('easy').where("duration").equals(10)

    // //{...req.query} this creates a new obj of req.query wihch can be later modified so that original remains the same 
    // const queryObj = { ...req.query }
    // const exculdedField = ['page', 'sort', 'limit', 'fields']
    // exculdedField.forEach(el => delete queryObj[el]) //limits those excludee fields from the queryobj , used for other things like paginations etc

    // // const tours = await Tour.find() // we dont do this cause it directly returns the value and we cant do chaining to lit like adding different methods etc
    // //Therefore we split it 

    // //1a. advance fitering for gte , lte , lt , gt to convert {gte:5} to {$gte :5}
    // let querystr = JSON.stringify(queryObj);
    // querystr = querystr.replace(/\b(gte|lte|lt|gt)\b/g, match => `$${match}`)
    // let query = Tour.find(JSON.parse(querystr))



    //2. sorting
    // if (req.query.sort) {
    //     const sortBy = req.query.sort.split(',').join(" ")
    //     //sort("price rating") we can do this to specify multiple sorting attributes 
    //     query = query.sort(sortBy)
    // }
    // else {
    //     query = query.sort('-createdAt')
    // }

    //3.field limmiting(returning only certain fields)
    // if (req.query.fields) {
    //     const fields = req.query.fields.split(",").join(" ");
    //     query = query.select(fields)
    // }
    // else {
    //     //removing the field named v
    //     query = query.select('-__v')
    // }

    //4.pagination
    //skip shows how many results to be skipped 
    //page1 = 1-10
    //page2 = 11-20 
    //etc
    // const page = req.query.page * 1 || 1 // convrt string to int
    // const limit = req.query.limit * 1 || 100
    // const skip = (page - 1) * limit
    // query = query.skip(skip).limit(limit)
    // if (req.query.page) {
    //     const newTours = await Tour.countDocuments()
    //     if (skip >= numTours) throw new Error("This page does not exists")
    // }
    //this chaining only works cause we return "this" object at the end
    const features = new APIfeatures(Tour.find(), req.query).filter().Sort().limitFields().paginate()
    const tours = await features.query
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours,
        },
    });
});
exports.getTour = catchAsync(async (req, res, next) => {
    // const reqTour = req.params;
    // const reqId = reqTour.id * 1; // to convert from string to number
    // const tour = tours.find((el) => el.id === reqId);

    const Id = req.params.id
    const tour = await Tour.findById(Id) // Tour.findOne({_id:Id})
    // const tour = await Tour.findById(Id).populate('guides') // Tour.findOne({_id:Id})

    if (!tour) {
        return next(new appError("no tour found with that id", 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        },
    });

    res.status(400).json({
        status: 'Rejected',
        message: "Invalid Data"
    });

});



exports.createTour = catchAsync(async (req, res, next) => {
    // const data = req.body;
    // const id = tours[tours.length - 1].id + 1;
    // newTours = Object.assign({ id: id }, data); // same as {id:id,...data}
    // tours.push(newTours);
    // fs.writeFile(
    //     `${__dirname}/dev-data/data/tours-simple.json`,
    //     JSON.stringify(tours),
    //     (err) => {
    //         res.status(201).json({
    //             status: 'sucess',
    //             results: tours.length,
    //             data: {
    //                 tours: newTours,
    //             },
    //         });
    //     }
    // );

    const newTour = await Tour.create(req.body)
    res.status(201).json({
        status: 'success',
        data: {
            tours: newTour,
        },
    });


});
exports.updateTour = catchAsync(async (req, res, next) => {

    const Id = req.params.id
    const data = req.body
    const updatedtour = await Tour.findByIdAndUpdate(Id, data, {
        new: true, //new updated doc will be returned
        runValidators: true //runs update validators on this command
    })

    if (!updatedtour) {
        return next(new appError("no tour found with that id", 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            tour: updatedtour,
        },
    });

    res.status(400).json({
        status: 'Rejected',
        message: "Invalid Data"
    });

});

exports.deleteTour = catchAsync(async (req, res, next) => {

    const Id = req.params.id
    const tour = await Tour.findOneAndDelete(Id)
    if (!tour) {
        return next(new appError("no tour found with that id", 404))
    }
    res.status(204).json({
        //204 sends no content so u cant see the results
        status: 'success',
        data: null, //we send null to show its deleted
    });

}
);

exports.getTourStats = catchAsync(async (req, res, next) => {

    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: '$difficulty', //calculates for each difficulty type
                // _id: { $toUpper: '$difficulty' },// gives the name in caps 
                numRatings: { $sum: '$ratingsQuantity' },
                numTours: { $sum: 1 }, //add 1 for each document that goes through the pipeline present so we get the total count 
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            }
        },
        {
            $sort: { avgPrice: -1 } //same namne as above mentioned , 1 for ascending order , -1 for descending
        },
        // {
        //     $match: { _id: { $ne: 'easy' } } //exclude the docs that say difficulty(id) easy
        // }

    ])
    if (!stats) {
        return next(new appError("Could not get the stats", 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });

})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {   //unwind deconstructs the array and converts each elemnt to indiviual document and gives it 
            //since there are 3 start dates for each tour and there are 9tours
            //we get 27 results instead of usual 9 
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) }
            }
        },
        {
            $group:
            {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                toursName: { $push: '$name' }
            }
        },
        {
            $addFields:
            {
                month:
                    '$_id'

            }
        },
        {
            $project: { //makes the id invisible , make it 1 to be visible or just dont add the field
                _id: 0
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        // {
        //     $limit: 6 //limits the number of outputs
        // }

    ])
    res.status(200).json({
        status: 'success',
        results: plan.length,
        data: {
            plan
        }
    });


})