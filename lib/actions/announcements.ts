'use server';

import { createServerClient } from '@/lib/supabase-server';
import { Announcement, AnnouncementWithAuthor, AnnouncementFormData, AnnouncementStatus } from '@/lib/types/announcement';
import { validateAnnouncementFormData, hasValidationErrors } from '@/lib/validation/announcement-validation';

export async function createAnnouncement(data: AnnouncementFormData): Promise<{ success: boolean; announcementId?: string; error?: string; validationErrors?: Record<string, string[]> }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return { success: false, error: 'Admin only' };

    const validationErrors = validateAnnouncementFormData(data);
    if (hasValidationErrors(validationErrors)) return { success: false, validationErrors };

    const { data: announcement, error } = await supabase.from('announcements').insert({
      title: data.title,
      content: data.content,
      status: data.status,
      priority: data.priority || 'medium',
      publish_date: data.publishDate || null,
      expiry_date: data.expiryDate || null,
      created_by: user.id,
    }).select('id').single();

    if (error) throw error;
    return { success: true, announcementId: announcement.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAnnouncements(): Promise<{ success: boolean; announcements?: AnnouncementWithAuthor[]; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized', announcements: [] };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    let query = supabase.from('announcements').select('*, profiles!announcements_created_by_fkey(id, full_name, email)').order('created_at', { ascending: false });

    if (profile?.role !== 'admin') {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    if (error) throw error;

    const announcements = (data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      status: a.status,
      priority: a.priority,
      publishDate: a.publish_date,
      expiryDate: a.expiry_date,
      createdAt: a.created_at,
      createdBy: a.created_by,
      updatedAt: a.updated_at,
      author: {
        id: a.profiles.id,
        fullName: a.profiles.full_name || a.profiles.email,
        email: a.profiles.email,
      },
    }));

    return { success: true, announcements };
  } catch (error: any) {
    return { success: false, error: error.message, announcements: [] };
  }
}

export async function updateAnnouncementStatus(id: string, status: AnnouncementStatus): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return { success: false, error: 'Admin only' };

    const { error } = await supabase.from('announcements').update({ status }).eq('id', id);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean; error?: string }> {
  try {
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
