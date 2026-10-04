import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import articlesRouter from "./routes/articles";
import authRouter from "./routes/auth";
import commentsRouter from "./routes/comments";
import subscribersRouter from "./routes/subscribers";
import contactRouter from "./routes/contact";
import embedRouter from "./routes/embed";
import analyticsRouter from "./routes/analytics";
import { allowedOrigins, csrfProtection, limiter } from "./middleware/security";
import { requireAuth } from "./middleware/requireAuth";

export function createApp() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? "0"));
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: {
    directives: { defaultSrc: ["'none'"], styleSrc: ["'unsafe-inline'"], baseUri: ["'none'"], frameAncestors: ["'none'"] },
  } }));
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins().includes(origin)), credentials: true,
    allowedHeaders: ["Content-Type", "X-Requested-With", "Authorization"], methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));
  app.use(cookieParser());
  app.use(csrfProtection);
  app.use("/api/articles", (req, res, next) => {
    if (req.method === "POST" || req.method === "PUT") return requireAuth(req, res, () => express.json({ limit: "32mb" })(req, res, next));
    next();
  });
  app.use(express.json({ limit: "16kb" }));
  app.use("/api/auth/login", limiter(10));
  app.use("/api/subscribers", limiter(10));
  app.use("/api/contact", limiter(5));
  app.use("/api/comments", (req, res, next) => req.method === "POST" ? commentLimiter(req, res, next) : next());
  app.use("/api/articles", articlesRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/comments", commentsRouter);
  app.use("/api/subscribers", subscribersRouter);
  app.use("/api/contact", contactRouter);
  app.use("/api/embed", embedRouter);
  app.use("/api/analytics", analyticsRouter);
  const errors: ErrorRequestHandler = (err, _req, res, _next) => {
    if (res.headersSent) return;
    if (err.type === "entity.too.large") { res.status(413).json({ error: "Request is too large. Articles allow up to 32 MB; forms allow 16 KB." }); return; }
    if (err.type === "entity.parse.failed") { res.status(400).json({ error: "Invalid JSON" }); return; }
    if (err.code === "P2002") { res.status(409).json({ error: "That record already exists" }); return; }
    console.error("[api]", err.code ?? err.name ?? "Unexpected error");
    res.status(500).json({ error: "Something went wrong. Please try again." });
  };
  app.use(errors);
  return app;
}
const commentLimiter = limiter(10);
