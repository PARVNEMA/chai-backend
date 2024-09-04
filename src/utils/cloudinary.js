import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";
import { ApiResponse } from "./ApiResponse.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfull
    console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteCloudinary = async (itemId) => {
  try {
    await cloudinary.uploader.destroy(itemId, function (result) {
      throw new ApiResponse(200, "deleted on cloudinary");
    });
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while deleting on cloudinary"
    );
  }
};

export { uploadOnCloudinary, deleteCloudinary };
