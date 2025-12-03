import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Trash2, Plus, Menu, Copy, Check, ThumbsUp, ThumbsDown, Minimize2, Maximize2, Square } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { buildApi } from '../lib/api';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from './hooks/use-toast';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  rating?: 'good' | 'bad';
  messageIndex?: number; // Index trong chat history để rate
}

interface ChatHistory {
  chatId: string;
  title: string;
  preview: string;
  messageCount: number;
  updatedAt: string;
}

const ChatBox: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, 'good' | 'bad'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Resize state
  const defaultWidth = 380;
  const defaultHeight = 600;
  const minWidth = 320;
  const minHeight = 400;
  const maxWidth = 1200;
  const maxHeight = 900;
  
  const [chatboxSize, setChatboxSize] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('chatbox-size');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          width: Math.max(minWidth, Math.min(maxWidth, parsed.width || defaultWidth)),
          height: Math.max(minHeight, Math.min(maxHeight, parsed.height || defaultHeight)),
        };
      } catch {
        return { width: defaultWidth, height: defaultHeight };
      }
    }
    return { width: defaultWidth, height: defaultHeight };
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const chatboxRef = useRef<HTMLDivElement>(null);
  
  // Maximize state - must be declared before useEffect that uses it
  const [isMaximized, setIsMaximized] = useState(false);
  const [previousSize, setPreviousSize] = useState({ width: defaultWidth, height: defaultHeight });

  // Get auth token
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Highlight code blocks
  useEffect(() => {
    if (messages.length > 0) {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Save size to localStorage when changed
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('chatbox-size', JSON.stringify(chatboxSize));
    }
  }, [chatboxSize, isOpen]);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: chatboxSize.width,
      height: chatboxSize.height,
    });
  }, [chatboxSize]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
      const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));
      
      setChatboxSize({ width: newWidth, height: newHeight });
      
      // If resizing, exit maximize mode
      if (isMaximized) {
        setIsMaximized(false);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      document.body.style.cursor = 'nwse-resize';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
      
      // Prevent scrolling while resizing
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    };
  }, [isResizing, resizeStart, minWidth, minHeight, maxWidth, maxHeight, isMaximized]);

  // Reset size to default
  const resetSize = () => {
    setChatboxSize({ width: defaultWidth, height: defaultHeight });
  };

  // Toggle maximize/minimize
  const toggleMaximize = () => {
    if (isMaximized) {
      // Restore previous size
      setChatboxSize(previousSize);
      setIsMaximized(false);
    } else {
      // Save current size and maximize
      setPreviousSize(chatboxSize);
      setChatboxSize({ 
        width: Math.min(window.innerWidth - 48, maxWidth), 
        height: Math.min(window.innerHeight - 120, maxHeight) 
      });
      setIsMaximized(true);
    }
  };

  // Load chat histories when sidebar opens
  useEffect(() => {
    if (showSidebar && isOpen) {
      loadChatHistories();
    }
  }, [showSidebar, isOpen]);

  // Load chat histories
  const loadChatHistories = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(buildApi('/chat/histories'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setChatHistories(data.data.chats || []);
        }
      }
    } catch (error) {
      console.error('Load chat histories error:', error);
    }
  };

  // Load specific chat history
  const loadChatHistory = async (id: string) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(buildApi(`/chat/history/${id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Tính messageIndex cho mỗi assistant message
          let assistantIndex = 0;
          const loadedMessages = data.data.messages.map((msg: any) => {
            const message: Message = {
              id: `${msg.timestamp}-${Math.random()}`,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              rating: msg.rating,
            };
            
            if (msg.role === 'assistant') {
              message.messageIndex = assistantIndex;
              assistantIndex++;
            }
            
            return message;
          });
          
          setMessages(loadedMessages);
          
          // Load ratings vào state
          const loadedRatings: Record<string, 'good' | 'bad'> = {};
          loadedMessages.forEach((msg: Message) => {
            if (msg.rating) {
              loadedRatings[msg.id] = msg.rating;
            }
          });
          setRatings(loadedRatings);
          
          setChatId(id);
          setShowSidebar(false);
        }
      }
    } catch (error) {
      console.error('Load chat history error:', error);
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: language === 'vi' ? 'Không thể tải cuộc trò chuyện' : 'Failed to load chat',
        variant: 'destructive',
      });
    }
  };

  // Start new chat
  const startNewChat = () => {
    setMessages([]);
    setChatId(null);
    setShowSidebar(false);
    inputRef.current?.focus();
  };

  // Delete chat
  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(buildApi(`/chat/history/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setChatHistories(prev => prev.filter(chat => chat.chatId !== id));
        if (chatId === id) {
          startNewChat();
        }
        toast({
          title: language === 'vi' ? 'Thành công' : 'Success',
          description: language === 'vi' ? 'Đã xóa cuộc trò chuyện' : 'Chat deleted',
        });
      }
    } catch (error) {
      console.error('Delete chat error:', error);
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: language === 'vi' ? 'Không thể xóa cuộc trò chuyện' : 'Failed to delete chat',
        variant: 'destructive',
      });
    }
  };

  // Copy message
  const copyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: language === 'vi' ? 'Đã sao chép' : 'Copied',
        description: language === 'vi' ? 'Đã sao chép vào clipboard' : 'Copied to clipboard',
      });
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  // Send message logic
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Chưa đăng nhập');
      }

      const response = await fetch(buildApi('/chat/message'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          chatId: chatId,
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        const assistantMessageCount = messages.filter(m => m.role === 'assistant').length;
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.message.content,
          timestamp: new Date(data.data.message.timestamp),
          messageIndex: assistantMessageCount,
        };

        setMessages(prev => [...prev, aiMessage]);

        if (!chatId && data.data.chatId) {
          setChatId(data.data.chatId);
          loadChatHistories();
        }
      } else {
        throw new Error(data.message || 'Lỗi khi gửi tin nhắn');
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: error.message || (language === 'vi' ? 'Không thể gửi tin nhắn' : 'Failed to send message'),
        variant: 'destructive',
      });
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  // Form submission handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  // Handle textarea resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  // Handle rating message
  const handleRateMessage = async (messageId: string, rating: 'good' | 'bad') => {
    if (!chatId) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: language === 'vi' ? 'Không tìm thấy cuộc trò chuyện' : 'Chat not found',
        variant: 'destructive',
      });
      return;
    }

    const message = messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant' || message.messageIndex === undefined) {
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Chưa đăng nhập');
      }

      const response = await fetch(buildApi('/chat/rate'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          messageIndex: message.messageIndex,
          rating,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Cập nhật rating trong state
        setRatings(prev => ({
          ...prev,
          [messageId]: rating,
        }));

        // Cập nhật rating trong message
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, rating } : msg
          )
        );

        toast({
          title: language === 'vi' ? 'Thành công' : 'Success',
          description: language === 'vi' ? 'Đã lưu đánh giá' : 'Rating saved',
        });
      } else {
        throw new Error(data.message || 'Lỗi khi lưu đánh giá');
      }
    } catch (error: any) {
      console.error('Rate message error:', error);
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: error.message || (language === 'vi' ? 'Không thể lưu đánh giá' : 'Failed to save rating'),
        variant: 'destructive',
      });
    }
  };

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isAuthenticated = !!getToken();

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center text-white"
        aria-label="Open chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatboxRef}
          className="fixed bottom-24 right-6 z-[9999] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
          style={{
            width: `${chatboxSize.width}px`,
            height: `${chatboxSize.height}px`,
            minWidth: `${minWidth}px`,
            minHeight: `${minHeight}px`,
            maxWidth: `${maxWidth}px`,
            maxHeight: `${maxHeight}px`,
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white px-4 py-3 flex justify-between items-center border-b border-white/20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                title={language === 'vi' ? 'Lịch sử chat' : 'Chat history'}
              >
                <Menu size={20} />
              </button>
              <button
                onClick={startNewChat}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                title={language === 'vi' ? 'Cuộc trò chuyện mới' : 'New chat'}
              >
                <Plus size={20} />
              </button>
            <div>
                <h3 className="font-semibold text-base">
                  {language === 'vi' ? 'BugHunter AI' : 'BugHunter AI'}
              </h3>
                <p className="text-xs text-pink-100">
                  {language === 'vi' ? 'Trợ lý lập trình thông minh' : 'Smart programming assistant'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMaximize}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                title={isMaximized 
                  ? (language === 'vi' ? 'Thu nhỏ' : 'Minimize')
                  : (language === 'vi' ? 'Mở rộng' : 'Maximize')
                }
              >
                {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              {/* <button
                onClick={resetSize}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                title={language === 'vi' ? 'Kích thước mặc định' : 'Default size'}
              >
                <Square size={16} />
              </button> */}
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                title={language === 'vi' ? 'Đóng' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            {showSidebar && (
              <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                    {language === 'vi' ? 'Lịch sử' : 'History'}
                  </h4>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {chatHistories.map((chat) => (
                      <div
                        key={chat.chatId}
                        onClick={() => loadChatHistory(chat.chatId)}
                        className={`p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group ${
                          chatId === chat.chatId ? 'bg-gray-200 dark:bg-gray-700' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {chat.title || language === 'vi' ? 'Cuộc trò chuyện mới' : 'New chat'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {chat.preview}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {new Date(chat.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => deleteChat(chat.chatId, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-all"
                            title={language === 'vi' ? 'Xóa' : 'Delete'}
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {chatHistories.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                        {language === 'vi' ? 'Chưa có cuộc trò chuyện nào' : 'No chat history'}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Messages Container */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <MessageCircle size={48} className="text-gray-400 dark:text-gray-500 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'vi' ? 'Xin chào! 👋' : 'Hello! 👋'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                        {language === 'vi'
                          ? 'Tôi là trợ lý AI của BugHunter. Tôi có thể giúp bạn học lập trình, debug code, và trả lời các câu hỏi về lập trình. Hãy bắt đầu cuộc trò chuyện!'
                          : "I'm BugHunter's AI assistant. I can help you learn programming, debug code, and answer programming questions. Let's start a conversation!"}
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">AI</span>
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {message.role === 'assistant' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code: ({ node, inline, className, children, ...props }: any) => {
                                     const match = /language-(\w+)/.exec(className || '');
                                     return !inline && match ? (
                                       <div className="relative group">
                                         <pre className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                                           <code className={className}>
                                             {children}
                                           </code>
                                         </pre>
                                         <button
                                           onClick={() => copyMessage(String(children), message.id)}
                                           className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-all"
                                         >
                                           {copiedId === message.id ? (
                                             <Check size={14} className="text-green-400" />
                                           ) : (
                                             <Copy size={14} className="text-gray-300" />
                                           )}
                                         </button>
                                       </div>
                                     ) : (
                                       <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm">
                                         {children}
                                       </code>
                                     );
                                   },
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                          {/* Rating buttons for AI messages */}
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <button
                                onClick={() => handleRateMessage(message.id, 'good')}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                                  (ratings[message.id] === 'good' || message.rating === 'good')
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                                title={language === 'vi' ? 'Đánh giá tốt' : 'Rate as good'}
                              >
                                <ThumbsUp size={14} />
                                <span>{language === 'vi' ? 'Tốt' : 'Good'}</span>
                              </button>
                              <button
                                onClick={() => handleRateMessage(message.id, 'bad')}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                                  (ratings[message.id] === 'bad' || message.rating === 'bad')
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                                title={language === 'vi' ? 'Đánh giá không tốt' : 'Rate as bad'}
                              >
                                <ThumbsDown size={14} />
                                <span>{language === 'vi' ? 'Không tốt' : 'Bad'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">U</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}

            {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">AI</span>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                        <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
              </ScrollArea>

          {/* Input Footer */}
              {!isAuthenticated ? (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'vi'
                      ? 'Vui lòng đăng nhập để sử dụng chat'
                      : 'Please login to use chat'}
                  </p>
                </div>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={handleFormSubmit} className="flex gap-2">
                    <textarea
                ref={inputRef}
                value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        language === 'vi'
                          ? 'Nhập tin nhắn...'
                          : 'Type a message...'
                      }
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-[200px] text-sm"
                disabled={isLoading}
                      rows={1}
              />
                    <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3"
                    >
                      {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Send size={20} />
                      )}
                    </Button>
            </form>
                </div>
              )}
            </div>
          </div>
          
          {/* Resize Handle - Larger and more visible */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e);
            }}
            className={`absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize group ${
              isResizing ? 'bg-blue-500 dark:bg-blue-400' : 'bg-transparent hover:bg-blue-400/20 dark:hover:bg-blue-500/20'
            } transition-colors rounded-tl-lg`}
            title={language === 'vi' ? 'Kéo để điều chỉnh kích thước' : 'Drag to resize'}
          >
            {/* Visual indicator - diagonal lines */}
            <div className="absolute bottom-1 right-1 w-5 h-5 flex items-end justify-end">
              <div className="flex flex-col gap-0.5">
                <div className={`w-3 h-0.5 ${isResizing ? 'bg-white' : 'bg-gray-400 dark:bg-gray-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-400'} transition-colors`}></div>
                <div className={`w-2 h-0.5 ${isResizing ? 'bg-white' : 'bg-gray-400 dark:bg-gray-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-400'} transition-colors`}></div>
                <div className={`w-1 h-0.5 ${isResizing ? 'bg-white' : 'bg-gray-400 dark:bg-gray-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-400'} transition-colors`}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBox;
