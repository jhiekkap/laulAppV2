// import other routes 
const allRoutes = require('./allRoutes');
const soundRoutes = require('./soundRoutes'); 
const appRouter = (app, fs) => {

    // default route
     app.get('/', (req, res) => {
        res.send('welcome to the development api-server');
    });
 
    soundRoutes(app, fs);
    allRoutes(app, fs); 
};

module.exports = appRouter;