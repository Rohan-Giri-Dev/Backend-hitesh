// asyncHandeler is a higher-order function:
// it takes another function (requestHandeler) as input.
const asyncHandeler = (requestHandeler) => {
  // It returns a new Express middleware function.
  // Express middleware usually receives req, res, and next.
  return (req, res, next) => {
    // Promise.resolve() converts the result of requestHandeler
    // into a Promise, even if requestHandeler is not async.
    Promise.resolve(requestHandeler(req, res, next))

      // If requestHandeler throws an error or rejects,
      // catch() will catch that error.
      .catch((err) => next(err));

    // next(err) sends the error to Express error-handling middleware.
  };
};

// Exporting asyncHandeler so it can be used in other files.
export { asyncHandeler };
