const express = require('express');
const { Pool } = require('pg');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Banco de dados PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: 5432,
});

// Servir HTML
app.use(express.static(path.join(__dirname, '/')));

// Receber JSON do front
app.use(express.json());

let fichaGlobal = {};

// Socket.IO para tempo real
io.on('connection', (socket) => {
  console.log('Novo usuário conectado');

  // Envia a ficha atual ao conectar
  socket.emit('fichaUpdate', fichaGlobal);

  // Quando um jogador atualiza um campo
  socket.on('fichaUpdate', async (data) => {
    fichaGlobal[data.id] = data.value;

    // Broadcast p/ todos menos quem enviou
    socket.broadcast.emit('fichaUpdate', data);

    // Salva no banco (exemplo simplificado)
    try {
      await pool.query(
        'INSERT INTO fichas(id, valor) VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET valor = $2',
        [data.id, data.value]
      );
    } catch (err) {
      console.error('Erro ao salvar no banco:', err);
    }
  });
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
