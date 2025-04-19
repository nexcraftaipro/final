import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

const SUPABASE_URL = "https://xnquehtifrkfgoahqjje.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucXVlaHRpZnJrZmdvYWhxamplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTg2NTAzNCwiZXhwIjoyMDU3NDQxMDM0fQ.ryvuI4FhDcc94_xx5bqGmENkuepwHkJsxhDVUNo3P0A";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  }
});

const setupPremium = async () => {
  try {
    // First try to update directly (if column exists)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 393);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        is_premium: true,
        expiration_date: expirationDate.toISOString()
      })
      .eq('email', 'earnmoneydh@gmail.com');

    if (updateError && updateError.code === 'PGRST204') {
      // Column doesn't exist, let's create it using raw SQL
      const { error: createError } = await supabase
        .from('_sql')
        .rpc('run', {
          query: `
            ALTER TABLE public.profiles 
            ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ DEFAULT NULL;
          `
        });

      if (createError) {
        console.error('Error creating column:', createError);
        return;
      }

      // Try the update again
      const { error: retryError } = await supabase
        .from('profiles')
        .update({ 
          is_premium: true,
          expiration_date: expirationDate.toISOString()
        })
        .eq('email', 'earnmoneydh@gmail.com');

      if (retryError) {
        console.error('Error updating profile after column creation:', retryError);
        return;
      }
    } else if (updateError) {
      console.error('Error updating profile:', updateError);
      return;
    }

    console.log('Successfully set up premium status with expiration date:', expirationDate.toISOString());
  } catch (error) {
    console.error('Error:', error);
  }
};

setupPremium(); 