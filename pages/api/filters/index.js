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
        return res.status(400).json({ message: "Error", error });
      }
    }

    default: {
      return res.status(405).json({ message: "Method not allowed" });
    }
  }
}

const handleGetRequest = async () => {
  const filters = [];

  const existingFilters = await handleGetCloudinaryUploads(
    `${CLOUDINARY_FOLDER_NAME}${FILTERS_FOLDER_NAME}`
  );

  filters.push(...existingFilters.resources);

  const nonExistingFilters = FILTERS.filter((filter) => {
    const existingFilter = existingFilters.resources.find((resource) => {
      return (
        resource.public_id ===
        `${CLOUDINARY_FOLDER_NAME}${FILTERS_FOLDER_NAME}${filter.publicId}`
      );
    });

    return existingFilter === undefined;
  });

  for (const filter of nonExistingFilters) {
    const uploadResult = await handleCloudinaryUpload({
      file: filter.path,
      publicId: filter.publicId,
      inFolder: true,
      folder: `${CLOUDINARY_FOLDER_NAME}${FILTERS_FOLDER_NAME}`,
    });

    filters.push(uploadResult);
  }

  return filters;
};
