import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  const { content } = req.body;
  const trimmed = content?.trim();

  if (!trimmed) {
    throw new ApiError(400, "Error, Content is required");
  }

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized - user not found");
  }

  const tweet = await Tweet.create({
    content: trimmed,
    owner: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Successfully created tweet"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets

  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(401, "Error, Unauthorized - user not found ");
  }

  const tweet = await Tweet.findById({ owner: userId });

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "User successfully fetched"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  const trimmed = content?.trim();

  if (!trimmed) {
    throw new ApiError(400, "Error , Content is unavaliable");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Error , unauthorized user");
  }

  //to find if the tweet exists or not
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only edit your own tweets");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content: trimmed,
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Successfully updated tweet"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Not found any tweetId");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Error , unauthorized user");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "Error , no tweet found");
  }

  if (tweet.owner.toString() !== userId.toString()) {
    throw new ApiError(400, "You can only delete your own tweets");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Deleted the tweet"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
