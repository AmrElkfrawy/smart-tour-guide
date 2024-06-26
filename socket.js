const appError = require('./utils/appError');
const jwt = require('jsonwebtoken');
let io;

const authSocketMiddleware = (socket, next) => {
    const token = socket.handshake.query.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new appError('Authentication error', 401));
        }

        if (decoded.role !== 'admin') {
            return next(new appError('Authentication error', 401));
        }
        next();
    });
};

module.exports = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer);

        const adminNamespace = io.of('/admin');
        adminNamespace.use(authSocketMiddleware);
        return io;
    },
    getIO: () => {
        if (!io) {
            return new Error('Socket.io not initialized!');
        }
        return io;
    },
};
