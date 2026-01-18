import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import authRoutes from "./src/routes/auth.routes";
import roomRoutes from "./src/routes/room.routes";
import setupSocket from "./src/socket/index";
import jwt from "jsonwebtoken";
import historyRoutes from "./src/routes/history.routes";
import { socketAuthMiddleware } from "./src/middleware/socketAuth.middleware";
const app = express();
app.use(cors());
app.use(express.json());

const http = createServer(app);
const io = new Server(http, { cors: { origin: "*" } });
setupSocket(io);

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/history", historyRoutes);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  console.error(err?.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
io.use(socketAuthMiddleware);

app.use(((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
}) as express.ErrorRequestHandler);

const PORT = Number(process.env.PORT) || 4000;
http.listen(PORT, () => console.log(`API & Socket on :${PORT}`));
