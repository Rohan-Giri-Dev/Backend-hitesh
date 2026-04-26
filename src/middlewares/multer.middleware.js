// Import multer.
// Multer is used to handle file uploads in Express.
import multer from "multer";

// Create storage settings for uploaded files.
// Here we are telling multer:
// 1. Where to save the uploaded file
// 2. What name to give the uploaded file
const storage = multer.diskStorage({
  // This function decides the folder where uploaded files will be stored.
  destination: function (req, file, cb) {
    // cb means callback.
    // First value is error. null means no error.
    // Second value is the folder path where file should be saved.
    cb(null, "./public/temp");
  },

  // This function decides the name of the uploaded file.
  filename: function (req, file, cb) {
    // file.originalname means the original file name from user's computer.
    // Example: if user uploads "profile.png",
    // multer will save it as "profile.png".
    cb(null, file.originalname);
  },
});

// Create the actual multer upload middleware using the storage settings above.
// We export it so we can use it in routes like:
//
// upload.fields([
//   { name: "avatar", maxCount: 1 },
//   { name: "coverImage", maxCount: 1 }
// ])
//
// This means multer will save uploaded files inside ./public/temp
export const upload = multer({ storage });
