import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/components/contexts/LanguageContext';
import Header from '@/components/Header';
import ChallengeList from '@/components/challenges/ChallengeList';

const Challenges: React.FC = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const selectedLanguage = searchParams.get('lang') || undefined;

  return (
    <>
      <Header />
      <section className="min-h-screen flex pt-20 md:pt-24 pb-8 md:pb-12 overflow-visible relative">
      {/* Additional overlay for Challenges specific styling */}
      <div className="absolute inset-0 pointer-events-none bg-white/30 dark:bg-black/30 z-10" />
      <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/5 rounded-full blur-3xl"></div>

      {/* Main content */}
      <div className="container mx-auto px-4 relative z-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {language === 'vi' ? 'Danh sách bài tập' : 'Challenges'}
            {selectedLanguage && (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] ml-2">- {selectedLanguage}</span>
            )}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {language === 'vi'
              ? 'Tìm và sửa lỗi trong các bài tập lập trình. Thử thách bản thân với các bài tập đa dạng.'
              : 'Find and fix bugs in programming challenges. Challenge yourself with diverse exercises.'}
          </p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 shadow-[0_0_25px_rgba(162,89,255,0.15)] border border-gray-100/20 dark:border-gray-700/50">
          <ChallengeList selectedLanguage={selectedLanguage} />
        </div>
      </div>
      </section>
    </>
  );
};

export default Challenges;