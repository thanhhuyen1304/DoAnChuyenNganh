import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Report {
  _id: string;
  reporter: { username: string; email: string };
  reportedUser?: { username: string; email: string };
  type: string;
  reason: string;
  description: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

const ReportManagement: React.FC = () => {
  const { language } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`${API_BASE_URL}/reports?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setReports(data.data.reports);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, notes?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminNotes: notes }),
      });

      const data = await response.json();
      if (data.success) {
        fetchReports();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'reviewing': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">{language === 'vi' ? 'Tất cả' : 'All'}</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {reports.map((report) => (
        <Card key={report._id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(report.status)}
                  <Badge>{report.status}</Badge>
                  <Badge variant="outline">{report.type}</Badge>
                </div>
                <p className="font-semibold">{report.reason}</p>
                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'vi' ? 'Báo cáo bởi' : 'Reported by'}: {report.reporter.username}
                  {report.reportedUser && ` | ${language === 'vi' ? 'Bị báo cáo' : 'Reported'}: ${report.reportedUser.username}`}
                </p>
                {report.adminNotes && (
                  <p className="text-sm text-blue-600 mt-2">{report.adminNotes}</p>
                )}
              </div>
              <div className="flex gap-2">
                {report.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(report._id, 'reviewing')}>
                      {language === 'vi' ? 'Xem xét' : 'Review'}
                    </Button>
                    <Button size="sm" variant="default" onClick={() => updateStatus(report._id, 'resolved')}>
                      {language === 'vi' ? 'Giải quyết' : 'Resolve'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(report._id, 'rejected')}>
                      {language === 'vi' ? 'Từ chối' : 'Reject'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReportManagement;

