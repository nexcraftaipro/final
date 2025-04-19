const SUPABASE_URL = "https://xnquehtifrkfgoahqjje.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucXVlaHRpZnJrZmdvYWhxamplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NjUwMzQsImV4cCI6MjA1NzQ0MTAzNH0.b8ddu9kzwv5RlyX59n9Mmrgh0ijGEztXPDuazAy8IGI";

const addColumn = async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        sql: `
          ALTER TABLE public.profiles 
          ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ DEFAULT NULL;
        `
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    console.log('Successfully added expiration_date column');
  } catch (error) {
    console.error('Error:', error);
  }
};

addColumn(); 