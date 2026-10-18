const { io } = require('socket.io-client');

const token = process.argv[2];

if (!token) {
  console.error('Usage: node scripts/ws-test.js <access_token>');
  process.exit(1);
}

const socket = io('http://localhost:3000/notifications', {
  auth: { token },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('CONNECTED   socket', socket.id);
  console.log('waiting for notifications...');
});

socket.on('notification', (payload) => {
  console.log('NOTIFICATION', JSON.stringify(payload, null, 2));
});

socket.on('connect_error', (error) => {
  console.log('REJECTED   ', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('DISCONNECTED', reason);
});