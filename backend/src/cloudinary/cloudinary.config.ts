import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Check if environment variables are set
const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env;

// Initialize Cloudinary configuration
const initializeCloudinary = () => {
  console.log('Initializing Cloudinary...');

  // Re-check environment variables
  const cloudName = process.env.CLOUD_NAME;
  const apiKey = process.env.CLOUD_API_KEY;
  const apiSecret = process.env.CLOUD_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Missing environment variables:', {
      CLOUD_NAME: !cloudName,
      CLOUD_API_KEY: !apiKey,
      CLOUD_API_SECRET: !apiSecret
    });
    throw new Error(
      'Cloudinary configuration is missing. Please check the environment variables.',
    );
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    console.log('Cloudinary configuration successful');
  } catch (error) {
    console.error('Error configuring Cloudinary:', error);
    throw error;
  }
};

// Export both the cloudinary instance and the initialization function
export { initializeCloudinary };
export default cloudinary;
