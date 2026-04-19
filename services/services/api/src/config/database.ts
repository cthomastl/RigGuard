import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const useSSL = process.env.DB_SSL === "true";

export const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  database: process.env.DB_NAME || "rigguard",
  username: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "changeme",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: useSSL
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
});

export async function connectDB(): Promise<void> {
  await sequelize.authenticate();
  console.log("MySQL connection established.");
  await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
  console.log("Models synced.");
}
