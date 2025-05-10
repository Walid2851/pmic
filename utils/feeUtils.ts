// utils/feeUtils.js
import { SupabaseClient } from '@supabase/supabase-js';

export const calculateTotalFeeAmount = async (
  feeTypeId: string, 
  supabase: SupabaseClient
) => {
    if (!feeTypeId) return 0;
    
    const { data, error } = await supabase
      .from('fee_component')
      .select('amount')
      .eq('fee_type_id', feeTypeId)
      .eq('is_active', true);
      
    if (error || !data) return 0;
    
    return data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
};