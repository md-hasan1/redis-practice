import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpars/fileUploader";
import { BlogValidation } from "./blog.validation";
import { BlogController } from "./blog.controller";

const router = express.Router();

// Create a new blog (Authenticated users)
router.post(
  "/",
  auth(),
  fileUploader.uploadSingle,
  validateRequest(BlogValidation.createBlogValidationSchema),
  BlogController.createBlog
);

// Get all blogs (Public with filter, search & pagination)
router.get("/", BlogController.getAllBlogs);

// Get my blogs (Authenticated user's authored blogs)
router.get("/my-blogs", auth(), BlogController.getMyBlogs);

// Get single blog by ID (Public, increments view count)
router.get("/:id", BlogController.getBlogById);

// Update a blog (Author or Admin)
router.put(
  "/:id",
  auth(),
  fileUploader.uploadSingle,
  validateRequest(BlogValidation.updateBlogValidationSchema),
  BlogController.updateBlog
);

// Delete a blog (Author or Admin)
router.delete("/:id", auth(), BlogController.deleteBlog);

export const BlogRoutes = router;
