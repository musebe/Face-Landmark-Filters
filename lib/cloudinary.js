// Import the v2 api and rename it to cloudinary
import { v2 as cloudinary, TransformationOptions } from "cloudinary";
import { CLOUDINARY_FOLDER_NAME } from "./constants";

// Initialize the sdk with cloud_name, api_key and api_secret
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

/**
 * Get cloudinary uploads
 * @param {string} folder Folder name
 * @returns {Promise}
 */
export const handleGetCloudinaryUploads = (folder = CLOUDINARY_FOLDER_NAME) => {
  return cloudinary.api.resources({
    type: "upload",
    prefix: folder,
    resource_type: "image",
  });
};

/**
 * @typedef {Object} Resource
 * @property {string | Buffer} file
 * @property {string} publicId
 * @property {boolean} inFolder
 * @property {string} folder
 * @property {TransformationOptions} transformation
 *
 */

/**
 * Uploads an image to cloudinary and returns the upload result
 *
 * @param {Resource} resource
 */
export const handleCloudinaryUpload = ({
  file,
  publicId,
  transformation,
  folder = CLOUDINARY_FOLDER_NAME,
  inFolder = false,
}) => {
  return cloudinary.uploader.upload(file, {
    // Folder to store image in
    folder: inFolder ? folder : null,
    // Public id of image.
    public_id: publicId,
    // Type of resource
    resource_type: "auto",
    // Transformation to apply to the video
    transformation,
  });
};

/**
 * Deletes resources from cloudinary. Takes in an array of public ids
 * @param {string[]} ids
 */
export const handleCloudinaryDelete = (ids) => {
  return cloudinary.api.delete_resources(ids, {
    resource_type: "image",
  });
};
