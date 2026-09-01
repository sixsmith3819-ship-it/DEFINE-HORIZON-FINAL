import Link from 'next/link';
import { Plus, Calendar, User } from 'lucide-react';
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-600">Company announcements and updates</p>
        </div>
        {isAdmin && (
          <Link href="/announcements/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" />
            New Announcement
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No announcements yet</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(announcement.status)}`}>
                      {announcement.status}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{announcement.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{announcement.author.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                </div>
                {announcement.expiryDate && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Calendar className="w-4 h-4" />
                    <span>Expires: {new Date(announcement.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
