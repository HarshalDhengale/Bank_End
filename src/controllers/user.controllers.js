import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError} from "../utils/ApiError.js"
import { user } from "../models/user.model.js"
import{ uploadOnCloudinary } from "../utils/cloudinary.js" 
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req,res) =>{
    // get user details from fronted --> data from postman
    // validation - not empty
    // check if user already exists : user 
    // check for images , check for avatar
    // upload them to clodinary,avatar
    // create user object - create entry in db
    // remove password and refersh token filed from response
    // check for user creation
    // return res



    // get user details from fronted --> data from postman
    const {fullName, email, username, password } =   req.body
    console.log("Email : ",email);

    // validation - not empty
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
   
        // check if user already exists : user 

        const existeduser = user.findOne({
            $or: [{ username } ,{ email }]
        })

        if(existeduser){
            throw new ApiError(409,"User with eami or username Allready exist")
        }

         // check for images , check for avatar
       const avatarLocalPath =  req.files?.avatar[0]?.path;

       const coverImagelocalPath = req.files?.coverImage[0]?.path;

       if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is Required")
       }

           // upload them to clodinary,avatar
      const avatar =  await uploadOnCloudinary(avatarLocalPath)

      const coverImage =  await uploadOnCloudinary(coverImagelocalPath)

         if(!avatar){
            throw new ApiError(400,"Avatar is Required")

         }

       // create user object - create entry in db

       const user1 =  await user.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
       })

           // check for user creation

     const createuser = await user.findById(user1._id).select(
       "-password -refreshToken" 
     )

     if(!createuser){
        throw new ApiError(500,"Something went wrong while registering the user")
     }

    // return res

    return res.status(201).json(
        new ApiResponse(200,createuser,"User register Successfu4lly")
    )
})   


export {
    registerUser
}