import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { useLanguage } from '../contexts/LanguageContext';
import { buildApi } from '../../lib/apiBase';
import {
  AlertCircle,
  Award,
  CalendarClock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  Loader2,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Target,
  Trash2,
  UserPlus,
  Users,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

 type TimelineView = 'month' | 'week';

 interface PlanConfig {
  startDate: Date;
  deadline: Date;
  targetHoursPerWeek: number;
 }

 interface Milestone {
  id: string;
  label: string;
  description: string;
  date: Date;
 }

 interface ScheduledBlock {
  id: string;
  title: string;
  topicKey: string;
  startDate: Date;
  endDate: Date;
  estimatedHours: number;
  status: 'queued' | 'doing' | 'done';
  progress: number;
  note?: string;
  color: string;
  isCheckpoint?: boolean;
  isOverdue?: boolean;
 }

 interface Achievement {
  _id: string;
  name: string;
  description: string;
  type: 'challenge' | 'streak' | 'points' | 'special';
  points: number;
  badge: string;
  icon: string;
  isActive: boolean;
  isDeleted?: boolean;
  usersEarnedCount?: number;
  condition: { type: string; value: number };
  createdAt: string;
  updatedAt: string;
  createdBy?: { username: string };
 }

 interface PaginationState {
  page: number;
  totalPages: number;
  total: number;
 }

interface ExerciseItem {
  id: string;
  title: string;
  topicKey: string;
  status: 'done' | 'doing' | 'pending';
  result?: 'correct' | 'wrong' | 'partial';
  score: number;
  maxScore: number;
  durationMinutes: number;
  attempts: number;
  completedAt?: Date;
}

type EnhancedBlock = ScheduledBlock & {
  totalExercises: number;
  doneCount: number;
  doingCount: number;
  pendingCount: number;
  computedProgress: number;
  computedStatus: 'done' | 'doing' | 'queued' | 'not_assigned';
};

 interface PersonalPageProps {
  user?: { username?: string; email?: string; _id?: string; role?: string };
 }

 const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

 const formatInputDate = (date: Date) => date.toISOString().split('T')[0];
 const formatDisplayDate = (date: Date) => date.toLocaleDateString('vi-VN');

const TOPIC_COLORS: Record<string, { main: string; soft: string; label: string; bg: string; border: string; text: string }> = {
  syntax: { 
    main: '#9333ea', // Purple
    soft: 'bg-purple-50 dark:bg-purple-950/20', 
    label: 'Syntax',
    bg: 'bg-purple-500',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-400',
  },
  logic: { 
    main: '#eab308', // Yellow
    soft: 'bg-yellow-50 dark:bg-yellow-950/20', 
    label: 'Logic',
    bg: 'bg-yellow-500',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  performance: { 
    main: '#22c55e', // Green
    soft: 'bg-emerald-50 dark:bg-emerald-950/20', 
    label: 'Performance',
    bg: 'bg-emerald-500',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
};

const STATUS_COLORS: Record<'done' | 'doing' | 'pending', string> = {
  done: '#10b981',
  doing: '#f59e0b',
  pending: '#94a3b8',
};

const mockMilestones: Milestone[] = [
  { id: 'ms1', label: 'Bắt đầu', description: 'Khởi động lộ trình', date: new Date() },
  { id: 'ms2', label: 'Tuần 2', description: 'Ôn lại lỗi phổ biến', date: new Date(Date.now() + WEEK_MS * 2) },
  { id: 'ms3', label: 'Tuần 4', description: 'Tăng độ khó', date: new Date(Date.now() + WEEK_MS * 4) },
];

 const mockBlocks: ScheduledBlock[] = [
  {
    id: 'b1',
    title: 'Ôn Syntax',
    topicKey: 'syntax',
    startDate: new Date(),
    endDate: new Date(Date.now() + WEEK_MS),
    estimatedHours: 6,
    status: 'doing',
    progress: 45,
    color: TOPIC_COLORS.syntax.bg,
    isCheckpoint: true,
  },
  {
    id: 'b2',
    title: 'Luyện Logic',
    topicKey: 'logic',
    startDate: new Date(Date.now() + WEEK_MS),
    endDate: new Date(Date.now() + WEEK_MS * 2),
    estimatedHours: 8,
    status: 'queued',
    progress: 0,
    color: TOPIC_COLORS.logic.bg,
  },
  {
    id: 'b3',
    title: 'Fix Performance',
    topicKey: 'performance',
    startDate: new Date(Date.now() + WEEK_MS * 2),
    endDate: new Date(Date.now() + WEEK_MS * 3),
    estimatedHours: 10,
    status: 'queued',
    progress: 0,
    color: TOPIC_COLORS.performance.bg,
  },
 ];

 const mockAchievements: Achievement[] = [
  {
    _id: 'a1',
    name: 'Beginner',
    description: 'Hoàn thành 3 thử thách',
    type: 'challenge',
    points: 50,
    badge: 'beginner_badge',
    icon: '🏆',
    isActive: true,
    usersEarnedCount: 12,
    condition: { type: 'complete_challenges', value: 3 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: { username: 'admin' },
  },
  {
    _id: 'a2',
    name: 'Streak 7 ngày',
    description: 'Đăng nhập 7 ngày liên tiếp',
    type: 'streak',
    points: 80,
    badge: 'streak_7',
    icon: '🔥',
    isActive: true,
    usersEarnedCount: 5,
    condition: { type: 'login_streak', value: 7 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: { username: 'admin' },
  },
 ];

 const PersonalPage: React.FC<PersonalPageProps> = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'achievements' | 'timeline'>('timeline');
  const [timelineView, setTimelineView] = useState<TimelineView>('month');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const [planConfig, setPlanConfig] = useState<PlanConfig>({
    startDate: new Date(),
    deadline: new Date(Date.now() + WEEK_MS * 6),
    targetHoursPerWeek: 6,
  });
  const [scheduledBlocks] = useState<ScheduledBlock[]>(mockBlocks);
  const [timelineMilestones] = useState<Milestone[]>(mockMilestones);

  const [achievements, setAchievements] = useState<Achievement[]>(mockAchievements);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, totalPages: 1, total: achievements.length });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    badge: '',
    description: '',
    icon: '🏆',
    type: 'challenge',
    image: '',
    points: 0,
    conditionType: 'complete_challenges',
    conditionValue: 1,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState<Array<{ _id: string; username: string; email: string; experience?: number }>>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const [exerciseItems, setExerciseItems] = useState<ExerciseItem[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [timelineUnlocked, setTimelineUnlocked] = useState(false);
  const [showBlockHistory, setShowBlockHistory] = useState(false);
  const [historyBlock, setHistoryBlock] = useState<{ block: EnhancedBlock; exercises: ExerciseItem[] } | null>(null);
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  // Map category/tags to topicKey
  const mapCategoryToTopicKey = (category?: string, tags?: string[]): string => {
    const cat = (category || '').toLowerCase();
    const tagStr = (tags || []).join(' ').toLowerCase();
    const combined = `${cat} ${tagStr}`.toLowerCase();
    
    if (combined.includes('syntax') || combined.includes('cú pháp') || combined.includes('syntax error')) {
      return 'syntax';
    }
    if (combined.includes('performance') || combined.includes('hiệu năng') || combined.includes('optimization') || combined.includes('tối ưu')) {
      return 'performance';
    }
    if (combined.includes('logic') || combined.includes('lôgic') || combined.includes('algorithm') || combined.includes('thuật toán')) {
      return 'logic';
    }
    // Default fallback
    return 'logic';
  };

  // Fetch challenges and submissions from API
  const fetchChallengesAndSubmissions = useCallback(async () => {
    try {
      setExercisesLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all challenges
      const challengesResponse = await fetch(buildApi('/challenges?limit=1000&isActive=true'));
      const challengesData = await challengesResponse.json();
      
      if (!challengesData.success) {
        console.error('Failed to fetch challenges:', challengesData.message);
        return;
      }
      
      const challenges = challengesData.data?.challenges || challengesData.data || [];
      
      // Fetch user submissions if logged in
      let submissionsMap = new Map<string, any>();
      if (token) {
        try {
          const submissionsResponse = await fetch(buildApi('/submissions/user/all?limit=1000'), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const submissionsData = await submissionsResponse.json();
          
          if (submissionsData.success) {
            const submissions = submissionsData.data?.submissions || [];
            // Group by challengeId, keep latest submission
            submissions.forEach((sub: any) => {
              const challengeId = sub.challenge?._id || sub.challenge;
              if (challengeId) {
                const existing = submissionsMap.get(challengeId);
                if (!existing || new Date(sub.submittedAt) > new Date(existing.submittedAt)) {
                  submissionsMap.set(challengeId, sub);
                }
              }
            });
          }
        } catch (err) {
          console.warn('Could not fetch submissions:', err);
        }
      }
      
      // Map challenges to exerciseItems
      const mappedExercises: ExerciseItem[] = challenges.map((challenge: any) => {
        const submission = submissionsMap.get(challenge._id);
        const topicKey = mapCategoryToTopicKey(challenge.category, challenge.tags);
        
        let status: 'done' | 'doing' | 'pending' = 'pending';
        let result: 'correct' | 'wrong' | 'partial' | undefined = undefined;
        let score = 0;
        let maxScore = 10;
        let attempts = 0;
        let durationMinutes = 0;
        let completedAt: Date | undefined = undefined;
        
        if (submission) {
          attempts = submission.attempts || 1;
          const isAccepted = submission.status === 'Accepted';
          const isRejected = submission.status === 'Rejected';
          
          if (isAccepted) {
            status = 'done';
            result = 'correct';
            score = maxScore;
          } else if (isRejected && attempts > 0) {
            status = 'doing';
            result = 'wrong';
            score = 0;
          } else if (submission.status === 'Partially Accepted') {
            status = 'doing';
            result = 'partial';
            score = Math.floor((submission.passedTests || 0) / (submission.totalTests || 1) * maxScore);
          }
          
          if (submission.submittedAt) {
            completedAt = new Date(submission.submittedAt);
            // Estimate duration (could be improved with actual time tracking)
            durationMinutes = Math.max(5, Math.min(120, attempts * 15));
          }
        }
        
        return {
          id: challenge._id,
          title: challenge.title || `Challenge ${challenge._id}`,
          topicKey,
          status,
          result,
          score,
          maxScore,
          durationMinutes,
          attempts,
          completedAt,
        };
      });
      
      setExerciseItems(mappedExercises);
    } catch (error) {
      console.error('Error fetching challenges and submissions:', error);
    } finally {
      setExercisesLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchChallengesAndSubmissions();
  }, [fetchChallengesAndSubmissions]);

  const enhancedBlocks: EnhancedBlock[] = useMemo(
    () =>
      scheduledBlocks.map((block) => {
        const relatedExercises = exerciseItems.filter((ex) => ex.topicKey === block.topicKey);
        const totalExercises = relatedExercises.length;
        const doneCount = relatedExercises.filter((ex) => ex.status === 'done').length;
        const doingCount = relatedExercises.filter((ex) => ex.status === 'doing').length;
        const pendingCount = relatedExercises.filter((ex) => ex.status === 'pending').length;
        const computedProgress =
          totalExercises === 0 ? 0 : Math.round(((doneCount + doingCount * 0.5) / totalExercises) * 100);
        let computedStatus: EnhancedBlock['computedStatus'] = 'queued';
        if (totalExercises === 0) {
          computedStatus = 'not_assigned';
        } else if (doneCount === totalExercises) {
          computedStatus = 'done';
        } else if (doingCount > 0) {
          computedStatus = 'doing';
        } else {
          computedStatus = 'queued';
        }
        return {
          ...block,
          totalExercises,
          doneCount,
          doingCount,
          pendingCount,
          computedProgress,
          computedStatus,
        };
      }),
    [scheduledBlocks, exerciseItems]
  );

  const progressPercent = useMemo(() => {
    if (exerciseItems.length === 0) return 0;
    const doneCount = exerciseItems.filter((ex) => ex.status === 'done').length;
    const doingCount = exerciseItems.filter((ex) => ex.status === 'doing').length;
    return Math.min(100, Math.round(((doneCount + doingCount * 0.5) / exerciseItems.length) * 100));
  }, [exerciseItems]);

  const etaDate = useMemo(() => planConfig.deadline, [planConfig]);
  const hasOverrun = useMemo(() => planConfig.deadline.getTime() < Date.now(), [planConfig]);
  
  // Deadline warnings and progress tracking
  const deadlineWarnings = useMemo(() => {
    const now = Date.now();
    const deadlineTime = planConfig.deadline.getTime();
    const daysUntilDeadline = Math.ceil((deadlineTime - now) / (24 * 60 * 60 * 1000));
    const isOverdue = deadlineTime < now;
    const isNearDeadline = daysUntilDeadline <= 7 && daysUntilDeadline > 0;
    const isCritical = daysUntilDeadline <= 3 && daysUntilDeadline > 0;
    
    return {
      isOverdue,
      isNearDeadline,
      isCritical,
      daysUntilDeadline: isOverdue ? -Math.abs(daysUntilDeadline) : daysUntilDeadline,
    };
  }, [planConfig.deadline]);
  
  // Progress tracking vs expected progress
  const progressWarnings = useMemo(() => {
    const now = Date.now();
    const startTime = planConfig.startDate.getTime();
    const deadlineTime = planConfig.deadline.getTime();
    const totalDuration = deadlineTime - startTime;
    const elapsed = now - startTime;
    const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const actualProgress = progressPercent;
    const progressGap = expectedProgress - actualProgress;
    const isBehind = progressGap > 10; // More than 10% behind
    const isCriticalBehind = progressGap > 25; // More than 25% behind
    
    // Calculate expected completion date based on current progress
    let expectedCompletionDate: Date | null = null;
    if (actualProgress > 0 && actualProgress < 100) {
      const remainingProgress = 100 - actualProgress;
      const avgProgressPerDay = actualProgress / Math.max(1, elapsed / (24 * 60 * 60 * 1000));
      if (avgProgressPerDay > 0) {
        const daysToComplete = remainingProgress / avgProgressPerDay;
        expectedCompletionDate = new Date(now + daysToComplete * 24 * 60 * 60 * 1000);
      }
    }
    
    return {
      expectedProgress: Math.round(expectedProgress),
      actualProgress,
      progressGap: Math.round(progressGap),
      isBehind,
      isCriticalBehind,
      expectedCompletionDate,
    };
  }, [planConfig.startDate, planConfig.deadline, progressPercent]);
  const timelineDurationWeeks = useMemo(
    () => Math.max(1, Math.round((planConfig.deadline.getTime() - planConfig.startDate.getTime()) / WEEK_MS)),
    [planConfig]
  );

  // Weekly checkpoints: chi tiết theo từng tuần với ngày cụ thể
  const weeklyCheckpoints = useMemo(() => {
    const checkpoints: Array<{ label: string; startDate: Date; days: string[] }> = [];
    for (let idx = 0; idx < timelineDurationWeeks; idx++) {
      const weekStart = new Date(planConfig.startDate.getTime() + WEEK_MS * idx);
      const days: string[] = [];
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekStart.getTime() + d * 24 * 60 * 60 * 1000);
        if (dayDate.getTime() <= planConfig.deadline.getTime()) {
          days.push(formatDisplayDate(dayDate));
        }
      }
      checkpoints.push({
        label: `${language === 'vi' ? 'Tuần' : 'Week'} ${idx + 1}`,
        startDate: weekStart,
        days,
      });
    }
    return checkpoints;
  }, [timelineDurationWeeks, language, planConfig.startDate, planConfig.deadline]);

  // Monthly checkpoints: tổng quan theo tháng với nhiều checkpoint hơn
  const monthlyCheckpoints = useMemo(() => {
    const checkpoints: Array<{ label: string; startDate: Date; milestones: string[] }> = [];
    const cursor = new Date(planConfig.startDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(planConfig.deadline);
    end.setHours(0, 0, 0, 0);

    while (cursor.getTime() <= end.getTime()) {
      const monthStart = new Date(cursor);
      const monthEnd = new Date(cursor);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Last day of month

      const label =
        language === 'vi'
          ? `Tháng ${cursor.getMonth() + 1}/${cursor.getFullYear()}`
          : `${cursor.toLocaleString('en-US', { month: 'short' })} ${cursor.getFullYear()}`;

      // Tạo nhiều checkpoint trong tháng: đầu tuần, giữa tuần, cuối tuần
      const milestones: string[] = [];
      const weekInMonth = Math.ceil((monthEnd.getDate() - monthStart.getDate() + 1) / 7);
      
      // Checkpoint đầu tháng
      milestones.push(formatDisplayDate(monthStart));
      
      // Checkpoint giữa tháng (nếu tháng dài hơn 2 tuần)
      if (weekInMonth > 2) {
        const midDate = new Date(monthStart);
        midDate.setDate(Math.floor(monthStart.getDate() + (monthEnd.getDate() - monthStart.getDate()) / 2));
        milestones.push(formatDisplayDate(midDate));
      }
      
      // Checkpoint cuối tháng
      milestones.push(formatDisplayDate(monthEnd));

      checkpoints.push({ label, startDate: new Date(cursor), milestones });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return checkpoints;
  }, [language, planConfig.startDate, planConfig.deadline]);

  const timelineTicks = useMemo(() => {
    return timelineView === 'week' ? weeklyCheckpoints : monthlyCheckpoints;
  }, [timelineView, weeklyCheckpoints, monthlyCheckpoints]);

  const weekDetails = useMemo(() => {
    const weeks = Array.from({ length: timelineDurationWeeks }, (_, idx) => ({
      weekLabel: `${language === 'vi' ? 'Tuần' : 'Week'} ${idx + 1}`,
      blocks: [] as Array<
        EnhancedBlock & {
          doneList: ExerciseItem[];
          doingList: ExerciseItem[];
          pendingList: ExerciseItem[];
        }
      >,
    }));
    enhancedBlocks.forEach((block) => {
      const weekIndex = Math.min(
        weeks.length - 1,
        Math.max(0, Math.floor((block.startDate.getTime() - planConfig.startDate.getTime()) / WEEK_MS))
      );
      const related = exerciseItems.filter((ex) => ex.topicKey === block.topicKey);
      const doneList = related.filter((ex) => ex.status === 'done');
      const doingList = related.filter((ex) => ex.status === 'doing');
      const pendingList = related.filter((ex) => ex.status === 'pending');
      weeks[weekIndex].blocks.push({
        ...block,
        doneList,
        doingList,
        pendingList,
      });
    });
    return weeks;
  }, [enhancedBlocks, exerciseItems, language, planConfig.startDate, timelineDurationWeeks]);

  const monthDetails = useMemo(() => {
    const months: Array<{
      monthLabel: string;
      blocks: Array<
        EnhancedBlock & {
          doneList: ExerciseItem[];
          doingList: ExerciseItem[];
          pendingList: ExerciseItem[];
        }
      >;
    }> = [];
    const cursor = new Date(planConfig.startDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(planConfig.deadline);
    end.setHours(0, 0, 0, 0);

    while (cursor.getTime() <= end.getTime()) {
      const monthStart = new Date(cursor);
      const monthEnd = new Date(cursor);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const monthLabel =
        language === 'vi'
          ? `Tháng ${cursor.getMonth() + 1}/${cursor.getFullYear()}`
          : `${cursor.toLocaleString('en-US', { month: 'short' })} ${cursor.getFullYear()}`;

      months.push({ monthLabel, blocks: [] });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    enhancedBlocks.forEach((block) => {
      const blockStart = block.startDate.getTime();
      const blockEnd = block.endDate.getTime();
      const monthIndex = months.findIndex((month, idx) => {
        const monthStart = new Date(planConfig.startDate);
        monthStart.setMonth(monthStart.getMonth() + idx);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        return blockStart < monthEnd.getTime() && blockEnd > monthStart.getTime();
      });

      if (monthIndex >= 0) {
        const related = exerciseItems.filter((ex) => ex.topicKey === block.topicKey);
        const doneList = related.filter((ex) => ex.status === 'done');
        const doingList = related.filter((ex) => ex.status === 'doing');
        const pendingList = related.filter((ex) => ex.status === 'pending');
        months[monthIndex].blocks.push({
          ...block,
          doneList,
          doingList,
          pendingList,
        });
      }
    });

    return months;
  }, [enhancedBlocks, exerciseItems, language, planConfig.startDate, planConfig.deadline]);

  const weeklyAvfProgress = useMemo(() => {
    return weekDetails.map((week) => {
      const total = week.blocks.reduce((sum, b) => sum + b.totalExercises, 0);
      const done = week.blocks.reduce((sum, b) => sum + b.doneCount, 0);
      const doing = week.blocks.reduce((sum, b) => sum + b.doingCount * 0.5, 0);
      const percent = total === 0 ? 0 : Math.round(((done + doing) / total) * 100);
      return { weekLabel: week.weekLabel, percent };
    });
  }, [weekDetails]);

  const hasAnyActivity = useMemo(
    () => exerciseItems.some((ex) => ex.status !== 'pending'),
    [exerciseItems]
  );

  useEffect(() => {
    if (hasAnyActivity) {
      setTimelineUnlocked(true);
    }
  }, [hasAnyActivity]);

  // Create deadline notifications
  useEffect(() => {
    const createDeadlineNotification = async (title: string, message: string, type: 'warning' | 'error' = 'warning') => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const API_BASE = buildApi('/notifications');
        const response = await fetch(API_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            message,
            type,
            link: '/personal?tab=timeline',
          }),
        });

        if (response.ok) {
          console.log('Deadline notification created');
        }
      } catch (error) {
        console.error('Error creating deadline notification:', error);
      }
    };

    // Check if we should create notifications (only once per day per warning type)
    const lastNotificationKey = `last_deadline_notif_${planConfig.deadline.getTime()}`;
    const lastNotificationDate = localStorage.getItem(lastNotificationKey);
    const today = new Date().toDateString();

    if (deadlineWarnings.isOverdue && lastNotificationDate !== today) {
      createDeadlineNotification(
        language === 'vi' 
          ? `⚠️ Deadline đã quá hạn ${Math.abs(deadlineWarnings.daysUntilDeadline)} ngày!`
          : `⚠️ Deadline overdue by ${Math.abs(deadlineWarnings.daysUntilDeadline)} days!`,
        language === 'vi'
          ? `Deadline của bạn đã quá hạn ${Math.abs(deadlineWarnings.daysUntilDeadline)} ngày. Hãy hoàn thành lộ trình ngay lập tức!`
          : `Your deadline is overdue by ${Math.abs(deadlineWarnings.daysUntilDeadline)} days. Complete your roadmap immediately!`,
        'error'
      );
      localStorage.setItem(lastNotificationKey, today);
    } else if (deadlineWarnings.isCritical && lastNotificationDate !== today) {
      createDeadlineNotification(
        language === 'vi'
          ? `🚨 Deadline còn ${deadlineWarnings.daysUntilDeadline} ngày!`
          : `🚨 Only ${deadlineWarnings.daysUntilDeadline} days until deadline!`,
        language === 'vi'
          ? `Deadline của bạn chỉ còn ${deadlineWarnings.daysUntilDeadline} ngày. Hãy tăng tốc độ học tập!`
          : `Your deadline is in ${deadlineWarnings.daysUntilDeadline} days. Accelerate your learning pace!`,
        'error'
      );
      localStorage.setItem(lastNotificationKey, today);
    } else if (deadlineWarnings.isNearDeadline && lastNotificationDate !== today) {
      createDeadlineNotification(
        language === 'vi'
          ? `⏰ Deadline còn ${deadlineWarnings.daysUntilDeadline} ngày`
          : `⏰ ${deadlineWarnings.daysUntilDeadline} days until deadline`,
        language === 'vi'
          ? `Deadline của bạn còn ${deadlineWarnings.daysUntilDeadline} ngày. Hãy kiểm tra tiến độ học tập.`
          : `Your deadline is in ${deadlineWarnings.daysUntilDeadline} days. Check your learning progress.`,
        'warning'
      );
      localStorage.setItem(lastNotificationKey, today);
    }

    // Progress warning notifications
    const lastProgressKey = `last_progress_notif_${planConfig.deadline.getTime()}`;
    const lastProgressDate = localStorage.getItem(lastProgressKey);

    if (progressWarnings.isCriticalBehind && lastProgressDate !== today) {
      createDeadlineNotification(
        language === 'vi'
          ? `📉 Tiến độ chậm ${progressWarnings.progressGap}% so với kế hoạch`
          : `📉 Progress is ${progressWarnings.progressGap}% behind schedule`,
        language === 'vi'
          ? `Tiến độ của bạn chậm ${progressWarnings.progressGap}% so với kế hoạch. Hãy tăng tốc độ học tập hoặc điều chỉnh deadline.`
          : `Your progress is ${progressWarnings.progressGap}% behind schedule. Increase your learning pace or adjust the deadline.`,
        'warning'
      );
      localStorage.setItem(lastProgressKey, today);
    }
  }, [deadlineWarnings, progressWarnings, planConfig.deadline, language]);

  // Pan handlers for timeline navigation
  const handlePanStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
    e.preventDefault();
  }, [panX, panY]);

  const handlePanMove = useCallback((e: MouseEvent) => {
    if (!isPanning) return;
    setPanX(e.clientX - panStartRef.current.x);
    setPanY(e.clientY - panStartRef.current.y);
    e.preventDefault();
  }, [isPanning]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Reset pan when view changes
  useEffect(() => {
    setPanX(0);
    setPanY(0);
  }, [timelineView]);

  // Global mouse event listeners for panning
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
      return () => {
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handlePanEnd);
      };
    }
  }, [isPanning, handlePanMove, handlePanEnd]);

  const filteredAchievements = useMemo(() => {
    let list = [...achievements];
    if (typeFilter !== 'all') list = list.filter((a) => a.type === typeFilter);
    if (statusFilter !== 'all') {
      const active = statusFilter === 'true';
      list = list.filter((a) => (active ? a.isActive : !a.isActive));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(term) || a.description.toLowerCase().includes(term));
    }
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'points') list.sort((a, b) => b.points - a.points);
    if (sortBy === 'createdAt') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [achievements, typeFilter, statusFilter, searchTerm, sortBy]);

  const pagedAchievements = useMemo(() => {
    const pageSize = 5;
    const totalPages = Math.max(1, Math.ceil(filteredAchievements.length / pageSize));
    const page = Math.min(pagination.page, totalPages);
    const start = (page - 1) * pageSize;
    setPagination((prev) => ({ ...prev, page, totalPages, total: filteredAchievements.length }));
    return filteredAchievements.slice(start, start + pageSize);
  }, [filteredAchievements, pagination.page]);

  const openDetailModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowDetailModal(true);
  };

  const openAwardModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowAwardModal(true);
  };

  const openEditModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setFormData({
      name: achievement.name,
      badge: achievement.badge,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type,
      image: '',
      points: achievement.points,
      conditionType: achievement.condition.type,
      conditionValue: achievement.condition.value,
      isActive: achievement.isActive,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowDeleteModal(true);
  };

  const restoreAchievement = (id: string) => {
    setAchievements((prev) => prev.map((a) => (a._id === id ? { ...a, isDeleted: false, isActive: true } : a)));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      badge: '',
      description: '',
      icon: '🏆',
      type: 'challenge',
      image: '',
      points: 0,
      conditionType: 'complete_challenges',
      conditionValue: 1,
      isActive: true,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = language === 'vi' ? 'Vui lòng nhập tên' : 'Name is required';
    if (!formData.badge) errors.badge = language === 'vi' ? 'Vui lòng nhập badge' : 'Badge is required';
    if (!formData.description) errors.description = language === 'vi' ? 'Vui lòng nhập mô tả' : 'Description is required';
    if (formData.points < 0) errors.points = language === 'vi' ? 'Điểm phải >= 0' : 'Points must be >= 0';
    if (formData.conditionValue < 1) errors.conditionValue = language === 'vi' ? 'Giá trị >= 1' : 'Value must be >=1';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createAchievement = () => {
    if (!validateForm()) return;
    const newItem: Achievement = {
      _id: `temp-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      type: formData.type as Achievement['type'],
      points: formData.points,
      badge: formData.badge,
      icon: formData.icon,
      isActive: formData.isActive,
      usersEarnedCount: 0,
      condition: { type: formData.conditionType, value: formData.conditionValue },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAchievements((prev) => [newItem, ...prev]);
    setShowCreateModal(false);
    resetForm();
  };

  const updateAchievement = () => {
    if (!selectedAchievement || !validateForm()) return;
    setAchievements((prev) =>
      prev.map((a) =>
        a._id === selectedAchievement._id
          ? {
              ...a,
              name: formData.name,
              description: formData.description,
              badge: formData.badge,
              icon: formData.icon,
              type: formData.type as Achievement['type'],
              points: formData.points,
              condition: { type: formData.conditionType, value: formData.conditionValue },
              isActive: formData.isActive,
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    );
    setShowEditModal(false);
    setSelectedAchievement(null);
  };

  const deleteAchievement = (soft = true) => {
    if (!selectedAchievement) return;
    if (soft) {
      setAchievements((prev) => prev.map((a) => (a._id === selectedAchievement._id ? { ...a, isDeleted: true, isActive: false } : a)));
    } else {
      setAchievements((prev) => prev.filter((a) => a._id !== selectedAchievement._id));
    }
    setShowDeleteModal(false);
    setSelectedAchievement(null);
  };

  const searchUsers = useCallback((term: string) => {
    setSearchingUsers(true);
    setTimeout(() => {
      if (!term.trim()) {
        setSearchedUsers([]);
        setSearchingUsers(false);
        return;
      }
      setSearchedUsers([
        { _id: 'u1', username: 'demoUser', email: 'demo@example.com', experience: 120 },
        { _id: 'u2', username: 'coder', email: 'coder@example.com', experience: 80 },
      ]);
      setSearchingUsers(false);
    }, 400);
  }, []);

  const awardAchievementToUser = () => {
    if (!selectedUserId) return;
    setShowAwardModal(false);
    setSelectedUserId('');
    setUserSearchTerm('');
    setSearchedUsers([]);
  };

  const handlePlanDateChange = (key: keyof PlanConfig, value: string) => {
    setPlanConfig((prev) => ({ ...prev, [key]: new Date(value) }));
  };

  const handleHoursChange = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    setPlanConfig((prev) => ({ ...prev, targetHoursPerWeek: Math.max(1, num) }));
  };

  const handleCheckpointToggle = (id: string) => {
    const target = enhancedBlocks.find((b) => b.id === id);
    if (!target || target.totalExercises === 0) return;
    const shouldMarkDone = target.doneCount + target.doingCount < target.totalExercises;

    setExerciseItems((prev) =>
      prev.map((ex) =>
        ex.topicKey === target.topicKey
          ? {
              ...ex,
              status: shouldMarkDone ? 'done' : 'pending',
            }
          : ex
      )
    );
  };

  const handleExportPlan = () => {
    window.print();
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'achievements' | 'timeline')} className="space-y-6">
      <TabsContent value="timeline" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">
                  {language === 'vi' ? 'Timeline lộ trình học tập cá nhân hóa' : 'Personalized learning timeline'}
                </CardTitle>
                <CardDescription>
                  {language === 'vi'
                    ? 'Phân bổ theo tuần/tháng, có checkpoint, milestone và điều chỉnh theo tốc độ thực tế'
                    : 'Weekly/monthly allocation with checkpoints, milestones, and auto-adjustment by actual pace'}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={timelineView === 'week' ? 'default' : 'outline'}
                  onClick={() => setTimelineView('week')}
                >
                  {language === 'vi' ? 'Xem tuần' : 'Week view'}
                </Button>
                <Button
                  size="sm"
                  variant={timelineView === 'month' ? 'default' : 'outline'}
                  onClick={() => setTimelineView('month')}
                >
                  {language === 'vi' ? 'Xem tháng' : 'Month view'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>{language === 'vi' ? 'Ngày bắt đầu' : 'Start date'}</Label>
                <Input
                  type="date"
                  value={formatInputDate(planConfig.startDate)}
                  onChange={(e) => handlePlanDateChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{language === 'vi' ? 'Deadline cố định' : 'Fixed deadline'}</Label>
                <Input
                  type="date"
                  value={formatInputDate(planConfig.deadline)}
                  onChange={(e) => handlePlanDateChange('deadline', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{language === 'vi' ? 'Sức chứa/tuần (giờ)' : 'Capacity per week (hrs)'}</Label>
                <Input
                  type="number"
                  min={1}
                  value={planConfig.targetHoursPerWeek}
                  onChange={(e) => handleHoursChange(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div
                className="flex items-center justify-between text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => setShowProgressDialog(true)}
                title={
                  language === 'vi'
                    ? 'Nhấp để xem chi tiết các bài đã hoàn thành, đang làm và chưa bắt đầu'
                    : 'Click to view detailed list of completed / in-progress / pending exercises'
                }
              >
                <span>
                  {language === 'vi' ? 'Tiến độ tổng' : 'Overall progress'}: {progressPercent}%{' '}
                  <span className="underline decoration-dotted">
                    {language === 'vi' ? '(xem chi tiết)' : '(view details)'}
                  </span>
                </span>
                <span>
                  {language === 'vi' ? 'ETA dự kiến' : 'Projected ETA'}: {formatDisplayDate(etaDate)}
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-3 bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi'
                    ? 'Tiến độ được tính trực tiếp từ trạng thái các bài tập liên quan.'
                    : 'Progress is calculated directly from linked exercise statuses.'}
                </p>
            </div>

            {/* Deadline and Progress Warnings */}
            {(deadlineWarnings.isOverdue || deadlineWarnings.isCritical || deadlineWarnings.isNearDeadline || progressWarnings.isBehind) && (
              <div className="space-y-2">
                {deadlineWarnings.isOverdue && (
                  <Alert variant="destructive" className="border-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-semibold">
                      {language === 'vi'
                        ? `⚠️ Deadline đã quá hạn ${Math.abs(deadlineWarnings.daysUntilDeadline)} ngày! Cần hoàn thành ngay lập tức.`
                        : `⚠️ Deadline overdue by ${Math.abs(deadlineWarnings.daysUntilDeadline)} days! Complete immediately.`}
                    </AlertDescription>
                  </Alert>
                )}
                {!deadlineWarnings.isOverdue && deadlineWarnings.isCritical && (
                  <Alert variant="destructive" className="border-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-semibold">
                      {language === 'vi'
                        ? `🚨 Deadline còn ${deadlineWarnings.daysUntilDeadline} ngày! Cần tăng tốc độ học tập.`
                        : `🚨 Only ${deadlineWarnings.daysUntilDeadline} days until deadline! Need to accelerate learning.`}
                    </AlertDescription>
                  </Alert>
                )}
                {!deadlineWarnings.isOverdue && !deadlineWarnings.isCritical && deadlineWarnings.isNearDeadline && (
                  <Alert className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="font-semibold text-yellow-800 dark:text-yellow-300">
                      {language === 'vi'
                        ? `⏰ Deadline còn ${deadlineWarnings.daysUntilDeadline} ngày. Hãy kiểm tra tiến độ.`
                        : `⏰ ${deadlineWarnings.daysUntilDeadline} days until deadline. Check your progress.`}
                    </AlertDescription>
                  </Alert>
                )}
                {progressWarnings.isCriticalBehind && (
                  <Alert variant="destructive" className="border-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {language === 'vi'
                            ? `📉 Tiến độ chậm ${progressWarnings.progressGap}% so với kế hoạch!`
                            : `📉 Progress is ${progressWarnings.progressGap}% behind schedule!`}
                        </p>
                        <p className="text-sm">
                          {language === 'vi'
                            ? `Tiến độ thực tế: ${progressWarnings.actualProgress}% | Tiến độ mong đợi: ${progressWarnings.expectedProgress}%`
                            : `Actual: ${progressWarnings.actualProgress}% | Expected: ${progressWarnings.expectedProgress}%`}
                        </p>
                        {progressWarnings.expectedCompletionDate && (
                          <p className="text-sm">
                            {language === 'vi'
                              ? `Dự kiến hoàn thành: ${formatDisplayDate(progressWarnings.expectedCompletionDate)}`
                              : `Expected completion: ${formatDisplayDate(progressWarnings.expectedCompletionDate)}`}
                          </p>
                        )}
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium">
                            {language === 'vi' ? '💡 Đề xuất:' : '💡 Suggestions:'}
                          </p>
                          <ul className="text-sm list-disc list-inside space-y-0.5 ml-2">
                            <li>
                              {language === 'vi'
                                ? 'Tăng thời gian học tập mỗi ngày'
                                : 'Increase daily study time'}
                            </li>
                            <li>
                              {language === 'vi'
                                ? 'Ưu tiên các bài tập quan trọng'
                                : 'Prioritize important exercises'}
                            </li>
                            <li>
                              {language === 'vi'
                                ? 'Điều chỉnh deadline nếu cần thiết'
                                : 'Adjust deadline if necessary'}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                {!progressWarnings.isCriticalBehind && progressWarnings.isBehind && (
                  <Alert className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                          {language === 'vi'
                            ? `⚠️ Tiến độ chậm ${progressWarnings.progressGap}% so với kế hoạch`
                            : `⚠️ Progress is ${progressWarnings.progressGap}% behind schedule`}
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          {language === 'vi'
                            ? `Tiến độ thực tế: ${progressWarnings.actualProgress}% | Tiến độ mong đợi: ${progressWarnings.expectedProgress}%`
                            : `Actual: ${progressWarnings.actualProgress}% | Expected: ${progressWarnings.expectedProgress}%`}
                        </p>
                        {progressWarnings.expectedCompletionDate && (
                          <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            {language === 'vi'
                              ? `Dự kiến hoàn thành: ${formatDisplayDate(progressWarnings.expectedCompletionDate)}`
                              : `Expected completion: ${formatDisplayDate(progressWarnings.expectedCompletionDate)}`}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            {hasOverrun && !deadlineWarnings.isOverdue && (
              <Alert variant="destructive">
                <AlertDescription>
                  {language === 'vi'
                    ? 'Lộ trình vượt quá deadline. Cần tăng tốc hoặc điều chỉnh ưu tiên.'
                    : 'Plan exceeds the fixed deadline. Increase pace or reprioritize topics.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    <span>{formatDisplayDate(planConfig.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>
                      {formatDisplayDate(planConfig.deadline)} · {timelineDurationWeeks}{' '}
                      {language === 'vi' ? 'tuần' : 'weeks'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg border bg-muted/30">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-foreground">
                      {language === 'vi' ? 'Chế độ xem:' : 'View mode:'} <span className="font-bold">{timelineView === 'week' ? (language === 'vi' ? 'Theo tuần' : 'Weekly') : (language === 'vi' ? 'Theo tháng' : 'Monthly')}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {language === 'vi' ? 'Chú thích màu sắc:' : 'Color legend:'}
                    </span>
                    {Object.entries(TOPIC_COLORS).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 px-3 py-1.5 rounded-md border-2 bg-background shadow-sm" style={{ borderColor: val.main + '40' }}>
                        <span className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: val.main, borderColor: val.main }} />
                        <span className="text-xs font-semibold" style={{ color: val.main }}>{val.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  {exercisesLoading && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-3 rounded-md border">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm font-semibold text-center">
                        {language === 'vi' ? 'Đang tải dữ liệu bài tập...' : 'Loading exercise data...'}
                      </p>
                    </div>
                  )}
                  
                  {!timelineUnlocked && !exercisesLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-3 rounded-md border">
                      <p className="text-sm font-semibold text-center">
                        {language === 'vi'
                          ? 'Lộ trình sẽ được mở khi bạn bắt đầu làm bài tập. Bạn vẫn có thể mở sơ đồ để xem trước.'
                          : 'The roadmap unlocks automatically once you start solving exercises. You can still preview it now.'}
                      </p>
                      <Button size="sm" onClick={() => setTimelineUnlocked(true)}>
                        {language === 'vi' ? 'Mở sơ đồ' : 'Unlock roadmap'}
                      </Button>
                    </div>
                  )}

                  <div className="relative w-full rounded-md border overflow-hidden">
                    <ScrollArea
                      className={`w-full ${!timelineUnlocked ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      <div className="p-4">
                        {/* Timeline Grid Table */}
                        <div className="rounded-lg border border-border bg-background overflow-hidden">
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full border-collapse bg-background">
                          <thead className="sticky top-0 z-20">
                            <tr className="bg-muted/80 backdrop-blur-sm border-b-2 border-border">
                              <th className="border-r border-border px-4 py-4 text-left font-bold text-sm text-foreground min-w-[220px] sticky left-0 z-30 bg-muted/80 backdrop-blur-sm shadow-sm">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary" />
                                    <span>{language === 'vi' ? 'Lộ trình học tập' : 'Learning Roadmap'}</span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-normal">
                                    {timelineView === 'week' 
                                      ? (language === 'vi' ? 'Dữ liệu tổng hợp theo tuần' : 'Data aggregated by week')
                                      : (language === 'vi' ? 'Dữ liệu tổng hợp theo tháng' : 'Data aggregated by month')}
                                  </div>
                                </div>
                              </th>
                              {timelineTicks.map((tick, idx) => (
                                <th
                                  key={`${tick.label}-${idx}`}
                                  className={`border-r border-border px-4 py-4 text-center font-bold text-xs text-foreground bg-muted/40 hover:bg-muted/60 transition-colors ${
                                    timelineView === 'week' ? 'min-w-[100px]' : 'min-w-[140px]'
                                  }`}
                                >
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {timelineView === 'week' ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <CalendarClock className="w-3.5 h-3.5 text-sky-600" />
                                      )}
                                      <span className="font-bold text-sm">{tick.label}</span>
                                    </div>
                                    {timelineView === 'week' && 'days' in tick && (
                                      <div className="text-[10px] text-muted-foreground font-normal space-y-0.5">
                                        <div>{tick.days[0]?.split('/')[0]}/{tick.days[0]?.split('/')[1]}</div>
                                        <div className="text-[9px]">→ {tick.days[tick.days.length - 1]?.split('/')[0]}/{tick.days[tick.days.length - 1]?.split('/')[1]}</div>
                                      </div>
                                    )}
                                    {timelineView === 'month' && 'milestones' in tick && (
                                      <div className="text-[10px] text-muted-foreground font-normal">
                                        <div className="flex items-center justify-center gap-1">
                                          <Flag className="w-3 h-3" />
                                          <span>{tick.milestones.length} {language === 'vi' ? 'mốc' : 'milestones'}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {enhancedBlocks.map((block) => {
                              const topicColor = TOPIC_COLORS[block.topicKey] || TOPIC_COLORS.logic;
                              const badgeBg =
                                block.computedStatus === 'done'
                                  ? `${topicColor.soft} border-2 ${topicColor.border} ${topicColor.text}`
                                  : block.computedStatus === 'doing'
                                  ? `${topicColor.soft} border-2 ${topicColor.border} ${topicColor.text}`
                                  : 'bg-slate-500/20 border-slate-500/50 text-slate-700 dark:text-slate-400';
                              
                              return (
                                <tr key={block.id} className="hover:bg-muted/20 transition-colors border-b border-border/50">
                                  <td className="border-r-2 border-border px-4 py-5 sticky left-0 z-10 bg-background min-w-[220px] shadow-sm">
                                    <div className="space-y-3">
                                      <div className="flex items-start gap-2">
                                        {block.isCheckpoint && <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />}
                                        <div className="flex-1">
                                          <p className="font-bold text-sm leading-tight">{block.title}</p>
                                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              <CalendarClock className="w-3 h-3" />
                                              {formatDisplayDate(block.startDate)}
                                            </span>
                                            <span>→</span>
                                            <span>{formatDisplayDate(block.endDate)}</span>
                                            <span>·</span>
                                            <span className="font-medium">{block.estimatedHours}h</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className={`text-xs font-semibold border-2 ${badgeBg}`}>
                                          {block.computedStatus === 'done'
                                            ? language === 'vi'
                                              ? '✓ Hoàn thành'
                                              : '✓ Done'
                                            : block.computedStatus === 'doing'
                                            ? language === 'vi'
                                              ? '⟳ Đang học'
                                              : '⟳ In progress'
                                            : block.computedStatus === 'queued'
                                            ? language === 'vi'
                                              ? '○ Chờ'
                                              : '○ Queued'
                                            : language === 'vi'
                                            ? '○ Chưa gán bài'
                                            : '○ No tasks'}
                                        </Badge>
                                        <span className="text-xs font-medium text-muted-foreground">
                                          {block.doneCount}/{block.totalExercises} {language === 'vi' ? 'bài' : 'tasks'}
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-muted-foreground">{language === 'vi' ? 'Tiến độ' : 'Progress'}</span>
                                          <span className="font-bold">{block.computedProgress}%</span>
                                        </div>
                                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                          <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                              width: `${Math.min(100, block.computedProgress)}%`,
                                              backgroundColor: topicColor.main,
                                              opacity: block.computedStatus === 'done' ? 1 : block.computedStatus === 'doing' ? 0.8 : 0.5,
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full text-xs font-medium"
                                        onClick={() => {
                                          const related = exerciseItems.filter((ex) => ex.topicKey === block.topicKey);
                                          setHistoryBlock({ block, exercises: related });
                                          setShowBlockHistory(true);
                                        }}
                                      >
                                        <Eye className="w-3 h-3 mr-1.5" />
                                        {language === 'vi' ? 'Xem chi tiết' : 'View details'}
                                      </Button>
                                    </div>
                                  </td>
                                  {timelineTicks.map((tick, idx) => {
                                    const tickStart = tick.startDate.getTime();
                                    const tickEnd =
                                      timelineView === 'week'
                                        ? tickStart + WEEK_MS
                                        : new Date(tick.startDate.getFullYear(), tick.startDate.getMonth() + 1, 0).getTime();
                                    const blockStart = block.startDate.getTime();
                                    const blockEnd = block.endDate.getTime();
                                    
                                    // Kiểm tra xem block có overlap với tick không
                                    const isInPeriod = blockStart < tickEnd && blockEnd > tickStart;
                                    const isActive = blockStart >= tickStart && blockStart < tickEnd;
                                    
                                    const topicColor = TOPIC_COLORS[block.topicKey] || TOPIC_COLORS.logic;
                                    return (
                                      <td
                                        key={`${tick.label}-${idx}`}
                                        className={`border-r border-border px-4 py-5 text-center align-top transition-colors bg-background hover:bg-muted/10 ${
                                          timelineView === 'week' ? 'min-w-[100px]' : 'min-w-[140px]'
                                        } ${
                                          isInPeriod
                                            ? topicColor.border
                                            : ''
                                        }`}
                                        style={isInPeriod ? {
                                          borderRightColor: topicColor.main + '40',
                                          backgroundColor: topicColor.main + '08',
                                        } : {}}
                                      >
                                        {isInPeriod && (
                                          <div className="space-y-2.5">
                                            {isActive && (
                                              <div className="flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm animate-pulse" title={language === 'vi' ? 'Bắt đầu' : 'Start'} />
                                              </div>
                                            )}
                                            <div className="flex flex-col items-center gap-1">
                                              <div className="text-sm font-bold" style={{
                                                color: topicColor.main,
                                              }}>
                                                {block.computedProgress}%
                                              </div>
                                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                  className="h-full rounded-full transition-all"
                                                  style={{
                                                    width: `${Math.min(100, block.computedProgress)}%`,
                                                    backgroundColor: topicColor.main,
                                                    opacity: block.computedStatus === 'done' ? 1 : block.computedStatus === 'doing' ? 0.8 : 0.5,
                                                  }}
                                                />
                                              </div>
                                            </div>
                                            <div className="text-xs font-medium text-muted-foreground">
                                              {block.doneCount}/{block.totalExercises} {language === 'vi' ? 'bài' : 'tasks'}
                                            </div>
                                            {block.isOverdue && (
                                              <div className="flex items-center justify-center gap-1 text-xs text-destructive font-semibold bg-destructive/10 rounded px-2 py-1">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>{language === 'vi' ? 'Trễ' : 'Late'}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {timelineTicks.map((tick) => (
                    <div key={tick.label} className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4" />
                      <span>{tick.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold">{language === 'vi' ? 'Checkpoint & trạng thái' : 'Checkpoints & status'}</p>
                <div className="space-y-2">
                  {enhancedBlocks.map((block) => {
                    const related = exerciseItems.filter((ex) => ex.topicKey === block.topicKey);
                    const doneList = related.filter((ex) => ex.status === 'done');
                    return (
                      <div key={block.id} className="flex flex-col gap-2 rounded-md border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">{block.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDisplayDate(block.startDate)} → {formatDisplayDate(block.endDate)} · {block.estimatedHours}h
                              {block.totalExercises > 0 && (
                                <>
                                  {' '}
                                  · {block.doneCount}/{block.totalExercises}{' '}
                                  {language === 'vi' ? 'bài đã xong' : 'done'}
                                </>
                              )}
                              {block.totalExercises === 0 && ` · ${language === 'vi' ? 'Chưa gán bài' : 'No tasks'}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                block.computedStatus === 'done'
                                  ? 'default'
                                  : block.computedStatus === 'doing'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {block.computedStatus === 'done'
                                ? language === 'vi'
                                  ? 'Hoàn thành'
                                  : 'Done'
                                : block.computedStatus === 'doing'
                                ? language === 'vi'
                                  ? 'Đang học'
                                  : 'In progress'
                                : block.computedStatus === 'queued'
                                ? language === 'vi'
                                  ? 'Chờ'
                                  : 'Queued'
                                : language === 'vi'
                                ? 'Chưa gán bài'
                                : 'No tasks'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckpointToggle(block.id)}
                              disabled={block.totalExercises === 0}
                            >
                              {block.doneCount === block.totalExercises && block.totalExercises > 0
                                ? language === 'vi'
                                  ? 'Mở lại'
                                  : 'Reopen'
                                : language === 'vi'
                                ? 'Đánh dấu xong'
                                : 'Mark done'}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold">{language === 'vi' ? 'Bài đã hoàn thành' : 'Completed lessons'}</p>
                          {doneList.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {language === 'vi' ? 'Chưa có bài hoàn thành.' : 'No completed items yet.'}
                            </p>
                          ) : (
                            <ul className="text-xs list-disc list-inside space-y-1">
                              {doneList.map((ex) => (
                                <li key={ex.id}>
                                  {ex.title} ({language === 'vi' ? 'Điểm' : 'Score'}: {ex.score}/{ex.maxScore})
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">{language === 'vi' ? 'Milestone quan trọng' : 'Key milestones'}</p>
                <div className="space-y-2">
                  {timelineMilestones.map((ms) => (
                    <div key={ms.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium">{ms.label}</p>
                        <p className="text-xs text-muted-foreground">{ms.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarClock className="w-4 h-4" />
                        <span>{formatDisplayDate(ms.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">
                {timelineView === 'week' 
                  ? (language === 'vi' ? 'Chi tiết theo tuần' : 'Weekly breakdown')
                  : (language === 'vi' ? 'Chi tiết theo tháng' : 'Monthly breakdown')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(timelineView === 'week' ? weekDetails : monthDetails).map((period) => {
                  const periodLabel = timelineView === 'week' ? (period as typeof weekDetails[0]).weekLabel : (period as typeof monthDetails[0]).monthLabel;
                  const periodBlocks = period.blocks;
                  
                  return (
                    <div key={periodLabel} className="rounded-md border p-3 space-y-2 bg-muted/40">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CalendarClock className="w-4 h-4" />
                        <span>{periodLabel}</span>
                      </div>
                      {periodBlocks.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {language === 'vi' ? 'Chưa có hoạt động' : 'No activities'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {periodBlocks.map((block) => {
                            const topicColor = TOPIC_COLORS[block.topicKey] || TOPIC_COLORS.logic;
                            return (
                              <div key={block.id} className={`rounded-md border-2 p-2 bg-background space-y-1 ${topicColor.border}`} style={{ borderColor: topicColor.main + '40' }}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: topicColor.main }} />
                                    <span className="text-sm font-medium">{block.title}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {block.doneCount}/{block.totalExercises} {language === 'vi' ? 'bài' : 'items'}
                                  </Badge>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(100, block.computedProgress)}%`,
                                      backgroundColor: topicColor.main,
                                    }}
                                  />
                                </div>
                                {block.doneList.length > 0 && (
                                  <div className="text-xs">
                                    <p className="font-semibold" style={{ color: topicColor.main }}>
                                      {language === 'vi' ? 'Đã xong:' : 'Done:'}
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {block.doneList.map((ex) => (
                                        <li key={ex.id}>{ex.title}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {block.doingList.length > 0 && (
                                  <div className="text-xs" style={{ color: topicColor.main }}>
                                    <p className="font-semibold">{language === 'vi' ? 'Đang làm:' : 'Doing:'}</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {block.doingList.map((ex) => (
                                    <li key={ex.id}>{ex.title}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                                {block.pendingList.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    <p className="font-semibold">{language === 'vi' ? 'Chưa làm:' : 'Pending:'}</p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {block.pendingList.map((ex) => (
                                        <li key={ex.id}>{ex.title}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="achievements" className="space-y-6">
        {achievements.length === 0 ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Tá»•ng sá»‘' : 'Total'}</p>
                      <p className="text-2xl font-bold">{achievements.length}</p>
                    </div>
                    <Award className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Äang hoáº¡t Ä‘á»™ng' : 'Active'}</p>
                      <p className="text-2xl font-bold text-green-600">{achievements.filter((a) => a.isActive && !a.isDeleted).length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Không hoạt động' : 'Inactive'}</p>
                      <p className="text-2xl font-bold text-orange-600">{achievements.filter((a) => !a.isActive && !a.isDeleted).length}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Đã xóa' : 'Deleted'}</p>
                      <p className="text-2xl font-bold text-red-600">{achievements.filter((a) => a.isDeleted).length}</p>
                    </div>
                    <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedAchievement(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {showEditModal
                  ? (language === 'vi' ? 'Chỉnh sửa thành tích' : 'Edit Achievement')
                  : (language === 'vi' ? 'Tạo thành tích mới' : 'Create New Achievement')}
              </DialogTitle>
              <DialogDescription>
                {language === 'vi'
                  ? 'Điền đầy đủ thông tin để tạo hoặc cập nhật thành tích'
                  : 'Fill in the details to create or update an achievement'}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{language === 'vi' ? 'Tên thành tích' : 'Achievement Name'} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={language === 'vi' ? 'VD: NgÆ°á»i má»›i báº¯t Ä‘áº§u' : 'e.g., Beginner'}
                    />
                    {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="badge">{language === 'vi' ? 'Tên Badge' : 'Badge Name'} *</Label>
                    <Input
                      id="badge"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder={language === 'vi' ? 'VD: beginner_badge' : 'e.g., beginner_badge'}
                    />
                    {formErrors.badge && <p className="text-sm text-destructive">{formErrors.badge}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{language === 'vi' ? 'Mô tả' : 'Description'} *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={language === 'vi' ? 'Mô tả chi tiết về thành tích' : 'Detailed description of the achievement'}
                    rows={3}
                  />
                  {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">{language === 'vi' ? 'Icon (Emoji)' : 'Icon (Emoji)'}</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="🏆"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">{language === 'vi' ? 'Loáº¡i' : 'Type'} *</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="challenge">{language === 'vi' ? 'Thử thách' : 'Challenge'}</SelectItem>
                        <SelectItem value="streak">{language === 'vi' ? 'Chuá»—i' : 'Streak'}</SelectItem>
                        <SelectItem value="points">{language === 'vi' ? 'Äiá»ƒm' : 'Points'}</SelectItem>
                        <SelectItem value="special">{language === 'vi' ? 'Äáº·c biá»‡t' : 'Special'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">{language === 'vi' ? 'URL Hình ảnh (tuỳ chọn)' : 'Image URL (optional)'}</Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="points">{language === 'vi' ? 'Äiá»ƒm thÆ°á»Ÿng' : 'Points'} *</Label>
                    <Input
                      id="points"
                      type="number"
                      min="0"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    />
                    {formErrors.points && <p className="text-sm text-destructive">{formErrors.points}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conditionType">{language === 'vi' ? 'Loáº¡i Ä‘iá»u kiá»‡n' : 'Condition Type'} *</Label>
                    <Input
                      id="conditionType"
                      value={formData.conditionType}
                      onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
                      placeholder="complete_challenges"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conditionValue">{language === 'vi' ? 'Giá trị điều kiện' : 'Condition Value'} *</Label>
                    <Input
                      id="conditionValue"
                      type="number"
                      min="1"
                      value={formData.conditionValue}
                      onChange={(e) => setFormData({ ...formData, conditionValue: parseInt(e.target.value) || 1 })}
                    />
                    {formErrors.conditionValue && <p className="text-sm text-destructive">{formErrors.conditionValue}</p>}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">{language === 'vi' ? 'Kích hoạt ngay' : 'Activate immediately'}</Label>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedAchievement(null);
                resetForm();
              }}>
                {language === 'vi' ? 'Há»§y' : 'Cancel'}
              </Button>
              <Button onClick={showEditModal ? updateAchievement : createAchievement}>
                {showEditModal
                  ? (language === 'vi' ? 'Cáº­p nháº­t' : 'Update')
                  : (language === 'vi' ? 'Táº¡o má»›i' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{language === 'vi' ? 'Chi tiết thành tích' : 'Achievement Details'}</DialogTitle>
            </DialogHeader>

            {selectedAchievement && (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="text-6xl">{selectedAchievement.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{selectedAchievement.name}</h3>
                    <p className="text-muted-foreground mt-2">{selectedAchievement.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
      <div>
                    <Label className="text-muted-foreground">{language === 'vi' ? 'Loáº¡i' : 'Type'}</Label>
                    <p className="font-medium">{selectedAchievement.type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{language === 'vi' ? 'Badge' : 'Badge'}</Label>
                    <p className="font-medium">{selectedAchievement.badge}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{language === 'vi' ? 'Äiá»ƒm' : 'Points'}</Label>
                    <p className="font-medium">{selectedAchievement.points}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{language === 'vi' ? 'Trạng thái' : 'Status'}</Label>
                    <p className="font-medium">
                      {selectedAchievement.isActive
                        ? (language === 'vi' ? 'Hoáº¡t Ä‘á»™ng' : 'Active')
                        : (language === 'vi' ? 'Không hoạt động' : 'Inactive')}
                    </p>
                  </div>
      </div>

                <div>
                  <Label className="text-muted-foreground">{language === 'vi' ? 'Äiá»u kiá»‡n' : 'Condition'}</Label>
                  <p className="font-medium">
                    {selectedAchievement.condition.type}: {selectedAchievement.condition.value}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">{language === 'vi' ? 'Sá»‘ ngÆ°á»i Ä‘áº¡t Ä‘Æ°á»£c' : 'Users Earned'}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-5 h-5" />
                    <span className="text-2xl font-bold">{selectedAchievement.usersEarnedCount || 0}</span>
                  </div>
                </div>

                {selectedAchievement.createdBy && (
                  <div>
                    <Label className="text-muted-foreground">{language === 'vi' ? 'NgÆ°á»i táº¡o' : 'Created By'}</Label>
                    <p className="font-medium">{selectedAchievement.createdBy.username}</p>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>{language === 'vi' ? 'Ngày tạo' : 'Created'}: {new Date(selectedAchievement.createdAt).toLocaleString()}</p>
                  <p>{language === 'vi' ? 'Cập nhật' : 'Updated'}: {new Date(selectedAchievement.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'vi' ? 'Xác nhận xóa' : 'Confirm Deletion'}</DialogTitle>
              <DialogDescription>
                {language === 'vi'
                  ? 'Bạn có chắc chắn muốn xóa thành tích này? Thành tích sẽ bị ẩn nhưng dữ liệu vẫn được giữ lại.'
                  : 'Are you sure you want to delete this achievement? It will be hidden but data will be preserved.'}
              </DialogDescription>
            </DialogHeader>

            {selectedAchievement && (
              <div className="py-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <span className="text-3xl">{selectedAchievement.icon}</span>
                  <div>
                    <p className="font-semibold">{selectedAchievement.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedAchievement.badge}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                {language === 'vi' ? 'Há»§y' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={() => deleteAchievement(false)}>
                {language === 'vi' ? 'Xóa (Soft Delete)' : 'Delete (Soft)'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAwardModal} onOpenChange={setShowAwardModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {language === 'vi' ? 'Trao thành tích cho người dùng' : 'Award Achievement to User'}
              </DialogTitle>
              <DialogDescription>
                {language === 'vi'
                  ? 'Tìm kiếm và chọn người dùng để trao thành tích này'
                  : 'Search and select a user to award this achievement'}
              </DialogDescription>
            </DialogHeader>

            {selectedAchievement && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <span className="text-3xl">{selectedAchievement.icon}</span>
                  <div>
                    <p className="font-semibold">{selectedAchievement.name}</p>
        <p className="text-sm text-muted-foreground">
                      {selectedAchievement.points} {language === 'vi' ? 'Ä‘iá»ƒm' : 'points'}
        </p>
      </div>
    </div>

                <div className="space-y-2">
                  <Label>{language === 'vi' ? 'Tìm kiếm người dùng' : 'Search User'}</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={language === 'vi' ? 'Nhập tên hoặc email...' : 'Enter name or email...'}
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                {searchingUsers && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}

                {!searchingUsers && searchedUsers.length > 0 && (
                  <ScrollArea className="h-48 rounded-md border">
                    <div className="p-2 space-y-1">
                      {searchedUsers.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => setSelectedUserId(user._id)}
                          className={`w-full p-3 rounded-md text-left transition-colors ${
                            selectedUserId === user._id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm opacity-80">{user.email}</p>
                            </div>
                            <Badge variant="outline">
                              {user.experience || 0} XP
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {!searchingUsers && userSearchTerm && searchedUsers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    {language === 'vi' ? 'Không tìm thấy người dùng' : 'No users found'}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAwardModal(false);
                  setSelectedUserId('');
                  setUserSearchTerm('');
                  setSearchedUsers([]);
                }}
              >
                {language === 'vi' ? 'Há»§y' : 'Cancel'}
              </Button>
              <Button
                onClick={awardAchievementToUser}
                disabled={!selectedUserId}
              >
                <Award className="w-4 h-4 mr-2" />
                {language === 'vi' ? 'Trao thành tích' : 'Award'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>
      
      <BlockHistoryDialog
        open={showBlockHistory}
        onOpenChange={setShowBlockHistory}
        data={historyBlock}
        onSelectExercise={(item) => {
          // Navigate to practice page with challengeId
          navigate(`/practice/${item.id}`);
          setShowBlockHistory(false);
        }}
      />

      <ExerciseDetailDialog
        open={showExerciseDetail}
        onOpenChange={setShowExerciseDetail}
        item={selectedExercise}
      />

      <ProgressDetailDialog
        open={showProgressDialog}
        onOpenChange={setShowProgressDialog}
        items={exerciseItems}
      />
    </Tabs>
  );
};

const BlockHistoryDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: { block: EnhancedBlock; exercises: ExerciseItem[] } | null;
  onSelectExercise: (item: ExerciseItem) => void;
}> = ({ open, onOpenChange, data, onSelectExercise }) => {
  const { language } = useLanguage();

  if (!data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" />
      </Dialog>
    );
  }

  const { block, exercises } = data;
  const done = exercises.filter((e) => e.status === 'done');
  const doing = exercises.filter((e) => e.status === 'doing');
  const pending = exercises.filter((e) => e.status === 'pending');

  const renderStatus = (item: ExerciseItem) => {
    if (item.status === 'done') return language === 'vi' ? 'Đã xong' : 'Done';
    if (item.status === 'doing') return language === 'vi' ? 'Đang làm' : 'Doing';
    return language === 'vi' ? 'Chưa làm' : 'Pending';
  };

  const renderResult = (item: ExerciseItem) => {
    if (!item.result) return language === 'vi' ? 'Chưa chấm' : 'Not graded';
    if (item.result === 'correct') return language === 'vi' ? 'Đúng' : 'Correct';
    if (item.result === 'partial') return language === 'vi' ? 'Một phần' : 'Partial';
    return language === 'vi' ? 'Sai' : 'Wrong';
  };

  const groups = [
    { key: 'done', labelVi: 'Đã hoàn thành', labelEn: 'Completed', items: done },
    { key: 'doing', labelVi: 'Đang thực hiện', labelEn: 'In progress', items: doing },
    { key: 'pending', labelVi: 'Chưa bắt đầu', labelEn: 'Not started', items: pending },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {language === 'vi' ? 'Lịch sử bài tập cho lộ trình' : 'Exercise history for block'}: {block.title}
          </DialogTitle>
          <DialogDescription>
            {language === 'vi'
              ? 'Hiển thị tất cả bài liên quan (kể cả đúng, sai, hoặc một phần) cho phần này trong lộ trình.'
              : 'Shows all related exercises (correct, wrong, partial) for this part of the roadmap.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.key}>
                <div className="font-semibold mb-2">
                  {language === 'vi' ? group.labelVi : group.labelEn} ({group.items.length})
                </div>
                {group.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground mb-2">
                    {language === 'vi' ? 'Không có bài trong nhóm này.' : 'No exercises in this group.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {group.items.map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => onSelectExercise(ex)}
                        className="w-full text-left flex flex-col md:flex-row md:items-center md:justify-between rounded-md border p-3 bg-background/60 hover:bg-accent transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{ex.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'vi' ? 'Kết quả:' : 'Result:'}{' '}
                            <span className="font-semibold">{renderResult(ex)}</span>{' '}
                            · {language === 'vi' ? 'Điểm:' : 'Score:'}{' '}
                            <span className="font-semibold">
                              {ex.score}/{ex.maxScore}
                            </span>{' '}
                            · {language === 'vi' ? 'Thời gian:' : 'Time:'}{' '}
                            <span className="font-semibold">
                              {ex.durationMinutes} {language === 'vi' ? 'phút' : 'min'}
                            </span>{' '}
                            · {language === 'vi' ? 'Số lần thử:' : 'Attempts:'}{' '}
                            <span className="font-semibold">{ex.attempts}</span>
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0 text-xs text-muted-foreground">
                          {renderStatus(ex)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {language === 'vi' ? 'Đóng' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ExerciseDetailDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ExerciseItem | null;
}> = ({ open, onOpenChange, item }) => {
  const { language } = useLanguage();

  if (!item) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md" />
      </Dialog>
    );
  }

  const renderResult = () => {
    if (!item.result) return language === 'vi' ? 'Chưa chấm' : 'Not graded';
    if (item.result === 'correct') return language === 'vi' ? 'Đúng' : 'Correct';
    if (item.result === 'partial') return language === 'vi' ? 'Một phần' : 'Partial';
    return language === 'vi' ? 'Sai' : 'Wrong';
  };

  const renderStatus = () => {
    if (item.status === 'done') return language === 'vi' ? 'Đã xong' : 'Done';
    if (item.status === 'doing') return language === 'vi' ? 'Đang làm' : 'Doing';
    return language === 'vi' ? 'Chưa làm' : 'Pending';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>
            {language === 'vi'
              ? 'Thông tin chi tiết bài tập trong lộ trình của bạn.'
              : 'Detailed information about this exercise in your roadmap.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {language === 'vi' ? 'Trạng thái' : 'Status'}
            </span>
            <Badge>{renderStatus()}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {language === 'vi' ? 'Kết quả' : 'Result'}
            </span>
            <span className="font-medium">{renderResult()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {language === 'vi' ? 'Điểm' : 'Score'}
            </span>
            <span className="font-medium">
              {item.score}/{item.maxScore}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {language === 'vi' ? 'Thời gian' : 'Time'}
            </span>
            <span className="font-medium">
              {item.durationMinutes} {language === 'vi' ? 'phút' : 'min'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {language === 'vi' ? 'Số lần thử' : 'Attempts'}
            </span>
            <span className="font-medium">{item.attempts}</span>
          </div>

          {item.completedAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {language === 'vi' ? 'Hoàn thành lúc' : 'Completed at'}
              </span>
              <span className="font-medium">
                {item.completedAt.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {language === 'vi' ? 'Đóng' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ProgressDetailDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ExerciseItem[];
}> = ({ open, onOpenChange, items }) => {
  const { language } = useLanguage();

  const done = items.filter((i) => i.status === 'done');
  const doing = items.filter((i) => i.status === 'doing');
  const pending = items.filter((i) => i.status === 'pending');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {language === 'vi' ? 'Chi tiết lộ trình học tập' : 'Learning path details'}
          </DialogTitle>
          <DialogDescription>
            {language === 'vi'
              ? 'Dữ liệu được tổng hợp tự động từ toàn bộ bài tập đã làm trong hệ thống, có thể kiểm chứng.'
              : 'Data is automatically aggregated from all your submissions in the system.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {[
              { key: 'done', labelVi: 'Đã hoàn thành', labelEn: 'Completed', data: done, tone: 'text-emerald-600' },
              { key: 'doing', labelVi: 'Đang thực hiện', labelEn: 'In progress', data: doing, tone: 'text-amber-600' },
              { key: 'pending', labelVi: 'Chưa bắt đầu', labelEn: 'Not started', data: pending, tone: 'text-slate-600' },
            ].map((group) => (
              <div key={group.key}>
                <div className={`font-semibold mb-2 ${group.tone}`}>
                  {language === 'vi' ? group.labelVi : group.labelEn} ({group.data.length})
                </div>
                {group.data.length === 0 ? (
                  <p className="text-xs text-muted-foreground mb-2">
                    {language === 'vi' ? 'Không có bài nào trong nhóm này.' : 'No exercises in this group.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {group.data.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between rounded-md border p-3 bg-background/60"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{ex.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'vi' ? 'Điểm:' : 'Score:'}{' '}
                            <span className="font-semibold">
                              {ex.score}/{ex.maxScore}
                            </span>{' '}
                            · {language === 'vi' ? 'Thời gian:' : 'Time:'}{' '}
                            <span className="font-semibold">
                              {ex.durationMinutes} {language === 'vi' ? 'phút' : 'min'}
                            </span>{' '}
                            · {language === 'vi' ? 'Số lần thử:' : 'Attempts:'}{' '}
                            <span className="font-semibold">{ex.attempts}</span>
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0 text-xs text-muted-foreground">
                          {group.key === 'done'
                            ? (language === 'vi' ? 'Đã hoàn thành' : 'Completed')
                            : group.key === 'doing'
                            ? (language === 'vi' ? 'Đang làm' : 'In progress')
                            : (language === 'vi' ? 'Chưa bắt đầu' : 'Not started')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {language === 'vi' ? 'Đóng' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalPage;
