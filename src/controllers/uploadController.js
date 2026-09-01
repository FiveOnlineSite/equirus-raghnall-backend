import { randomUUID } from "node:crypto";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getS3Client } from "../config/s3.js";
import { isServicePage } from "../config/servicePages.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedImageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function createUploadPolicy(request, response, next) {
  try {
    const { fileType, fileSize, page } = request.body;

    if (!allowedImageTypes[fileType]) {
      return response.status(400).json({
        success: false,
        message: "Only JPG, PNG and WebP images are allowed.",
      });
    }

    if (!Number.isInteger(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      return response.status(400).json({
        success: false,
        message: "Image size must be between 1 byte and 10 MB.",
      });
    }

    const isTestimonial = page === "testimonials";
    const isBlog = page === "blogs";

    if (!isTestimonial && !isBlog && !isServicePage(page)) {
      return response.status(400).json({ success: false, message: "Invalid service page." });
    }

    const extension = allowedImageTypes[fileType];
    const key = isTestimonial ? `testimonials/${Date.now()}-${randomUUID()}.${extension}` : isBlog ? `blogs/${Date.now()}-${randomUUID()}.${extension}` : `banners/${page}/${Date.now()}-${randomUUID()}.${extension}`;
    const upload = await createPresignedPost(getS3Client(), {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Fields: { "Content-Type": fileType },
      Conditions: [
        ["content-length-range", 1, MAX_FILE_SIZE],
        ["eq", "$Content-Type", fileType],
      ],
      Expires: 300,
    });

    response.json({
      success: true,
      uploadUrl: upload.url,
      fields: upload.fields,
      key,
    });
  } catch (error) {
    next(error);
  }
}
