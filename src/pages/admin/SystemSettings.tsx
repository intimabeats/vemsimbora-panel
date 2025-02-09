import React, { useState } from 'react'
import { Layout } from '../../components/Layout'
import { 
  Settings, 
  Coins, 
  Lock, 
  Bell, 
  Shield, 
  Sliders, 
  Save 
} from 'lucide-react'

export const SystemSettings: React.FC = () => {
  const [coinSettings, setCoinSettings] = useState({
    taskCompletionBase: 10,
    complexityMultiplier: 1.5,
    monthlyBonus: 50
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    passwordResetFrequency: 90
  })

  const SettingsSection: React.FC<{
    title: string, 
    icon: React.ElementType, 
    children: React.ReactNode
  }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
      <div className="flex items-center mb-4">
        <Icon className="mr-3 text-blue-600" size={24} />
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  )

  const SettingRow: React.FC<{
    label: string, 
    children: React.ReactNode
  }> = ({ label, children }) => (
    <div className="flex justify-between items-center py-3 border-b last:border-b-0">
      <span className="text-gray-700">{label}</span>
      {children}
    </div>
  )

  return (
    <Layout role="admin">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Settings className="mr-4 text-blue-600" /> System Settings
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SettingsSection title="Coin Reward System" icon={Coins}>
            <SettingRow label="Base Task Completion Reward">
              <input 
                type="number" 
                value={coinSettings.taskCompletionBase}
                onChange={(e) => setCoinSettings({
                  ...coinSettings, 
                  taskCompletionBase: Number(e.target.value)
                })}
                className="w-24 px-2 py-1 border rounded-lg text-right"
              />
            </SettingRow>
            <SettingRow label="Complexity Multiplier">
              <input 
                type="number" 
                step="0.1"
                value={coinSettings.complexityMultiplier}
                onChange={(e) => setCoinSettings({
                  ...coinSettings, 
                  complexityMultiplier: Number(e.target.value)
                })}
                className="w-24 px-2 py-1 border rounded-lg text-right"
              />
            </SettingRow>
            <SettingRow label="Monthly Bonus">
              <input 
                type="number" 
                value={coinSettings.monthlyBonus}
                onChange={(e) => setCoinSettings({
                  ...coinSettings, 
                  monthlyBonus: Number(e.target.value)
                })}
                className="w-24 px-2 py-1 border rounded-lg text-right"
              />
            </SettingRow>
          </SettingsSection>

          <SettingsSection title="Notification Preferences" icon={Bell}>
            <SettingRow label="Email Notifications">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    emailNotifications: e.target.checked
                  })}
                />
                <span className="slider round"></span>
              </label>
            </SettingRow>
            <SettingRow label="Push Notifications">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    pushNotifications: e.target.checked
                  })}
                />
                <span className="slider round"></span>
              </label>
            </SettingRow>
            <SettingRow label="Weekly Performance Reports">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notificationSettings.weeklyReports}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    weeklyReports: e.target.checked
                  })}
                />
                <span className="slider round"></span>
              </label>
            </SettingRow>
          </SettingsSection>

          <SettingsSection title="Security Settings" icon={Shield}>
            <SettingRow label="Two-Factor Authentication">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={securitySettings.twoFactorAuth}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    twoFactorAuth: e.target.checked
                  })}
                />
                <span className="slider round"></span>
              </label>
            </SettingRow>
            <SettingRow label="Password Reset Frequency (Days)">
              <input 
                type="number" 
                value={securitySettings.passwordResetFrequency}
                onChange={(e) => setSecuritySettings({
                  ...securitySettings, 
                  passwordResetFrequency: Number(e.target.value)
                })}
                className="w-24 px-2 py-1 border rounded-lg text-right"
              />
            </SettingRow>
          </SettingsSection>

          <SettingsSection title="Advanced Configuration" icon={Sliders}>
            <div className="text-gray-600">
              Advanced system configurations will be added in future updates.
            </div>
          </SettingsSection>
        </div>

        <div className="flex justify-end">
          <button 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
          >
            <Save className="mr-2" /> Save Changes
          </button>
        </div>
      </div>
    </Layout>
  )
}
