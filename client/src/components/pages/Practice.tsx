import React, { useState, useEffect } from 'react';
import { CodeEditor } from '../practice/CodeEditor';
import { ProblemsList } from '../practice/ProblemsList';
import { ProblemDetail } from '../practice/ProblemDetail';
import { TopNavigation } from '../practice/TopNavigation';
import KnowledgeGraphWidget from '../practice/KnowledgeGraphWidget';
import { buildApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const Practice = () => {
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra authentication
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedProblemId) {
      loadChallenge();
    } else {
      setChallenge(null);
    }
  }, [selectedProblemId]);

  const loadChallenge = async () => {
    if (!selectedProblemId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(buildApi(`/challenges/${selectedProblemId}`), {
        headers
      });
      const result = await response.json();

      if (result.success) {
        setChallenge(result.data);
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionSuccess = () => {
    // Reload challenge để cập nhật thông tin
    if (selectedProblemId) {
      loadChallenge();
    }
    // Dispatch custom event để cập nhật XP ở TopNavigation
    window.dispatchEvent(new Event('xpUpdated'));
    // Dispatch event để cập nhật Knowledge Graph
    window.dispatchEvent(new Event('submissionCompleted'));
    // Force storage event để cập nhật localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      localStorage.setItem('user', userData);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <TopNavigation />

      <div className="flex flex-1 overflow-hidden">
        <ProblemsList 
          selectedId={selectedProblemId} 
          onSelect={(id) => setSelectedProblemId(id)} 
        />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <ProblemDetail 
            problemId={selectedProblemId}
            onSubmissionSuccess={handleSubmissionSuccess}
          />

          {selectedProblemId && challenge && (
            <CodeEditor
              problemId={selectedProblemId}
              challenge={challenge}
              onSubmissionSuccess={handleSubmissionSuccess}
            />
          )}

          {/* Knowledge Graph Widget - Hiển thị khi có challenge được chọn */}
          {selectedProblemId && (
            <KnowledgeGraphWidget 
              challengeId={selectedProblemId}
              compact={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Practice;

