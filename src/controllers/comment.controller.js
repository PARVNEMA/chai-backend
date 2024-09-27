import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "video id not found");
  }

  const comments = await Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$owner" },
    // { $group: { _id: "$_id", comments: { $push: "$owner" } } },
  ]);

  if (comments.length == 0) {
    throw new ApiError(400, "comments not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "all comments loaded successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const user = req.user?._id;
  console.log(content, videoId, user);

  if (!content) {
    throw new ApiError(400, "Comment message required");
  }

  if (!user) {
    throw new ApiError(400, "user  not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }
  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment created succcessfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "comment message required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "comment not found");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    new mongoose.Types.ObjectId(commentId),
    {
      $set: {
        content: content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new ApiError(500, "error in updating comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "comment not found");
  }

  const deletedcomment = await Comment.findByIdAndDelete(commentId);

  if (!deleteComment) {
    throw new ApiError(500, "error in deleting comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
