import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xnquehtifrkfgoahqjje.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucXVlaHRpZnJrZmdvYWhxamplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NjUwMzQsImV4cCI6MjA1NzQ0MTAzNH0.b8ddu9kzwv5RlyX59n9Mmrgh0ijGEztXPDuazAy8IGI";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const updatePremiumStatus = async () => {
  // Calculate expiration date (393 days from now)
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 393);
  
  const { error } = await supabase
    .from('profiles')
    .update({ 
      is_premium: true,
      expiration_date: expirationDate.toISOString(),
    })
    .eq('email', 'earnmoneydh@gmail.com');

  if (error) {
    console.error('Error updating premium status:', error);
    return false;
  }

  console.log('Successfully updated premium status and expiration date');
  return true;
};

// Execute the update
updatePremiumStatus(); 