import Link from 'next/link';
import { Plus, Calendar, User, Bell } from 'lucide-react';
import { getAnnouncements } from '@/lib/actions/announcements';
import { createServerClient } from '@/lib/supabase-server';
import { AnnouncementStatus } from '@/lib/types/announcement';

export default async function AnnouncementsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from('profiles').select('role').eq('id', user.id).single() : { data: null };
  const isAdmin = profile?.role === 'admin';

  const result = await getAnnouncements();
  const announcements = result.success ? result.announcements || [] : [];

  const getStatusColor = (status: AnnouncementStatus) => {
    switch (status) {
      case AnnouncementStatus.Published: return 'bg-green-100 text-green-800';
      case AnnouncementStatus.Draft: return 'bg-yellow-100 text-yellow-800';
      case AnnouncementStatus.Archived: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // suppress unused warning
  void getStatusColor;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>Announcements</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--dh-text-2)' }}>Company announcements and updates</p>
        </div>
        {isAdmin && (
          <Link href="/announcements/new" className="dh-btn-primary">
            <Plus className="w-4 h-4" />
            New Announcement
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="dh-card p-12 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Bell className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--dh-text)' }}>No Announcements Yet</h3>
            <p className="text-sm" style={{ color: 'var(--dh-text-2)' }}>
              {isAdmin ? 'Create the first announcement for your team.' : 'No announcements have been published yet.'}
            </p>
          </div>
        ) : (
          announcements.map((announcement) => {
            const priorityColor = (announcement as any).priority === 'high' ? '#ef4444' : (announcement as any).priority === 'low' ? '#6366f1' : '#f59e0b'
            return (
              <div key={announcement.id} className="dh-card p-6 relative overflow-hidden" style={{ transition: 'box-shadow 0.2s, transform 0.2s' }}>
                {/* Priority left bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[14px]" style={{ background: priorityColor }} />
                <div className="pl-2">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-base font-bold" style={{ color: 'var(--dh-text)' }}>{announcement.title}</h3>
                        <span className={`badge ${announcement.status === 'published' ? 'badge-success' : announcement.status === 'draft' ? 'badge-warning' : 'badge-gray'}`}>
                          {announcement.status}
                        </span>
                        {(announcement as any).priority && (
                          <span className={`badge ${(announcement as any).priority === 'high' ? 'badge-error' : (announcement as any).priority === 'low' ? 'badge-info' : 'badge-warning'}`}>
                            {(announcement as any).priority} priority
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--dh-text-2)' }}>{announcement.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: '1px solid var(--dh-border)' }}>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--dh-text-3)' }}>
                      <User className="w-3.5 h-3.5" />
                      <span>{announcement.author.fullName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--dh-text-3)' }}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </div>
                    {announcement.expiryDate && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#f59e0b' }}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Expires {new Date(announcement.expiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
