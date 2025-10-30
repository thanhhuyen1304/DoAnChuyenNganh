import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export const ChallengeImportExport: React.FC = () => {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const challenges = JSON.parse(content);

          const token = localStorage.getItem('token');
          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/challenges/import`,
            { challenges },
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          toast({
            title: 'Import thành công',
            description: `Đã import ${challenges.length} bài tập`,
          });
        } catch (error) {
          console.error('Error importing challenges:', error);
          toast({
            title: 'Lỗi import',
            description: 'Không thể import bài tập. Kiểm tra định dạng file.',
            variant: 'destructive',
          });
        }
      };

      reader.readAsText(file);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/challenges/export`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const challenges = response.data.data;
      const blob = new Blob([JSON.stringify(challenges, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `challenges-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export thành công',
        description: `Đã export ${challenges.length} bài tập`,
      });
    } catch (error) {
      console.error('Error exporting challenges:', error);
      toast({
        title: 'Lỗi export',
        description: 'Không thể export bài tập',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import/Export Bài tập</CardTitle>
        <CardDescription>
          Import bài tập từ file JSON hoặc export danh sách bài tập hiện tại
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            className="max-w-xs"
          />
          <Button
            onClick={() => {
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
            disabled={importing}
          >
            {importing ? 'Đang import...' : 'Import'}
          </Button>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting}
          variant="outline"
        >
          {exporting ? 'Đang export...' : 'Export tất cả bài tập'}
        </Button>
      </CardContent>
    </Card>
  );
};