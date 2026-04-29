// Custom error class used to send proper API errors
import { ApiError } from "../utils/ApiError.js";

// asyncHandler is used to handle errors in async functions
// So we don't need to write try-catch in every controller/middleware
import { asyncHandler } from "../utils/asyncHandler.js";

// jsonwebtoken package is used to verify JWT tokens
import jwt from "jsonwebtoken";

// User model is used to find the user from database
import { User } from "../models/user.models.js";

// This middleware verifies whether the user has a valid access token or not
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // First, try to get token from cookies
    // req.cookies?.accessToken means:
    // check if cookies exist, then get accessToken from it
    //
    // If token is not found in cookies,
    // then check the Authorization header
    //
    // Authorization header usually looks like:
    // Bearer tokenValueHere
    //
    // replace("Bearer ", "") removes the word "Bearer "
    // and keeps only the actual token
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // If token is missing, user is not authenticated
    if (!token) {
      throw new ApiError(401, "unauthorized request");
    }

    // Verify the token using the secret key
    // If token is invalid or expired, jwt.verify will throw an error
    //
    // decodedToken will contain the data that was stored inside the token
    // Example:
    // {
    //   _id: "userIdHere",
    //   email: "abc@gmail.com",
    //   username: "aman",
    //   iat: ...,
    //   exp: ...
    // }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user from database using the _id stored inside the token
    //
    // select("-password -refreshToken") means:
    // do not include password and refreshToken in the returned user object
    //
    // This is done for security reasons
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // If no user is found, token is not valid anymore
    // Example: token has valid structure, but user was deleted from database
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    // Attach the logged-in user's data to the request object
    //
    // Now the next controller can access the user like:
    // req.user
    req.user = user;

    // Move to the next middleware or controller
    next();
  } catch (error) {
    // If anything fails, send unauthorized error
    // Example:
    // - token missing
    // - token expired
    // - token invalid
    // - user not found
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
