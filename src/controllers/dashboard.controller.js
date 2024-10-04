import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const user = req.user?._id;
  console.log(user);

  const totalSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(user),
      },
    },
    {
      $group: {
        _id: "$channel",
        totalSubscribers: { $sum: 1 },
      },
    },
    {
      $project: {
        totalSubscribers: 1,
      },
    },
  ]);
  console.log(totalSubscribers);

  if (!totalSubscribers || totalSubscribers.length == 0) {
    return new ApiResponse(
      410,
      { totalSubscribers: 0 },
      "no subscribers till now be the first one to subscriber"
    );
  }
  const totalVideosLikes = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "owner",
        foreignField: "_id",
        as: "totalLikes",
      },
    },
    {
      $addFields: {
        Likes: {
          $size: "$totalLikes",
        },
      },
    },
    {
      $project: {
        totalLikes: 1,
      },
    },
  ]);
  if (!totalVideosLikes || totalVideosLikes.length == 0) {
    return new ApiResponse(
      410,
      { totalVideosLikes: 0 },
      "no likes till now be the first one to like"
    );
  }
  const totalVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user),
      },
    },
    {
      $group: {
        _id: "$user",
        totalVideos: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $project: {
        totalVideos: 1,
        userDetails: {
          username: 1,
          email: 1,
          fullName: 1,
        },
      },
    },
  ]);
  if (!totalVideos || totalVideos.length == 0) {
    return new ApiResponse(410, { totalVideos: 0 }, "no videos till now ");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSubscribers: totalSubscribers[0].totalSubscribers,
        totalvideos: totalVideos[0].totalVideos,
        likes: totalVideosLikes[0].Likes,
      },
      "all data fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const user = req.user?._id;

  const allVideoas = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "allvideos",
      },
    },
    {
      $addFields: {
        totalvideos: {
          $size: "$allvideos",
        },
      },
    },
    {
      $project: {
        title: 1,
        totalvideos: 1,
        allvideos: 1,
      },
    },
  ]);

  if (allVideoas.length == 0) {
    throw new ApiResponse(410, {
      numberOfVideos: 0,
      message: "No videos uploaded by the user",
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, allVideoas, "all videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
