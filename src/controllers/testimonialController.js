import mongoose from "mongoose";
import Testimonial from "../models/Testimonial.js";
import { connectDatabase } from "../config/database.js";

const cdnUrl = () => (process.env.AWS_CDN_URL || "").replace(/\/$/, "");

function serialize(testimonial) {
  const item = testimonial.toObject ? testimonial.toObject() : testimonial;
  const imageKey = item.imageKey || "";
  return {
    ...item,
    imageKey,
    imageUrl: imageKey && cdnUrl() ? `${cdnUrl()}/${imageKey.replace(/^\//, "")}` : "",
  };
}

function readFields(body) {
  return {
    name: typeof body.name === "string" ? body.name.trim() : "",
    quote: typeof body.quote === "string" ? body.quote.trim() : "",
    imageKey: typeof body.imageKey === "string" ? body.imageKey.trim() : "",
    isPublished: Boolean(body.isPublished),
  };
}

function validate(fields) {
  if (!fields.name || fields.name.length > 100 || !fields.quote || fields.quote.length > 3000) {
    return "Name and testimonial text are required.";
  }

  if (!fields.imageKey.startsWith("testimonials/")) {
    return "A valid testimonial image is required.";
  }

  return null;
}

async function publishedCount() {
  return Testimonial.countDocuments({ isPublished: true });
}

export async function getPublicTestimonials(request, response, next) {
  try {
    await connectDatabase();
    const testimonials = await Testimonial.find({ isPublished: true }).sort({ displayOrder: 1, createdAt: 1 }).lean();
    response.json({
      success: true,
      testimonials: testimonials.length >= 5 ? testimonials.map(serialize) : [],
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminTestimonials(request, response, next) {
  try {
    await connectDatabase();
    const testimonials = await Testimonial.find().sort({ displayOrder: 1, createdAt: 1 }).lean();
    response.json({ success: true, testimonials: testimonials.map(serialize) });
  } catch (error) {
    next(error);
  }
}

export async function createTestimonial(request, response, next) {
  try {
    const fields = readFields(request.body);
    const message = validate(fields);
    if (message) return response.status(400).json({ success: false, message });

    await connectDatabase();
    const last = await Testimonial.findOne().sort({ displayOrder: -1 }).lean();
    const testimonial = await Testimonial.create({ ...fields, displayOrder: (last?.displayOrder || 0) + 1 });
    response.status(201).json({ success: true, testimonial: serialize(testimonial) });
  } catch (error) {
    next(error);
  }
}

export async function updateTestimonial(request, response, next) {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ success: false, message: "Invalid testimonial." });
    }

    const fields = readFields(request.body);
    const message = validate(fields);
    if (message) return response.status(400).json({ success: false, message });

    await connectDatabase();
    const existing = await Testimonial.findById(request.params.id);
    if (!existing) return response.status(404).json({ success: false, message: "Testimonial not found." });

    if (existing.isPublished && !fields.isPublished && await publishedCount() <= 5) {
      return response.status(400).json({ success: false, message: "At least five testimonials must remain published." });
    }

    Object.assign(existing, fields);
    await existing.save();
    response.json({ success: true, testimonial: serialize(existing) });
  } catch (error) {
    next(error);
  }
}

export async function deleteTestimonial(request, response, next) {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ success: false, message: "Invalid testimonial." });
    }

    await connectDatabase();
    const testimonial = await Testimonial.findById(request.params.id);
    if (!testimonial) return response.status(404).json({ success: false, message: "Testimonial not found." });

    if (testimonial.isPublished && await publishedCount() <= 5) {
      return response.status(400).json({ success: false, message: "At least five testimonials must remain published." });
    }

    await testimonial.deleteOne();
    response.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function reorderTestimonials(request, response, next) {
  try {
    const ids = request.body.ids;
    if (!Array.isArray(ids) || !ids.length || ids.some((id) => !mongoose.isValidObjectId(id))) {
      return response.status(400).json({ success: false, message: "A valid testimonial order is required." });
    }

    await connectDatabase();
    const count = await Testimonial.countDocuments({ _id: { $in: ids } });
    if (count !== ids.length || new Set(ids).size !== ids.length) {
      return response.status(400).json({ success: false, message: "The testimonial order is invalid." });
    }

    await Testimonial.bulkWrite(ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { displayOrder: index } } })));
    return getAdminTestimonials(request, response, next);
  } catch (error) {
    next(error);
  }
}
