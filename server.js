const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Room storage
const rooms = new Map();

// Sample texts for typing
const sampleTexts = [
  "The quick brown fox jumps over the lazy dog near the riverbank.",
  "Programming is the art of turning coffee into code and bugs into features.",
  "Practice makes perfect, but nobody is perfect, so why practice at all?",
  "Life is what happens when you're busy making other plans and debugging code.",
  "The only way to do great work is to love what you do every single day.",
  "Success is not final, failure is not fatal, it is the courage to continue that counts.",
  "Innovation distinguishes between a leader and a follower in the tech world.",
  "The best time to plant a tree was twenty years ago, the second best time is now."
];

// Helper functions - SERVER VALIDATES EVERYTHING
const calculateWPM = (text, timeInSeconds) => {
  const words = text.trim().split(/\s+/).length;
  const minutes = timeInSeconds / 60;
  return Math.round(words / minutes) || 0;
};

const calculateAccuracy = (typed, target) => {
  if (!typed) return 100;
  let correct = 0;
  const minLength = Math.min(typed.length, target.length);
  for (let i = 0; i < minLength; i++) {
    if (typed[i] === target[i]) correct++;
  }
  return Math.round((correct / typed.length) * 100);
};

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Create room
    socket.on('create-room', (data) => {
      const { roomCode, playerName } = data;
      const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      
      rooms.set(roomCode, {
        text,
        players: [{
          id: socket.id,
          name: playerName,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          finished: false,
          startTime: null,
          typedText: ''
        }],
        gameStarted: false,
        winner: null
      });

      socket.join(roomCode);
      socket.emit('room-created', { roomCode, text });
      console.log(`Room created: ${roomCode}`);
    });

    // Join room
    socket.on('join-room', (data) => {
      const { roomCode, playerName } = data;
      const room = rooms.get(roomCode);

      if (!room) {
        socket.emit('room-error', { message: 'Room not found' });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit('room-error', { message: 'Room is full' });
        return;
      }

      room.players.push({
        id: socket.id,
        name: playerName,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
        startTime: null,
        typedText: ''
      });

      socket.join(roomCode);
      
      // Start game when 2 players
      room.gameStarted = true;
      const startTime = Date.now();
      
      // Set start time for both players
      room.players.forEach(p => p.startTime = startTime);
      
      io.to(roomCode).emit('game-start', {
        text: room.text,
        players: room.players.map(p => ({ id: p.id, name: p.name }))
      });

      console.log(`Player joined: ${roomCode}, Players: ${room.players.length}`);
    });

    // Update progress - SERVER CALCULATES EVERYTHING
    socket.on('update-progress', (data) => {
      const { roomCode, typedText } = data;
      const room = rooms.get(roomCode);

      if (!room || !room.gameStarted) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      // Store typed text
      player.typedText = typedText;

      // SERVER CALCULATES (anti-cheat)
      const progress = (typedText.length / room.text.length) * 100;
      player.progress = Math.min(progress, 100);

      const timeElapsed = (Date.now() - player.startTime) / 1000;
      player.wpm = calculateWPM(typedText, timeElapsed);
      player.accuracy = calculateAccuracy(typedText, room.text);

      // Broadcast to opponent
      socket.to(roomCode).emit('opponent-update', {
        progress: player.progress,
        wpm: player.wpm,
        accuracy: player.accuracy
      });

      // Check if finished (SERVER DECIDES)
      if (typedText === room.text && !player.finished) {
        player.finished = true;
        
        // Check if this player won
        const otherPlayer = room.players.find(p => p.id !== socket.id);
        const won = !otherPlayer.finished;
        
        if (won && !room.winner) {
          room.winner = socket.id;
        }

        // Notify both players
        io.to(roomCode).emit('player-finished', {
          playerId: socket.id,
          playerName: player.name,
          stats: {
            wpm: player.wpm,
            accuracy: player.accuracy,
            progress: player.progress
          }
        });

        // If both finished, send game over
        if (room.players.every(p => p.finished)) {
          io.to(roomCode).emit('game-over', {
            winner: room.winner,
            players: room.players.map(p => ({
              id: p.id,
              name: p.name,
              wpm: p.wpm,
              accuracy: p.accuracy
            }))
          });
        }
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Clean up rooms
      rooms.forEach((room, roomCode) => {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          
          // Notify other player
          io.to(roomCode).emit('opponent-left');
          
          // Delete room if empty
          if (room.players.length === 0) {
            rooms.delete(roomCode);
            console.log(`Room deleted: ${roomCode}`);
          }
        }
      });
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});