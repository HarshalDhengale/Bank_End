import {v2 as cloudinary} from "cloudinary";
import fs from "fs";   //-->file kpo resd erite aur manage karati hai library

import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
  cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME', 
  api_key: 'process.env.CLOUDINARY_API_KEY', 
  api_secret: 'process.env.CLOUDINARY_API_SECRET' 
});

const uploadOnCloudinary = async (localFilepath) => {
    try{
         if(!localFilepath) return null;
         // upload the file on cloudinary
          const response = await cloudinary.uploader.upload(localFilepath,{
            resource_type : "auto"
         })
         // file has been upload successfully
         console.log("File is upload on cloudinary",response.url);
         return response;
    }catch(error){
        fs.unlinkSync(localFilepath);// remove the locally saved temprory file as the upload opertion got failed
        return null;

    }
}

cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" }, 
  function(error, result) {console.log(result); });


  export{uploadOnCloudinary}

