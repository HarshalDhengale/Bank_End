import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import{ uploadOnCloudinary } from "../utils/cloudinary.js" 
import { ApiResponse } from "../utils/ApiResponse.js"
// import { json } from "body-parser"



const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken};


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token");
    }
}

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


``
   // get user details from fronted --> data from postman
    const {fullName, email, username, password} =   req.body
    // console.log("Email : ",email);
    // console.log("fullname : ",fullName);
    // console.log("username : ",username);
    // console.log("pass : ",password);


    // validation - not empty
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
   
        // check if user already exists : user 

        const existeduser =  await User.findOne({
            $or: [{ username } ,{ email }]
        })

        if(existeduser){
            throw new ApiError(409,"User with email or username Allready exist")
        
        }
         // check for images , check for avatar
         
      const avatarLocalPath = req.files.avatar[0].path;
            // console.log("info : ",req.files);
     //  const coverImagelocalPath = req.files?.coverImage?.path;
    
     
   

    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

       if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
       }

           // upload them to clodinary,avatar
      const avatar =  await uploadOnCloudinary(avatarLocalPath)

      const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

         if(!avatar){
            throw new ApiError(400,"Avatar is Required")

         }

       // create user object - create entry in db

       const user =  await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
       })

           // check for user creation

     const createuser = await User.findById(user._id).select(
       "-password -refreshToken" 
     )

     if(!createuser){
        throw new ApiError(500,"Something went wrong while registering the user")
     }

    // return res

    return res.status(201).json(
        new ApiResponse(200,createuser,"User register Successfully")
    )
})   


const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
     console.log(user);
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)
   console.log(isPasswordValid);

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} =  await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    console.log(loggedInUser);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logOutUser = asyncHandler(async( req , res ) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new : true
        }
     )

     // send cookies
     const options = {
        httpOnly : true,
        secure : true
       }

return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200 , {} , "User logged  Out"))
       
})
     // end point of refresh access token
const refreshAccessToken = asyncHandler(async (req , res ) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshAccessToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
           // data cookies mai bhejana hai naya wala isliye options use karate hai
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken , newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
       return res
        .status(200)
        .cookie("accessToken" ,accessToken ,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken , refreshToken : newrefreshToken},
                "Access Token refreshed Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async( req , res )=>{

    const{oldPassword , newPassword} = req.body;

    const  user = await User.findById( req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password change successfully"))
})

const getCurrentUser = asyncHandler(async( req , res )=>{
    return res
    .status(200)
    .json(200,req.user,"Current user feched Successfully")
      
})

const updateAccountDetail = asyncHandler(async (req ,res )=>{
    const{ fullName ,email} = req.body;

    if(!fullName && !email){
        throw new ApiError (400,"fullname or email is required")
    }

     const user =  await User.findByIdAndUpdate( req.user?._id,
        {
            $set : {
                fullName : fullName,
                email : email
            }
        },
        {new : true}
        ).select("-password")
   
        return res
               .status(200)
               .json(new ApiResponse(200,user,"Account Detail update Successfully"))
})

const updateUserAvatar = asyncHandler(async (req ,res )=>{

    const avatarLocalPath = req.files?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }

     const avatar = await uploadOnCloudinary(avatarLocalPath)

     if(!avatar.url){
        throw new ApiError(400,"Error while upload on avatar")
     }

      const user =   await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200,user,"Avata update successfully"))
    
})

const updateUserCoverImage = asyncHandler(async (req ,res )=>{

    const coverImageLocalPath = req.files?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"coverimage file is missing")
    }

     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

     if(!coverImage.url){
        throw new ApiError(400,"Error while upload on coverimage")
     }

      const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {new : true}).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200,user,"coverimage update successfully"))
    
})

const getUserChannelProfile = asyncHandler(async( req , res ) =>{
    const {username} =  req.params

    if(!username?.trim()){
        throw new ApiError(400,"User is missing")
    }

    const channel = User.aggregate([{
        $match : {
            username : username?.toLowerCase()
        }
    },
    {
        $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField : "channel",
            as : "subsribers"
        }
    },
    {
        $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField : " subsriber",
            as : "subsribedTo"
        }
    },
        {
            $addFields : {
                 subcribersCount : {
                    $size : "$subsribers"
                 },
                 channelsubcribedToCount : {
                    $size : "$subsribedTo"
                 },
                 isSubscribed : {
                    if : {$in : [req.user?._id,subsribers. subsriber]},
                    then : true,
                    else : false
                 }
            }
        },
        {
            $project : {
                fullName : 1,
                username : 1,
                subcribersCount : 1,
                channelsubcribedToCount : 1,
                isSubscribed  : 1,
                avatar : 1,
                coverImage : 1,
                email : 1

            }
        }
    ])

    if(!channel?.length){
    throw new ApiError(400,"Channel does not exist")
    }

    return res
    .status(200),
    json(
        new ApiResponse(200,channel[0],"User channel Fetched successfully"))
    
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}

