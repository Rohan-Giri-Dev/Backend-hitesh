import { asyncHandeler } from "../utils/asyncHandeler.js";
import { ApiError } from "..utils/ApiError.js";
import { User } from "../models/user.models.js";

const registerUser = asyncHandeler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  //check if user exists : through username, email
  //check for images , check for avatar
  //upload them to cloudinary, avatar check
  // create user object - create entry in db
  // remove pass and refresh token form field
  // check for user creation
  // return response

  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);

  //this if condition will check for all parameter through an array
  if (
    //some will check the whole paramter
    // through some we check if the fields are there and if present then we trim them
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fileds are compulsory and required");
  }

  // this line of code will check if the user already exits or not
  // instead of just using find which only takes 1 parameter
  // we can user $ operator and or . This will take array as the input and inside that we have objects
  const existedUser = User.findOne({
    $or: [{ username }, { email }]
  })

  if(existedUser){
    throw new ApiError(409, "User with email or usrname already exists")
  }


  
});

export { registerUser };
