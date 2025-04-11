const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('frontend'));  // Serve the 'public' folder (containing HTML, JS, etc.)

// Handle Socket.IO events
io.on('connection', socket => {
    console.log('A user connected');

    // User joins a room
    socket.on('join', room => {
        socket.join(room);
        console.log(`User joined room: ${room}`);

        // Notify others that someone joined
        socket.to(room).emit('user-joined');
    });

    // Send offer to users in the room
    socket.on('offer', room => {
        socket.to(room).emit('offer', socket.id); // Send offer to room members
    });

    // Send answer to users in the room
    socket.on('answer', (answer, room) => {
        socket.to(room).emit('answer', answer); // Send answer to room members
    });

    // Send ICE candidate to users in the room
    socket.on('ice-candidate', (candidate, room) => {
        socket.to(room).emit('ice-candidate', candidate); // Send ICE candidate to room members
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

http.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
