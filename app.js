// @ Description: Main entry point for the application. This file contains the configuration for the express server, including middleware, routes, and error handling.
const path = require('path');

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const logger = require('./utils/logger');

const globalErrorHandler = require('./controllers/errorController');
const bookingController = require('./controllers/bookingController');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views/emails'));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Enable requests from any origin
app.use(cors());

// Set Security HTTP headers
app.use(helmet({ contentSecurityPolicy: false }));

// Development logging in console
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Custom Morgan format string that excludes the timestamp
const customMorganFormat =
    ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] - :referrer :user-agent';

// Use Morgan middleware with the custom format
app.use(morgan(customMorganFormat, { stream: logger.stream }));

// Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
app.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    bookingController.webhookCheckout
);

// Body parser, reading data from body in req.body
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// Data sanitization
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'name',
            'category',
            'ratingsQuantity',
            'rating',
            'duration',
            'maxGroupSize',
            'difficulty',
            'price',
            'role',
        ],
    })
);

const limiter = rateLimit({
    max: 300,
    windowMS: 60 * 60 * 1000,
    message:
        'Too many requests from this IP, please try again in after an hour.',
});
// protect from dos
app.use('/api', limiter);

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

require('./routes/routes')(app);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
