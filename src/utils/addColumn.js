import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xnquehtifrkfgoahqjje.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucXVlaHRpZnJrZmdvYWhxamplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NjUwMzQsImV4cCI6MjA1NzQ0MTAzNH0.b8ddu9kzwv5RlyX59n9Mmrgh0ijGEztXPDuazAy8IGI";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const addExpirationDateColumn = async () => {
  const { error } = await supabase
    .rpc('execute_sql_query', {
      query: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ DEFAULT NULL;
      `
    });

  if (error) {
    console.error('Error adding expiration_date column:', error);
    return false;
  }

  console.log('Successfully added expiration_date column to profiles table');
  return true;
};

// Execute the column addition
addExpirationDateColumn(); 