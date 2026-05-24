import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Send OTP to phone number via Supabase Auth
 */
export async function sendOTP(phoneNumber: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to send OTP',
      data: null,
    };
  }
}

/**
 * Verify OTP and create/login user session
 */
export async function verifyOTP(phoneNumber: string, token: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: token,
      type: 'sms',
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        session: null,
      };
    }

    return {
      success: true,
      error: null,
      session: data.session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to verify OTP',
      session: null,
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: true,
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to sign out',
    };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return {
        success: false,
        error: error.message,
        session: null,
      };
    }
    return {
      success: true,
      error: null,
      session: data.session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to get session',
      session: null,
    };
  }
}

/**
 * Update user profile in database
 */
export async function updateUserProfile(userId: string, profile: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          phone: profile.phone,
          name: profile.name,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select();

    if (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update profile',
      data: null,
    };
  }
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to get profile',
      data: null,
    };
  }
}

/**
 * Fetch all available properties
 */
export async function fetchProperties() {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }
    return { success: true, error: null, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch properties', data: [] };
  }
}

/**
 * Create a new property listing
 */
export async function createProperty(property: any) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .insert(property)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: true, error: null, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create property', data: null };
  }
}

/**
 * Upload a property photo to Supabase Storage
 */
export async function uploadPropertyImage(uri: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'User not authenticated', url: null };
    }

    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('property-photos')
      .upload(fileName, blob, {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: true,
      });

    if (error) {
      return { success: false, error: error.message, url: null };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-photos')
      .getPublicUrl(fileName);

    return { success: true, error: null, url: publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to upload image', url: null };
  }
}

/**
 * Fetch all saved properties for a user
 */
export async function fetchSavedProperties(userId: string) {
  try {
    const { data, error } = await supabase
      .from('saved_properties')
      .select('*, properties(*)')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }
    
    const properties = (data || [])
      .map(item => item.properties)
      .filter(Boolean);

    return { success: true, error: null, data: properties };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch saved properties', data: [] };
  }
}

/**
 * Save a property
 */
export async function saveProperty(userId: string, propertyId: string) {
  try {
    const { error } = await supabase
      .from('saved_properties')
      .insert({ user_id: userId, property_id: propertyId });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save property' };
  }
}

/**
 * Unsave a property
 */
export async function unsaveProperty(userId: string, propertyId: string) {
  try {
    const { error } = await supabase
      .from('saved_properties')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to unsave property' };
  }
}

/**
 * Check if a property is saved by a user
 */
export async function checkIfSaved(userId: string, propertyId: string) {
  try {
    const { data, error } = await supabase
      .from('saved_properties')
      .select('id')
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .maybeSingle();

    if (error) {
      return { success: false, isSaved: false };
    }
    return { success: true, isSaved: !!data };
  } catch (err: any) {
    return { success: false, isSaved: false };
  }
}

export default supabase;
