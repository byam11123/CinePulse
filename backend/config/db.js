import mongoose from "mongoose";
import { ENV_VARS } from "./envVars.js";
import logger from "../utils/logger.js";

export const connectDB = async () => {
  try {
    // Database connection options for optimization
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
      // Enable SSL if in production
      ...(ENV_VARS.NODE_ENV === 'production' && { ssl: true }),
    };

    const conn = await mongoose.connect(ENV_VARS.MONGO_URI, options);

    // Log successful connection
    logger.info("MongoDB Connected", { host: conn.connection.host });

    // Connection event listeners for monitoring
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.info('Mongoose disconnected from DB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error("Error connecting to MongoDB: ", { error: error.message });
    process.exit(1);
  }
};
