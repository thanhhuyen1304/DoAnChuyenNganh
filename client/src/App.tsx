import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "./components/contexts/LanguageContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toast";
import AuthLayout from './components/auth/AuthLayout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Index from "./components/pages/Index";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import Dashboard from "./components/pages/Dashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import NotFound from "./components/pages/NotFound";
import OAuthCallback from "./components/pages/OAuthCallback";
import OAuthError from "./components/pages/OAuthError";
import OAuthDebug from "./components/pages/OAuthDebug";
import Profile from "./components/pages/Profile";
import Settings from "./components/pages/Settings";
import Practice from "./components/pages/Practice";
import AchievementsPage from "./components/pages/AchievementsPage";
import Challenges from "./components/pages/Challenges";
import { PvPPage as SimplePvPPage } from "./components/simplePvp/PvPPage";
import AllChallengesPage from "./components/pages/AllChallengesPage";
import { ToastProvider } from './components/ui/toast';
import ChatBox from './components/ChatBox';
import { BackgroundProvider } from './components/contexts/BackgroundContext';
import { BackgroundWrapper } from './components/BackgroundWrapper';

// Create a client
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <LanguageProvider>
          <BackgroundProvider>
            <BackgroundWrapper>
              <TooltipProvider>
                <ToastProvider>
                  <Toaster />
                  <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/auth/callback" element={<OAuthCallback />} />
                    <Route path="/auth/error" element={<OAuthError />} />
                    <Route path="/auth/debug" element={<OAuthDebug />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/practice" element={<Practice />} />
                    <Route path="/challenges" element={<Challenges />} />
                    <Route path="/challenges/allchallengeslist" element={<AllChallengesPage />} />
                    <Route path="/pvp" element={<SimplePvPPage />} />
                    <Route path="/achievements" element={<AchievementsPage />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </BrowserRouter>
                  <ChatBox />
                </ToastProvider>
              </TooltipProvider>
            </BackgroundWrapper>
          </BackgroundProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;