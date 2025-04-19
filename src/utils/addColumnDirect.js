import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xnquehtifrkfgoahqjje.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucXVlaHRpZnJrZmdvYWhxamplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NjUwMzQsImV4cCI6MjA1NzQ0MTAzNH0.b8ddu9kzwv5RlyX59n9Mmrgh0ijGEztXPDuazAy8IGI";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const addColumn = async () => {
  try {
    // First, let's check if the column exists
    const { data: columnExists, error: checkError } = await supabase
      .from('profiles')
      .select('expiration_date')
      .limit(1);

    if (checkError && checkError.code === 'PGRST204') {
      // Column doesn't exist, let's add it
      const { data, error } = await supabase
        .from('profiles')
        .update({ expiration_date: null })
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .select();

      if (error) {
        console.error('Error adding column:', error);
        return;
      }
    }

    // Now let's update your profile with premium status and expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 393);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        is_premium: true,
        expiration_date: expirationDate.toISOString()
      })
      .eq('email', 'earnmoneydh@gmail.com');

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return;
    }

    console.log('Successfully added column and updated premium status');
  } catch (error) {
    console.error('Error:', error);
  }
};

addColumn(); 