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
    const subscription = await Subscription.create({
      subscriber: req.user?._id,
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
      _id: alreadysubscribed._id,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, unsubscribe, "channel unsubscribed "));
  }
  // TODO: toggle subscription
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  //   const existchannel = await User.findById(channelId);
  //   if (!existchannel) {
  //     throw new ApiError(400, "Channel not Found");
  //   }

  try {
    const userSubscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscribercount",
        },
      },
      { $unwind: "$subscribercount" },

      {
        $project: {
          channel: 1,
          subs: 1,
          subscribercount: {
            _id: 1,
            fullname: 1,
            username: 1,
            avatar: 1,
          },
        },
      },
    ]);
    if (!userSubscribers || userSubscribers.length == 0) {
      return new ApiResponse(
        200,
        { userSubscribers },
        {
          numberOfSubscribers: 0,
          message: "0 Subscribers",
        },
        "no subscribers found"
      );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { number: userSubscribers.length, userSubscribers },
          "all subscribers fetched usccessfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error.message,
      "something went wrong while fetching subscribers"
    );
  }
});
const isSubscribedAlready = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const alreadysubscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user?._id,
  });
  if (alreadysubscribed) {
    return res.status(200).json(
      new ApiResponse(200, "user is already subscribed", {
        alreadysubscribed: true,
      })
    );
  }
  return res.status(200).json(
    new ApiResponse(200, "user is not subscribed", {
      alreadysubscribed: false,
    })
  );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  console.log("subscriberId", channelId);

  // Check if subscriberId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }

  // Find subscriptions based on the subscriberId
  const subscribed = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedchannels",
      },
    },
    {
      $unwind: "$subscribedchannels",
    },
    {
      $project: {
        _id: 1,
        "subscribedchannels._id": 1,
        "subscribedchannels.fullname": 1,
        "subscribedchannels.username": 1,
        "subscribedchannels.avatar": 1,
        createdAt: 1,
      },
    },
  ]);

  // console.log("subscribed", subscribed);

  // Check if there are no subscribed channels
  if (!subscribed || subscribed.length === 0) {
    throw new ApiError(404, "No channel subscribed");
  }

  // Return the response with the fetched subscriptions
  return res.status(200).json(
    new ApiResponse(200, "All subscribed channels fetched successfully", {
      subscribed,
    })
  );
});

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
  isSubscribedAlready,
};
