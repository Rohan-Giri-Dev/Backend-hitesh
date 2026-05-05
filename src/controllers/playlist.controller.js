import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //TODO: create playlist

  if (!(name && description)) {
    throw new ApiError(400, "Error , name and description is required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Failed to create playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Created playlist successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const playlist = await Playlist.find({ owner: userId });

  if (!playlist || playlist.length === 0) {
    throw new ApiError(400, "No playlists found for this user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Fetched user playlists successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist not foundr");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Fetched user playlists successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Error , playlistId && videoId is invalid");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "No video found");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "No playlist found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }

  const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatePlaylist, "Added video successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "No video found");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "No playlist found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "No playlist found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }

  const deleted = await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, deleted, "Deleted playlist successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, "Name and description is needed");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "No playlist found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }

  const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatePlaylist, "Updated playlist successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
