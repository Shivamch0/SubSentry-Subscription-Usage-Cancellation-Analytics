import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import {connectDB} from './config/db.js';

const port = process.env.PORT || 4000;

connectDB()
.then(() => {
    app.listen(port , () => {
        console.log(`SubSentry API listening on port ${port}`);
    })
})
.catch((error) => {
    console.error('Something went wrong while connecting the database', error.message);
})
