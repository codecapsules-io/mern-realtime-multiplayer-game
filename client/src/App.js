import React, { useState, useEffect, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import './App.css';

const ENDPOINT = 'http://localhost:5005';

function App() {
  const [gameState, setGameState] = useState({ players: [], ball: { x: 300, y: 200 } });
  const [player, setPlayer] = useState({ id: null, x: 0, y: 0 });
  const socket = useRef(null);

  const handleConnect = () => {
    if (!socket.current) {
      socket.current = socketIOClient(ENDPOINT);

      socket.current.on('init', (state) => {
        console.log('Init state received:', state);
        setGameState(state);
        const newPlayer = { id: socket.current.id, x: 0, y: 0 };
        setPlayer(newPlayer);
        socket.current.emit('update', newPlayer);
      });

      socket.current.on('update', (state) => {
        console.log('Game state updated:', state);
        setGameState(state);
      });

      const handleKeyDown = (e) => {
        setPlayer((prevPlayer) => {
          if (!prevPlayer.id) return prevPlayer;

          let newPlayer = { ...prevPlayer };
          switch (e.key) {
            case 'ArrowUp':
              newPlayer.y -= 10;
              break;
            case 'ArrowDown':
              newPlayer.y += 10;
              break;
            case 'ArrowLeft':
              newPlayer.x -= 10;
              break;
            case 'ArrowRight':
              newPlayer.x += 10;
              break;
            default:
              break;
          }

          // Check for collision with the ball
          const ball = gameState.ball;
          const distance = Math.sqrt((newPlayer.x - ball.x) ** 2 + (newPlayer.y - ball.y) ** 2);
          if (distance < 20) { // Assuming both ball and player have a diameter of 20px
            const newBallPosition = {
              x: Math.random() * (window.innerWidth - 20),
              y: Math.random() * (window.innerHeight - 20)
            };
            socket.current.emit('ballUpdate', newBallPosition);
          }

          socket.current.emit('update', newPlayer);
          return newPlayer;
        });
      };

      window.addEventListener('keydown', handleKeyDown);

      socket.current.on('disconnect', () => {
        console.log('Client disconnected');
        window.removeEventListener('keydown', handleKeyDown);
        socket.current = null;
      });
    }
  };

  const handleDisconnect = () => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }
  };

  return (
    <div className="game-container">
      <div className="controls">
        <button onClick={handleConnect}>Connect</button>
        <button onClick={handleDisconnect}>Disconnect</button>
      </div>
      <div className="ball" style={{ left: gameState.ball.x, top: gameState.ball.y }}></div>
      {gameState.players.map((p) => (
        <div key={p.id} className="player" style={{ left: p.x, top: p.y }}>
          Player {p.id}
        </div>
      ))}
    </div>
  );
}

export default App;
