'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createAnnouncement } from '@/lib/actions/announcements';
import { AnnouncementStatus } from '@/lib/types/announcement';
import { FieldError, FormErrorBanner } from '@/components/ui';
import { validateAnnouncementFormData, hasValidationErrors } from '@/lib/validation/announcement-validation';

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    status: AnnouncementStatus.Draft,
    expiryDate: '',
  });

  const handleBlur = (fieldName: string) => {
    setTouched(prev => new Set(prev).add(fieldName));
    const allErrors = validateAnnouncementFormData(formData);
    setErrors(prev => ({ ...prev, [fieldName]: (allErrors as any)[fieldName] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSubmitError('');

    const allErrors = validateAnnouncementFormData(formData);
    if (hasValidationErrors(allErrors)) {
      setErrors(allErrors);
      setIsSubmitting(false);
      return;
    }

    const result = await createAnnouncement({
      title: formData.title,
      message: formData.message,
      status: formData.status,
      expiryDate: formData.expiryDate || undefined,
    });

    if (result.success) {
      router.push('/announcements');
      router.refresh();
    } else if (result.validationErrors) {
      setErrors(result.validationErrors);
      setIsSubmitting(false);
    } else {
      setSubmitError(result.error || 'Failed to create announcement');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6" style={{ background: 'var(--dh-bg)', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/announcements" className="inline-flex items-center gap-2 text-sm font-medium mb-4" style={{ color: 'var(--dh-text-2)' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Announcements
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>Create Announcement</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--dh-text-2)' }}>Share important updates with your team</p>
        </div>

        <form onSubmit={handleSubmit} className="dh-card p-6 space-y-5">
          <FormErrorBanner message={submitError} />

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--dh-text-2)' }}>
              Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onBlur={() => handleBlur('title')}
              className="dh-input"
              placeholder="Enter announcement title"
              maxLength={200}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            <FieldError id="title-error" message={errors.title?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--dh-text-2)' }}>
              Message <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              onBlur={() => handleBlur('message')}
              className="dh-input"
              placeholder="Enter announcement message"
              rows={5}
              style={{ resize: 'vertical' }}
              aria-describedby={errors.message ? 'message-error' : undefined}
            />
            <FieldError id="message-error" message={errors.message?.[0]} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--dh-text-2)' }}>
                Status <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AnnouncementStatus })}
                className="dh-input"
              >
                <option value={AnnouncementStatus.Draft}>Draft</option>
                <option value={AnnouncementStatus.Published}>Published</option>
                <option value={AnnouncementStatus.Archived}>Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--dh-text-2)' }}>
                Expiry Date <span style={{ color: 'var(--dh-text-3)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="dh-input"
                min={new Date().toISOString().split('T')[0]}
              />
              <FieldError id="expiryDate-error" message={errors.expiryDate?.[0]} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--dh-border)' }}>
            <button type="submit" disabled={isSubmitting} className="dh-btn-primary">
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Creating...' : 'Create Announcement'}
            </button>
            <Link href="/announcements" className="px-5 py-2 rounded-lg text-sm font-semibold transition" style={{ border: '1px solid var(--dh-border)', color: 'var(--dh-text-2)' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
