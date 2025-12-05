import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith('video');
        return {
            folder: 'astrix_uploads',
            allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'webm'],
            resource_type: isVideo ? 'video' : 'image',
            // Limit video duration to 60 seconds
            ...(isVideo && {
                eager: [
                    {
                        duration: "60",
                        crop: "limit"
                    }
                ],
                eager_async: false
            })
        };
    },
});

export const upload = multer({ storage: storage });
export default cloudinary;
