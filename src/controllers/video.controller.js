import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  // req.query It gives you everything that comes after the ? in the URL.
  // eg GET /videos?page=2&limit=10&sortBy=views
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  // fields that
});

const publishAVideo = asyncHandler(async (req, res) => {
  // asyncHandler is a wrapper that automatically catches any errors thrown
  // inside this function and passes them to Express's error handler.
  // Without it, you'd need try/catch in every single controller.

  // ─────────────────────────────────────────────────────────────
  // STEP 1: EXTRACT TEXT FIELDS FROM REQUEST BODY
  // ─────────────────────────────────────────────────────────────

  const { title, description } = req.body;
  // req.body contains text/JSON data sent by the client
  // When sending files (multipart/form-data), text fields STILL come from req.body
  // but files come from req.files (handled below)

  // ─────────────────────────────────────────────────────────────
  // STEP 2: EXTRACT FILE PATHS FROM req.files
  // ─────────────────────────────────────────────────────────────

  const videoLocalPath = req.files?.videoFile?.[0].path;
  // req.files   → set by multer middleware BEFORE this controller runs
  //               it's an object where each key is a field name
  // ?.videoFile → safe access (optional chaining), won't crash if req.files is undefined
  //               "videoFile" must match the field name in your multer config:
  //               upload.fields([{ name: "videoFile" }, { name: "thumbnail" }])
  // ?.[0]       → multer always stores files in an ARRAY even if only 1 file is uploaded
  //               so we grab the first (and only) item
  // .path       → the temporary path where multer saved the file on YOUR server's disk
  //               e.g. "/tmp/uploads/abc123.mp4"
  //               this is a TEMPORARY file — it gets deleted after uploading to Cloudinary

  const thumbnailPath = req.files?.thumbnail?.[0].path;
  // Same logic as above, but for the thumbnail image field

  // ─────────────────────────────────────────────────────────────
  // STEP 3: VALIDATE TEXT FIELDS
  // ─────────────────────────────────────────────────────────────

  // Correct code: !(title && description) → fails if EITHER one is missing
  if (!(title && description)) {
    throw new ApiError(400, "Title and description is required");
    // 400 = Bad Request → the CLIENT sent incomplete data, not server's fault
    // ApiError is your custom error class that the global error handler will catch
    // We validate TEXT fields first before doing any file uploads
    // because file uploads cost time & bandwidth — fail fast if basics are missing
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 4: VALIDATE FILE PATHS
  // ─────────────────────────────────────────────────────────────

  if (!(videoLocalPath && thumbnailPath)) {
    throw new ApiError(400, "Video and thumbnail are required");
    // If either file is missing, multer won't set that path → it'll be undefined
    // We use && because we need BOTH files to be present
    // Still a 400 because the client forgot to attach the files
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 5: UPLOAD FILES TO CLOUDINARY
  // ─────────────────────────────────────────────────────────────

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  // uploadOnCloudinary is your utility function that:
  //   1. Takes the local temp file path
  //   2. Streams/uploads it to Cloudinary's servers over the internet
  //   3. Returns a response object with the permanent URL and metadata
  //   4. Returns null if the upload fails
  // "await" is required because this is a NETWORK call — it takes time
  // Execution pauses here until Cloudinary responds

  const thumbnail = await uploadOnCloudinary(thumbnailPath);
  // Same process for the thumbnail image
  // Note: these run one after another (sequential), not at the same time
  // For better performance you could run them in parallel:
  // const [videoFile, thumbnail] = await Promise.all([
  //   uploadOnCloudinary(videoLocalPath),
  //   uploadOnCloudinary(thumbnailPath)
  // ]);

  // ─────────────────────────────────────────────────────────────
  // STEP 6: VERIFY CLOUDINARY UPLOADS SUCCEEDED
  // ─────────────────────────────────────────────────────────────

  if (!(videoFile && thumbnail)) {
    throw new ApiError(500, "Error in uploading the video");
    // If uploadOnCloudinary returns null, the upload silently failed
    // This check catches that case
    // 500 = Internal Server Error → this is the SERVER's fault, not the client's
    //       the client sent valid files, but our server failed to upload them
  }

  // At this point, Cloudinary has returned a response object like:
  // videoFile = {
  //   url: "https://res.cloudinary.com/your-cloud/video/upload/abc.mp4", ← permanent URL
  //   duration: 120.5,   ← video length in seconds, calculated by Cloudinary automatically
  //   public_id: "abc",
  //   format: "mp4",
  //   ... more metadata
  // }

  // ─────────────────────────────────────────────────────────────
  // STEP 7: SAVE VIDEO DOCUMENT TO MONGODB
  // ─────────────────────────────────────────────────────────────

  const video = await Video.create({
    title, // from req.body — user provided
    description, // from req.body — user provided

    videoFile: videoFile.url,
    // We do NOT store the actual video file in MongoDB
    // MongoDB is a database, not a file server
    // We store the Cloudinary URL (a string) which points to where the file lives

    thumbnail: thumbnail.url,
    // Same — just storing the Cloudinary URL of the thumbnail image

    duration: videoFile.duration,
    // Cloudinary automatically calculates video duration and returns it in the response
    // We just read it from the response object — we don't calculate it ourselves

    owner: req.user._id,
    // req.user is set by your verifyJWT auth middleware that runs BEFORE this controller
    // The middleware decodes the JWT token → fetches user from DB → attaches to req.user
    // So by the time we're here, req.user is already populated with the logged-in user
    // ._id is MongoDB's auto-generated unique ID for that user

    isPulished: true,
    // This is a hardcoded default — when someone uploads, assume they want it live
    // You could also read this from req.body if you want draft functionality:
    // isPublished: req.body.isPublished ?? true
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 8: SEND SUCCESS RESPONSE
  // ─────────────────────────────────────────────────────────────

  return (
    res
      .status(200)
      // ⚠️  Technically should be 201 (Created) since we created a new resource
      // 200 = OK (general success)
      // 201 = Created (a new resource was successfully created) ← more accurate here
      .json(new ApiResponse(200, video, "Video uploaded successfully"))
  );
  // ApiResponse is your custom response wrapper that formats every response consistently
  // e.g. { statusCode: 200, data: video, message: "Video uploaded successfully" }
  // "return" ensures the function stops here and doesn't try to send a second response
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
