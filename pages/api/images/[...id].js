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
