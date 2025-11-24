import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { Loader2, Plus, Trash2, Award } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  condition: { type: string; value: number };
  points: number;
  badge: string;
  isActive: boolean;
}

const AchievementManagement: React.FC = () => {
  const { language } = useLanguage();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏆',
    type: 'challenge',
    conditionType: 'complete_challenges',
    conditionValue: 1,
    points: 10,
    badge: '',
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/achievements`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setAchievements(data.data.achievements);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const createAchievement = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/achievements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          type: formData.type,
          condition: {
            type: formData.conditionType,
            value: formData.conditionValue,
          },
          points: formData.points,
          badge: formData.badge,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchAchievements();
        setShowCreate(false);
        setFormData({
          name: '',
          description: '',
          icon: '🏆',
          type: 'challenge',
          conditionType: 'complete_challenges',
          conditionValue: 1,
          points: 10,
          badge: '',
        });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  const deleteAchievement = async (id: string) => {
    if (!confirm(language === 'vi' ? 'Xóa thành tích này?' : 'Delete this achievement?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/achievements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchAchievements();
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{language === 'vi' ? 'Quản lý thành tích' : 'Manage Achievements'}</h2>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" />
          {language === 'vi' ? 'Tạo mới' : 'Create'}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <Input
              placeholder={language === 'vi' ? 'Tên thành tích' : 'Achievement name'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              placeholder={language === 'vi' ? 'Mô tả' : 'Description'}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              placeholder="Icon (emoji)"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            />
            <Input
              placeholder={language === 'vi' ? 'Badge name' : 'Badge name'}
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={language === 'vi' ? 'Điểm' : 'Points'}
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              />
              <Input
                type="number"
                placeholder={language === 'vi' ? 'Giá trị điều kiện' : 'Condition value'}
                value={formData.conditionValue}
                onChange={(e) => setFormData({ ...formData, conditionValue: parseInt(e.target.value) || 0 })}
              />
            </div>
            <Button onClick={createAchievement}>{language === 'vi' ? 'Tạo' : 'Create'}</Button>
          </CardContent>
        </Card>
      )}

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid gap-4">
        {achievements.map((achievement) => (
          <Card key={achievement._id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <h3 className="font-semibold">{achievement.name}</h3>
                    <Badge>{achievement.type}</Badge>
                    {!achievement.isActive && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{achievement.badge}</Badge>
                    <Badge variant="outline">{achievement.points} points</Badge>
                  </div>
                </div>
                <Button size="sm" variant="destructive" onClick={() => deleteAchievement(achievement._id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AchievementManagement;

