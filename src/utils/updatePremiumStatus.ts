import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';

export const updatePremiumStatus = async () => {
  const expirationDate = addDays(new Date(), 393);
  
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

  return true;
};

// Execute the update
updatePremiumStatus(); 