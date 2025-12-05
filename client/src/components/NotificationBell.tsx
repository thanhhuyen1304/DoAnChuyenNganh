import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { getApiBase } from '../lib/apiBase';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  read: boolean;
  link?: string;
  createdAt: string;
}

const NotificationBell: React.FC = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load unread count only
  const loadUnreadCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const API_BASE = getApiBase();

      const countResponse = await fetch(`${API_BASE}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (countResponse.ok) {
        const countData = await countResponse.json();
        if (countData.success) {
          setUnreadCount(countData.data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Load full notifications list
  const loadNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const API_BASE = getApiBase();

      const notifResponse = await fetch(`${API_BASE}/notifications?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        if (notifData.success) {
          setNotifications(notifData.data.notifications || []);
          setUnreadCount(notifData.data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Load unread count on mount and periodically (every 2 minutes)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Load initial count
    loadUnreadCount();

    // Poll every 2 minutes (120 seconds) - reduced frequency to save server load
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Optimistic update
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === id ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Optimistic update
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const deletedNotif = notifications.find((n) => n._id === id);
        setNotifications((prev) => prev.filter((notif) => notif._id !== id));
        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-l-4 border-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return language === 'vi' ? 'Vừa xong' : 'Just now';
    } else if (diffMins < 60) {
      return language === 'vi' ? `${diffMins} phút trước` : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return language === 'vi' ? `${diffHours} giờ trước` : `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return language === 'vi' ? `${diffDays} ngày trước` : `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    // Only mark as read, don't navigate away
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 relative"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {isOpen && unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[10002] max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === 'vi' ? 'Thông báo' : 'Notifications'}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  {language === 'vi' ? 'Đánh dấu tất cả đã đọc' : 'Mark all read'}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {language === 'vi' ? 'Đang tải...' : 'Loading...'}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {language === 'vi' ? 'Không có thông báo nào' : 'No notifications'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 transition-colors cursor-pointer ${
                      !notification.read 
                        ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-medium' 
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    } ${getTypeStyles(notification.type)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-white font-medium">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            {/* Highlight XP earned */}
                            {notification.message.includes('XP') && (
                              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-semibold">
                                <span>✨</span>
                                <span>{notification.message.match(/\+(\d+)\s*XP/i)?.[0] || ''}</span>
                              </div>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification._id);
                        }}
                        className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        <X size={14} className="text-gray-400 dark:text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

