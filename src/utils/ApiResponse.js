// ApiResponse is a reusable class for sending a standard API response format
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    // HTTP status code, like 200, 201, 400, 500
    this.statusCode = statusCode;

    // Actual response data returned by the API
    this.data = data;

    // Response message
    // If no message is passed, default value will be "Success"
    this.message = message;

    // success will be true if statusCode is less than 400
    // Example: 200, 201, 301 = true
    // Example: 400, 404, 500 = false
    this.success = statusCode < 400;
  }
}

// Exporting ApiResponse so it can be used in other files
export { ApiResponse };
