import { z } from "zod";

const createBlogValidationSchema = z.object({
  title: z
    .string({
      required_error: "Title is required",
    })
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters"),
  content: z
    .string({
      required_error: "Content is required",
    })
    .min(10, "Content must be at least 10 characters"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

const updateBlogValidationSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters")
    .optional(),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

export const BlogValidation = {
  createBlogValidationSchema,
  updateBlogValidationSchema,
};
