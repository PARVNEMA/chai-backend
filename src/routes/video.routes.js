import { Router } from "express";
import {
  allVideosOfUser,
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(getAllVideos);
router.route("/:videoId").get(getVideoById);
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

router
  .route("/:videoId")
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);


router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

router.route("/allchannelvideos/:userId").get(allVideosOfUser);

export default router;
