// ApiError is a custom error class for API errors
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    // Calls the parent Error class constructor
    // This sets the error message
    super(message);

    // HTTP status code like 400, 401, 404, 500
    this.statusCode = statusCode;

    // No data is returned when there is an error
    this.data = null;

    // Custom error message
    this.message = message;

    // Since this is an error response, success is always false
    this.success = false;

    // Extra error details, useful for validation errors
    this.errors = errors;

    // If a custom stack trace is passed, use it
    if (stack) {
      this.stack = stack;
    } else {
      // Otherwise, create a stack trace automatically
      // this.constructor means ApiError
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Exporting ApiError so it can be used in other files
export { ApiError };
