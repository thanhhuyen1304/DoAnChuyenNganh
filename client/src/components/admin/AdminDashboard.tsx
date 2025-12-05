import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BarChart2 as BarChart, 
  Code2,
  Loader2,
  ListTodo,
  PlusCircle,
  Search,
  Home
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { CreateChallenge } from './CreateChallenge';
import AdvancedScraper from './AdvancedScraper';
import TokenDebugger from './TokenDebugger';
import DatabaseDebugger from './DatabaseDebugger';
import APITester from './APITester';
import ScraperGuide from './ScraperGuide';
import ChallengeStats from './ChallengeStats';
import { EditChallengeModal } from './EditChallengeModal';
import UserManagement from './UserManagement';
import ReportManagement from './ReportManagement';
import FeedbackManagement from './FeedbackManagement';
import AchievementManagement from './AchievementManagement';
import SystemSettings from './SystemSettings';
import TrainingDataManagement from './TrainingDataManagement';
import KnowledgeGraphCanvas from './KnowledgeGraphCanvas';
import CommentReportManagement from './CommentReportManagement';
import AllCommentsManagement from './AllCommentsManagement';
import ChallengeManagement from './ChallengeManagement';
import Header from '../Header';
import ErrorBoundary from '../ui/ErrorBoundary';

// Constants
import { getApiBase } from '../../lib/apiBase'
const API_BASE_URL = getApiBase();

// Types
interface Challenge {
  _id: string;
  title: string;
  description: string;
  language: string;
  difficulty: string;
  category: string;
  points: number;
  isActive: boolean;
  createdAt: string;
}

// Navigation items
const CHALLENGE_TABS = [
  { 
    id: 'challenges', 
    icon: ListTodo, 
    label: { vi: 'Danh sách', en: 'List' }, 
    color: 'text-blue-500' 
  },
  { 
    id: 'create', 
    icon: PlusCircle, 
    label: { vi: 'Tạo mới', en: 'Create' }, 
    color: 'text-green-500' 
  },
  { 
    id: 'scraper', 
    icon: Search, 
    label: { vi: 'Scraper', en: 'Scraper' }, 
    color: 'text-purple-500' 
  }
];

// First, let's add the imports for our new icons
import { 
  Users, 
  Settings, 
  Flag, 
  MessageSquare, 
  Award,
  Shield,
  Brain,
  Network
} from 'lucide-react';

const OTHER_TABS = [
  // Admin Management Features
  { id: 'users', icon: Users, label: { vi: 'Quản lý người dùng', en: 'User Management' }, color: 'text-blue-500' },
  { id: 'comment-reports', icon: MessageSquare, label: { vi: 'Báo cáo vi phạm', en: 'Violation Reports' }, color: 'text-orange-500' },
  { id: 'all-comments', icon: MessageSquare, label: { vi: 'Tất cả bình luận', en: 'All Comments' }, color: 'text-cyan-500' },
  { id: 'feedback', icon: MessageSquare, label: { vi: 'Phản hồi', en: 'Feedback' }, color: 'text-emerald-500' },
  { id: 'achievements', icon: Award, label: { vi: 'Thành tích', en: 'Achievements' }, color: 'text-amber-500' },
  
  // Development Tools
  // { id: 'debug', icon: KeyRound, label: { vi: 'Debug Token', en: 'Debug' }, color: 'text-amber-500' },
  // { id: 'database', icon: Database, label: { vi: 'Database', en: 'Database' }, color: 'text-blue-500' },
  // { id: 'api', icon: Webhook, label: { vi: 'API Test', en: 'API Test' }, color: 'text-purple-500' },
  // { id: 'guide', icon: FileQuestion, label: { vi: 'Hướng dẫn', en: 'Guide' }, color: 'text-green-500' },
  // { id: 'reports', icon: Flag, label: { vi: 'Báo cáo vi phạm', en: 'Reports' }, color: 'text-red-500' },
  // { id: 'training-data', icon: Brain, label: { vi: 'Training Data AI', en: 'Training Data AI' }, color: 'text-purple-500' },
  // { id: 'knowledge-graph', icon: Network, label: { vi: 'Knowledge Graph', en: 'Knowledge Graph' }, color: 'text-indigo-500' },
  { id: 'stats', icon: BarChart, label: { vi: 'Thống kê', en: 'Stats' }, color: 'text-orange-500' }
];

// Sidebar toggle button component
const SidebarToggle: React.FC<{ isVisible: boolean; onClick: () => void }> = ({ isVisible, onClick }) => (
  <button
    aria-label="Toggle sidebar"
    onClick={onClick}
    className="w-full py-6 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-left gap-3"
  >
    <Code2 className="w-6 h-6 text-primary-500 flex-shrink-0" />
  </button>
);

