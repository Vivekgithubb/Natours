class appError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        //convert statuscode to sring to add startswith operator
        this.status = `${statusCode}`.startsWith('4') ? "fail" : "error"
        this.isOperational = true;
        //“Attach a .stack property to this object, but start capturing from the point where I call captureStackTrace, not earlier.”
        //this → the error object being created.
        // this.constructor → the function/class you’re in.
        // This tells Node.js to skip this constructor in the trace, so the stack trace starts at the caller.
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = appError