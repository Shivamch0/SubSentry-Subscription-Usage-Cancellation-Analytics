import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';
import dns from 'dns';

dns.setServers(['1.1.1.1', '8.8.8.8']);
export const connectDB = async () => {
    try {
        if (!process.env.DB_URL) throw new Error('DB_URL is not configured');
        await mongoose.connect(process.env.DB_URL, { dbName: DB_NAME });
        console.log('Database connected successfully');
    } catch (error) {
        console.log("Database connection failed..." , error);
        process.exit(1)
    }
}
