/**
 * Announcements Types
 */

export enum AnnouncementStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  status: AnnouncementStatus;
  priority?: string;
  publishDate?: string;
  expiryDate?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface AnnouncementWithAuthor extends Announcement {
  author: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  status: AnnouncementStatus;
  priority?: string;
  publishDate?: string;
  expiryDate?: string;
}
