import mongoose from "mongoose";
import Faq from "../models/Faq.js";
import FaqPage from "../models/FaqPage.js";
import { connectDatabase } from "../config/database.js";
import { isServicePage } from "../config/servicePages.js";

const MAX_FAQS_PER_PAGE = 5;

function validPage(page) {
  return page === "home" || isServicePage(page);
}

function readFields(body) {
  return {
    question: typeof body.question === "string" ? body.question.trim() : "",
    answer: typeof body.answer === "string" ? body.answer.trim() : "",
  };
}

function validate(fields) {
  return !fields.question || !fields.answer || fields.question.length > 300 || fields.answer.length > 5000
    ? "Question and answer are required."
    : null;
}

async function listFaqs(page) {
  return Faq.find({ page }).sort({ displayOrder: 1, createdAt: 1 }).lean();
}

async function getPublishState(page) {
  const faqPage = await FaqPage.findOne({ page }).lean();
  return Boolean(faqPage?.isPublished);
}

export async function getPublicFaqs(request, response, next) {
  try {
    const { page } = request.params;
    if (!validPage(page)) return response.status(400).json({ success: false, message: "Invalid service page." });
    await connectDatabase();
    const faqs = await listFaqs(page);
    const isPublished = await getPublishState(page);
    response.json({ success: true, faqs: isPublished && faqs.length === MAX_FAQS_PER_PAGE ? faqs : [] });
  } catch (error) {
    next(error);
  }
}

export async function getAdminFaqs(request, response, next) {
  try {
    const { page } = request.params;
    if (!validPage(page)) return response.status(400).json({ success: false, message: "Invalid service page." });
    await connectDatabase();
    const faqs = await listFaqs(page);
    response.json({ success: true, faqs, isPublished: await getPublishState(page) });
  } catch (error) {
    next(error);
  }
}

export async function createFaq(request, response, next) {
  try {
    const { page } = request.params;
    if (!validPage(page)) return response.status(400).json({ success: false, message: "Invalid service page." });
    const fields = readFields(request.body);
    const message = validate(fields);
    if (message) return response.status(400).json({ success: false, message });

    await connectDatabase();
    const count = await Faq.countDocuments({ page });
    if (count >= MAX_FAQS_PER_PAGE) {
      return response.status(400).json({ success: false, message: "A page can have a maximum of five FAQs." });
    }

    const faq = await Faq.create({ page, ...fields, displayOrder: count });
    response.status(201).json({ success: true, faq });
  } catch (error) {
    next(error);
  }
}

export async function updateFaq(request, response, next) {
  try {
    const { page, id } = request.params;
    if (!validPage(page) || !mongoose.isValidObjectId(id)) return response.status(400).json({ success: false, message: "Invalid FAQ." });
    const fields = readFields(request.body);
    const message = validate(fields);
    if (message) return response.status(400).json({ success: false, message });

    await connectDatabase();
    const faq = await Faq.findOneAndUpdate({ _id: id, page }, fields, { new: true, runValidators: true });
    if (!faq) return response.status(404).json({ success: false, message: "FAQ not found." });
    response.json({ success: true, faq });
  } catch (error) {
    next(error);
  }
}

export async function deleteFaq(request, response, next) {
  try {
    const { page, id } = request.params;
    if (!validPage(page) || !mongoose.isValidObjectId(id)) return response.status(400).json({ success: false, message: "Invalid FAQ." });
    await connectDatabase();
    const faq = await Faq.findOneAndDelete({ _id: id, page });
    if (!faq) return response.status(404).json({ success: false, message: "FAQ not found." });
    await FaqPage.findOneAndUpdate({ page }, { page, isPublished: false }, { upsert: true });
    response.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function publishFaqs(request, response, next) {
  try {
    const { page } = request.params;
    const isPublished = Boolean(request.body.isPublished);
    if (!validPage(page)) return response.status(400).json({ success: false, message: "Invalid service page." });

    await connectDatabase();
    const count = await Faq.countDocuments({ page });
    if (isPublished && count !== MAX_FAQS_PER_PAGE) {
      return response.status(400).json({ success: false, message: "Add all five FAQs before publishing." });
    }

    await FaqPage.findOneAndUpdate({ page }, { page, isPublished }, { new: true, upsert: true, runValidators: true });
    response.json({ success: true, isPublished });
  } catch (error) {
    next(error);
  }
}

export async function reorderFaqs(request, response, next) {
  try {
    const { page } = request.params;
    const { ids } = request.body;
    if (!validPage(page) || !Array.isArray(ids) || !ids.length || ids.length > MAX_FAQS_PER_PAGE || ids.some((id) => !mongoose.isValidObjectId(id))) {
      return response.status(400).json({ success: false, message: "A valid FAQ order is required." });
    }

    await connectDatabase();
    const count = await Faq.countDocuments({ page, _id: { $in: ids } });
    if (count !== ids.length || new Set(ids).size !== ids.length) return response.status(400).json({ success: false, message: "The FAQ order is invalid." });
    await Faq.bulkWrite(ids.map((id, index) => ({ updateOne: { filter: { _id: id, page }, update: { displayOrder: index } } })));
    response.json({ success: true, faqs: await listFaqs(page) });
  } catch (error) {
    next(error);
  }
}
