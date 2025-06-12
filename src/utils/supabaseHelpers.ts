import { supabase } from '@/integrations/supabase/client';
import { adminSupabase } from '@/integrations/supabase/admin-client';

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get user profile data
 * @param userId - The user ID to get profile data for
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Update user profile data
 * @param userId - The user ID to update profile data for
 * @param updates - Object containing profile fields to update
 */
export const updateUserProfile = async (userId: string, updates: Record<string, any>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Upload a file to Supabase storage
 * @param bucket - Storage bucket name
 * @param path - File path in the bucket
 * @param file - File to upload
 */
export const uploadFile = async (bucket: string, path: string, file: File) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Get a public URL for a file in Supabase storage
 * @param bucket - Storage bucket name
 * @param path - File path in the bucket
 */
export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Delete a file from Supabase storage
 * @param bucket - Storage bucket name
 * @param path - File path in the bucket
 */
export const deleteFile = async (bucket: string, path: string) => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time changes on a table
 * @param table - Table name to subscribe to
 * @param callback - Callback function that receives the payload
 */
export const subscribeToChanges = (
  table: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
};

// Admin functions (use with caution, server-side only)

/**
 * Create a new user (admin only)
 * @param email - User email
 * @param password - User password
 */
export const adminCreateUser = async (email: string, password: string) => {
  try {
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Delete a user (admin only)
 * @param userId - User ID to delete
 */
export const adminDeleteUser = async (userId: string) => {
  try {
    const { error } = await adminSupabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}; 