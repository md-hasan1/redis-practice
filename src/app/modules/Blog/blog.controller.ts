import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { BlogService } from "./blog.service";
import { Request, Response } from "express";
import pick from "../../../shared/pick";
import { blogFilterableFields } from "./blog.constant";

const createBlog = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await BlogService.createBlogIntoDb(req, req.file);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Blog created successfully!",
      data: result,
    });
  }
);

const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, blogFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await BlogService.getAllBlogsFromDb(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blogs retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getMyBlogs = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.id;
    const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

    const result = await BlogService.getMyBlogsFromDb(userId, options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My blogs retrieved successfully!",
      meta: result.meta,
      data: result.data,
    });
  }
);

const getBlogById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BlogService.getBlogByIdFromDb(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog retrieved successfully!",
    data: result,
  });
});

const updateBlog = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const result = await BlogService.updateBlogIntoDb(id, req, req.file);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog updated successfully!",
      data: result,
    });
  }
);

const deleteBlog = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const result = await BlogService.deleteBlogFromDb(id, req.user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog deleted successfully!",
      data: result,
    });
  }
);

export const BlogController = {
  createBlog,
  getAllBlogs,
  getMyBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
};
