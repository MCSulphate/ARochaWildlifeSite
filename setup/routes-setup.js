// Matthew Lester NEA Project - routes-setup.js (Routes Setup)

// Imports
import IndexRouter from "../routes/index";
import DataUploadRouter from "../routes/data-upload";
import AdminRouter from "../routes/admin";
import UserRouter from "../routes/user";
import DataReviewRouter from "../routes/data-review";

// RoutesSetup Class
class RoutesSetup {
    
    setup(app) {
        
        // Data Upload Routes (new, show, etc.)
        app.use("/track", new DataUploadRouter().getExpressRouter());
        
        // Admin Routes (panel, accounts, etc.)
        app.use("/admin", new AdminRouter().getExpressRouter());
        
        // User Routes (profile)
        app.use("/user", new UserRouter().getExpressRouter());
        
        // Data-Review Routes (main, show)
        app.use("/review", new DataReviewRouter().getExpressRouter());
        
        // Index Routes (landing, login, etc.)
        // This has to be last, as it has the catch-all route.
        app.use(new IndexRouter().getExpressRouter());
        
    }
    
}

// Export the class.
export default RoutesSetup;