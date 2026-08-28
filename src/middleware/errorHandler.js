export function notFoundHandler(request, response) {
  response.status(404).json({ success: false, message: "Endpoint not found." });
}

export function errorHandler(error, request, response, next) {
  console.error("Unhandled API error:", {
    method: request.method,
    path: request.originalUrl,
    name: error.name,
    message: error.message,
  });

  if (response.headersSent) {
    return next(error);
  }

  response.status(500).json({ success: false, message: "Internal server error." });
}
