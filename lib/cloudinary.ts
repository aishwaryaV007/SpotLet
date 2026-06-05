import { Platform } from 'react-native';

/**
 * Upload an image to Cloudinary using their REST API
 * This is lightweight and requires no external native SDKs.
 */
export async function uploadToCloudinary(uri: string): Promise<{ success: boolean; url: string | null; error: string | null }> {
  try {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return {
        success: false,
        url: null,
        error: 'Cloudinary configuration missing: EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME or EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env',
      };
    }

    const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    const formData = new FormData();
    
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, filename);
    } else {
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);
    }
    
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: Platform.OS === 'web' ? undefined : {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = await response.json();

    if (response.ok && data.secure_url) {
      return {
        success: true,
        url: data.secure_url,
        error: null,
      };
    } else {
      return {
        success: false,
        url: null,
        error: data.error?.message || 'Failed to upload image to Cloudinary',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      url: null,
      error: err.message || 'An unexpected error occurred during Cloudinary upload',
    };
  }
}
