// Matthew Lester NEA Project - server-setup.js (Server Setup)

// ServerSetup Class
class ServerSetup {
    
    setup(app) {
        
        return new Promise((resolve, reject) => {
            
            app.listen(process.env.PORT || 80, "0.0.0.0", err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
            
        });
        
    }
    
}

// Export the class.
export default ServerSetup;