import supabase from '@/utils/supabaseClient';

export async function writeAdminAudit({
  adminId,
  action,
  targetType,
  targetId,
  payload = {},
}) {
  const { error } = await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    payload,
  });

  return { error };
}