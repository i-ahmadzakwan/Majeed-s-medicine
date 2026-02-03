import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Lock, User, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ✅ Pass the role from backend response
        login(data.user.username, password, data.user.role);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials. Try admin / admin123');
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-xl mb-4 animate-float">
            <Pill className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Majeed's Medicines
          </h1>
          <p className="text-muted-foreground mt-2">Your trusted pharmacy partner</p>
        </div>

        {/* Login Card */}
        <Card className="glass-card border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-display">Welcome Back</CardTitle>
            <CardDescription>Sign in to manage your pharmacy</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12 bg-background border-border focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-background border-border focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2">
                <strong className="text-foreground">Demo Accounts:</strong><br />
                <br />
                👤 Customer: <code className="bg-muted px-2 py-1 rounded">customer</code> / <code className="bg-muted px-2 py-1 rounded">customer123</code>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 Majeed's Medicines. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;