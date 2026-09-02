import mongoose from "mongoose";
import Blog from "../models/Blog.js";
import { connectDatabase } from "../config/database.js";

const cdnUrl = () => (process.env.AWS_CDN_URL || "").replace(/\/$/, "");
const categories = new Set(["Blogs", "Risk Reports", "Market Updates", "Case Studies"]);
const serialize = (blog) => {
  const item = blog.toObject ? blog.toObject() : blog;
  return { ...item, imageUrl: item.imageKey && cdnUrl() ? `${cdnUrl()}/${item.imageKey.replace(/^\//, "")}` : "" };
};
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 160);
function fields(body) {
  return {
    title: typeof body.title === "string" ? body.title.trim() : "",
    metaTitle: typeof body.metaTitle === "string" ? body.metaTitle.trim() : "",
    metaDescription: typeof body.metaDescription === "string" ? body.metaDescription.trim() : "",
    slug: typeof body.slug === "string" ? slugify(body.slug) : "",
    category: typeof body.category === "string" ? body.category.trim() : "",
    readTime: typeof body.readTime === "string" ? body.readTime.trim() : "",
    content: typeof body.content === "string" ? body.content.trim() : "",
    imageKey: typeof body.imageKey === "string" ? body.imageKey.trim() : "",
    imageAlt: typeof body.imageAlt === "string" ? body.imageAlt.trim() : "",
  };
}
function validate(value) {
  if (!value.title || !categories.has(value.category) || !value.readTime || !value.content || !value.imageKey.startsWith("blogs/")) return "Title, a valid category, read time, content, and an image are required.";
  if (value.title.length > 200 || value.metaTitle.length > 200 || value.metaDescription.length > 320 || value.imageAlt.length > 200 || value.readTime.length > 30 || value.content.length > 20000) return "One or more fields are too long.";
  return null;
}
async function uniqueSlug(title, id) {
  const base = slugify(title) || "blog";
  let slug = base;
  let count = 2;
  while (await Blog.exists({ slug, ...(id ? { _id: { $ne: id } } : {}) })) slug = `${base}-${count++}`;
  return slug;
}
export async function listPublicBlogs(_request, response, next) { try { await connectDatabase(); response.json({ success: true, blogs: (await Blog.find().sort({ createdAt: -1 }).lean()).map(serialize) }); } catch (error) { next(error); } }
export async function listFeaturedBlogs(_request, response, next) { try { await connectDatabase(); const blogs = await Blog.find({ featuredOnHome: true }).sort({ createdAt: -1 }).limit(3).lean(); response.json({ success: true, blogs: blogs.length === 2 ? blogs.map(serialize) : [] }); } catch (error) { next(error); } }
export async function getPublicBlog(request, response, next) { try { await connectDatabase(); const blog = await Blog.findOne({ slug: request.params.slug }).lean(); if (!blog) return response.status(404).json({ success: false, message: "Blog not found." }); response.json({ success: true, blog: serialize(blog) }); } catch (error) { next(error); } }
export async function listAdminBlogs(_request, response, next) { return listPublicBlogs(_request, response, next); }
export async function createBlog(request, response, next) { try { const value = fields(request.body); const message = validate(value); if (message) return response.status(400).json({ success: false, message }); await connectDatabase(); const blog = await Blog.create({ ...value, slug: await uniqueSlug(value.slug || value.title) }); response.status(201).json({ success: true, blog: serialize(blog) }); } catch (error) { next(error); } }
export async function updateBlog(request, response, next) { try { if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid blog." }); const value = fields(request.body); const message = validate(value); if (message) return response.status(400).json({ success: false, message }); await connectDatabase(); const blog = await Blog.findByIdAndUpdate(request.params.id, { ...value, slug: await uniqueSlug(value.slug || value.title, request.params.id) }, { new: true, runValidators: true }); if (!blog) return response.status(404).json({ success: false, message: "Blog not found." }); response.json({ success: true, blog: serialize(blog) }); } catch (error) { next(error); } }
export async function updateFeaturedBlog(request, response, next) { try { if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid blog." }); const featuredOnHome = request.body.featuredOnHome === true; await connectDatabase(); if (featuredOnHome && await Blog.countDocuments({ featuredOnHome: true, _id: { $ne: request.params.id } }) >= 2) return response.status(400).json({ success: false, message: "Only two blogs can be featured on the homepage." }); const blog = await Blog.findByIdAndUpdate(request.params.id, { featuredOnHome }, { new: true, runValidators: true }); if (!blog) return response.status(404).json({ success: false, message: "Blog not found." }); response.json({ success: true, blog: serialize(blog) }); } catch (error) { next(error); } }
export async function deleteBlog(request, response, next) { try { if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid blog." }); await connectDatabase(); const blog = await Blog.findByIdAndDelete(request.params.id); if (!blog) return response.status(404).json({ success: false, message: "Blog not found." }); response.json({ success: true }); } catch (error) { next(error); } }
