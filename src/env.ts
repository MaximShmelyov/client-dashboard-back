import dotenv from "dotenv";
dotenv.config();

export const ENV = {
    PORT: process.env.PORT || 4000,
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
};
