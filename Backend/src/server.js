import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import {connectDB} from './config/db.js';

const port = process.env.PORT || 4000

connectDB()
.then(() => {
    app.listen(port , (req , res) => {
        console.log("Server is listening on port:" , port)
    })
})
.catch((error) => {
    console.log("Something went wrong while connecting the database", error)
})
