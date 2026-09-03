'use client';

import { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { getSettings, updateSetting } from '@/lib/actions/settings';
import { SystemSetting } from '@/lib/types/settings';
import { FieldError } from '@/components/ui';
import { validateSettingValue, SettingType } from '@/lib/validation/settings-validation';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadSettings() {
      const result = await getSettings();
      if (result.success && result.settings) {
        setSettings(result.settings);
        const data: Record<string, string> = {};
        result.settings.forEach(s => {
          data[s.settingKey] = s.settingValue;
        });
        setFormData(data);
      }
      setIsLoading(false);
    }
    loadSettings();
  }, []);

  const getSettingType = (key: string): SettingType => {
    if (key.toLowerCase().includes('commission') || key.toLowerCase().includes('rate')) return 'percentage';
    if (key.toLowerCase().includes('quantity') || key.toLowerCase().includes('threshold') || key.toLowerCase().includes('stock')) return 'number';
    return 'text';
  };

  const handleSave = async (key: string) => {
    const type = getSettingType(key);
    const validation = validateSettingValue(formData[key] || '', type);
    if (!validation.valid) {
      setFieldErrors(prev => ({ ...prev, [key]: validation.error || 'Invalid value' }));
      return;
    }
    setFieldErrors(prev => ({ ...prev, [key]: '' }));

    setIsSaving(true);
    setSaveMessage('');

    const result = await updateSetting(key, formData[key]);

    if (result.success) {
      setSaveMessage('Settings saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setFieldErrors(prev => ({ ...prev, [key]: result.error || 'Failed to save settings' }));
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-6" style={{ background: 'var(--dh-bg)', minHeight: '100vh' }}>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="skeleton h-10 w-48 mb-8" />
          {[1,2,3].map(i => <div key={i} className="skeleton h-32" />)}
        </div>
      </div>
    );
  }

  const commissionSettings = settings.filter(s => s.settingKey.includes('commission'));
  const productSettings = settings.filter(s => s.settingKey.includes('stock') || s.settingKey.includes('product'));
  const generalSettings = settings.filter(s => !s.settingKey.includes('commission') && !s.settingKey.includes('stock') && !s.settingKey.includes('product'));

  return (
    <div className="p-6" style={{ background: 'var(--dh-bg)', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>System Settings</h1>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--dh-text-2)' }}>Configure system-wide settings and preferences</p>
        </div>

        {saveMessage && (
          <div className="mb-6 rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
            ✓ {saveMessage}
          </div>
        )}

        <div className="space-y-6">
          {commissionSettings.length > 0 && (
            <div className="dh-card p-6">
              <h2 className="text-base font-bold mb-5" style={{ color: 'var(--dh-text)' }}>Commission Rates</h2>
              <div className="space-y-4">
                {commissionSettings.map(setting => (
                  <div key={setting.id} className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--dh-text-2)' }}>
                        {setting.description || setting.settingKey}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData[setting.settingKey] || ''}
                          onChange={(e) => setFormData({ ...formData, [setting.settingKey]: e.target.value })}
                          className="dh-input pr-8"
                          aria-describedby={fieldErrors[setting.settingKey] ? `${setting.settingKey}-error` : undefined}
                        />
                        <span className="absolute right-3 top-2.5 text-sm font-semibold" style={{ color: 'var(--dh-text-3)' }}>%</span>
                      </div>
                      <FieldError id={`${setting.settingKey}-error`} message={fieldErrors[setting.settingKey]} />
                    </div>
                    <button
                      onClick={() => handleSave(setting.settingKey)}
                      disabled={isSaving}
                      className="dh-btn-primary"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {productSettings.length > 0 && (
            <div className="dh-card p-6">
              <h2 className="text-base font-bold mb-5" style={{ color: 'var(--dh-text)' }}>Product Settings</h2>
              <div className="space-y-4">
                {productSettings.map(setting => (
                  <div key={setting.id} className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--dh-text-2)' }}>
                        {setting.description || setting.settingKey}
                      </label>
                      <input
                        type="number"
                        value={formData[setting.settingKey] || ''}
                        onChange={(e) => setFormData({ ...formData, [setting.settingKey]: e.target.value })}
                        className="dh-input"
                        aria-describedby={fieldErrors[setting.settingKey] ? `${setting.settingKey}-error` : undefined}
                      />
                      <FieldError id={`${setting.settingKey}-error`} message={fieldErrors[setting.settingKey]} />
                    </div>
                    <button onClick={() => handleSave(setting.settingKey)} disabled={isSaving} className="dh-btn-primary">
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {generalSettings.length > 0 && (
            <div className="dh-card p-6">
              <h2 className="text-base font-bold mb-5" style={{ color: 'var(--dh-text)' }}>General Settings</h2>
              <div className="space-y-4">
                {generalSettings.map(setting => (
                  <div key={setting.id} className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--dh-text-2)' }}>
                        {setting.description || setting.settingKey}
                      </label>
                      <input
                        type="text"
                        value={formData[setting.settingKey] || ''}
                        onChange={(e) => setFormData({ ...formData, [setting.settingKey]: e.target.value })}
                        className="dh-input"
                        aria-describedby={fieldErrors[setting.settingKey] ? `${setting.settingKey}-error` : undefined}
                      />
                      <FieldError id={`${setting.settingKey}-error`} message={fieldErrors[setting.settingKey]} />
                    </div>
                    <button onClick={() => handleSave(setting.settingKey)} disabled={isSaving} className="dh-btn-primary">
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {settings.length === 0 && (
            <div className="dh-card p-12 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <SettingsIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--dh-text)' }}>No Settings Configured</h3>
              <p className="text-sm" style={{ color: 'var(--dh-text-2)' }}>System settings will appear here once configured.</p>
            </div>
          )}

          <div className="dh-card p-5" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))', borderColor: 'rgba(99,102,241,0.2)' }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--dh-primary)' }}>About Settings</h3>
            <ul className="text-sm space-y-1" style={{ color: 'var(--dh-text-2)' }}>
              <li>• Commission rates affect all new transactions</li>
              <li>• Changes take effect immediately</li>
              <li>• Only administrators can modify settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
