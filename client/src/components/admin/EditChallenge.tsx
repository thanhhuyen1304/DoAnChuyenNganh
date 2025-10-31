import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import * as Select from '@radix-ui/react-select';
import { Label } from '../ui/label';
import { CodePreview } from './CodePreview';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { decodeHtml } from '../../lib/utils';

interface EditChallengeProps {
  challengeId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
}

interface Challenge {
  title: string;
  description: string;
  problemStatement: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: 'Python' | 'JavaScript' | 'Java' | 'C++' | 'C#' | 'C';
  category: 'Syntax' | 'Logic' | 'Performance' | 'Security';
  testCases: TestCase[];
  buggyCode: string;
  correctCode: string;
  points: number;
  timeLimit: number;
  memoryLimit: number;
  isActive: boolean;
}

export const EditChallenge: React.FC<EditChallengeProps> = ({
  challengeId,
  onClose,
  onUpdate
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  
  // Khởi tạo giá trị mặc định cho các trường số
  useEffect(() => {
    if (challenge) {
      setChallenge({
        ...challenge,
        points: challenge.points || 10,
        timeLimit: challenge.timeLimit || 1,
        memoryLimit: challenge.memoryLimit || 128,
        testCases: challenge.testCases.map(tc => ({
          ...tc,
          points: tc.points || 10
        }))
      });
    }
  }, [challenge]);

  const [shouldRefresh, setShouldRefresh] = useState(false);

  // Lấy thông tin challenge
  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // use buildApi helper to avoid double /api issues if VITE_API_URL already contains /api
      const { buildApi } = await import('../../lib/api');
      const response = await axios.get(
        buildApi(`/challenges/${challengeId}`),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = response.data.data;
      // Decode HTML entities trong các trường text
      data.title = decodeHtml(data.title);
      data.description = decodeHtml(data.description);
      data.problemStatement = decodeHtml(data.problemStatement);
      data.buggyCode = decodeHtml(data.buggyCode);
      data.correctCode = decodeHtml(data.correctCode);
      data.testCases = data.testCases.map((tc: TestCase) => ({
        ...tc,
        input: decodeHtml(tc.input),
        expectedOutput: decodeHtml(tc.expectedOutput)
      }));
      setChallenge(data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching challenge:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải thông tin bài tập',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Load challenge khi component mount hoặc khi cần refresh
  useEffect(() => {
    fetchChallenge();
  }, [challengeId, shouldRefresh]);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { buildApi } = await import('../../lib/api');
      await axios.put(
        buildApi(`/challenges/${challengeId}`),
        challenge,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật bài tập',
      });
      
      // Refresh dữ liệu sau khi cập nhật
      setShouldRefresh(prev => !prev);
      
      // Gọi callback để cập nhật danh sách ở component cha
      onUpdate();
      
      // Reset loading state
      setLoading(false);
    } catch (error: any) {
      console.error('Error updating challenge:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể cập nhật bài tập',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };  const handleTestCaseChange = (index: number, field: keyof TestCase, value: any) => {
    if (!challenge) return;
    const newTestCases = [...challenge.testCases];
    newTestCases[index] = {
      ...newTestCases[index],
      [field]: value
    };
    setChallenge({
      ...challenge,
      testCases: newTestCases
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }
  
  if (!challenge) {
    return (
      <div className="p-4 text-center text-red-600">
        Không thể tải thông tin bài tập. Vui lòng thử lại sau.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h2 className="text-2xl font-bold mb-4">Edit Challenge</h2>
      
      {/* Basic Info */}
      <div className="space-y-2">
        <Input
          type="text"
          value={challenge.title}
          onChange={(e) => setChallenge({...challenge, title: e.target.value})}
          placeholder="Title"
        />
        <Textarea
          value={challenge.description}
          onChange={(e) => setChallenge({...challenge, description: e.target.value})}
          placeholder="Description"
        />
        <Textarea
          value={challenge.problemStatement}
          onChange={(e) => setChallenge({...challenge, problemStatement: e.target.value})}
          placeholder="Problem Statement"
        />
      </div>

      {/* Classification */}
      <div className="grid grid-cols-3 gap-4">
          <Select.Root
            value={challenge.difficulty}
            onValueChange={(value) => setChallenge({...challenge, difficulty: value as 'Easy' | 'Medium' | 'Hard'})}
          >
            <Select.Trigger className="w-full flex items-center justify-between border rounded-md px-3 py-2">
              <Select.Value />
              <Select.Icon>
                <CaretSortIcon />
              </Select.Icon>
            </Select.Trigger>
            
            <Select.Portal>
              <Select.Content className="bg-white border rounded-md shadow-lg">
                <Select.Viewport>
                  <Select.Item value="Easy" className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
                    <Select.ItemText>Dễ</Select.ItemText>
                    <Select.ItemIndicator className="ml-2">
                      <CheckIcon />
                    </Select.ItemIndicator>
                  </Select.Item>
                  <Select.Item value="Medium" className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
                    <Select.ItemText>Trung bình</Select.ItemText>
                    <Select.ItemIndicator className="ml-2">
                      <CheckIcon />
                    </Select.ItemIndicator>
                  </Select.Item>
                  <Select.Item value="Hard" className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
                    <Select.ItemText>Khó</Select.ItemText>
                    <Select.ItemIndicator className="ml-2">
                      <CheckIcon />
                    </Select.ItemIndicator>
                  </Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          <Select.Root
            value={challenge.language}
            onValueChange={(value) => setChallenge({...challenge, language: value as Challenge['language']})}
          >
            <Select.Trigger className="w-full flex items-center justify-between border rounded-md px-3 py-2">
              <Select.Value />
              <Select.Icon>
                <CaretSortIcon />
              </Select.Icon>
            </Select.Trigger>
            
            <Select.Portal>
              <Select.Content className="bg-white border rounded-md shadow-lg">
                <Select.Viewport>
                  {['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C'].map((lang) => (
                    <Select.Item key={lang} value={lang} className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
                      <Select.ItemText>{lang}</Select.ItemText>
                      <Select.ItemIndicator className="ml-2">
                        <CheckIcon />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          <Select.Root
            value={challenge.category}
            onValueChange={(value) => setChallenge({...challenge, category: value as Challenge['category']})}
          >
            <Select.Trigger className="w-full flex items-center justify-between border rounded-md px-3 py-2">
              <Select.Value />
              <Select.Icon>
                <CaretSortIcon />
              </Select.Icon>
            </Select.Trigger>
            
            <Select.Portal>
              <Select.Content className="bg-white border rounded-md shadow-lg">
                <Select.Viewport>
                  {['Syntax', 'Logic', 'Performance', 'Security'].map((cat) => (
                    <Select.Item key={cat} value={cat} className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
                      <Select.ItemText>{cat}</Select.ItemText>
                      <Select.ItemIndicator className="ml-2">
                        <CheckIcon />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
      </div>

      {/* Code Sections */}
      <div className="space-y-4">
        <div>
          <Label>Buggy Code</Label>
          <div className="border rounded-md overflow-hidden">
            <CodePreview
              code={challenge.buggyCode}
              language={challenge.language}
              height="300px"
              readOnly={false}
              onChange={(value) => setChallenge({...challenge, buggyCode: value || ''})}
            />
          </div>
        </div>
        <div>
          <Label>Correct Code</Label>
          <div className="border rounded-md overflow-hidden">
            <CodePreview
              code={challenge.correctCode}
              language={challenge.language}
              height="300px"
              readOnly={false}
              onChange={(value) => setChallenge({...challenge, correctCode: value || ''})}
            />
          </div>
        </div>
      </div>

      {/* Test Cases */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Test Cases</h3>
        {challenge.testCases.map((testCase, index) => (
          <div key={index} className="space-y-2 p-4 border rounded">
            <Input
              type="text"
              value={testCase.input}
              onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
              placeholder="Input"
            />
            <Input
              type="text"
              value={testCase.expectedOutput}
              onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
              placeholder="Expected Output"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={testCase.isHidden}
                  onChange={(e) => handleTestCaseChange(index, 'isHidden', e.target.checked)}
                />
                Hidden Test Case
              </label>
              <Input
                type="number"
                value={testCase.points || 0}
                onChange={(e) => handleTestCaseChange(index, 'points', Number(e.target.value) || 0)}
                placeholder="Points"
                className="w-24"
                min={0}
                max={100}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Points, Time Limit, Memory Limit and Status */}
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="points">Điểm số</Label>
          <Input
            id="points"
            type="number"
            min={1}
            max={1000}
            value={challenge.points || 0}
            onChange={(e) => setChallenge({...challenge, points: Number(e.target.value) || 0})}
            placeholder="Điểm"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeLimit">Giới hạn thời gian (giây)</Label>
          <Input
            id="timeLimit"
            type="number"
            min={1}
            max={60}
            value={challenge.timeLimit || 1}
            onChange={(e) => setChallenge({...challenge, timeLimit: Number(e.target.value) || 1})}
            placeholder="Giới hạn thời gian"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="memoryLimit">Giới hạn bộ nhớ (MB)</Label>
          <Input
            id="memoryLimit"
            type="number"
            min={1}
            max={512}
            value={challenge.memoryLimit || 128}
            onChange={(e) => setChallenge({...challenge, memoryLimit: Number(e.target.value) || 128})}
            placeholder="Giới hạn bộ nhớ"
            className="w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="isActive">Trạng thái</Label>
          <label className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={challenge.isActive}
              onChange={(e) => setChallenge({...challenge, isActive: e.target.checked})}
            />
            Đang hoạt động
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
};