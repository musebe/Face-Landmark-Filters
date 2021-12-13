/**
 * @typedef {Object} Preset
 * @property {number} widthOffset
 * @property {number} heightOffset
 */

/**
 * @typedef {Object} Filter
 * @property {string} publicId
 * @property {string} path
 * @property {string} landmark
 * @property {Preset} presets
 */

/**
 * Cloudinary folder where images will be uploaded to
 */
export const CLOUDINARY_FOLDER_NAME = "face-landmark-filters/";

/**
 * Cloudinary folder where filters will be uploaded to
 */
export const FILTERS_FOLDER_NAME = "filters/";

/**
 * Facial landmarks
 */
export const LANDMARKS = {
  LEFT_EYE: "left_eye",
  RIGHT_EYE: "right_eye",
  NOSE: "nose",
  MOUTH: "mouth",
};

/**
 * Filters that we can apply to the image
 * @type {Filter[]}
 */
export const FILTERS = [
  {
    publicId: "snapchat_nose",
    path: "public/images/snapchat_nose.png",
    landmark: LANDMARKS.NOSE,
    presets: {
      widthOffset: 50,
      heightOffset: 50,
    },
  },
  {
    publicId: "clown_nose",
    path: "public/images/clown_nose.png",
    landmark: LANDMARKS.NOSE,
    presets: {
      widthOffset: 30,
      heightOffset: 30,
    },
  },
  {
    publicId: "snapchat_tongue",
    path: "public/images/tongue.png",
    landmark: LANDMARKS.MOUTH,
    presets: {
      widthOffset: 20,
      heightOffset: 50,
    },
  },
];
