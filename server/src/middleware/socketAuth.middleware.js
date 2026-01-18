import jwt from "jsonwebtoken";

export const socketAuthMiddleware = async (socket, next) => {
  console.log("here");
  try {
    const token = socket.handshake.auth.token;

    if (!token) return next(new Error("Authentication token required"));

    const payload = verifyJwt(token);
    socket.data.user = {
      id: payload.sub || payload.id,
      username: payload.username,
    };

    next();
  } catch (err) {
    console.error("Socket auth error:", err);
    next(new Error("Authentication error"));
  }
};

function verifyJwt(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT secret not configured");
  if (!token) throw new Error("Invalid token");

  let raw = token;
  if (raw.startsWith("Bearer ")) raw = raw.slice(7);

  try {
    const payload = jwt.verify(raw, secret);
    return payload;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}
