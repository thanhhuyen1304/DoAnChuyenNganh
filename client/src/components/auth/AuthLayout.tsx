import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold">🐛</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            BugHunter
                        </span>
                    </div>
                    <CardTitle className="text-2xl">Welcome to BugHunter</CardTitle>
                </CardHeader>
                <CardContent>
                    {children}
                </CardContent>
            </Card>
        </div>
    );
};

export default AuthLayout;