import dotenv from 'dotenv'
dotenv.config()

import { v2 as cloudinary } from 'cloudinary';
import { promises as fs } from "fs"


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});



//method to upload the files on cloudinary

const uploadOnCloudinary = async (localfilePath) => {
    if (!localfilePath) {
        console.log('No file to upload on cloudinary')
        return null
    }

    try {
        const uploadResponse = await cloudinary.uploader.upload(localfilePath, {
            secure: true,
            folder: "Resume Unmask", 
            resource_type:"auto",
            use_filename: true,
            unique_filename: false,
        })

        return uploadResponse
    } catch (error) {
        console.log(`File Upload Unsuccessfull: ${error}`)
        return null
    } finally {
        // Always attempt to delete local temporary upload.
        try {
            await fs.unlink(localfilePath)
        } catch (unlinkError) {
            if (unlinkError?.code !== 'ENOENT') {
                console.log(`Could not delete temporary file ${localfilePath}: ${unlinkError.message}`)
            }
        }
    }

}


export { uploadOnCloudinary }