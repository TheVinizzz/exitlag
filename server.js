const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Middleware para servir arquivos estáticos
app.use('/Game', express.static(path.join(__dirname, '')));
app.use('/Build', express.static(path.join(__dirname, 'Game/Build')));

// Rota para servir o arquivo HTML
app.get('/', (req, res) => {
  //res.sendFile(path.join(__dirname, 'test.html'));
  res.sendFile(path.join(__dirname, 'Game/index.html'));
});

app.get('/exitlag/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'Game/index.html'));
  });

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Nova função para buscar e emitir o ranking
  const sendRanking = async () => {
    try {
      const ranking = await prisma.player.findMany({
        orderBy: {
          score: 'desc'
        }
      });
      socket.emit('ranking', ranking);
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
    }
  };

  // Evento para solicitar o ranking
  socket.on('getRanking', sendRanking);
  
  // Envia o ranking assim que o cliente se conecta
  sendRanking();

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Rota para criar um novo jogador
app.post('/players', async (req, res) => {
  const { name } = req.body;
  try {
    const player = await prisma.player.create({
      data: {
        name,
        score: 0
      }
    });

    // Buscar ranking atualizado
    const updatedRanking = await prisma.player.findMany({
      orderBy: {
        score: 'desc'
      }
    });

    // Emitir o ranking atualizado para todos os clientes
    io.emit('rankingUpdate', updatedRanking);

    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para atualizar a pontuação
app.put('/players/:id/score', async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;
  try {
    // Primeiro buscar o jogador atual
    const currentPlayer = await prisma.player.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentPlayer) {
      return res.status(404).json({ error: "Jogador não encontrado" });
    }

    // Atualizar somando ao score atual
    const player = await prisma.player.update({
      where: { id: parseInt(id) },
      data: { 
        score: currentPlayer.score + score 
      }
    });
    
    // Buscar ranking atualizado
    const updatedRanking = await prisma.player.findMany({
      orderBy: {
        score: 'desc'
      }
    });
    
    // Emitir o ranking atualizado para todos os clientes
    io.emit('rankingUpdate', updatedRanking);
    
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para obter o ranking
app.get('/ranking', async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      orderBy: {
        score: 'desc'
      }
    });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});