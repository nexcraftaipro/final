import postgres from 'postgres';

const sql = postgres({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  username: 'postgres.xnquehtifrkfgoahqjje',
  password: 'cTHwRr8P2S9uMfDV',
  ssl: 'require'
});

const setupPremium = async () => {
  try {
    // Step 1: Add the column
    await sql`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ DEFAULT NULL;
    `;

    // Step 2: Update the profile
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 393);

    await sql`
      UPDATE public.profiles 
      SET 
        is_premium = true,
        expiration_date = ${expirationDate.toISOString()}
      WHERE email = 'earnmoneydh@gmail.com';
    `;

    console.log('Successfully set up premium status with expiration date:', expirationDate.toISOString());
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
};

setupPremium(); 