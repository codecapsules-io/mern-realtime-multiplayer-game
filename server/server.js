const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

mongoose.connect('mongodb://localhost:27017/realtimegame', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const gameStateSchema = new mongoose.Schema({
  players: Array,
  ball: Object
});

const GameState = mongoose.model('GameState', gameStateSchema);

let gameState = {
  players: [],
  ball: { x: 300, y: 200 }
};

io.on('connection', (socket) => {
  console.log('New client connected');
  
  const newPlayer = { id: socket.id, x: 0, y: 0 };
  gameState.players.push(newPlayer);
  socket.emit('init', gameState);

  socket.on('update', (playerData) => {
    const playerIndex = gameState.players.findIndex(player => player.id === playerData.id);
    if (playerIndex !== -1) {
      gameState.players[playerIndex] = playerData;
      io.emit('update', gameState);
    }
  });

  socket.on('ballUpdate', (newBallPosition) => {
    gameState.ball = newBallPosition;
    io.emit('update', gameState);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    gameState.players = gameState.players.filter(player => player.id !== socket.id);
    io.emit('update', gameState);
  });
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
