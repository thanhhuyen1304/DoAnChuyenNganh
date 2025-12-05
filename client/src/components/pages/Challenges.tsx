import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/components/contexts/LanguageContext';
import Header from '@/components/Header';
import ChallengeList from '@/components/challenges/ChallengeList';

const Challenges: React.FC = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const selectedLanguage = searchParams.get('language') || searchParams.get('lang') || undefined;

  return (
    <>
      <Header />
      <section className="min-h-screen flex pt-20 md:pt-24 pb-8 md:pb-12 overflow-hidden relative">
        {/* Nền giống Hero: overlay + blobs */}
        <div className="absolute inset-0 pointer-events-none bg-white/30 dark:bg-black/30 z-10" />
        <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/5 rounded-full blur-3xl"></div>

        {/* Main content */}
        <div className="container mx-auto px-4 relative z-20">
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
              {language === 'vi' ? 'Danh sách bài tập' : 'Challenges'}
              {selectedLanguage && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] ml-2">
                  – {selectedLanguage}
                </span>
              )}
            </h1>
            <p className="text-base md:text-lg text-black dark:text-gray-300 max-w-3xl leading-relaxed">
              {language === 'vi'
                ? 'Tìm và sửa lỗi trong các bài tập lập trình được thiết kế thực tế. Lọc theo ngôn ngữ, độ khó và luyện tập như trong môi trường phỏng vấn.'
                : 'Explore real-world debugging challenges. Filter by language and difficulty, and practice in an interview-like environment.'}
            </p>
          </div>

          <div className="">
            <ChallengeList selectedLanguage={selectedLanguage} />
          </div>
        </div>
      </section>
    </>
  );
};

export default Challenges;