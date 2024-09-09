import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const existchannel = await User.findById(channelId);
  if (!existchannel) {
    throw new ApiError(400, "Channel not Found");
  }

  const alreadysubscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (!alreadysubscribed) {
    const subscriber = req.user?._id;
    const subscription = await Subscription.create({
      subscriber: subscriber,
      channel: channelId,
    });

    if (!subscription) {
      throw new ApiError(500, "something went wrong while subscribing channel");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, subscription, "subscribed to channel successfully")
      );
  } else {
    const unsubscribe = await Subscription.findOneAndDelete({
      channel: new mongoose.Types.ObjectId(channelId),
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, unsubscribe, "channel unsubscribed successfully")
      );
  }
  // TODO: toggle subscription
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  //   const existchannel = await User.findById(channelId);
  //   if (!existchannel) {
  //     throw new ApiError(400, "Channel not Found");
  //   }

  const userSubscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribercount",
      },
    },
    {
      $addFields: {
        subs: {
          $size: "$subscribercount",
        },
      },
    },
    {
      $project: {
        subs: 1,
        subscribercount: {
          _id: 1,
          fullname: 1,
          username: 1,
        },
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, userSubscribers, "total subscribers"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const existchannel = await User.findById(subscriberId);
  if (!existchannel) {
    throw new ApiError(400, "Channel not Found");
  }
  const channelSubscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
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
    {
      $addFields: {
        TotalLikes: {
          $size: "$channel",
        },
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(200, channelSubscribers, "total subscribed channels")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
