// Import Express framework
import express from "express";

// Import CORS middleware
// Allows frontend and backend to communicate if they are on different origins
import cors from "cors";

// Import cookie-parser middleware
// Used to read cookies from incoming requests
import cookieParser from "cookie-parser";

// Create an Express app
const app = express();

// Enable CORS
app.use(
  cors({
    // Only allow requests from this frontend URL
    origin: process.env.CORS_ORIGIN,

    // Allow cookies/authorization headers in cross-origin requests
    credentials: true,
  })
);

// Allows server to accept JSON data from request body
// Limit means request body cannot be bigger than 16kb
app.use(express.json({ limit: "16kb" }));

// Allows server to accept form data / URL-encoded data
// extended: true allows nested objects
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serves static files from the public folder
// Example: /public/image.png can be accessed from browser
app.use(express.static("public"));

// Allows server to read cookies from request
app.use(cookieParser());

// Import user routes
import userRouter from "./routes/user.routes.js";

// Mount user routes
// Any route inside userRouter will start with /api/v1/users
app.use("/api/v1/users", userRouter);

// Export app so it can be used in another file, like index.js/server.js
export default app;
