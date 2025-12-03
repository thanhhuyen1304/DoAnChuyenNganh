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

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
}

interface Solution {
  title: string;
  content: string;
  language: string;
  code: string;
  explanation: string;
  tokenCost: number;
  order: number;
}

interface ChallengeData {
  title: string;
  description: string;
  problemStatement: string;
  language: 'Python' | 'JavaScript' | 'Java' | 'C++' | 'C#' | 'C';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Syntax' | 'Logic' | 'Performance' | 'Security';
  buggyCode?: string; // Optional - chỉ dùng làm starter code nếu admin muốn
  testCases: TestCase[];
  points: number;
  timeLimit: number;
  memoryLimit: number;
  tokenReward: number;
  solutions: Solution[];
}

export const CreateChallenge: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeData>({
    title: '',
    description: '',
    problemStatement: '',
    language: 'Python',
    difficulty: 'Easy',
    category: 'Syntax',
    buggyCode: '', // Optional - starter code
    testCases: [{ input: '', expectedOutput: '', isHidden: false, points: 10 }],
    points: 10,
    timeLimit: 1,
    memoryLimit: 128,
    tokenReward: 1, // Default: Easy = 1, Medium = 2, Hard = 3
    solutions: []
  });

  // Auto-update tokenReward when difficulty changes
  useEffect(() => {
    const tokenRewards: Record<string, number> = {
      'Easy': 1,
      'Medium': 2,
      'Hard': 3
    };
    setChallenge(prev => ({
      ...prev,
      tokenReward: tokenRewards[prev.difficulty] || 1
    }));
  }, [challenge.difficulty]);

  const handleTestCaseChange = (index: number, field: keyof TestCase, value: any) => {
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

  const handleAddTestCase = () => {
    setChallenge({
      ...challenge,
      testCases: [
        ...challenge.testCases,
        { input: '', expectedOutput: '', isHidden: false, points: 10 }
      ]
    });
  };

  const handleRemoveTestCase = (index: number) => {
    if (challenge.testCases.length > 1) {
      const newTestCases = challenge.testCases.filter((_, i) => i !== index);
      setChallenge({
        ...challenge,
        testCases: newTestCases
      });
    }
  };

  const handleSolutionChange = (index: number, field: keyof Solution, value: any) => {
    const newSolutions = [...challenge.solutions];
    newSolutions[index] = {
      ...newSolutions[index],
      [field]: value
    };
    setChallenge({
      ...challenge,
      solutions: newSolutions
    });
  };

  const handleAddSolution = () => {
    setChallenge({
      ...challenge,
      solutions: [
        ...challenge.solutions,
        {
          title: '',
          content: '',
          language: challenge.language,
          code: '',
          explanation: '',
          tokenCost: 1,
          order: challenge.solutions.length + 1
        }
      ]
    });
  };

  const handleRemoveSolution = (index: number) => {
    const newSolutions = challenge.solutions.filter((_, i) => i !== index);
    // Re-order remaining solutions
    newSolutions.forEach((sol, i) => {
      sol.order = i + 1;
    });
    setChallenge({
      ...challenge,
      solutions: newSolutions
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { buildApi } = await import('../../lib/api');
      const response = await axios.post(
        buildApi('/challenges'),
        challenge,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast({
        title: 'Thành công',
        description: 'Đã tạo bài tập mới',
      });

      // Reset form
      setChallenge({
        title: '',
        description: '',
        problemStatement: '',
        language: 'Python',
        difficulty: 'Easy',
        category: 'Syntax',
        buggyCode: '', // Optional - starter code
        testCases: [{ input: '', expectedOutput: '', isHidden: false, points: 10 }],
        points: 10,
        timeLimit: 1,
        memoryLimit: 128,
        tokenReward: 1,
        solutions: []
      });
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tạo bài tập mới',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h2 className="text-2xl font-bold mb-4">Create New Challenge</h2>
      
      {/* Basic Info */}
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề</Label>
        <Input
          id="title"
          type="text"
          value={challenge.title}
          onChange={(e) => setChallenge({...challenge, title: e.target.value})}
          placeholder="Tiêu đề bài tập"
          required
        />

        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={challenge.description}
          onChange={(e) => setChallenge({...challenge, description: e.target.value})}
          placeholder="Mô tả ngắn gọn về bài tập"
          required
        />

        <Label htmlFor="problemStatement">Đề bài</Label>
        <Textarea
          id="problemStatement"
          value={challenge.problemStatement}
          onChange={(e) => setChallenge({...challenge, problemStatement: e.target.value})}
          placeholder="Nội dung chi tiết của đề bài"
          required
        />
      </div>

      {/* Classification */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="difficulty">Độ khó</Label>
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
        </div>

        <div>
          <Label htmlFor="language">Ngôn ngữ</Label>
          <Select.Root
            value={challenge.language}
            onValueChange={(value) => setChallenge({...challenge, language: value as ChallengeData['language']})}
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
        </div>

        <div>
          <Label htmlFor="category">Danh mục</Label>
          <Select.Root
            value={challenge.category}
            onValueChange={(value) => setChallenge({...challenge, category: value as ChallengeData['category']})}
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
      </div>

      {/* Starter Code (Optional) */}
      <div className="space-y-2">
        <div>
          <Label htmlFor="starterCode">Starter Code (Tùy chọn)</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Code mẫu để học sinh bắt đầu. Để trống nếu không cần.
          </p>
          <div className="border rounded-md overflow-hidden">
            <CodePreview
              code={challenge.buggyCode || ''}
              language={challenge.language.toLowerCase()}
              height="200px"
              readOnly={false}
              onChange={(value) => setChallenge({...challenge, buggyCode: value || ''})}
            />
          </div>
        </div>
      </div>

      {/* Test Cases */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Test Cases</Label>
          <Button 
            type="button"
            onClick={handleAddTestCase}
            variant="outline"
          >
            Thêm Test Case
          </Button>
        </div>
        {challenge.testCases.map((testCase, index) => (
          <div key={index} className="space-y-2 p-4 border rounded">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => handleRemoveTestCase(index)}
                variant="outline"
                size="sm"
                disabled={challenge.testCases.length === 1}
              >
                Xóa
              </Button>
            </div>
            
            <Label>Input</Label>
            <Input
              type="text"
              value={testCase.input}
              onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
              placeholder="Input"
              required
            />
            
            <Label>Expected Output</Label>
            <Input
              type="text"
              value={testCase.expectedOutput}
              onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
              placeholder="Expected Output"
              required
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
              <div className="space-y-1">
                <Label htmlFor={`points-${index}`}>Điểm</Label>
                <Input
                  id={`points-${index}`}
                  type="number"
                  value={testCase.points}
                  onChange={(e) => handleTestCaseChange(index, 'points', Number(e.target.value) || 0)}
                  placeholder="Điểm"
                  className="w-24"
                  min={0}
                  max={100}
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Points and Limits */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="points">Tổng điểm</Label>
          <Input
            id="points"
            type="number"
            value={challenge.points}
            onChange={(e) => setChallenge({...challenge, points: Number(e.target.value) || 0})}
            min={1}
            max={1000}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeLimit">Giới hạn thời gian (giây)</Label>
          <Input
            id="timeLimit"
            type="number"
            value={challenge.timeLimit}
            onChange={(e) => setChallenge({...challenge, timeLimit: Number(e.target.value) || 1})}
            min={1}
            max={60}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="memoryLimit">Giới hạn bộ nhớ (MB)</Label>
          <Input
            id="memoryLimit"
            type="number"
            value={challenge.memoryLimit}
            onChange={(e) => setChallenge({...challenge, memoryLimit: Number(e.target.value) || 128})}
            min={1}
            max={512}
            required
          />
        </div>
      </div>

      {/* Token Reward */}
      <div className="space-y-2 p-4 border rounded bg-amber-50">
        <Label htmlFor="tokenReward" className="flex items-center gap-2">
          <span>🪙</span>
          Token thưởng khi hoàn thành
        </Label>
        <Input
          id="tokenReward"
          type="number"
          value={challenge.tokenReward}
          onChange={(e) => setChallenge({...challenge, tokenReward: Number(e.target.value) || 1})}
          min={1}
          max={10}
          required
        />
        <p className="text-sm text-muted-foreground">
          Số token học sinh nhận được khi hoàn thành bài lần đầu (Default: Easy=1, Medium=2, Hard=3)
        </p>
      </div>

      {/* Solutions Section */}
      <div className="space-y-4 p-4 border rounded bg-blue-50">
        <div className="flex justify-between items-center">
          <div>
            <Label className="text-lg">Lời giải mẫu</Label>
            <p className="text-sm text-muted-foreground">
              Thêm các lời giải để học sinh có thể mở khóa bằng token
            </p>
          </div>
          <Button
            type="button"
            onClick={handleAddSolution}
            variant="outline"
          >
            Thêm Lời Giải
          </Button>
        </div>

        {challenge.solutions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có lời giải. Nhấn "Thêm Lời Giải" để bắt đầu.
          </div>
        ) : (
          challenge.solutions.map((solution, index) => (
            <div key={index} className="space-y-3 p-4 border rounded bg-white">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Lời giải #{solution.order}</h4>
                <Button
                  type="button"
                  onClick={() => handleRemoveSolution(index)}
                  variant="outline"
                  size="sm"
                >
                  Xóa
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input
                  type="text"
                  value={solution.title}
                  onChange={(e) => handleSolutionChange(index, 'title', e.target.value)}
                  placeholder="VD: Solution sử dụng HashMap"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngôn ngữ</Label>
                  <Select.Root
                    value={solution.language}
                    onValueChange={(value) => handleSolutionChange(index, 'language', value)}
                  >
                    <Select.Trigger className="w-full flex items-center justify-between border rounded-md px-3 py-2 bg-white">
                      <Select.Value />
                      <Select.Icon>
                        <CaretSortIcon />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="bg-white border rounded-md shadow-lg z-50">
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
                </div>

                <div className="space-y-2">
                  <Label>Chi phí mở khóa (Token)</Label>
                  <Input
                    type="number"
                    value={solution.tokenCost}
                    onChange={(e) => handleSolutionChange(index, 'tokenCost', Number(e.target.value) || 1)}
                    min={1}
                    max={5}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Giải thích</Label>
                <Textarea
                  value={solution.explanation}
                  onChange={(e) => handleSolutionChange(index, 'explanation', e.target.value)}
                  placeholder="Giải thích cách tiếp cận, thuật toán, độ phức tạp..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Code mẫu</Label>
                <div className="border rounded-md overflow-hidden">
                  <CodePreview
                    code={solution.code}
                    language={solution.language.toLowerCase()}
                    height="200px"
                    readOnly={false}
                    onChange={(value) => handleSolutionChange(index, 'code', value || '')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nội dung bổ sung (Tùy chọn)</Label>
                <Textarea
                  value={solution.content}
                  onChange={(e) => handleSolutionChange(index, 'content', e.target.value)}
                  placeholder="Thêm thông tin chi tiết, ví dụ, lưu ý..."
                  rows={3}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Đang tạo...' : 'Tạo bài tập'}
        </Button>
      </div>
    </form>
  );
};