import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "content not found");
  }

  const tweet = await Tweet.create({
    content: content,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "something wrong while creating tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const {userId}=req.params
  if(!userId){
    throw new ApiError(400,"user id not found")
  }

  const userTweets=await Tweet.aggregate([{
    $match:{
        owner:new mongoose.Types.ObjectId(userId)
    }
  }])
  if(userTweets.length==0){
    throw new ApiError(400,"no tweets found")
  }

  return res.status(200).json(new ApiResponse(200,userTweets,"tweets found successfully"))

});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  const {tweetId}=req.params

  const tweetfound=await Tweet.findById(tweetId);
  if(!tweetfound){
      throw new ApiError(400,"tweet not found")
  }
  if (!content) {
    throw new ApiError(400, "content not found");
  }

  const updatedtweet = await Tweet.findByIdAndUpdate(
    new mongoose.Types.ObjectId(tweetId),
    {
      $set: {
        content:content
      },
    },
    {
      new: true,
    }
  );
  if(!updatedtweet){
    throw new ApiError(500,"something went wrong while updating tweet")
  }

  return res.status(200).json(new ApiResponse(200,updatedtweet,"tweet updated successfully"))
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const {tweetId}=req.params

  if(!tweetId){
    throw new ApiError(400,"tweet id not found")
  }
  const tweetfound=await Tweet.findById(tweetId);
  if(!tweetfound){
      throw new ApiError(400,"tweet not found")
  }

  const deletetweet=await Tweet.findByIdAndDelete(tweetId);

  return res.status(200).json(new ApiResponse(200,deletetweet,"tweet deleted successfully"))
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