// Main component
const AdminDashboard: React.FC = () => {
  // State management
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newChallengesCount, setNewChallengesCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isChallengeTabsVisible, setIsChallengeTabsVisible] = useState(false);
  const [activeGroup, setActiveGroup] = useState('challenges');
  const [activeChallengeTab, setActiveChallengeTab] = useState('challenges');
  const [activeOtherTab, setActiveOtherTab] = useState('users');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const { language } = useLanguage();

  // Effects
  useEffect(() => {
    fetchChallenges();
  }, []);

  // API calls
  const fetchChallenges = async (showSuccessMessage = false) => {
    try {
      setLoading(true);
      const previousCount = challenges.length;
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/challenges/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setChallenges(data.data.challenges);
        setError('');
        
        if (showSuccessMessage && data.data.challenges.length > previousCount) {
          const newCount = data.data.challenges.length - previousCount;
          setNewChallengesCount(newCount);
          setSuccess(language === 'vi' 
            ? `🎉 Đã thêm ${newCount} bài tập mới vào danh sách!`
            : `🎉 Added ${newCount} new challenges to the list!`);
          
          setTimeout(() => {
            setSuccess('');
            setNewChallengesCount(0);
          }, 5000);
        }
      } else {
        setError(language === 'vi'
          ? `Không thể tải danh sách bài tập: ${data.message}`
          : `Could not load challenges: ${data.message}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(language === 'vi' 
        ? `Lỗi kết nối server: ${errorMessage}`
        : `Server connection error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setSelectedChallengeId(challenge._id);
    setEditModalOpen(true);
  };

  const handleDelete = async (challengeId: string) => {
    if (!confirm(language === 'vi'
      ? 'Bạn có chắc chắn muốn xóa bài tập này?'
      : 'Are you sure you want to delete this challenge?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(language === 'vi' 
          ? 'Xóa bài tập thành công'
          : 'Challenge deleted successfully');
        fetchChallenges();
      } else {
        setError(data.message || (language === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'));
      }
    } catch (err) {
      setError(language === 'vi' ? 'Lỗi kết nối server' : 'Server connection error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-300 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800 overflow-visible">
      {/* Header */}
      <Header />
      {/* Background effects */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-40 dark:opacity-30 filter blur-sm"
        style={{ backgroundImage: `url('/logo.jpg')` }}
      />
      <div className="absolute inset-0 pointer-events-none bg-white/20 dark:bg-black/30 z-10" />
      <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/5 rounded-full blur-3xl"></div>
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen z-30 transition-all duration-300 ${
        isVisible ? 'w-60' : 'w-16'
      } bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-100/20 dark:border-gray-700/50 overflow-y-auto`}>
        
        <nav className="pt-16 p-4 space-y-6">
          <SidebarToggle isVisible={isVisible} onClick={() => setIsVisible(!isVisible)} />
          
          {/* Challenge Management */}
          <div>
            <button
              onClick={() => {
                if (activeGroup === 'challenges') {
                  setIsChallengeTabsVisible(!isChallengeTabsVisible);
                } else {
                  setActiveGroup('challenges');
                  setActiveChallengeTab('challenges');
                  setIsChallengeTabsVisible(true);
                }
              }}
              className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
                activeGroup === 'challenges' ? 'bg-primary-50 dark:bg-primary-900/30' : ''
              }`}
            >
              <LayoutDashboard 
                className={`w-5 h-5 transition-all duration-200 ${
                  activeGroup === 'challenges'
                    ? 'scale-110 text-indigo-500'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              />
              {isVisible && (
                <div className="flex items-center justify-between flex-1">
                  <span className={`transition-all duration-200 no-underline hover:no-underline ${
                    activeGroup === 'challenges'
                      ? 'text-indigo-500 font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }text-lg`} style={{ textDecoration: 'none' }}>
                    {language === 'vi' ? 'Quản lý bài tập' : 'Manage Challenges'}
                  </span>
                  <span className={`transform transition-transform duration-200 ${isChallengeTabsVisible ? 'rotate-90' : ''}`}>
                    ▸
                  </span>
                </div>
              )}
            </button>

            {activeGroup === 'challenges' && isChallengeTabsVisible && (
              <div className={`mt-2 space-y-1 ${isVisible ? 'pl-6' : 'pl-2'} transition-all duration-200`}>
                {CHALLENGE_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChallengeTab(tab.id)}
                    className={`w-full p-2 rounded-md transition-all duration-200 ${
                      activeChallengeTab === tab.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                    } flex items-center gap-3`}
                  >
                    <tab.icon 
                      className={`w-5 h-5 transition-all duration-200 ${
                        activeChallengeTab === tab.id
                          ? 'scale-110 ' + tab.color
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                      strokeWidth={2}
                    />
                    {isVisible && (
                      <span className={`transition-all duration-200 ${
                        activeChallengeTab === tab.id
                          ? tab.color + ' font-medium'
                          : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {tab.label[language === 'vi' ? 'vi' : 'en']}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Other Tools */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            {OTHER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveGroup('others');
                  setActiveOtherTab(tab.id);
                }}
                className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
                  activeGroup === 'others' && activeOtherTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/30'
                    : ''
                }`}
              >
                <tab.icon 
                  className={`w-5 h-5 transition-all duration-200 ${
                    activeGroup === 'others' && activeOtherTab === tab.id
                      ? 'scale-110 ' + tab.color
                      : 'text-gray-500 dark:text-gray-400'
                  }`} 
                />
                {isVisible && (
                  <span className={`transition-all duration-200 ${
                    activeGroup === 'others' && activeOtherTab === tab.id
                      ? tab.color + ' font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {tab.label[language === 'vi' ? 'vi' : 'en']}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className={`transition-all duration-300 ${isVisible ? 'ml-60' : 'ml-16'} p-6 relative z-20 pt-6`}>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-100/20 dark:border-gray-700/50">
            <AlertDescription>❌ {error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-100/20 dark:border-gray-700/50">
            <AlertDescription>
              <div className="flex items-center gap-2">
                ✨ {success}
                {newChallengesCount > 0 && (
                  <Badge variant="outline" className="bg-gradient-to-r from-green-500 to-emerald-500">
                    +{newChallengesCount} {language === 'vi' ? 'mới' : 'new'}
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Content */}
        {activeGroup === 'challenges' && (
          <div className="space-y-6">
            {/* Tab content */}
            {activeChallengeTab === 'challenges' && (
              <ChallengeManagement onRefresh={() => fetchChallenges(true)} />
            )}
            {activeChallengeTab === 'create' && <CreateChallenge />}
            {activeChallengeTab === 'scraper' && (
              <AdvancedScraper onScrapeSuccess={() => fetchChallenges(true)} />
            )}
          </div>
        )}

        {/* Other tools content */}
        {activeGroup === 'others' && (
          <>
            {/* Admin Management Features */}
            {activeOtherTab === 'users' && (
              <div className="space-y-6">
                <UserManagement />
              </div>
            )}
            {activeOtherTab === 'comment-reports' && (
              <div className="space-y-6">
                <CommentReportManagement />
              </div>
            )}
            {activeOtherTab === 'all-comments' && (
              <div className="space-y-6">
                <AllCommentsManagement />
              </div>
            )}
            {activeOtherTab === 'achievements' && (
              <div className="space-y-6">
                <AchievementManagement />
              </div>
            )}
            {/* {activeOtherTab === 'training-data' && (
              <div className="space-y-6">
                <ErrorBoundary fallback={
                  <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <CardContent className="p-4">
                      <h3 className="text-red-600 dark:text-red-400 font-semibold mb-2">
                        {language === 'vi' ? 'Lỗi khi tải Training Data AI' : 'Error loading Training Data AI'}
                      </h3>
                      <p className="text-red-600 dark:text-red-400 text-sm">
                        {language === 'vi' ? 'Vui lòng kiểm tra console để xem chi tiết lỗi và refresh trang.' : 'Please check console for error details and refresh the page.'}
                      </p>
                    </CardContent>
                  </Card>
                }>
                  <TrainingDataManagement />
                </ErrorBoundary>
              </div>
            )}
            {activeOtherTab === 'knowledge-graph' && (
              <div className="space-y-6">
                <ErrorBoundary fallback={
                  <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <CardContent className="p-4">
                      <h3 className="text-red-600 dark:text-red-400 font-semibold mb-2">
                        {language === 'vi' ? 'Lỗi khi tải Knowledge Graph' : 'Error loading Knowledge Graph'}
                      </h3>
                      <p className="text-red-600 dark:text-red-400 text-sm">
                        {language === 'vi' ? 'Vui lòng kiểm tra console để xem chi tiết lỗi và refresh trang.' : 'Please check console for error details and refresh the page.'}
                      </p>
                    </CardContent>
                  </Card>
                }>
                  <KnowledgeGraphCanvas />
                </ErrorBoundary>
              </div>
            )} */}

            {/* Development Tools */}
            {activeOtherTab === 'debug' && <TokenDebugger />}
            {activeOtherTab === 'database' && <DatabaseDebugger />}
            {activeOtherTab === 'api' && <APITester />}
            {activeOtherTab === 'guide' && <ScraperGuide />}
            {activeOtherTab === 'stats' && <ChallengeStats challenges={challenges} />}
          </>
        )}
      </main>

      {/* Edit modal */}
      <EditChallengeModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        challengeId={selectedChallengeId}
        onUpdate={() => {
          fetchChallenges();
          setEditModalOpen(false);
        }}
      />
    </div>
  );
};

export default AdminDashboard;