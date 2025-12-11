import React, { useState, useEffect } from 'react';
import Header from '../Header';
import { ProblemsList } from '../practice/ProblemsList';
import { ProblemDetail } from '../practice/ProblemDetail';
import { CodeEditor } from '../practice/CodeEditor';
import KnowledgeGraphWidget from '../practice/KnowledgeGraphWidget';
import RelatedExercises from '../practice/RelatedExercises';
import { buildApi } from '@/lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { BookOpen, Loader2, ListChecks } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SmartResourcePanel from '../practice/SmartResourcePanel';

const Practice = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const challengeFromUrl = searchParams.get('challengeId');

  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(challengeFromUrl);
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const id = searchParams.get('challengeId');
    if (id) {
      setSelectedProblemId(id);
    } else {
      setSelectedProblemId(null);
    }
  }, [searchParams]);

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
        headers,
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

  const handleProblemSelect = (id: string) => {
    setSelectedProblemId(id);
    setSearchParams({ challengeId: id });
  };

  const clearSelection = () => {
    setSelectedProblemId(null);
    setChallenge(null);
    setSearchParams({});
  };

  const handleSubmissionSuccess = () => {
    // KHÔNG reload challenge để tránh mất state trong CodeEditor
    // Challenge data không thay đổi sau khi submit
    // if (selectedProblemId) {
    //   loadChallenge();
    // }
    
    // Trigger refresh của ProblemsList để cập nhật trạng thái solved
    setRefreshKey(prev => prev + 1);
    window.dispatchEvent(new Event('xpUpdated'));
    window.dispatchEvent(new Event('submissionCompleted'));
    const userData = localStorage.getItem('user');
    if (userData) {
      localStorage.setItem('user', userData);
    }
  };

  return (
    <>
      <Header />
      <section className="relative min-h-screen pt-24 pb-12 overflow-hidden">
        {/* Background overlays - giống Hero */}
        <div className="absolute inset-0 pointer-events-none bg-white/30 dark:bg-black/30 z-10" />
        <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-20 space-y-8 flex flex-col min-h-0">
          <div className="bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] rounded-3xl text-white p-6 md:p-8 shadow-[0_10px_40px_rgba(162,89,255,0.35)] flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-white/80 mb-2">
                  {language === 'vi' ? 'Practice Mode' : 'Practice Mode'}
                </p>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {language === 'vi'
                    ? 'Chọn bài tập và bắt đầu sửa lỗi'
                    : 'Pick a challenge and start debugging'}
                </h1>
                <p className="text-white/80 max-w-2xl">
                  {selectedProblemId
                    ? challenge?.title || (language === 'vi' ? 'Đang tải dữ liệu bài tập...' : 'Loading challenge...')
                    : language === 'vi'
                      ? 'Danh sách bài tập luôn sẵn sàng ở bên trái. Chọn một bài bất kỳ để xem mô tả chi tiết và mở IDE ngay lập tức.'
                      : 'Your challenge list is ready on the left. Select any item to see details and open the editor instantly.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {selectedProblemId && (
                  <Button
                    variant="outline"
                    onClick={clearSelection}
                    className="border-white/30 text-primary-600 hover:bg-white/10"
                  >
                    {language === 'vi' ? 'Chọn bài khác' : 'Pick another'}
                  </Button>
                )}
                <Button
                  onClick={() => navigate('/challenges')}
                  className="border-white/30 text-primary-600 hover:bg-white/10"
                >
                  {language === 'vi' ? 'Quay lại Challenges' : 'Back to Challenges'}
                </Button>
              </div>
            </div>

            {challenge && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/15 rounded-2xl p-4">
                  <p className="text-sm text-white/70">{language === 'vi' ? 'Độ khó' : 'Difficulty'}</p>
                  <p className="text-xl font-semibold mt-1">{challenge.difficulty}</p>
                </div>
                <div className="bg-white/15 rounded-2xl p-4">
                  <p className="text-sm text-white/70">{language === 'vi' ? 'Ngôn ngữ' : 'Language'}</p>
                  <p className="text-xl font-semibold mt-1">{challenge.language}</p>
                </div>
                <div className="bg-white/15 rounded-2xl p-4">
                  <p className="text-sm text-white/70">{language === 'vi' ? 'Điểm thưởng' : 'XP reward'}</p>
                  <p className="text-xl font-semibold mt-1">{challenge.points} XP</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 flex-1 min-h-0 items-start">
            <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-12rem)] flex flex-col">
              <ProblemsList
                selectedId={selectedProblemId}
                onSelect={handleProblemSelect}
                refreshKey={refreshKey}
              />
            </div>

            <div className="space-y-6 min-h-0">
              {selectedProblemId ? (
                <>
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/80 shadow-xl overflow-hidden">
                    <ProblemDetail problemId={selectedProblemId} onSubmissionSuccess={handleSubmissionSuccess} />
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/80 shadow-xl overflow-hidden">
                    {challenge && !loading ? (
                      <CodeEditor
                        problemId={selectedProblemId}
                        challenge={challenge}
                        onSubmissionSuccess={handleSubmissionSuccess}
                      />
                    ) : (
                      <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                      </div>
                    )}
                  </div>

                  <RelatedExercises
                    challengeId={selectedProblemId}
                    onNavigateChallenge={(id) => handleProblemSelect(id)}
                  />

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/80 shadow-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <ListChecks className="w-5 h-5 text-primary-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {language === 'vi' ? 'Liên kết kiến thức' : 'Knowledge graph'}
                      </h3>
                    </div>
                    <KnowledgeGraphWidget challengeId={selectedProblemId} compact={false} />
                  </div>

                  {challenge && (
                    <SmartResourcePanel
                      contextText={`${challenge.title || ''}. ${challenge.description || ''}`}
                      language={challenge.language}
                      difficulty={challenge.difficulty}
                    />
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-primary-300 dark:border-primary-800 bg-white/90 dark:bg-gray-900/60 shadow-lg text-center px-10 py-16">
                  <BookOpen className="w-16 h-16 mx-auto text-primary-500 mb-6" />
                  <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                    {language === 'vi' ? 'Bắt đầu bằng cách chọn một bài tập' : 'Start by choosing a challenge'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    {language === 'vi'
                      ? 'Danh sách các bài tập ở cột bên trái. Nhấp vào bất kỳ bài nào để xem mô tả chi tiết, test case và mở trình soạn thảo để sửa lỗi.'
                      : 'Browse the list on the left, click any challenge to see its description, test cases, and jump straight into the editor.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Practice;