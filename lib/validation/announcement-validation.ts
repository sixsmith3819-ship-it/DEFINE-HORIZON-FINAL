/**
 * Announcement Validation
 */

import { AnnouncementFormData } from '@/lib/types/announcement';

export function validateAnnouncementFormData(data: AnnouncementFormData): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  if (!data.title?.trim()) {
    errors.title = ['Title is required'];
  } else if (data.title.length > 200) {
    errors.title = ['Title must be 200 characters or less'];
  }

  if (!data.message?.trim()) {
    errors.message = ['Message is required'];
  }

  if (!data.status) {
    errors.status = ['Status is required'];
  }

  if (data.expiryDate) {
    const expiry = new Date(data.expiryDate);
    const now = new Date();
    if (expiry < now) {
      errors.expiryDate = ['Expiry date must be in the future'];
    }
  }

  return errors;
}

export function hasValidationErrors(errors: Record<string, string[]>): boolean {
  return Object.keys(errors).length > 0;
}

export function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}
