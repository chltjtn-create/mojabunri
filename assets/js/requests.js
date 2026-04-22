import { supabase } from './supabase-client.js';

export async function fetchRequests(filters = {}) {
  let query = supabase
    .from('construction_requests')
    .select(`
      *,
      requester:requester_profile_id(full_name, phone),
      skb_manager:assigned_skb_manager_id(full_name),
      partner_bp:assigned_partner_bp_id(full_name)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.request_type) query = query.eq('request_type', filters.request_type);
  if (filters.search) {
    query = query.or(`request_number.ilike.%${filters.search}%,requester_name.ilike.%${filters.search}%,kepco_number.ilike.%${filters.search}%,building_name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchRequest(id) {
  const { data, error } = await supabase
    .from('construction_requests')
    .select(`
      *,
      requester:requester_profile_id(full_name, email, phone, department),
      skb_manager:assigned_skb_manager_id(full_name, email, phone),
      partner_bp:assigned_partner_bp_id(full_name, email, phone)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createRequest(formData) {
  const { data, error } = await supabase
    .from('construction_requests')
    .insert([formData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRequest(id, updates) {
  const { data, error } = await supabase
    .from('construction_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function changeStatus(requestId, toStatus, actorProfileId, reason = null) {
  const { error } = await supabase.rpc('change_request_status', {
    p_request_id: requestId,
    p_to_status: toStatus,
    p_actor_profile_id: actorProfileId,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function fetchEvents(requestId) {
  const { data, error } = await supabase
    .from('request_events')
    .select(`*, actor:actor_profile_id(full_name)`)
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchChecklists(requestId) {
  const { data, error } = await supabase
    .from('request_checklists')
    .select('*')
    .eq('request_id', requestId);
  if (error) throw error;
  return data;
}

export async function updateChecklist(id, isCompleted) {
  const { error } = await supabase
    .from('request_checklists')
    .update({ is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchFiles(requestId) {
  const { data, error } = await supabase
    .from('request_files')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function uploadFile(requestId, requestNumber, stage, fileKind, file) {
  const ext = file.name.split('.').pop();
  const storagePath = `requests/${requestNumber}/${stage}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('request-files')
    .upload(storagePath, file);
  if (uploadError) throw uploadError;

  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id;

  const { error: dbError } = await supabase.from('request_files').insert([{
    request_id: requestId,
    stage,
    file_kind: fileKind,
    storage_bucket: 'request-files',
    storage_path: storagePath,
    original_filename: file.name,
    mime_type: file.type,
    file_size_bytes: file.size,
    uploaded_by: userId,
  }]);
  if (dbError) throw dbError;
}

export function getFileUrl(storagePath) {
  const { data } = supabase.storage.from('request-files').getPublicUrl(storagePath);
  return data.publicUrl;
}
