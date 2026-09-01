'use server';

import { createServerClient } from '@/lib/supabase-server';
import { SystemSetting, SettingFormData } from '@/lib/types/settings';

export async function getSettings(): Promise<{ success: boolean; settings?: SystemSetting[]; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    let query = supabase.from('system_settings').select('*').order('setting_key');
    if (!isAdmin) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    const settings = (data || []).map((s: any) => ({
      id: s.id,
      settingKey: s.setting_key,
      settingValue: s.setting_value,
      settingType: s.setting_type,
      description: s.description,
      isPublic: s.is_public,
      updatedAt: s.updated_at,
      updatedBy: s.updated_by,
    }));

    return { success: true, settings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSetting(key: string): Promise<{ success: boolean; setting?: SystemSetting; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from('system_settings').select('*').eq('setting_key', key).single();
    if (error) throw error;

    const setting: SystemSetting = {
      id: data.id,
      settingKey: data.setting_key,
      settingValue: data.setting_value,
      settingType: data.setting_type,
      description: data.description,
      isPublic: data.is_public,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    };

    return { success: true, setting };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSetting(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return { success: false, error: 'Admin only' };

    const { error } = await supabase.from('system_settings').update({
      setting_value: value,
      updated_by: user.id,
    }).eq('setting_key', key);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSetting(data: SettingFormData): Promise<{ success: boolean; settingId?: string; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return { success: false, error: 'Admin only' };

    const { data: setting, error } = await supabase.from('system_settings').insert({
      setting_key: data.settingKey,
      setting_value: data.settingValue,
      setting_type: data.settingType,
      description: data.description || null,
      is_public: data.isPublic,
      updated_by: user.id,
    }).select('id').single();

    if (error) throw error;
    return { success: true, settingId: setting.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSetting(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return { success: false, error: 'Admin only' };

    const { error } = await supabase.from('system_settings').delete().eq('setting_key', key);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
