const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const app = express();
const fs = require('fs');
require('dotenv').config()

// enable files upload 
app.use(fileUpload({
    createParentPath: true 
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static('uploads'))  
app.use(express.static('build'));

require('./routes/routes.js')(app, fs);

//start app 
const port = process.env.PORT || 3001;
app.listen(port, () =>
    console.log(`App is listening on port ${port}.`)
);