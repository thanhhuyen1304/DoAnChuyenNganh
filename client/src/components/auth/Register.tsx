import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { useLanguage } from '../contexts/LanguageContext';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useLanguage();

    const { username, email, password } = formData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Add logic for form submission and validation here
            console.log('Form submitted:', formData);
            
            // Example API call
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            // Handle successful registration
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    type="text"
                    name="username"
                    value={username}
                    onChange={handleChange}
                    required
                    placeholder="Enter your username"
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    type="password"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                />
            </div>
            
            <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow"
                disabled={isLoading}
            >
                {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <a href="/login" className="text-primary hover:underline">
                    Sign in
                </a>
            </div>
        </form>
    );
};

export default Register;