import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Prefer an explicit URI from env, otherwise build one from components.
    const envUri = process.env.MONGODB_URI?.trim();
    const user = process.env.MONGO_INITDB_ROOT_USERNAME;
    const pass = process.env.MONGO_INITDB_ROOT_PASSWORD;
    const host = process.env.MONGO_HOST || 'localhost';
    const port = process.env.MONGO_PORT || '27017';
    const dbName = process.env.MONGO_INITDB_DATABASE || process.env.DB_NAME || 'qualifica-professor';

    let uri = envUri || '';

    if (!uri) {
      // Connect without auth for local development
      uri = `mongodb://${host}:${port}/${dbName}`;
    }

    // Validate scheme early to provide a clearer error than the driver.
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error(`Invalid MongoDB URI scheme. Computed URI does not start with 'mongodb://' or 'mongodb+srv://'. Computed start: "${uri.slice(0, 30)}"`);
    }

    // Mask password when logging.
    const maskedUri = uri.replace(/(mongodb:\/\/)([^:]+):([^@]+)@/, (m, p, u) => `${p}${u}:****@`);
    console.log('Connecting to MongoDB with URI:', maskedUri);

    await mongoose.connect(uri, { dbName });
    console.log(`Connected to MongoDB (db: ${dbName})`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};