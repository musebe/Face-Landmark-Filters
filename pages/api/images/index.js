import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import {
  handleCloudinaryUpload,
  handleGetCloudinaryUploads,
} from "../../../lib/cloudinary";
import {
  CLOUDINARY_FOLDER_NAME,
  FILTERS,
  FILTERS_FOLDER_NAME,
} from "../../../lib/constants";
import {
  detectFaceLandmarks,
  getCenterOfLandmark,
  getHeightWidthOfLandmark,
} from "../../../lib/face-api";
import { parseForm } from "../../../lib/parse-form";

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * @type {NextApiHandler}
 * @param {NextApiRequest} req
 * @param {NextApiResponse} res
 */
export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case "GET": {
      try {
        const result = await handleGetRequest();

        return res.status(200).json({ message: "Success", result });
      } catch (error) {
        console.error(error);
        return res.status(400).json({ message: "Error", error });
      }
    }

    case "POST": {
      try {
        const result = await handlePostRequest(req);

        return res.status(201).json({ message: "Success", result });
      } catch (error) {
        console.error(error);
        return res.status(400).json({ message: "Error", error });
      }
    }

    default: {
      return res.status(405).json({ message: "Method not allowed" });
    }
  }
}

const handleGetRequest = async () => {
  const result = await handleGetCloudinaryUploads();

  result.resources = result.resources.filter(
    (resource) =>
      !resource.public_id.startsWith(
        `${CLOUDINARY_FOLDER_NAME}${FILTERS_FOLDER_NAME}`
      )
  );

  return result;
};

/**
 *
 * @param {NextApiRequest} req
 */
const handlePostRequest = async (req) => {
  // Get the form data using the parseForm function
  const data = await parseForm(req);

  const photo = data.files.photo;
  const {
    nose: noseFilter,
    mouth: mouthFilter,
    left_eye: leftEyeFilter,
    right_eye: rightEyeFilter,
  } = data.fields;

  const faces = await detectFaceLandmarks(photo.filepath);

  const transformations = [];

  for (const face of faces) {
    const { landmarks } = face;

    if (noseFilter) {
      const nose = landmarks.getNose();

      const centerOfNose = getCenterOfLandmark(nose);
      const heightWidthOfNose = getHeightWidthOfLandmark(nose);

      const filter = FILTERS.find((filter) => filter.publicId === noseFilter);

      if (!filter) {
        throw new Error("Filter not found");
      }

      transformations.push({
        overlay:
          `${CLOUDINARY_FOLDER_NAME}${FILTERS_FOLDER_NAME}${filter.publicId}`.replace(
            /\//g,
            ":"
          ),
        width:
          Math.round(heightWidthOfNose.width) + filter.presets?.widthOffset ??
          0,
        height:
          Math.round(heightWidthOfNose.height) + filter.presets?.heightOffset ??
          0,
        crop: "fit",
        gravity: "xy_center",
        x: Math.round(centerOfNose.x),
        y: Math.round(centerOfNose.y),
      });
    }

    if (mouthFilter) {
      const mouth = landmarks.getMouth();

      const centerOfMouth = getCenterOfLandmark(mouth);
      const heightWidthOfMouth = getHeightWidthOfLandmark(mouth);

      const filter = FILTERS.find((filter) => filter.publicId === mouthFilter);

      if (!filter) {
        throw new Error("Filter not found");
      }

      transformations.push({
        overlay:
          `${CLOUDINARY_FOLDER_NAME}${FILTERS_FOLDER_NAME}${filter.publicId}`.replace(
            /\//g,
            ":"
          ),
        width:
          Math.round(heightWidthOfMouth.width) + filter.presets?.widthOffset ??
          0,
        height:
          Math.round(heightWidthOfMouth.height) +
            filter.presets?.heightOffset ?? 0,
        crop: "fit",
        gravity: "xy_center",
        x: Math.round(centerOfMouth.x),
        y: Math.round(centerOfMouth.y + heightWidthOfMouth.height),
      });
    }

    if (leftEyeFilter) {
      const leftEye = landmarks.getLeftEye();

      const centerOfLeftEye = getCenterOfLandmark(leftEye);
      const heightWidthOfLeftEye = getHeightWidthOfLandmark(leftEye);

      const filter = FILTERS.find(
        (filter) => filter.publicId === leftEyeFilter
      );

      if (!filter) {
        throw new Error("Filter not found");
      }

      transformations.push({
        overlay:
          `${CLOUDINARY_FOLDER_NAME}${FILTERS_FOLDER_NAME}${filter.publicId}`.replace(
            /\//g,
            ":"
          ),
        width:
          Math.round(heightWidthOfLeftEye.width) +
            filter.presets?.widthOffset ?? 0,
        height:
          Math.round(heightWidthOfLeftEye.height) +
            filter.presets?.heightOffset ?? 0,
        crop: "fit",
        gravity: "xy_center",
        x: Math.round(centerOfLeftEye.x),
        y: Math.round(centerOfLeftEye.y),
      });
    }

    if (rightEyeFilter) {
      const rightEye = landmarks.getRightEye();

      const centerOfRightEye = getCenterOfLandmark(rightEye);
      const heightWidthOfRightEye = getHeightWidthOfLandmark(rightEye);

      const filter = FILTERS.find(
        (filter) => filter.publicId === rightEyeFilter
      );

      if (!filter) {
        throw new Error("Filter not found");
      }

      transformations.push({
        overlay:
          `${CLOUDINARY_FOLDER_NAME}${FILTERS_FOLDER_NAME}${filter.publicId}`.replace(
            /\//g,
            ":"
          ),
        width:
          Math.round(heightWidthOfRightEye.width) +
            filter.presets?.widthOffset ?? 0,
        height:
          Math.round(heightWidthOfRightEye.height) +
            filter.presets?.heightOffset ?? 0,
        crop: "fit",
        gravity: "xy_center",
        x: Math.round(centerOfRightEye.x),
        y: Math.round(centerOfRightEye.y),
      });
    }
  }

  const uploadResult = await handleCloudinaryUpload({
    file: photo.filepath,
    transformation: transformations,
    inFolder: true,
  });

  return uploadResult;
};
