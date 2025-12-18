const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const rooms = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "https://typerace-virid.vercel.app",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

   socket.on('create-room', ({ playerName }) => {
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

 const room = {
  creatorId: socket.id,   
  players: [{
    id: socket.id,
    name: playerName,
    progress: 0,
    wpm: 0,
    finished: false
  }],
  textToType: '',
  startTime: null,
  winner: null
};


  rooms.set(roomCode, room);
  socket.join(roomCode);

  socket.emit('room-created', {
    roomCode,
    playerNumber: 1,
    players: room.players   
  });

  console.log(`Room ${roomCode} created by ${playerName}`);
});


    socket.on('join-room', ({ roomCode, playerName }) => {
      const room = rooms.get(roomCode);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      room.players.push({ id: socket.id, name: playerName, progress: 0, wpm: 0, finished: false });
      socket.join(roomCode);
      
   io.to(roomCode).emit('player-joined', {
  players: room.players,
  playerNumber: room.players.length,
  creator: room.creatorId   
});


      console.log(`${playerName} joined room ${roomCode}`);
    });

  socket.on('start-race', ({ roomCode }) => {
  const room = rooms.get(roomCode);
  if (!room || room.players.length < 2) return;

  if (socket.id !== room.creatorId) return;


      const texts = [
        "The quick brown fox jumps over the lazy dog near the riverbank.",
        "Programming is the art of telling another human what one wants the computer to do.",
        "In the middle of difficulty lies opportunity for those who persist.",
        "Success is not final failure is not fatal it is the courage to continue that counts.",
        "The only way to do great work is to love what you do and pursue excellence."
      ];

      room.textToType = texts[Math.floor(Math.random() * texts.length)];
      room.startTime = Date.now();
      room.winner = null;
      room.players.forEach(p => {
        p.progress = 0;
        p.wpm = 0;
        p.finished = false;
      });

      io.to(roomCode).emit('race-started', { textToType: room.textToType });
      console.log(`Race started in room ${roomCode}`);
    });

    socket.on('reset-race', ({ roomCode }) => {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.textToType = '';
  room.startTime = null;
  room.winner = null;

  room.players.forEach(p => {
    p.progress = 0;
    p.wpm = 0;
    p.finished = false;
  });

  io.to(roomCode).emit('race-reset', {
    players: room.players
  });

  console.log(`Race reset in room ${roomCode}`);
});


    socket.on('update-progress', ({ roomCode, input }) => {
      const room = rooms.get(roomCode);
      if (!room || !room.textToType) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      const progress = Math.min((input.length / room.textToType.length) * 100, 100);
      const minutes = (Date.now() - room.startTime) / 60000;
      const words = input.trim().split(/\s+/).length;
      const wpm = Math.round(words / minutes) || 0;

      player.progress = progress;
      player.wpm = wpm;

      // Check if player finished with 100% accuracy
      if (input === room.textToType && !room.winner) {
        player.finished = true;
        room.winner = player;
        io.to(roomCode).emit('race-finished', { 
          winner: player,
          finalStats: room.players
        });
        console.log(`${player.name} won in room ${roomCode}`);
      } else {
        io.to(roomCode).emit('progress-update', { players: room.players });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      rooms.forEach((room, roomCode) => {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          
          if (room.players.length === 0) {
            rooms.delete(roomCode);
            console.log(`Room ${roomCode} deleted`);
          } else {
            io.to(roomCode).emit('player-left', { players: room.players });
          }
        }
      });
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});