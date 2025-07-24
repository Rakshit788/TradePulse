// src/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { setupSocket } from './socket';

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Attach socket handling
setupSocket(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server and WS running on port ${PORT}`);
});

// Start your matching engine loop

