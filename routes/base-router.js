// Matthew Lester NEA Project - base-router.js (Base Router Class)

// Imports
import express from 'express';

// BaseRouter Class
class BaseRouter {
    
    constructor() {
        this._router = express.Router();
    }
    
    // Returns the Express.js router for use.
    getExpressRouter() {
        return this._router;
    }
    
}

// Export the class.
export default BaseRouter;