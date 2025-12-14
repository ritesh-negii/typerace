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
          finished: false
        }],
        gameStarted: false
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
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      room.players.push({
        id: socket.id,
        name: playerName,
        progress: 0,
        wpm: 0,
        finished: false
      });

      socket.join(roomCode);
      
      // Start game when 2 players
      room.gameStarted = true;
      io.to(roomCode).emit('game-start', {
        text: room.text,
        players: room.players
      });

      console.log(`Player joined: ${roomCode}, Players: ${room.players.length}`);
    });

    // Update progress
    socket.on('update-progress', (data) => {
      const { roomCode, progress, wpm, accuracy } = data;
      const room = rooms.get(roomCode);

      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.progress = progress;
        player.wpm = wpm;
        player.accuracy = accuracy;

        // Broadcast to other players
        socket.to(roomCode).emit('opponent-update', {
          progress,
          wpm,
          accuracy
        });

        // Check if finished
        if (progress >= 100 && !player.finished) {
          player.finished = true;
          io.to(roomCode).emit('player-finished', {
            playerId: socket.id,
            playerName: player.name
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