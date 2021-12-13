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
