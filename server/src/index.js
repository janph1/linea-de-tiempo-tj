import express from 'express';
import http from 'http';
import cors from 'cors';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { RoomManager } from './game/RoomManager.js';
import { DECK_THEMES } from './game/DeckManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager(io);

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// API de metadatos (mazos disponibles + IP local para QR en red Wi-Fi)
app.get('/api/meta', (req, res) => {
  res.json({
    decks: DECK_THEMES,
    lanIp: getLanIp(),
    activeRooms: roomManager.rooms.size,
  });
});

// En producción, servir el frontend compilado de client/dist
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

io.on('connection', (socket) => {
  const safeHandler = (fn) => (payload, callback) => {
    try {
      const result = fn(payload || {});
      if (typeof callback === 'function') callback({ ok: true, ...result });
    } catch (err) {
      if (typeof callback === 'function') {
        callback({ ok: false, error: err.message || 'Error inesperado.' });
      } else {
        socket.emit('game_error', { message: err.message || 'Error inesperado.' });
      }
    }
  };

  socket.on(
    'create_room',
    safeHandler(({ name, avatar }) => {
      const room = roomManager.createRoom();
      const { player } = room.addOrReconnectPlayer({
        socketId: socket.id,
        name,
        avatar,
      });
      roomManager.joinSocketToRoom(socket, room, player);
      return {
        roomCode: room.code,
        playerId: player.id,
        playerToken: player.token,
      };
    })
  );

  socket.on(
    'join_room',
    safeHandler(({ roomCode, name, avatar, playerToken }) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) {
        throw new Error(`No existe ninguna sala con el código "${String(roomCode || '').toUpperCase()}".`);
      }
      const { player, reconnected } = room.addOrReconnectPlayer({
        socketId: socket.id,
        name,
        avatar,
        playerToken,
      });
      roomManager.joinSocketToRoom(socket, room, player);
      return {
        roomCode: room.code,
        playerId: player.id,
        playerToken: player.token,
        reconnected,
      };
    })
  );

  socket.on(
    'leave_room',
    safeHandler(() => {
      roomManager.handleDisconnect(socket.id);
      return {};
    })
  );

  socket.on(
    'update_settings',
    safeHandler((settings) => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) throw new Error('No estás en una sala.');
      const playerId = room.socketToPlayer.get(socket.id);
      room.updateSettings(playerId, settings);
      return {};
    })
  );

  socket.on(
    'kick_player',
    safeHandler(({ targetPlayerId }) => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) throw new Error('No estás en una sala.');
      const playerId = room.socketToPlayer.get(socket.id);
      room.kickPlayer(playerId, targetPlayerId);
      return {};
    })
  );

  socket.on(
    'start_game',
    safeHandler(() => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) throw new Error('No estás en una sala.');
      const playerId = room.socketToPlayer.get(socket.id);
      if (playerId !== room.hostId) {
        throw new Error('Solo el anfitrión puede iniciar la partida.');
      }
      room.engine.startGame();
      return {};
    })
  );

  socket.on(
    'play_card',
    safeHandler(({ cardId, insertIndex }) => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) throw new Error('No estás en una sala.');
      const playerId = room.socketToPlayer.get(socket.id);
      if (room.settings.gameMode === 'survival') {
        room.engine.submitSimultaneousCard(playerId, cardId, insertIndex);
      } else {
        room.engine.playClassicCard(playerId, cardId, insertIndex);
      }
      return {};
    })
  );

  socket.on(
    'play_again',
    safeHandler(({ toLobby } = {}) => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) throw new Error('No estás en una sala.');
      const playerId = room.socketToPlayer.get(socket.id);
      if (playerId !== room.hostId) {
        throw new Error('Solo el anfitrión puede reiniciar la partida.');
      }
      if (toLobby) {
        room.returnToLobby(playerId);
      } else {
        room.engine.startGame();
      }
      return {};
    })
  );

  // Reacciones rápidas con emojis en tiempo real
  let lastReactionTs = 0;
  socket.on('send_reaction', ({ emoji } = {}) => {
    const now = Date.now();
    if (now - lastReactionTs < 450) return;
    lastReactionTs = now;

    const allowed = ['👏', '🔥', '😱', '😂', '🤔', '🎉', '❤️', '🙌'];
    if (!allowed.includes(emoji)) return;

    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const playerId = room.socketToPlayer.get(socket.id);
    const player = room.players.get(playerId);
    if (!player) return;

    io.to(room.code).emit('reaction_burst', {
      id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
      emoji,
      playerName: player.name,
      playerAvatar: player.avatar,
    });
  });

  socket.on('disconnect', () => {
    roomManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  const lan = getLanIp();
  console.log(`\n🕰️  Servidor Línea de Tiempo activo en:`);
  console.log(`   • Local: http://localhost:${PORT}`);
  console.log(`   • Red LAN (celulares en mismo Wi-Fi): http://${lan}:${PORT}\n`);
});
