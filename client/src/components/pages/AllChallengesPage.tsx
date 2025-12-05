import React from 'react';
import Header from '../Header';
import Footer from '../Footer';
import AllChallengesList from '../challenges/AllChallengesList';
import { useLanguage } from '../contexts/LanguageContext';

const AllChallengesPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'vi' ? 'Tất Cả Thử Thách' : 'All Challenges'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {language === 'vi' 
              ? 'Khám phá và chinh phục tất cả các thử thách lập trình'
              : 'Explore and conquer all programming challenges'}
          </p>
        </div>

        {/* Challenges List */}
        <AllChallengesList />
      </main>

      <Footer />
    </div>
  );
};

export default AllChallengesPage;