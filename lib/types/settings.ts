/**
 * Settings Types
 */

export enum SettingType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Json = 'json',
}

export interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  settingType: SettingType;
  description?: string;
  isPublic: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface SettingFormData {
  settingKey: string;
  settingValue: string;
  settingType: SettingType;
  description?: string;
  isPublic: boolean;
}
