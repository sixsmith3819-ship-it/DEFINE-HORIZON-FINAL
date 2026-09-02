'use server';

import { createServerClient } from '@/lib/supabase-server';
import { Announcement, AnnouncementWithAuthor, AnnouncementFormData, AnnouncementStatus } from '@/lib/types/announcement';
import { validateAnnouncementFormData, hasValidationErrors } from '@/lib/validation/announcement-validation';

export async function createAnnouncement(data: AnnouncementFormData): Promise<{ success: boolean; announcementId?: string; error?: string; validationErrors?: Record<string, string[]> }> {
  try {
    console.log('[getAnnouncements] Starting...');
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return { success: false, error: 'Admin only' };

    const validationErrors = validateAnnouncementFormData(data);
    if (hasValidationErrors(validationErrors)) return { success: false, validationErrors };

    const { data: announcement, error } = await supabase.from('announcements').insert({
      title: data.title,
      content: data.message,  // Map message -> content for DB
      priority: data.priority || 'medium',
      status: data.status,
      publish_date: data.publishDate || null,
      expiry_date: data.expiryDate || null,
      created_by: user.id,
      updated_by: user.id,
    }).select('id').single();

    if (!announcement) throw new Error('Failed to create announcement');
    return { success: true, announcementId: announcement.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAnnouncements(): Promise<{ success: boolean; announcements?: AnnouncementWithAuthor[]; error?: string }> {
  try {
    console.log('[getAnnouncements] Starting...');
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized', announcements: [] };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    let query = supabase.from('announcements').select('*').order('created_at', { ascending: false });

    if (profile?.role !== 'admin') {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    console.log('[getAnnouncements] Query result:', { count: data?.length, error: error?.message });
    if (error) throw error;

    // Fetch all unique author IDs
    const authorIds = [...new Set((data || []).map((a: any) => a.created_by))];
    console.log('[getAnnouncements] Fetching authors:', authorIds.length);
    
    // Fetch all authors in one query
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', authorIds);
    
    console.log('[getAnnouncements] Authors fetched:', authors?.length);
    const authorMap = new Map((authors || []).map((a: any) => [a.id, a]));

    const announcements = (data || []).map((a: any) => {
      const author = authorMap.get(a.created_by);
      return {
        id: a.id,
        title: a.title,
        message: a.content,  // Map DB content -> code message
        status: a.status,
        priority: a.priority,
        expiryDate: a.expiry_date,
        publishDate: a.publish_date,
        createdAt: a.created_at,
        createdBy: a.created_by,
        updatedAt: a.updated_at,
        updatedBy: a.updated_by,
        author: {
          id: author?.id || a.created_by,
          fullName: author?.full_name || author?.email || 'Unknown',
          email: author?.email || '',
        },
      };
    });

    console.log('[getAnnouncements] Returning announcements:', announcements.length);
    return { success: true, announcements };
  } catch (error: any) {
    console.error('[getAnnouncements] Error:', error);
    return { success: false, error: error.message, announcements: [] };
  }
}


export async function updateAnnouncementStatus(id: string, status: AnnouncementStatus): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[getAnnouncements] Starting...');
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return { success: false, error: 'Admin only' };

    const { error } = await supabase.from('announcements').update({ status, updated_by: user.id }).eq('id', id);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[getAnnouncements] Starting...');
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return { success: false, error: 'Admin only' };

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
