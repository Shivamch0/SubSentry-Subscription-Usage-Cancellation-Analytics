import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';
import dns from 'dns';

dns.setServers(['1.1.1.1' , '8.8.8.8'])

export const connectDB = async () => {
    try {
        const con = await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
        console.log("Database connected Successfully...")
    } catch (error) {
        console.log("Database connection failed..." , error);
        process.exit(1)
    }
}