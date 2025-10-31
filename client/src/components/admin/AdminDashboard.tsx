import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Webhook, 
  BarChart2 as BarChart, 
  Code2,
  Loader2,
  KeyRound,
  FileQuestion,
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

// Constants
const API_BASE_URL = 'http://localhost:5000/api' as const;

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
  Shield
} from 'lucide-react';

const OTHER_TABS = [
  // Admin Management Features
  { id: 'users', icon: Users, label: { vi: 'Quản lý người dùng', en: 'User Management' }, color: 'text-blue-500' },
  { id: 'roles', icon: Shield, label: { vi: 'Phân quyền', en: 'Role Management' }, color: 'text-indigo-500' },
  { id: 'reports', icon: Flag, label: { vi: 'Báo cáo vi phạm', en: 'Reports' }, color: 'text-red-500' },
  { id: 'feedback', icon: MessageSquare, label: { vi: 'Phản hồi', en: 'Feedback' }, color: 'text-emerald-500' },
  { id: 'achievements', icon: Award, label: { vi: 'Huy hiệu & thành tích', en: 'Achievements' }, color: 'text-amber-500' },
  { id: 'settings', icon: Settings, label: { vi: 'Cài đặt hệ thống', en: 'System Settings' }, color: 'text-gray-500' },
  
  // Development Tools
  // { id: 'debug', icon: KeyRound, label: { vi: 'Debug Token', en: 'Debug' }, color: 'text-amber-500' },
  // { id: 'database', icon: Database, label: { vi: 'Database', en: 'Database' }, color: 'text-blue-500' },
  // { id: 'api', icon: Webhook, label: { vi: 'API Test', en: 'API Test' }, color: 'text-purple-500' },
  // { id: 'guide', icon: FileQuestion, label: { vi: 'Hướng dẫn', en: 'Guide' }, color: 'text-green-500' },
  { id: 'stats', icon: BarChart, label: { vi: 'Thống kê', en: 'Stats' }, color: 'text-orange-500' }
];

// Sidebar toggle button component
const SidebarToggle: React.FC<{ isVisible: boolean; onClick: () => void }> = ({ isVisible, onClick }) => (
  <button
    aria-label="Toggle sidebar"
    onClick={onClick}
    className="w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center"
  >
    <Code2 className="w-6 h-6 text-primary-500" />
    {isVisible && (
      <span className="ml-3 font-semibold">
        Admin Dashboard
      </span>
    )}
  </button>
);

// Challenge list card component
const ChallengeList: React.FC<{
  challenges: Challenge[];
  onEdit: (challenge: Challenge) => void;
  onDelete: (id: string) => void;
  language: string;
}> = ({ challenges, onEdit, onDelete, language }) => {
  if (challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Code2 className="w-12 h-12 text-primary-400" />
          <p className="text-lg">
            {language === 'vi'
              ? 'Chưa có bài tập nào. Hãy tạo bài tập mới hoặc scrape từ các nguồn online!'
              : 'No challenges yet. Create new ones or scrape from online sources!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {challenges.map((challenge) => (
        <Card key={challenge._id} className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{challenge.title}</CardTitle>
                <CardDescription>{challenge.description}</CardDescription>
              </div>
              <Badge variant={challenge.isActive ? 'default' : 'secondary'}>
                {challenge.isActive 
                  ? (language === 'vi' ? 'Hoạt động' : 'Active')
                  : (language === 'vi' ? 'Tạm dừng' : 'Inactive')}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-50">{challenge.language}</Badge>
              <Badge variant="outline" className="bg-yellow-50">{challenge.difficulty}</Badge>
              <Badge variant="outline" className="bg-purple-50">{challenge.category}</Badge>
              <Badge variant="outline" className="bg-green-50">
                {challenge.points} {language === 'vi' ? 'điểm' : 'points'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onEdit(challenge)}>
                ✏️ {language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(challenge._id)}>
                🗑️ {language === 'vi' ? 'Xóa' : 'Delete'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

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
  const [activeOtherTab, setActiveOtherTab] = useState('debug');
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
    <div className="min-h-screen relative bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen z-30 transition-all duration-300 ${
        isVisible ? 'w-60' : 'w-16'
      } bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-100/20 dark:border-gray-700/50`}>
        <SidebarToggle isVisible={isVisible} onClick={() => setIsVisible(!isVisible)} />
        
        <nav className="p-4 space-y-6">
          {/* Home Button */}
          <div>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <Home 
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
              />
              {isVisible && (
                <span className="text-gray-600 dark:text-gray-300">
                  {language === 'vi' ? 'Trang chủ' : 'Home'}
                </span>
              )}
            </button>
          </div>

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
                  }`} style={{ textDecoration: 'none' }}>
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
      <main className={`transition-all duration-300 ${isVisible ? 'ml-60' : 'ml-16'} p-6`}>
        {/* Header */}
        {/* <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {language === 'vi' ? 'Quản lý' : 'Manage'}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
              {language === 'vi' ? 'Bài tập' : 'Challenges'}
            </span>
          </h1>
        </div> */}

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>❌ {error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
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
              <ChallengeList
                challenges={challenges}
                onEdit={handleEdit}
                onDelete={handleDelete}
                language={language}
              />
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
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'vi' ? 'Quản lý người dùng' : 'User Management'}
                </h2>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-500 dark:text-gray-400">
                      {language === 'vi' 
                        ? 'Chức năng quản lý người dùng đang được phát triển...'
                        : 'User management feature is under development...'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {activeOtherTab === 'roles' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'vi' ? 'Phân quyền' : 'Role Management'}
                </h2>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-500 dark:text-gray-400">
                      {language === 'vi'
                        ? 'Chức năng phân quyền đang được phát triển...'
                        : 'Role management feature is under development...'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {activeOtherTab === 'reports' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'vi' ? 'Báo cáo vi phạm' : 'Reports'}
                </h2>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-500 dark:text-gray-400">
                      {language === 'vi'
                        ? 'Chức năng báo cáo vi phạm đang được phát triển...'
                        : 'Reports feature is under development...'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {activeOtherTab === 'feedback' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'vi' ? 'Phản hồi' : 'Feedback'}
                </h2>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-500 dark:text-gray-400">
                      {language === 'vi'
                        ? 'Chức năng phản hồi đang được phát triển...'
                        : 'Feedback feature is under development...'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {activeOtherTab === 'achievements' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'vi' ? 'Huy hiệu & thành tích' : 'Achievements'}
                </h2>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-500 dark:text-gray-400">
                      {language === 'vi'
                        ? 'Chức năng quản lý huy hiệu và thành tích đang được phát triển...'
                        : 'Achievements management feature is under development...'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {activeOtherTab === 'settings' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'vi' ? 'Cài đặt hệ thống' : 'System Settings'}
                </h2>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-500 dark:text-gray-400">
                      {language === 'vi'
                        ? 'Chức năng cài đặt hệ thống đang được phát triển...'
                        : 'System settings feature is under development...'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

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