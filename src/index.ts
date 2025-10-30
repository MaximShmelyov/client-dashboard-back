import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from 'path';
import * as OpenApiValidator from 'express-openapi-validator';
import YAML from 'yamljs';
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

const apiSpec = path.join(__dirname, '..', 'openapi', 'v1', 'schema.yaml');
const swaggerDoc = YAML.load(apiSpec);

app.get('/docs', (req, res) => res.json(swaggerDoc));

app.use(
    OpenApiValidator.middleware({
        apiSpec,
        validateRequests: true,
        validateResponses: true,
    })
);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.status && err.errors) {
        res.status(err.status).json({
            statusCode: err.status,
            error: err.name,
            message: err.message,
            details: err.errors,
        });
    } else {
        console.error(err);
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error' });
    }
});

app.listen(ENV.PORT, () => {
    console.log(`Server running at http://localhost:${ENV.PORT}`);
});
