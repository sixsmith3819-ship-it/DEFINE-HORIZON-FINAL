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
  message: string;
  priority?: string;
  status: AnnouncementStatus;
  publishDate?: string;
  expiryDate?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
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
  message: string;
  priority?: string;
  status: AnnouncementStatus;
  publishDate?: string;
  expiryDate?: string;
}
