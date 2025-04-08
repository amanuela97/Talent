import { v2 as cloudinary } from 'cloudinary';

// Check if environment variables are set
const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env;

if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET) {
  throw new Error(
    'Cloudinary configuration is missing. Please check the environment variables.',
  );
}

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_API_SECRET,
});

console.log('Cloudinary is configured successfully.');
export default cloudinary;
