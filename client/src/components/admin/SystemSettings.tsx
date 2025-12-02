import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { Loader2, Save, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Setting {
  _id: string;
  key: string;
  value: any;
  type: string;
  description?: string;
  category: string;
  isPublic: boolean;
}

const SystemSettings: React.FC = () => {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editedSettings, setEditedSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setSettings(data.data.settings);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any, type: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value, type }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Cập nhật thành công');
        fetchSettings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  const initializeDefaults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/settings/initialize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Khởi tạo thành công');
        fetchSettings();
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  const groupedSettings = settings.reduce((acc: any, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {});

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{language === 'vi' ? 'Cài đặt hệ thống' : 'System Settings'}</h2>
        <Button onClick={initializeDefaults} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {language === 'vi' ? 'Khởi tạo mặc định' : 'Initialize Defaults'}
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

      {Object.entries(groupedSettings).map(([category, categorySettings]: [string, any]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySettings.map((setting: Setting) => (
              <div key={setting._id} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="font-medium">{setting.key}</label>
                  {setting.description && (
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  )}
                </div>
                <div className="flex-1">
                  {setting.type === 'boolean' ? (
                    <select
                      value={editedSettings[setting.key] ?? setting.value}
                      onChange={(e) => {
                        setEditedSettings({
                          ...editedSettings,
                          [setting.key]: e.target.value === 'true',
                        });
                      }}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : (
                    <Input
                      type={setting.type === 'number' ? 'number' : 'text'}
                      value={editedSettings[setting.key] ?? setting.value}
                      onChange={(e) => {
                        setEditedSettings({
                          ...editedSettings,
                          [setting.key]: setting.type === 'number' ? Number(e.target.value) : e.target.value,
                        });
                      }}
                    />
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => updateSetting(setting.key, editedSettings[setting.key] ?? setting.value, setting.type)}
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SystemSettings;

