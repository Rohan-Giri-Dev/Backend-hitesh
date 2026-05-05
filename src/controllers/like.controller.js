import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Error ,videoId is invalid");
  }

  const existing = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (existing) {
    await Like.findByIdAndDelete(existing._id);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false },
          "Successfully toggled the video like"
        )
      );
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: true },
          "Successfully toggled the video like"
        )
      );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const existing = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (existing) {
    await Like.findByIdAndDelete(existing._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Comment unliked successfully")
      );
  } else {
    await Like.create({ comment: commentId, likedBy: req.user._id });
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: true }, "Comment liked successfully")
      );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const existing = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (existing) {
    await Like.findByIdAndDelete(existing._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Tweet unliked successfully")
      );
  } else {
    await Like.create({ tweet: tweetId, likedBy: req.user._id });
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: true }, "Tweet liked successfully")
      );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const like = await Like.find({ likedBy: req.user?._id }).populate("video");

  return res
    .status(200)
    .json(new ApiResponse(200, like, "All liked video fetched"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
