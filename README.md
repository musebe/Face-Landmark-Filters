# Detect face landmarks and add filters overlays using cloudinary and face-api.js

## Introduction

We've all seen those cool snapchat and instagram filters that usually go over a person's mouth or nose or eyes. This is made possible by machine learning and some clever image positioning. In this tutorial, we'll be using [face-api.js](https://justadudewhohacks.github.io/face-api.js/docs/index.html), to detect face landmarks and [cloudinary](https://cloudinary.com/?ap=em) to overlay images/filters over detected landmarks. We're going to be building our application using [next.js](https://nextjs.org/).

## The setup

This is majorly a javascript project. Working knowledge of javascript is required. We'll also be using React.js and a bit of Node.js. Knowledge of the two is recommended but not required. In addition, we have a machine learning(ML) aspect. For this basic tutorial, you won't need any ML or Tensors knowledge. However, if you would like to train your own models or expand the functionality, you need to be conversant with the field.

[Cloudinary](https://cloudinary.com/?ap=em) is a service that allows developers to store different types of media, manipulate and transform the media and also optimize its delivery. 

[face-api.js](https://justadudewhohacks.github.io/face-api.js/docs/index.html) is a javaScript API for face detection and face recognition in the browser implemented on top of the [tensorflow.js](https://www.tensorflow.org/js) core API.

[Next.js](https://nextjs.org/) is a react framework that allows for production grade features such as hybrid static & server rendering, file system routing, incremental static generation, and others.

Let's start by creating a new Next.js project. This is fairly easy to do using the Next.js CLI app. Open your terminal in your desired folder and run the following command.

```bash
npx create-next-app face-landmark-filters
```

This scaffolds a new project called `face-landmark-filters`. You can change the name to any name you'd like. Change directory into the new `face-landmark-filters` folder and open it in your favorite code editor.

```bash
cd face-landmark-filters
```

### Cloudinary account and credentials

It's quite easy to get started with a free cloudinary account if you do not already have one. Fire up your browser and go to [cloudinary](https://cloudinary.com/?ap=em). Create an account if you don't have one then proceed to log in. Over at the [console page](https://cloudinary.com/console?ap=em) you'll find the credentials you need.

![Cloudinary Dashboard](https://res.cloudinary.com/hackit-africa/image/upload/v1623006780/cloudinary-dashboard.png "Cloudinary Dashboard")

Open your code editor and create a new file called `.local.env` at the root of your project. We're going to be putting our environment variables in this file. In case you're not familiar with environment variables, they allow us to abstract sensitive keys and secrets from our code. Read about support for environment variables in Next.js from the [documentation](https://nextjs.org/docs/basic-features/environment-variables).

Paste the following inside your `.env.local` file.

```env
CLOUD_NAME=YOUR_CLOUD_NAME
API_KEY=YOUR_API_KEY
API_SECRET=YOUR_API_SECRET
```

Replace `YOUR_CLOUD_NAME`, `YOUR_API_KEY` and `YOUR_API_SECRET` with the **cloud name**, **api key** and **api secret** values that we got from the [cloudinary console page](https://cloudinary.com/console?ap=em).

### Libraries and dependencies

We're going to need a few node packages for this project.

- [cloudinary](https://www.npmjs.com/package/cloudinary)
- [formidable](https://www.npmjs.com/package/formidable)
- [@vladmandic/face-api](https://www.npmjs.com/package/@vladmandic/face-api)
- [@tensorflow/tfjs-node](https://www.npmjs.com/package/@tensorflow/tfjs-node)
- [canvas](https://www.npmjs.com/package/canvas)

The reason why we're using [@vladmandic/face-api](https://www.npmjs.com/package/@vladmandic/face-api) instead of [face-api.js](https://www.npmjs.com/package/face-api.js) is because [face-api.js](https://www.npmjs.com/package/face-api.js) doesn't seem to be actively maintained and is not compatible with newer versions of [tensorflow.js](https://www.tensorflow.org/js).

[@tensorflow/tfjs-node](https://www.npmjs.com/package/@tensorflow/tfjs-node) speeds up face and landmark detection using the ML models. It's not required but nice to have the speed boost.

[canvas](https://www.npmjs.com/package/canvas) will patch the Node.js environment to have support for graphical functions. It patches the `HTMLImageElement` and `HTMLCanvasElement`.

[formidable](https://www.npmjs.com/package/formidable) will be responsible for parsing any form data that we receive in our api routes.

Run the following command to install all of the above

```bash
npm install cloudinary formidable @vladmandic/face-api @tensorflow/tfjs-node canvas
```

### Machine Learning models

face-api.js requires some pre-trained machine learning models that will allow tensorflow to detect faces as well as the facial landmarks. As I mentioned earlier, if you'd like to train your own models or extend the funtionality, you need to have knowledge of ML and deep learning. The creator of face-api.js was generous enough to provide some pre-trained models along with the library. Download the models at [https://github.com/vladmandic/face-api/tree/master/model](https://github.com/vladmandic/face-api/tree/master/model) and save them in your project inside the `public/models` folder. You can also get the full source code for this tutorial on my [github](https://github.com/newtonmunene99/face-landmark-filters) with all the models already added.

### Filter images

We also need the images that we are going to be using as filters. These need to be PNGs with a transparent background. For ease you can download the images from [https://github.com/newtonmunene99/face-landmark-filters/blob/master/public/images](https://github.com/newtonmunene99/face-landmark-filters/blob/master/public/images) and save them inside the `public/images` folder. Again, you can also get the full source code for this tutorial on my [github](https://github.com/newtonmunene99/face-landmark-filters) with all the images already added.

## Getting started

Create a folder named `lib` at the root of your project. Inside this folder create a file called `parse-form.js`. Paste the following code inside `lib/parse-form.js`

```js
// lib/parse-form.js

import { IncomingForm, Files, Fields } from "formidable";

/**
 * Parses the incoming form data.
 *
 * @param {NextApiRequest} req The incoming request object
 * @returns {Promise<{fields:Fields;files:Files;}>} The parsed form data
 */
export const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    // Create a new incoming form
    const form = new IncomingForm({ keepExtensions: true, multiples: true });

    form.parse(req, (error, fields, files) => {
      if (error) {
        return reject(error);
      }

      return resolve({ fields, files });
    });
  });
};
```

This file exports a function called `parseForm`. This will use formidable to parse any requests that we receive in our api routes with the `multipart/form-data` content type header. Read about the specifics in the [formidable docs](https://www.npmjs.com/package/formidable).

---

Create another file inside the `lib` folder and name it `constants.js`. Paste the following code inside `lib/constants.js`

```js
// lib/constants.js

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
```

These are just a few variables that we'll be using in our project. In the `FILTERS` array, we have all the filters that we're going to be able to use. We define a public id for each filter, its path in the file system, the facial landmark over which we can apply the filter and a few presets that we'll use when applying the filter. Let me explain a bit more on the presets. So say for example we have a nose filter that is a bit small or large in pixel size. We need to make it a bit smaller or bigger so that it covers the person's nose perfectly so we define a width and height offset that we can use. To make it smaller you can use a negative value and to make it bigger we use a positive value. 

With that said, if you want to have more filters just store the filter images inside of `public/images` folder then add them to the `FILTERS` array. Make sure the `publicId` is unique for every filter.

---

Create a new file under `lib` folder and name it `cloudinary.js`. Paste the following inside.

```js
// lib/cloudinary.js

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

```

This file contains all the functions we need to communicate with cloudinary. At the top we import the `v2` API from the SDK and rename it to `cloudinary` for readability purposes. We also import the `CLOUDINARY_FOLDER_NAME` variable from the `lib/constants.js` file that we created earlier. We then proceed to initialize the SDK by calling the `config` method on the api and passing to it the cloud name, api key and api secret. Remember we defined these as environment variables in our `.env.local` file earlier. The `handleGetCloudinaryUploads` function calls the `api.resources` method on the api to get all resources that have been uploaded to a specific folder. Read about this in the [cloudinary admin api docs](https://cloudinary.com/documentation/admin_api#get_resources). `handleCloudinaryUpload` calls the `uploader.upload` method to upload a file to cloudinary. It takes in a resource object which contains the file we want to upload, an optional publicId, transformation object, whether or not to place the file inside a folder and a folder name. Read more about the upload method in the [cloudinary upload docs](https://cloudinary.com/documentation/image_upload_api_reference#upload_method). `handleCloudinaryDelete` passes an array of public IDs to the `api.delete_resources` method for deletion. Read all about this method in the [cloudinary admin api docs](https://cloudinary.com/documentation/admin_api#delete_resources)

---

Create a new file under `lib` folder and name it `face-api.js`. Paste the following inside `lib/face-api.js`.

```js
// lib/face-api.js

import "@tensorflow/tfjs-node";
import { Canvas, Image, ImageData, loadImage } from "canvas";
import { env, nets, detectAllFaces, Point } from "@vladmandic/face-api";

env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

const loadModels = async () => {
  if (modelsLoaded) {
    return;
  }

  await nets.ssdMobilenetv1.loadFromDisk("public/models");
  await nets.faceLandmark68Net.loadFromDisk("public/models");
  modelsLoaded = true;
};

/**
 * Detect all faces in an image and their landmarks
 * @param {string} imagePath
 */
export const detectFaceLandmarks = async (imagePath) => {
  await loadModels();

  const image = await loadImage(imagePath);

  const faces = await detectAllFaces(image).withFaceLandmarks();

  return faces;
};

/**
 * Gets the approximate center of the landmark
 * @param {Point[]} landmark
 */
export const getCenterOfLandmark = (landmark) => {
  const coordinates = landmark.map((xy) => [xy.x, xy.y]);

  const x = coordinates.map((xy) => xy[0]);
  const y = coordinates.map((xy) => xy[1]);

  const centerX = (Math.min(...x) + Math.max(...x)) / 2;
  const centerY = (Math.min(...y) + Math.max(...y)) / 2;

  return { x: centerX, y: centerY };
};

/**
 * Get the approximate height and width of the landmark.
 * @param {Point[]} landmark
 * @returns
 */
export const getHeightWidthOfLandmark = (landmark) => {
  const minX = Math.min(...landmark.map((xy) => xy.x));
  const maxX = Math.max(...landmark.map((xy) => xy.x));

  const minY = Math.min(...landmark.map((xy) => xy.y));
  const maxY = Math.max(...landmark.map((xy) => xy.y));

  return {
    width: maxX - minX,
    height: maxY - minY,
  };
};

```

This file contains all the code we need to detect faces and their landmarks. At the top we first patch the node environment so that our face-api library can be able to use the HTMLImageElement and the HTMLCanvasElement. We then have a `loadModels` function which loads our pretrained models. To avoid having to load our models every time we make an API call, we have a `modelsLoaded` variable that we check to see if we have already loaded the models into memory. For a normal node project, you can just load your models once when you start up your application, but since we're using Next.js and severless functions for the backend, we want to check that everytime. Read more about loading models [here](https://github.com/justadudewhohacks/face-api.js#loading-the-models) `detectFaceLandmarks` takes in an image path, loads the ML models and then creates an Image object using the `loadImage` function from the canvas package and then detects all faces with landmarks and return the faces. Read more about detecting faces and landmarks [here](https://github.com/justadudewhohacks/face-api.js#detecting-68-face-landmark-points). 

`getCenterOfLandmark` takes in an array of x and y coordinates then uses some simple mathematics to estimate the center of the points. Let's use an eye as an example.

```md
  2   3
1   7   4
  5   6
```

Let's imagine that the numbers 1,2,3,4,5,6 above represent the outline for an eye. We want to get the center which is represented by the number 7.

`getHeightWidthOfLandmark` get the approximate height and width of a landmark. It also takes in an array of x and y coordinates. Using the same example of an eye as before.

```md
  2   3
1   7   4
  5   6
```

To get the approximate width, we take the smallest x coordinate which is represented by the number 1 and the largest which is represented by the number 4 then get the difference. Do the same with the height.

---

Let's move on to our API routes. Create a folder called `filters` inside `pages/api`. Create a new file called `index.js` under `pages/api/filters`. This file will handle calls to the `/api/filters` endpoint. If you are not familiar with API routes in Next.js, I highly recommend you read the [docs](https://nextjs.org/docs/api-routes/introduction) before proceeding. Paste the following code inside `pages/api/filters/index.js`.

```jsx
// pages/api/filters/index.js

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
```

I am assuming that you're now already familiar with the structure of a Next.js API route. It's usually a default export function that takes in the incoming request object and the outgoing response object. In our handler function we use a switch statement to differentiate among the different HTTP request methods. On this endpoint, `api/filters`, we only want to handle GET requests. 

The `handleGetReqeust` function gets all filters that have been uploaded to cloudinary by calling the `handleGetCloudinaryUploads` and passing in a folder. In this case our folder will resolve to `face-landmark-filters/filters/`. We then compare with the filters that we have defined in the `FILTERS` array that we defined earlier inside `lib/constants.js`. If the filter exists in the `FILTER` array but not on cloudinary we push it into an array and then upload all filters in the array to cloudinary. We then return all filters that have been uploaded to the `face-landmark-filters/filters/` folder on cloudinary. 

---

Create a folder called `images` inside `pages/api`. Create a new file called `index.js` under `pages/api/images`. This file will handle calls to the `/api/images` endpoint. Paste the following code inside `pages/api/images/index.js`.

```jsx
// pages/api/images/index.js

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
```

This endpoint is just slightly different from the `api/filters` endpoint. In this one, we export a `config` object at the top in addition to the default export function that handles the requests. The `config` object instructs Next.js not to use the default built in body parser. This is because we're expecting form data and we want to parse this ourselves using formidable. Read more about custom config for api routes in the [documentation](https://nextjs.org/docs/api-routes/api-middlewares#custom-config). 

This time around we want to handle GET and POST requests. `handleGetRequest` gets all images uploaded to the `face-landmark-filters/` folder. We also want to filter out any images inside `face-landmark-filters/filters/` folder because those are just our filter images.

`handlePostRequest` takes in the incoming request object and passes it to the `parseForm` function that we created earlier. This parses the incoming form data. From the data we get the photo that has been uploaded

```js
// ...
const photo = data.files.photo;
// ...
```

as well as which filters to use for the nose, mouth, and eyes.

```js
// ...
const {
    nose: noseFilter,
    mouth: mouthFilter,
    left_eye: leftEyeFilter,
    right_eye: rightEyeFilter,
  } = data.fields;
// ...
```

We then call the `detectFaceLandmarks` function and pass the uploaded photo to get all faces and the landmarks. 

```js
// ...
const faces = await detectFaceLandmarks(photo.filepath);
// ...
```

For every detected face, we get the landmarks using javascript object destructuring,

```js
// ...
for (const face of faces) {
    const { landmarks } = face;
// ...
```

then we check the parsed form data to see if the user selected a filter to apply for either the nose, mouth or eyes. If there's a filter for one of those landmarks we get the landmark coordinates, the center of the landmark, the height and width of the landmark, and also check if the filter exists in our `FILTERS` array. Using the nose as an example

```js
// ...
 if (noseFilter) {
      const nose = landmarks.getNose();

      const centerOfNose = getCenterOfLandmark(nose);
      const heightWidthOfNose = getHeightWidthOfLandmark(nose);

      const filter = FILTERS.find((filter) => filter.publicId === noseFilter);
// ...
```

For every filter that we need to apply, we push a transformation object to the `transformations` array. Read about transformations indepth in the [cloudinary image transformations docs](https://cloudinary.com/documentation/image_transformations). To apply an overlay transformation, we need to pass the following transformation object

```js
// This is just an example using sample values
{
  overlay: 'resource public id',
  width: 100,
  height: 100,
  crop: 'crop style', // which crop style to use if you need to crop
  gravity: 'gravity', // where to position the overlay relative to
  x: 100, // x coordinates relative to the gravity
  y: 100, // y coordinates relative to the gravity
}
```

In our case, for the overlay, we're using the filter's folder + it's `publicId` value. This is why I mentioned earlier to make sure that `publicId` is unique when adding filters to the `FILTERS` array. For the width and height, we use the landmarks approximate height and width + their offset presets. For the crop value, we use `fit`. Read about all possible values [here](https://cloudinary.com/documentation/transformation_reference#c_crop). For the gravity, we use `xy_center` which is a [special position](https://cloudinary.com/documentation/transformation_reference#g_special_position). This places our overlay's center at our x and y values. Read about this [here](https://cloudinary.com/documentation/transformation_reference#g_special_position). For our x and y, we just use the center of the landmark.

For a bit more context, check out [this documentation](https://cloudinary.com/documentation/layers) on placing layers on images.

Once we have our transformations ready, we upload the photo to cloudinary using the `handleCloudinaryUpload` function and pass the transformations to the `transformation` field.

---

Next thing, create a file called `[...id].js` under the `pages/api/images` folder. This file will handle api requests made to the `/api/images/:id` endpoint. Paste the following code inside.

```js
// pages/api/images

import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import { handleCloudinaryDelete } from "../../../lib/cloudinary";

/**
 * @type {NextApiHandler}
 * @param {NextApiRequest} req
 * @param {NextApiResponse} res
 */
export default async function handler(req, res) {
  let { id } = req.query;

  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  if (Array.isArray(id)) {
    id = id.join("/");
  }

  switch (req.method) {
    case "DELETE": {
      try {
        const result = await handleDeleteRequest(id);

        return res.status(200).json({ message: "Success", result });
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

const handleDeleteRequest = async (id) => {
  const result = await handleCloudinaryDelete([id]);

  return result;
};

```

This endpoint only accepts DELETE requests. `handleDeleteRequest` passes an images public id to `handleCloudinaryDelete` and deletes the image from cloudinary. The destructured array syntax for the file name is used to match all routes that come after a dynamic route. For example to handle routes such as `/api/images/:id/:anotherId/`  or `/api/images/:id/someAction/` instead of just `/api/images/:id/`. Read [this documentation](https://nextjs.org/docs/api-routes/dynamic-api-routes#catch-all-api-routes) to get a much better explanation.

---

We can finally move on to the front end. This is just some basic React.js and I won't be focusing too much on explaining what each bit does.

Add the following code inside `styles/globals.css`

```css

a:hover {
  text-decoration: underline;
}


:root {
  --color-primary: #ffee00;
}

.button {
  background-color: var(--color-primary);
  border-radius: 5px;
  border: none;
  color: #000000;
  text-transform: uppercase;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 50px;
}

.danger {
  color: #ffffff;
  background-color: #cc0000;
}

.button:hover:not([disabled]) {
  filter: brightness(96%);
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

```

These are some global styles that we're going to be using in our components. 

Create a folder called `components` at the root of your project and then create a file called `Layout.js` inside it. Paste the following code inside `components/Layout.js`

```jsx
import Head from "next/head";
import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div>
      <Head>
        <title>Face Landmarks Filters</title>
        <meta name="description" content="Face Landmarks Filters" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav>
        <Link href="/">
          <a>Home</a>
        </Link>
        <Link href="/images">
          <a>Images</a>
        </Link>
      </nav>

      <main>{children}</main>
      <style jsx>{`
        nav {
          height: 100px;
          background-color: var(--color-primary);
          display: flex;
          flex-flow: row wrap;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }

        nav a {
          font-weight: bold;
          letter-spacing: 1px;
        }

        main {
          min-height: calc(100vh- 100px);
          background-color: #f4f4f4;
        }
      `}</style>
    </div>
  );
}

```

We're going to use this to wrap all of our components. This achieves some structural consistency and also avoids code duplication.

Paste the following code inside `pages/index.js`.

```jsx
import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  CLOUDINARY_FOLDER_NAME,
  FILTERS,
  FILTERS_FOLDER_NAME,
} from "../lib/constants";

export default function Home() {
  const router = useRouter();

  const [filters, setFilters] = useState(null);

  /**
   * @type {[File, (file:File)=>void]}
   */
  const [image, setImage] = useState(null);

  /**
   * @type {[boolean, (uploading:boolean)=>void]}
   */
  const [loading, setLoading] = useState(false);

  /**
   * @type {[boolean, (uploading:boolean)=>void]}
   */
  const [uploadInProgress, setUploadInProgress] = useState(false);

  const getFilters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/filters", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      setFilters(
        FILTERS.map((filter) => {
          const resource = data.result.find((result) => {
            return (
              result.public_id ===
              `${CLOUDINARY_FOLDER_NAME}${FILTERS_FOLDER_NAME}${filter.publicId}`
            );
          });

          return {
            ...filter,
            resource,
          };
        }).filter((filter) => filter.resource)
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getFilters();
  }, [getFilters]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    try {
      setUploadInProgress(true);

      const formData = new FormData(event.target);

      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      router.push("/images");
    } catch (error) {
      console.error(error);
    } finally {
      setUploadInProgress(false);
    }
  };

  return (
    <Layout>
      <div className="wrapper">
        <form onSubmit={handleFormSubmit}>
          {loading ? (
            <small>getting filters...</small>
          ) : (
            <small>Ready. {filters?.length} filters available</small>
          )}

          {filters && (
            <div className="filters">
              {filters.map((filter) => (
                <div key={filter.resource.public_id} className="filter">
                  <label htmlFor={filter.publicId}>
                    <Image
                      src={filter.resource.secure_url}
                      alt={filter.resource.secure_url}
                      layout="fill"
                    ></Image>
                  </label>
                  <input
                    type="radio"
                    name={filter.landmark}
                    id={filter.publicId}
                    value={filter.publicId}
                    disabled={uploadInProgress}
                  ></input>
                </div>
              ))}
            </div>
          )}

          {image && (
            <div className="preview">
              <Image
                src={URL.createObjectURL(image)}
                alt="Image preview"
                layout="fill"
              ></Image>
            </div>
          )}
          <div className="form-group file">
            <label htmlFor="photo">Click to select photo</label>
            <input
              type="file"
              id="photo"
              name="photo"
              multiple={false}
              hidden
              accept=".png,.jpg,.jpeg"
              disabled={uploadInProgress}
              onInput={(event) => {
                setImage(event.target.files[0]);
              }}
            />
          </div>

          <button
            className="button"
            type="submit"
            disabled={!image || uploadInProgress || !filters}
          >
            Upload
          </button>
        </form>
      </div>
      <style jsx>{`
        div.wrapper {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        div.wrapper form {
          width: 60%;
          max-width: 600px;
          min-width: 300px;
          padding: 20px;
          border-radius: 5px;
          display: flex;
          flex-direction: column;
          justify-content: start;
          align-items: center;
          gap: 20px;
          background-color: #ffffff;
        }

        div.wrapper form div.preview {
          position: relative;
          height: 200px;
          width: 100%;
          object-fit: cover;
        }

        div.wrapper form div.filters {
          width: 100%;
          height: 200px;
          display: flex;
          flex-flow: row wrap;
          justify-content: center;
          align-items: center;
          gap: 5px;
        }

        div.wrapper form div.filters div.filter {
          flex: 0 0 50px;
          display: flex;
          flex-flow: row-reverse nowrap;
          padding: 10px;
          border: 1px solid #cccccc;
          border-radius: 5px;
        }

        div.wrapper form div.filters div.filter label {
          position: relative;
          width: 100px;
          height: 100px;
        }

        div.wrapper form div.form-group {
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flec-start;
        }

        div.wrapper form div.form-group.file {
          background-color: #f1f1f1;
          height: 150px;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        div.wrapper form div.form-group label {
          font-weight: bold;
          height: 100%;
          width: 100%;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        div.wrapper form div.form-group.file input {
          height: 100%;
          width: 100%;
          cursor: pointer;
        }

        div.wrapper form button {
          width: 100%;
        }
      `}</style>
    </Layout>
  );
}

```

Notice the use of a number of React hooks. Read about the `useState` hook [here](https://reactjs.org/docs/hooks-state.html) and the `useCallback` and `useEffect` hooks [here](https://reactjs.org/docs/hooks-reference.html). The docs have covered their uses pretty well and it's easy to understand. We use the `useEffect` hook to call the [memoized](https://en.wikipedia.org/wiki/Memoization) function `getFilters`. `getFilters` makes a GET request to the `api/filters` endpoint to get all filters available. In the body of our component, we have a form where the user can select what filters to apply and also select a photo for upload. We use a radio button group to ensure the user doesn't select more that one filter for the same facial landmark. When the form is submitted, the `handleFormSubmit` function is triggered. This function makes a POST request to the `api/images` endpoint with the form data as the body. On success, we navigate to the `/images` page that we'll be creating next. Read about `useRouter` [here](https://nextjs.org/docs/api-reference/next/router).

Create a new file under `pages/` called `images.js`. Paste the following inside `pages/images.js`.

```jsx
import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import Link from "next/link";
import Image from "next/image";

export default function Images() {
  const [images, setImages] = useState([]);

  const [loading, setLoading] = useState(false);

  const getImages = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/images", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      setImages(data.result.resources);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getImages();
  }, [getImages]);

  const handleDownloadResource = async (url) => {
    try {
      setLoading(true);

      const response = await fetch(url, {});

      if (response.ok) {
        const blob = await response.blob();

        const fileUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = `face-landmark-filters.${url.split(".").at(-1)}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      throw await response.json();
    } catch (error) {
      // TODO: Show error message to user
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/images/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      getImages();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {images.length > 0 ? (
        <div className="wrapper">
          <div className="images-wrapper">
            {images.map((image) => {
              return (
                <div className="image-wrapper" key={image.public_id}>
                  <div className="image">
                    <Image
                      src={image.secure_url}
                      width={image.width}
                      height={image.height}
                      layout="responsive"
                      alt={image.secure_url}
                    ></Image>
                  </div>
                  <div className="actions">
                    <button
                      className="button"
                      disabled={loading}
                      onClick={() => {
                        handleDownloadResource(image.secure_url);
                      }}
                    >
                      Download
                    </button>
                    <button
                      className="button danger"
                      disabled={loading}
                      onClick={() => {
                        handleDelete(image.public_id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {!loading && images.length === 0 ? (
        <div className="no-images">
          <b>No Images Yet</b>
          <Link href="/">
            <a className="button">Upload some images</a>
          </Link>
        </div>
      ) : null}
      {loading && images.length === 0 ? (
        <div className="loading">
          <b>Loading...</b>
        </div>
      ) : null}
      <style jsx>{`
        div.wrapper {
          min-height: 100vh;
          background-color: #f4f4f4;
        }

        div.wrapper div.images-wrapper {
          display: flex;
          flex-flow: row wrap;
          gap: 10px;
          padding: 10px;
        }

        div.wrapper div.images-wrapper div.image-wrapper {
          flex: 0 0 400px;
          display: flex;
          flex-flow: column;
        }

        div.wrapper div.images-wrapper div.image-wrapper div.image {
          background-color: #ffffff;
          position: relative;
          width: 100%;
        }

        div.wrapper div.images-wrapper div.image-wrapper div.actions {
          background-color: #ffffff;
          padding: 10px;
          display: flex;
          flex-flow: row wrap;
          gap: 10px;
        }

        div.loading,
        div.no-images {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-flow: column;
          gap: 10px;
        }
      `}</style>
    </Layout>
  );
}
```

This is a simple page. We call the `getImages` function when the component is mounted. `getImages` then makes a GET request to the `/api/images` endpoint to get all uploaded images(These will be the images that already have a filter applied to them). For the body, we just show the images in a flexbox container. Each image has a download and delete button. 

That's about it. I may have rushed over the UI part, however, the React.js and Next.js docs explain most of those things extremely well. You can always looks anything up you might have issues with there. 

The last thing we need to do is configure our Next.js project to be able to display images from cloudinary. Next.js does a lot of things under the hood to optimize the performance of your applications. One of these things is optimizing images when using the [Image](https://nextjs.org/docs/api-reference/next/image) component from Next.js. We need to add cloudinary's domain to our config file. Read more about this [here](https://nextjs.org/docs/api-reference/next/image#domains). Add the following to `next.config.js`. If you don't find the file at the root of your project you can create it yourself.

```js
module.exports = {
  // ...
  images: {
    domains: ["res.cloudinary.com"],
  },
};
```

Our application is now ready to run. 

```bash
npm run dev
```

You can find the full source code on my [Github](https://github.com/newtonmunene99/face-landmark-filters). Remember, this is a simple implementation for demonstration purposes. You can always optimize a few thing for use in the real world.

