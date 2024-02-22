const express = require('express');
const landmarkRouter = require('./routers/landmarkRouter');

const app = express();

app.use('/landmarks', landmarkRouter);

module.exports = app;
