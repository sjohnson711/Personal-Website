import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import articlesRouter from "./routes/articles";
import authRouter from "./routes/auth";
import commentsRouter from "./routes/comments";
import subscribersRouter from "./routes/subscribers";
import contactRouter from "./routes/contact";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/articles", articlesRouter);
app.use("/api/auth", authRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/subscribers", subscribersRouter);
app.use("/api/contact", contactRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
