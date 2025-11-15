import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { Loader2, MessageSquare } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Feedback {
  _id: string;
  user: { username: string; email: string };
  type: string;
  title: string;
  content: string;
  rating?: number;
  status: string;
  adminResponse?: string;
  createdAt: string;
}

const FeedbackManagement: React.FC = () => {
  const { language } = useLanguage();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/feedback?page=1&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setFeedbacks(data.data.feedbacks);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, adminResponse?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminResponse }),
      });

      const data = await response.json();
      if (data.success) {
        fetchFeedbacks();
        setSelectedFeedback(null);
        setResponse('');
      } else {
        setError(data.message);
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
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {feedbacks.map((feedback) => (
        <Card key={feedback._id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  <Badge>{feedback.status}</Badge>
                  <Badge variant="outline">{feedback.type}</Badge>
                  {feedback.rating && <Badge variant="outline">⭐ {feedback.rating}</Badge>}
                </div>
                <h3 className="font-semibold">{feedback.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{feedback.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'vi' ? 'Từ' : 'From'}: {feedback.user.username}
                </p>
                {feedback.adminResponse && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <p className="text-sm font-semibold">{language === 'vi' ? 'Phản hồi admin' : 'Admin Response'}:</p>
                    <p className="text-sm">{feedback.adminResponse}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setSelectedFeedback(feedback)}>
                  {language === 'vi' ? 'Phản hồi' : 'Respond'}
                </Button>
                <Button size="sm" variant="default" onClick={() => updateStatus(feedback._id, 'completed')}>
                  {language === 'vi' ? 'Hoàn thành' : 'Complete'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedFeedback && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <CardContent className="p-6 bg-white rounded-lg max-w-2xl w-full m-4">
            <h3 className="font-semibold mb-4">{language === 'vi' ? 'Phản hồi' : 'Respond'}</h3>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={language === 'vi' ? 'Nhập phản hồi...' : 'Enter response...'}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={() => updateStatus(selectedFeedback._id, 'in_progress', response)}>
                {language === 'vi' ? 'Gửi' : 'Send'}
              </Button>
              <Button variant="outline" onClick={() => {
                setSelectedFeedback(null);
                setResponse('');
              }}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeedbackManagement;

