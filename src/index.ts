import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ENV } from "./env";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:8081"], // web + expo dev
    credentials: true,
}));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

app.listen(ENV.PORT, () => {
    console.log(`Server running at http://localhost:${ENV.PORT}`);
});
