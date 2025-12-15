import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import OwlMascot from '@/components/mascot/OwlMascot';

interface LoginFormProps {
  onLogin: (username: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading = false, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onLogin(username, password);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-2 shadow-soft">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <OwlMascot 
              size="lg" 
              mood="happy" 
              greeting="Welcome back! Let's check your updates 🎓"
            />
          </div>
          <div>
            <CardTitle className="text-2xl">Student Portal</CardTitle>
            <CardDescription className="mt-2">
              Connect your Verracross account to start tracking
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 rounded-xl border-2"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-xl bg-coral-light border-2 border-coral/30 text-coral text-sm text-center">
                {error}
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              variant="lavender"
              size="lg"
              className="w-full"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">🦉</span>
                  Connecting...
                </>
              ) : (
                <>
                  🔗 Connect to Verracross
                </>
              )}
            </Button>
          </form>

          {/* Security note */}
          <div className="mt-6 p-4 rounded-xl bg-mint-light border-2 border-mint/20">
            <p className="text-xs text-center text-muted-foreground">
              🔒 Your credentials are stored securely and only used to access your own student account. We never share or store your password.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
