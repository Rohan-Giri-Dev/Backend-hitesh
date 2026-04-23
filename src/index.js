import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import app from "./app.js";
import dotenv from "dotenv";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, (req, res) =>{
      console.log(`Server is running at port: ${process.env.PORT}`);
      
    });
  })
  .catch((err) => {
    console.log("Mongo db connection failed !!!", err);
  });

/* 
First approach

import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    //after connection is made

    app.on("error", (error) => {
      console.log("ERR: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Error", error);
    throw err;
  }
})();

*/
