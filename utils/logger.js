const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logFormat = format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors('stack'),
        format.splat(),
        format.json()
    ),
    transports: [
        new transports.DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat,
        }),
        // new transports.Console({
        //     format: format.combine(format.colorize(), logFormat),
        // }),
    ],
    exceptionHandlers: [
        new transports.File({ filename: 'logs/exceptions.log' }),
    ],
});

// Stream for Morgan
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};

module.exports = logger;
