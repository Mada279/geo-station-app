import { supabase } from '@/utils/supabaseClient';

export interface GlobalAnnouncement {
  id: string;
  message_ar: string;
  cta_text?: string | null;
  cta_link?: string | null;
  theme_type: 'promo' | 'alert' | 'info' | 'maintenance';
  is_active: boolean;
  expires_at?: string | null;
  created_at: string;
  updated_at?: string;
}

const SETTING_KEY = 'global_announcements_list';

/**
 * Fetches the single active, unexpired announcement with the latest created_at.
 * Works seamlessly with both a standalone table (if created via SQL) or platform_settings JSON storage.
 */
export async function getActiveAnnouncement(): Promise<GlobalAnnouncement | null> {
  const now = new Date().toISOString();

  try {
    // 1. Try querying the global_announcements table first
    const { data: tableData, error: tableError } = await supabase
      .from('global_announcements')
      .select('*')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tableError && tableData) {
      return tableData as GlobalAnnouncement;
    }
  } catch {}

  try {
    // 2. Fallback to platform_settings JSON storage
    const { data: settingData, error: settingError } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', SETTING_KEY)
      .maybeSingle();

    if (!settingError && settingData && Array.isArray(settingData.setting_value)) {
      const list = settingData.setting_value as GlobalAnnouncement[];
      const activeList = list
        .filter((item) => {
          if (!item.is_active) return false;
          if (item.expires_at) {
            return new Date(item.expires_at) > new Date();
          }
          return true;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (activeList.length > 0) {
        return activeList[0];
      }
    }
  } catch (err) {
    console.warn('[AnnouncementsService] Error fetching announcement:', err);
  }

  return null;
}

/**
 * Fetches all announcements (active, scheduled, expired) for the Admin Dashboard.
 */
export async function getAllAnnouncements(): Promise<GlobalAnnouncement[]> {
  try {
    const { data: tableData, error: tableError } = await supabase
      .from('global_announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!tableError && tableData) {
      return tableData as GlobalAnnouncement[];
    }
  } catch {}

  try {
    const { data: settingData, error: settingError } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', SETTING_KEY)
      .maybeSingle();

    if (!settingError && settingData && Array.isArray(settingData.setting_value)) {
      const list = settingData.setting_value as GlobalAnnouncement[];
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  } catch (err) {
    console.error('[AnnouncementsService] Error fetching all announcements:', err);
  }

  return [];
}

/**
 * Creates or updates an announcement.
 */
export async function saveAnnouncement(announcement: Partial<GlobalAnnouncement>): Promise<{ success: boolean; error?: any }> {
  const isNew = !announcement.id;
  const now = new Date().toISOString();
  const item: GlobalAnnouncement = {
    id: announcement.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `announcement_${Date.now()}`),
    message_ar: announcement.message_ar || '',
    cta_text: announcement.cta_text || null,
    cta_link: announcement.cta_link || null,
    theme_type: announcement.theme_type || 'info',
    is_active: announcement.is_active ?? true,
    expires_at: announcement.expires_at || null,
    created_at: announcement.created_at || now,
    updated_at: now,
  };

  // Try saving to table if available
  try {
    const { error } = await supabase
      .from('global_announcements')
      .upsert(item);

    if (!error) {
      return { success: true };
    }
  } catch {}

  // Fallback: update in platform_settings
  try {
    const currentList = await getAllAnnouncements();
    let updatedList: GlobalAnnouncement[];

    if (isNew) {
      updatedList = [item, ...currentList];
    } else {
      updatedList = currentList.map((existing) => (existing.id === item.id ? item : existing));
    }

    const { error: upsertErr } = await supabase
      .from('platform_settings')
      .upsert({
        setting_key: SETTING_KEY,
        setting_value: updatedList,
        description: 'قائمة الإعلانات والبنرات العلوية النشطة في المنصة',
        updated_at: now,
      }, { onConflict: 'setting_key' });

    if (upsertErr) throw upsertErr;
    return { success: true };
  } catch (err) {
    console.error('[AnnouncementsService] Error saving announcement:', err);
    return { success: false, error: err };
  }
}

/**
 * Deletes an announcement by ID.
 */
export async function deleteAnnouncement(id: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('global_announcements')
      .delete()
      .eq('id', id);

    if (!error) {
      return { success: true };
    }
  } catch {}

  try {
    const currentList = await getAllAnnouncements();
    const updatedList = currentList.filter((item) => item.id !== id);

    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        setting_key: SETTING_KEY,
        setting_value: updatedList,
        description: 'قائمة الإعلانات والبنرات العلوية النشطة في المنصة',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'setting_key' });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[AnnouncementsService] Error deleting announcement:', err);
    return { success: false, error: err };
  }
}

/**
 * Toggles an announcement active status.
 */
export async function toggleAnnouncementActive(id: string, is_active: boolean): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('global_announcements')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      return { success: true };
    }
  } catch {}

  try {
    const currentList = await getAllAnnouncements();
    const updatedList = currentList.map((item) => (item.id === id ? { ...item, is_active, updated_at: new Date().toISOString() } : item));

    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        setting_key: SETTING_KEY,
        setting_value: updatedList,
        description: 'قائمة الإعلانات والبنرات العلوية النشطة في المنصة',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'setting_key' });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[AnnouncementsService] Error toggling announcement:', err);
    return { success: false, error: err };
  }
}
