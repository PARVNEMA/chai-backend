import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const allVideos = await Video.aggregate([
    {
      $match: {
        isPublished: true,
      },
    },
  ]);
  if (allVideos.length == 0) {
    throw new ApiError(400, "No videos of user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "all videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  console.log(req.body);

  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title || !description) {
    throw new ApiError(400, "title and description required");
  }
  // if (!req.files.videoFile || !req.files.thumbnail) {
  //   if (req.files.videoFile) {
  //     fs.unlinkSync(req.files?.videoFile[0]?.path);
  //   }
  //   if (req.files.thumbnail) {
  //     fs.unlinkSync(req.files?.thumbnail[0]?.path);
  //   }
  //   throw new ApiError(401, "either videoFile or thumbnail is missing");
  // }
  const videoPath = req.files?.videoFile[0]?.path;
  const thumbnailPath = req.files?.thumbnail[0]?.path;

  if (!videoPath || !thumbnailPath) {
    throw new ApiError(400, "Please upload video and thumbnail");
  }

  const videoFile = await uploadOnCloudinary(videoPath);
  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  if (!videoFile || !thumbnail) {
    throw new ApiError(
      400,
      "Something went wrong while uploading video and thumbnail"
    );
  }

  const vid = await Video.create({
    title,
    description,
    videoFile: videoFile.secure_url,
    thumbnail: thumbnail.secure_url,
    duration: videoFile?.duration,
    owner: req.user?._id,
  });

  console.log("Video", vid);

  return res
    .status(200)
    .json(new ApiResponse(200, vid, "Video created successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video not found");
  }

  // const video = await Video.findOne({ _id: videoId });
  // OR  const video = await Video.findOne({ _id: mongoose.Types.ObjectId(videoId) });
  const updateViews = await Video.findByIdAndUpdate(
    new mongoose.Types.ObjectId(videoId),
    {
      $inc: { views: 1 },
    }
  );
//  console.log("user =",req.user);

    const updateWatchHistory = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(req.user?._id),
      {
        $push: { watchHistory: new mongoose.Types.ObjectId(videoId) },
      },
      {
        new: true,
      }
    );
    // console.log("updateWatchHistory", updateWatchHistory);


  const video = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        "owner.avatar": 1,
        "owner.username": 1,
        "owner.fullName": 1,
        "owner._id": 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        likes: 1,
        views: 1,
      },
    },

    // Flatten the owner array to an object
  ]);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  return res.status(200).json(new ApiResponse(200, video[0], "Video found"));
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "title and description required");
  }
  const thumbnailPath = req.file?.path;

  if (!thumbnailPath) {
    throw new ApiError(400, "Please upload  thumbnail");
  }
  if (!videoId) {
    throw new ApiError(400, "Video not found");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  if (!thumbnail.url) {
    throw new ApiError(400, "Error while uploading on thumbnail");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    new mongoose.Types.ObjectId(videoId),
    {
      $set: {
        title,
        description: description,
        thumbnail:thumbnail.url
      },
    },
    {
      new: true,
    }
  );
  if (!updatedVideo) {
    throw new ApiError(400, "Video not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedVideo },
        "video details updated successfully"
      )
    );

  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video Id not found");
  }

  const video = await Video.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(videoId),
  });
  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  const clouddelete = await deleteCloudinary(video.videoFile);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video deleted  successfully"));

  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video not found");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  const updateduser = await Video.findByIdAndUpdate(
    new mongoose.Types.ObjectId(videoId),
    {
      $set: {
        isPublished: video.isPublished ? false : true,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateduser,
        "video toggle published updated successfully"
      )
    );
});

const allVideosOfUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "userId missing");
  }

  const allChannelVideos = await Video.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(userId) },
    },
  ]);

  if (!allChannelVideos) {
    throw new ApiResponse(200, "no videos published till now");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, allChannelVideos, "all videos fetched successfully")
    );
});
export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  allVideosOfUser,
};
