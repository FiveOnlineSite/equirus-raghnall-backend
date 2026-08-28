import nodemailer from "nodemailer";
import { servicePages } from "../config/servicePages.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

export async function submitContact(request, response, next) {
  try {
    if (clean(request.body.website, 200)) {
      return response.json({ ok: true });
    }

    const firstName = clean(request.body.firstName, 80);
    const lastName = clean(request.body.lastName, 80);
    const phone = clean(request.body.phone, 10);
    const email = clean(request.body.email, 254).toLowerCase();
    const organization = clean(request.body.organization, 150);
    const service = clean(request.body.service, 120);
    const message = clean(request.body.message, 4000);
    const serviceName = servicePages.get(service);

    if (!firstName || !lastName || !/^\d{10}$/.test(phone) ||
        !emailPattern.test(email) || !organization || !serviceName) {
      return response.status(400).json({
        message: "Please complete the first six fields and enter a valid 10-digit phone number.",
      });
    }

    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpAppPassword = process.env.SMTP_APP_PASSWORD;
    const recipientEmail = process.env.CONTACT_TO_EMAIL || smtpEmail;

    if (!smtpEmail || !smtpAppPassword || !recipientEmail) {
      return response.status(503).json({ message: "Email service is not configured yet." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: smtpEmail, pass: smtpAppPassword },
    });
    const fullName = `${firstName} ${lastName}`;
    const safe = {
      fullName: escapeHtml(fullName),
      phone: escapeHtml(phone),
      email: escapeHtml(email),
      organization: escapeHtml(organization),
      serviceName: escapeHtml(serviceName),
      message: escapeHtml(message || "No message provided").replace(/\n/g, "<br />"),
    };

    await transporter.sendMail({
      from: `Equirus Raghnall Website <${smtpEmail}>`,
      to: recipientEmail,
      replyTo: email,
      subject: `Website enquiry: ${serviceName}`,
      text: `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nOrganization: ${organization}\nService: ${serviceName}\n\nMessage:\n${message || "No message provided"}`,
      html: `<h2>New website enquiry</h2><p><strong>Name:</strong> ${safe.fullName}</p><p><strong>Email:</strong> ${safe.email}</p><p><strong>Phone:</strong> ${safe.phone}</p><p><strong>Organization:</strong> ${safe.organization}</p><p><strong>Service:</strong> ${safe.serviceName}</p><p><strong>Message:</strong><br />${safe.message}</p>`,
    });

    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
