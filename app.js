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
const landmarkRouter = require('./routes/landmarkRoutes');
const userRouter = require('./routes/userRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const detectionRouter = require('./routes/detectionRoutes');
const customizedTourRouter = require('./routes/customizedTourRoutes');
const tourRouter = require('./routes/tourRoutes');
const cartRouter = require('./routes/cartRoutes');
const wishlistRouter = require('./routes/wishlistRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const tourCategoryRouter = require('./routes/tourCategoryRoutes');
const contactRouter = require('./routes/contactRoutes');
const chatbotRouter = require('./routes/chatbotRoutes');
const statsRouter = require('./routes/statsRoutes');

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

app.use('/api/v1/landmarks', landmarkRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/detections', detectionRouter);
app.use('/api/v1/customizedTour', customizedTourRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/carts', cartRouter);
app.use('/api/v1/wishlists', wishlistRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/tourCategories', tourCategoryRouter);
app.use('/api/v1/contact-us', contactRouter);
app.use('/api/v1/chatbot', chatbotRouter);
app.use('/api/v1/stats', statsRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
