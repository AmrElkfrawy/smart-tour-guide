const mongoose = require('mongoose');

// loading environment variables
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const app = require('./app');

const dbConnection = process.env.DB_CONNECTION_STRING;
mongoose.connect(dbConnection).then(() => {
    console.log('DB connection successful');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Starting server on port ' + port);
});
