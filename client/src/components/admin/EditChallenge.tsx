import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { Label } from '../ui/label';
import { CodePreview } from './CodePreview';

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
  language: string;
  category: string;
  testCases: TestCase[];
  buggyCode: string;
  correctCode: string;
  points: number;
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

  // Lấy thông tin challenge
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/challenges/${challengeId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setChallenge(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching challenge:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch challenge details',
          variant: 'destructive',
        });
      }
    };
    fetchChallenge();
  }, [challengeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/challenges/${challengeId}`,
        challenge,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast({
        title: 'Success',
        description: 'Challenge updated successfully',
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to update challenge',
        variant: 'destructive',
      });
    }
  };

  const handleTestCaseChange = (index: number, field: keyof TestCase, value: any) => {
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

  if (loading || !challenge) {
    return <div>Loading...</div>;
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
        <Select
          value={challenge.difficulty}
          onValueChange={(value) => setChallenge({...challenge, difficulty: value as 'Easy' | 'Medium' | 'Hard'})}
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </Select>

        <Input
          type="text"
          value={challenge.language}
          onChange={(e) => setChallenge({...challenge, language: e.target.value})}
          placeholder="Language"
        />

        <Input
          type="text"
          value={challenge.category}
          onChange={(e) => setChallenge({...challenge, category: e.target.value})}
          placeholder="Category"
        />
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
                value={testCase.points}
                onChange={(e) => handleTestCaseChange(index, 'points', parseInt(e.target.value))}
                placeholder="Points"
                className="w-24"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Points and Status */}
      <div className="flex items-center gap-4">
        <Input
          type="number"
          value={challenge.points}
          onChange={(e) => setChallenge({...challenge, points: parseInt(e.target.value)})}
          placeholder="Total Points"
          className="w-32"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={challenge.isActive}
            onChange={(e) => setChallenge({...challenge, isActive: e.target.checked})}
          />
          Active
        </label>
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