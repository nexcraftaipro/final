import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xnquehtifrkfgoahqjje.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucXVlaHRpZnJrZmdvYWhxamplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTg2NTAzNCwiZXhwIjoyMDU3NDQxMDM0fQ.ryvuI4FhDcc94_xx5bqGmENkuepwHkJsxhDVUNo3P0A";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const setupPremium = async () => {
  try {
    // Step 1: Add the expiration_date column
    const { error: alterError } = await supabase
      .from('profiles')
      .select()
      .limit(1)
      .then(async () => {
        // If we get here, table exists, now add column
        return await supabase.rpc('alter_profiles_add_expiration', {
          sql: `
            DO $$
            BEGIN
              ALTER TABLE public.profiles 
              ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ DEFAULT NULL;
            END $$;
          `
        });
      });

    if (alterError) {
      console.error('Error adding column:', alterError);
      return;
    }

    // Step 2: Update premium status and expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 393); // 393 days from now

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

    console.log('Successfully set up premium status with expiration date:', expirationDate.toISOString());
  } catch (error) {
    console.error('Error:', error);
  }
};

setupPremium(); 