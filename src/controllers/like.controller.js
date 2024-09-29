import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "video not found");
  }

  const alreadylikedornot = await Like.findOne({
    video: new mongoose.Types.ObjectId(videoId),
    likedBy: new mongoose.Types.ObjectId(req.user?._id),
  });
  if (alreadylikedornot) {
    const deletelike = await Like.findOneAndDelete({
      video: new mongoose.Types.ObjectId(videoId),
      likedBy: new mongoose.Types.ObjectId(req.user?._id),
    });
    return res
      .status(200)
      .json(new ApiResponse(200, deletelike, "unliked successfully"));
  } else {
    const like = await Like.create({
      video: new mongoose.Types.ObjectId(videoId),
      likedBy: new mongoose.Types.ObjectId(req.user?._id),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, like, "liked successfully"));
  }

  //TODO: toggle like on video
});

const alreadyLiked =asyncHandler(async(req,res)=>{
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "video not found");
  }

  const alreadylikedornot = await Like.findOne({
    video: new mongoose.Types.ObjectId(videoId),
    likedBy: new mongoose.Types.ObjectId(req.user?._id),
  });

  if(alreadylikedornot){
    return res.status(200).json(new ApiResponse(200, {liked:true},"video is already liked"))
  }
  return res.status(200).json(new ApiResponse(200, {liked:false},"video is not liked"))
})
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const alreadylikedornot = await Like.findOne({
    comment: new mongoose.Types.ObjectId(commentId),
    likedBy: new mongoose.Types.ObjectId(req.user?._id),
  });
  if (alreadylikedornot) {
    const deletelike = await Like.findOneAndDelete({
      comment: new mongoose.Types.ObjectId(commentId),
      likedBy: new mongoose.Types.ObjectId(req.user?._id),
    });
    return res
      .status(200)
      .json(new ApiResponse(200, deletelike, "unliked successfully"));
  } else {
    const like = await Like.create({
      comment: new mongoose.Types.ObjectId(commentId),
      likedBy: new mongoose.Types.ObjectId(req.user?._id),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, like, "liked successfully"));
  }
  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const alreadylikedornot = await Like.findOne({
    tweet: new mongoose.Types.ObjectId(tweetId),
    likedBy: new mongoose.Types.ObjectId(req.user?._id),
  });
  if (alreadylikedornot) {
    const deletelike = await Like.findOneAndDelete({
      tweet: new mongoose.Types.ObjectId(tweetId),
      likedBy: new mongoose.Types.ObjectId(req.user?._id),
    });
    return res
      .status(200)
      .json(new ApiResponse(200, deletelike, "unliked successfully"));
  } else {
    const like = await Like.create({
      tweet: new mongoose.Types.ObjectId(tweetId),
      likedBy: new mongoose.Types.ObjectId(req.user?._id),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, like, "liked successfully"));
  }
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "liked",
      },
    },
    {
      $addFields: {
        TotalLikes: {
          $size: "$liked",
        },
      },
    },
    {
      $project: {
        likedBy: 1,
        TotalLikes: 1,
        liked: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "liked videos"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos ,alreadyLiked};
