const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');

const globalErrorHandler = require('./controllers/errorController');
const landmarkRouter = require('./routes/landmarkRoutes');
const userRouter = require('./routes/userRoutes');
const categoryRouter = require('./routes/categoryRoutes');

const app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

app.use(express.json({ limit: '10kb' }));

app.use('/api/v1/landmarks', landmarkRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
