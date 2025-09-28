class APIfeatures {
    constructor(query, queryString) {
        this.query = query
        this.queryString = queryString
    }
    filter() {
        // const tours = await tours.find().where('difficulty').equals('easy').where("duration").equals(10)

        //{...req.query} this creates a new obj of req.query wihch can be later modified so that original remains the same 
        const queryObj = { ...this.queryString }
        const exculdedField = ['page', 'sort', 'limit', 'fields']
        exculdedField.forEach(el => delete queryObj[el]) //limits those excludee fields from the queryobj , used for other things like paginations etc

        // const tours = await Tour.find() // we dont do this cause it directly returns the value and we cant do chaining to lit like adding different methods etc
        //Therefore we split it 

        //1a. advance fitering for gte , lte , lt , gt to convert {gte:5} to {$gte :5}
        let querystr = JSON.stringify(queryObj);
        querystr = querystr.replace(/\b(gte|lte|lt|gt)\b/g, match => `$${match}`)
        this.query = this.query.find(JSON.parse(querystr))
        //"this" returns the entire object now 
        return this; //this is to make sure we can use optional chaining
    }
    Sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(" ")
            //sort("price rating") we can do this to specify multiple sorting attributes 
            this.query = this.query.sort(sortBy)
        }
        else {
            this.query = this.query.sort('-createdAt')
        }
        return this;
    }
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(",").join(" ");
            query = this.query.select(fields)
        }
        else {
            //removing the field named v
            this.query = this.query.select('-__v')
        }
        return this;
    }
    paginate() {
        const page = this.queryString.page * 1 || 1 // convrt string to int
        const limit = this.queryString.limit * 1 || 100
        const skip = (page - 1) * limit
        this.query = this.query.skip(skip).limit(limit)
        return this;
    }

}

module.exports = APIfeatures