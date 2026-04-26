// asyncHandler is a higher-order function:
// it takes another function (requestHandler) as input.
const asyncHandler = (requestHandler) => {
  // It returns a new Express middleware function.
  // Express middleware usually receives req, res, and next.
  return (req, res, next) => {
    // Promise.resolve() converts the result of requestHandler
    // into a Promise, even if requestHandler is not async.
    Promise.resolve(requestHandler(req, res, next))

      // If requestHandler throws an error or rejects,
      // catch() will catch that error.
      .catch((err) => next(err));

    // next(err) sends the error to Express error-handling middleware.
  };
};

// Exporting asyncHandler so it can be used in other files.
export { asyncHandler };
