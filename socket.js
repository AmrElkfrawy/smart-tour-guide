const jwt = require('jsonwebtoken');
let io;

const authSocketMiddleware = (socket, next) => {
    const token = socket.handshake.query.token;
    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error: Invalid token'));
        }

        if (decoded.role !== 'admin') {
            return next(new Error('Authentication error: Not an admin'));
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
            throw new Error('Socket.io not initialized!');
        }
        return io;
    },
};
