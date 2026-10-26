import http from "http";
import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";
import { initSocket } from "./socket";

const PORT = process.env.PORT || 4000;
const httpServer = http.createServer(app);

// Initialize WebSockets
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`\n🚀 API & WebSocket server running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
