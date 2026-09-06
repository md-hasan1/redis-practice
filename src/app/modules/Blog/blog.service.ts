import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { Prisma, UserRole } from "@prisma/client";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IBlogFilterRequest } from "./blog.interface";
import { blogSearchAbleFields } from "./blog.constant";
import { Request } from "express";
import { fileUploader } from "../../../helpars/fileUploader";
import redis from "../../../shared/redis";


const createBlogIntoDb = async (
  req: Request & { user?: any },
  file?: Express.Multer.File
) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  let imageUrl: string | undefined = undefined;
  if (file) {
    const uploadResult = await fileUploader.uploadToCloudinary(file);
    imageUrl = uploadResult.Location;
  }

  let data = req.body;
  if (typeof req.body.data === "string") {
    data = JSON.parse(req.body.data);
  } else if (req.body.data) {
    data = req.body.data;
  }

  const blogData: Prisma.BlogCreateInput = {
    title: data.title,
    content: data.content,
    category: data.category || undefined,
    tags: Array.isArray(data.tags)
      ? data.tags
      : typeof data.tags === "string"
        ? data.tags.split(",").map((t: string) => t.trim())
        : [],
    isPublished:
      data.isPublished !== undefined
        ? typeof data.isPublished === "string"
          ? data.isPublished === "true"
          : Boolean(data.isPublished)
        : true,
    image: imageUrl || data.image || undefined,
    author: {
      connect: {
        id: userId,
      },
    },
  };

  const result = await prisma.blog.create({
    data: blogData,
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
        },
      },
    },
  });
  await redis.set("user:123", "Hasan");
  return result;
};

const getAllBlogsFromDb = async (
  params: IBlogFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, isPublished, ...filterData } = params;
  const user = {
    id: 1,
    name: "Hasan",
    role: "admin",
    createdAt: new Date()
  }
  // যেকোনো এক জায়গায় একবার রান করে পুরাতন ক্যাশ মুছে দিতে পারেন:
await redis.del("user:123");

  await redis.set("user:123", JSON.stringify(user), {
  EX: 10,
  });

  const andConditions: Prisma.BlogWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: blogSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (isPublished !== undefined) {
    const publishedBool =
      typeof isPublished === "string" ? isPublished === "true" : Boolean(isPublished);
    andConditions.push({
      isPublished: {
        equals: publishedBool,
      },
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.BlogWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.blog.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
        },
      },
    },
  });

  const total = await prisma.blog.count({
    where: whereConditions,
  });


  return {
    meta: { page, limit, total },
    data: result,
  };
};

const getMyBlogsFromDb = async (
  userId: string,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const result = await prisma.blog.findMany({
    where: { authorId: userId },
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
        },
      },
    },
  });

  const total = await prisma.blog.count({
    where: { authorId: userId },
  });

  return {
    meta: { page, limit, total },
    data: result,
  };
};

const getBlogByIdFromDb = async (id: string) => {
  const isExist = await prisma.blog.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
  }

  // Increment views and return blog with author details
  const result = await prisma.blog.update({
    where: { id },
    data: {
      views: {
        increment: 1,
      },
    },
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
        },
      },
    },
  });

  return result;
};

const updateBlogIntoDb = async (
  id: string,
  req: Request & { user?: any },
  file?: Express.Multer.File
) => {
  const existingBlog = await prisma.blog.findUnique({
    where: { id },
  });

  if (!existingBlog) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
  }

  const currentUser = req.user;
  const isOwner = existingBlog.authorId === currentUser?.id;
  const isAdmin =
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.SUPER_ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this blog"
    );
  }

  let imageUrl: string | undefined = undefined;
  if (file) {
    const uploadResult = await fileUploader.uploadToCloudinary(file);
    imageUrl = uploadResult.Location;
  }

  let data = req.body;
  if (typeof req.body.data === "string") {
    data = JSON.parse(req.body.data);
  } else if (req.body.data) {
    data = req.body.data;
  }

  const updateData: Prisma.BlogUpdateInput = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.tags !== undefined) {
    updateData.tags = Array.isArray(data.tags)
      ? data.tags
      : typeof data.tags === "string"
        ? data.tags.split(",").map((t: string) => t.trim())
        : [];
  }
  if (data.isPublished !== undefined) {
    updateData.isPublished =
      typeof data.isPublished === "string"
        ? data.isPublished === "true"
        : Boolean(data.isPublished);
  }
  if (imageUrl) {
    updateData.image = imageUrl;
  } else if (data.image !== undefined) {
    updateData.image = data.image;
  }

  const result = await prisma.blog.update({
    where: { id },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
        },
      },
    },
  });

  return result;
};

const deleteBlogFromDb = async (
  id: string,
  currentUser: { id: string; role: string }
) => {
  const existingBlog = await prisma.blog.findUnique({
    where: { id },
  });

  if (!existingBlog) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
  }

  const isOwner = existingBlog.authorId === currentUser?.id;
  const isAdmin =
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.SUPER_ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not authorized to delete this blog"
    );
  }

  const result = await prisma.blog.delete({
    where: { id },
  });

  return result;
};

export const BlogService = {
  createBlogIntoDb,
  getAllBlogsFromDb,
  getMyBlogsFromDb,
  getBlogByIdFromDb,
  updateBlogIntoDb,
  deleteBlogFromDb,
};
