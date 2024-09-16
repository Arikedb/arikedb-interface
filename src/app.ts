import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import routes_v1 from './routes_v1';
import winston from 'winston';
import { ArikedbCore } from "@arikedb/core";

dotenv.config();

const app: Application = express();

var db_cli = new ArikedbCore().connect(process.env.ARIKEDB_SERVER || '127.0.0.1', Number(process.env.ARIKEDB_PORT || 6923));

const logFormat = winston.format.combine(
    winston.format.simple(),
    winston.format.colorize(),
);

// Create the logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Use lower log level in dev
    format: logFormat,
    transports: [
        new winston.transports.Console()
    ]
});

app.use((req, res, next) => {
    req.logger = logger;
    req.db_cli = db_cli;
    next();
})

// Middleware to parse JSON requests
app.use(express.json());

// Routes version 1
app.use('/api/v1', routes_v1);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app;
