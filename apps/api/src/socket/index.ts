import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;
let onlineUsersCount = 0;

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on("connection", (socket: Socket) => {
    onlineUsersCount++;
    console.log(`[Socket.IO] Client connected: ${socket.id} (Total online: ${onlineUsersCount})`);

    // Broadcast updated online count immediately
    io?.emit("online:count", { count: onlineUsersCount });

    // Client subscribes to real-time status of their submission
    socket.on("subscribe:submission", (submissionId: string) => {
      if (submissionId) {
        socket.join(`submission:${submissionId}`);
      }
    });

    socket.on("unsubscribe:submission", (submissionId: string) => {
      if (submissionId) {
        socket.leave(`submission:${submissionId}`);
      }
    });

    // Client subscribes to real-time contest leaderboard
    socket.on("subscribe:contest", (contestIdentifier: string) => {
      if (contestIdentifier) {
        socket.join(`contest:${contestIdentifier}`);
      }
    });

    socket.on("unsubscribe:contest", (contestIdentifier: string) => {
      if (contestIdentifier) {
        socket.leave(`contest:${contestIdentifier}`);
      }
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      onlineUsersCount = Math.max(0, onlineUsersCount - 1);
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (Total online: ${onlineUsersCount})`);
      io?.emit("online:count", { count: onlineUsersCount });
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit live status updates for a submission (e.g. RUNNING, ACCEPTED, WRONG_ANSWER)
 */
export function emitSubmissionStatus(submissionId: string, data: any) {
  if (!io) return;
  io.to(`submission:${submissionId}`).emit("submission:status", {
    submissionId,
    ...data,
  });
}

/**
 * Broadcast live contest leaderboard updates
 */
export function emitContestUpdate(contestIdentifier: string, data: any) {
  if (!io) return;
  io.to(`contest:${contestIdentifier}`).emit("contest:leaderboard_update", data);
}

/**
 * Broadcast global platform activity (e.g., someone solved a problem)
 */
export function broadcastActivity(activity: {
  username: string;
  problemTitle: string;
  verdict: string;
  timestamp: string;
}) {
  if (!io) return;
  io.emit("activity:feed", activity);
}
