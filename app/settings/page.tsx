'use client';

import { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { getSettings, updateSetting } from '@/lib/actions/settings';
import { SystemSetting } from '@/lib/types/settings';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState('');

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

  const handleSave = async (key: string) => {
    setIsSaving(true);
    setSaveMessage('');
    
    const result = await updateSetting(key, formData[key]);
    
    if (result.success) {
      setSaveMessage('Settings saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      alert(result.error || 'Failed to save settings');
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const commissionSettings = settings.filter(s => s.settingKey.includes('commission'));
  const productSettings = settings.filter(s => s.settingKey.includes('stock') || s.settingKey.includes('product'));
  const generalSettings = settings.filter(s => !s.settingKey.includes('commission') && !s.settingKey.includes('stock') && !s.settingKey.includes('product'));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-gray-900" />
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        </div>
        <p className="text-sm text-gray-600">Configure system-wide settings and preferences</p>
      </div>

      {saveMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {saveMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Commission Settings */}
        {commissionSettings.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Commission Rates</h2>
            <div className="space-y-4">
              {commissionSettings.map(setting => (
                <div key={setting.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {setting.description || setting.settingKey}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={formData[setting.settingKey] || ''}
                        onChange={(e) => setFormData({ ...formData, [setting.settingKey]: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                      />
                      <span className="absolute right-3 top-2 text-gray-500">%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSave(setting.settingKey)}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Settings */}
        {productSettings.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Product Settings</h2>
            <div className="space-y-4">
              {productSettings.map(setting => (
                <div key={setting.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {setting.description || setting.settingKey}
                    </label>
                    <input
                      type="number"
                      value={formData[setting.settingKey] || ''}
                      onChange={(e) => setFormData({ ...formData, [setting.settingKey]: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => handleSave(setting.settingKey)}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Settings */}
        {generalSettings.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">General Settings</h2>
            <div className="space-y-4">
              {generalSettings.map(setting => (
                <div key={setting.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {setting.description || setting.settingKey}
                    </label>
                    <input
                      type="text"
                      value={formData[setting.settingKey] || ''}
                      onChange={(e) => setFormData({ ...formData, [setting.settingKey]: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => handleSave(setting.settingKey)}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {settings.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">No settings configured yet</p>
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-bold text-blue-900 mb-2">About Settings</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Commission rates affect all new transactions</li>
          <li>• Changes take effect immediately</li>
          <li>• Only administrators can modify settings</li>
        </ul>
      </div>
    </div>
  );
}
