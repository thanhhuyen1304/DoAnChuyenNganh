// Test script to check if WebSocket connection works
const io = require('socket.io-client');

console.log('Testing WebSocket connection...');

// Test connection to localhost:5000
const socket = io('http://localhost:5000', {
  auth: {
    token: 'test-token'
  },
  query: {
    token: 'test-token'
  },
  transports: ['polling', 'websocket']
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
  
  // Test creating a room
  socket.emit('create_room', {
    name: 'Test Room',
    settings: {
      difficulty: 'medium',
      mode: '1vs1',
      isPrivate: false
    }
  });
  
  // Test joining a room
  socket.emit('join_room', { roomId: 'test-room-id' });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('room_created', (data) => {
  console.log('✅ Room created event received:', data);
});

socket.on('room_joined', (data) => {
  console.log('✅ Room joined event received:', data);
});

socket.on('error', (data) => {
  console.log('⚠️ Error event received:', data);
});

// Test for 10 seconds
setTimeout(() => {
  console.log('Test completed');
  socket.disconnect();
  process.exit(0);
}, 10000);
