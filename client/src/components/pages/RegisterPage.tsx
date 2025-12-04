import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import Register from '../auth/Register';

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Đăng ký</CardTitle>
          <CardDescription>
            Tạo tài khoản BugHunter mới
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Register />
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
