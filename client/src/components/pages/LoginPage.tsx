import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import Login from '../auth/Login';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
          <CardDescription>
            Đăng nhập vào tài khoản BugHunter của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Login />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
