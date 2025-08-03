// src/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import  router from "./lib/route"
import { setupSocket } from './socket';
import { KlineGenerator } from './lib/helper';
import { startSchedulers } from './lib/scheduler';

const app = express();

app.use(express.json());

app.use('/api', router);

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });


setupSocket(io);
startSchedulers(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server and WS running on port ${PORT}`);
  
});




