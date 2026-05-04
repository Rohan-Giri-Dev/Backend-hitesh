import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  // extract query params, with defaults for pagination
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  // convert to numbers since req.query values are always strings
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  // skip tells MongoDB how many documents to skip for pagination
  // eg: page 2 with limit 10 → skip 10 documents
  const skip = (pageNumber - 1) * limitNumber;

  // base filter — only return published videos
  const filter = { isPublished: true };

  // if search query exists, search in both title and description (case insensitive)
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // if userId is provided, validate it and filter videos by that user
  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Error, invalid user");
    }
    filter.owner = userId;
  }

  // whitelist allowed sort fields to prevent sorting on arbitrary/sensitive fields
  const allowedSortFields = ["createdAt", "views", "duration", "title"];

  // if sortBy is not in the whitelist, fall back to createdAt
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  // asc → 1 (A-Z, oldest first), desc → -1 (Z-A, newest first)
  const sortOrder = sortType === "asc" ? 1 : -1;

  // mongodb sort object eg: { views: -1 }
  const sort = { [sortField]: sortOrder };

  // fetch videos with filter, sort, pagination applied
  // populate replaces owner id with actual user fields from users collection
  const videos = await Video.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNumber)
    .populate("owner", "username avatar fullName");

  // separate query to get total count (needed for frontend pagination)
  const totalVideos = await Video.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        totalVideos,
        page: pageNumber,
        limit: limitNumber,
        // how many pages exist in total eg: 45 videos / 10 per page = 5 pages
        totalPages: Math.ceil(totalVideos / limitNumber),
      },
      "Videos fetched successfully"
    )
  );
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
  const { videoId } = req.params; // params is used here because we are getting the ID from the url
  //TODO: get video by id

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid or missing video ID");
  }

  // here we are getting the video with the help of video id
  // and updating the views at the same time
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: {
        views: 1,
      },
    },
    { new: true }
  ).select("-owner");

  if (!video) {
    throw new ApiError(404, "Error no video found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  // 1. Get the ID of the video that needs updating from the URL parameters.
  const { videoId } = req.params;
  // NOTE: The developer left a TODO, indicating that other fields (like category, etc.) might be added here later.
  // TODO: update video details like title, description, thumbnail

  // 2. VALIDATE INPUT: Check if the videoId is provided and if it is a valid MongoDB ObjectId.
  if (!videoId || !isValidObjectId(videoId)) {
    // If validation fails, throw a 400 Bad Request error.
    throw new ApiError(400, "Error invalid video id");
  }

  // 3. Extract data from the request body (payload).
  const { title, description } = req.body;
  // The thumbnail path is sourced from the file uploaded via middleware (e.g., Multer).
  const thumbnailPath = req.file?.path;

  // 4. VALIDATE REQUIRED FIELDS: Ensure all necessary data (title, description, and the file) are present.
  if (!title || !description || !thumbnailPath) {
    // If any required field is missing, throw a 400 error.
    throw new ApiError(
      400,
      "Error , Title, description and thumbnail are required"
    );
  }

  // 5. PRE-CHECK: Retrieve the existing video record using the provided ID.
  const existingVideo = await Video.findById(videoId);

  // 6. VALIDATE RESOURCE EXISTENCE: Check if the video with the given ID actually exists in the database.
  if (!existingVideo) {
    throw new ApiError(404, "Video does not exists");
  }

  // 7. AUTHORIZATION CHECK (SECURITY): Compare the owner ID stored in the database
  //    with the ID of the currently logged-in user (req.user).
  //    This ensures that a user can only update content they own.
  if (existingVideo.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  // 8. PROCESS NEW THUMBNAIL: Upload the newly selected local file path to the cloud storage (Cloudinary).
  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  // 9. VALIDATE FILE UPLOAD: Check if the cloud upload process was successful.
  if (!thumbnail) {
    // If the upload fails, throw a 500 Internal Server Error.
    throw new ApiError(500, "Error while uploading thumbnails");
  }

  // 10. UPDATE DATABASE: Perform the update operation on the Video collection.
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      // $set operator updates the specified fields using the new data.
      $set: {
        title,
        description,
        thumbnail: thumbnail.url, // Use the public URL provided by the cloud service.
      },
    },
    { new: true } // { new: true } ensures the returned document is the updated record.
  ).select("-owner"); // Exclude the owner ID from the final returned video object for cleaner data.

  // 11. SUCCESS RESPONSE: Send a successful response to the client.
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Successfully updated the video "));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId || !isValidObjectId(videoId)) {
    // If validation fails, throw a 400 Bad Request error.
    throw new ApiError(400, "Error invalid video id");
  }

  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) {
    throw new ApiError(404, "Error, Video not found");
  }

  if (existingVideo.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  await Video.findByIdAndDelete(videoId);

  return res.status(200).json(new ApiResponse(200, {}, "Deleted the video"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Error, Invalid video id");
  }

  const existingVideo = await Video.findById(videoId);

  if (!existingVideo) {
    throw new ApiError(404, "Error , video doesent exists ");
  }

  if (existingVideo.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to toggle publish status");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !existingVideo.isPublished,
      },
    },
    { new: true }
  ).select("-owner");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video toogle status updated"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
