socket.on('ping', () => {
  socket.emit('pong');
});

// Add reconnection logic
socket.on('disconnect', () => {
  console.log('Disconnected from server');
  setTimeout(() => {
    socket.connect();
  }, 1000);
}); 