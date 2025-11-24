import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "./components/contexts/LanguageContext";
import { BackgroundProvider } from "./components/contexts/BackgroundContext";
import { BackgroundWrapper } from "./components/BackgroundWrapper";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import ChatBox from "./components/ChatBox";
import AuthLayout from './components/auth/AuthLayout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Index from "./components/pages/Index";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import Dashboard from "./components/pages/ClientDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import NotFound from "./components/pages/NotFound";
import OAuthCallback from "./components/pages/OAuthCallback";
import OAuthError from "./components/pages/OAuthError";
import OAuthDebug from "./components/pages/OAuthDebug";
import Profile from "./components/pages/Profile";
import Settings from "./components/pages/Settings";
import Challenges from "./components/pages/Challenges";
import ForgotPassword from "./components/pages/ForgotPassword";
import VerifyReset from "./components/pages/VerifyReset";
import EnvDebug from "./components/pages/EnvDebug";

// Create a client
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <LanguageProvider>
          <BackgroundProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ChatBox />
              <BackgroundWrapper>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                  <Route path="/auth/callback" element={<OAuthCallback />} />
                  <Route path="/auth/error" element={<OAuthError />} />
                  <Route path="/auth/debug" element={<OAuthDebug />} />
                  <Route path="/clientdashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/challenges" element={<Challenges />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/verify-reset" element={<VerifyReset />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/env-debug" element={<EnvDebug />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              </BackgroundWrapper>
            </TooltipProvider>
          </BackgroundProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;