import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/components/contexts/LanguageContext';
import Header from '@/components/Header';
import ChallengeList from '@/components/challenges/ChallengeList';
import { ProblemsList } from '@/components/practice/ProblemsList';

const Challenges: React.FC = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedLanguage = searchParams.get('language') || searchParams.get('lang') || undefined;
  const challengeIdFromUrl = searchParams.get('challengeId');
  
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(challengeIdFromUrl);

  const handleSelectChallenge = (id: string) => {
    setSelectedChallengeId(id);
    // Navigate to practice page with selected challenge
    navigate(`/practice?challengeId=${id}`);
  };

  return (
    <>
      <Header />
      <section className="min-h-screen flex pt-20 md:pt-24 pb-8 md:pb-12 overflow-hidden relative">
        {/* Nền giống Hero: overlay + blobs */}
        <div className="absolute inset-0 pointer-events-none bg-white/30 dark:bg-black/30 z-10" />
        <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/5 rounded-full blur-3xl"></div>

        {/* Main content with sidebar */}
        <div className="container mx-auto px-4 relative z-20 flex gap-6">
          {/* Problems List Sidebar */}
          <div className="hidden lg:block flex-shrink-0">
            <div className="sticky top-24">
              <ProblemsList
                selectedId={selectedChallengeId}
                onSelect={handleSelectChallenge}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="mb-6 md:mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                {language === 'vi' ? 'Chế độ Practice' : 'Practice mode'}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
                {language === 'vi' ? 'Danh sách bài tập' : 'Challenges'}
                {selectedLanguage && (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] ml-2">
                    – {selectedLanguage}
                  </span>
                )}
              </h1>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
                {language === 'vi'
                  ? 'Tìm và sửa lỗi trong các bài tập lập trình được thiết kế thực tế. Lọc theo ngôn ngữ, độ khó và luyện tập như trong môi trường phỏng vấn.'
                  : 'Explore real-world debugging challenges. Filter by language and difficulty, and practice in an interview-like environment.'}
              </p>
            </div>

            <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-5 md:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.18)] border border-gray-100/40 dark:border-gray-800/70">
              <ChallengeList selectedLanguage={selectedLanguage} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Challenges;