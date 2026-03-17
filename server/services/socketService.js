let io = null;

module.exports = {
  init(server) {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH']
      }
    });

    io.on('connection', (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);
      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      });
    });

    return io;
  },

  getIO() {
    if (!io) {
      throw new Error('Socket.IO not initialized. Call init() first.');
    }
    return io;
  }
};
