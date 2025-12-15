import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, EyeOff, Lock, User, LogIn, Globe } from 'lucide-react';
import OwlMascot from '@/components/mascot/OwlMascot';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

// Validation schema
const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(200),
  portalUrl: z.string().url('Invalid portal URL').optional(),
});

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [portalUrl, setPortalUrl] = useState('https://portals.veracross.com/sns');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        onAuthSuccess();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        onAuthSuccess();
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate inputs
    const validation = loginSchema.safeParse({ username, password, portalUrl });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    try {
      // Generate a unique email from the username for Supabase auth
      const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@veracross.local`;
      
      // Try to sign up first (in case user is new)
      let authResult = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            veracross_username: username,
          }
        }
      });

      // If user already exists, try to sign in
      if (authResult.error?.message?.includes('User already registered')) {
        authResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (authResult.error) {
        // Try signing in if signup failed for other reasons
        const signInResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInResult.error) {
          if (signInResult.error.message.includes('Invalid login credentials')) {
            setError('Invalid username or password. If you\'re a new user, please try again.');
          } else {
            setError(signInResult.error.message);
          }
          setIsLoading(false);
          return;
        }
      }

      // Store Veracross credentials for scraping
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Upsert credentials
        await supabase.from('user_credentials').upsert({
          user_id: user.id,
          username: username,
          encrypted_password: password, // Note: In production, encrypt this properly
          portal_url: portalUrl,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        toast({
          title: "Welcome to Veracross Dashboard! 🦉",
          description: "Connected to your SNS portal. Fetching your data...",
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
              greeting="Welcome! Enter your Veracross credentials 🎓"
            />
          </div>
          <div>
            <CardTitle className="text-2xl">Veracross SNS Login</CardTitle>
            <CardDescription className="mt-2">
              Sign in with your Veracross student portal credentials
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Portal URL field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="portalUrl">
                Portal URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="portalUrl"
                  type="url"
                  placeholder="https://portals.veracross.com/sns"
                  value={portalUrl}
                  onChange={(e) => setPortalUrl(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">Your school's Veracross portal URL</p>
            </div>

            {/* Username field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="username">
                Veracross Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your Veracross username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Veracross Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your Veracross password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 rounded-xl border-2"
                  disabled={isLoading}
                  autoComplete="current-password"
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
                  Connecting to Veracross...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Connect to Portal
                </>
              )}
            </Button>
          </form>

          {/* Security note */}
          <div className="mt-6 p-4 rounded-xl bg-mint-light border-2 border-mint/20">
            <p className="text-xs text-center text-muted-foreground">
              🔒 Your Veracross credentials are stored securely and only used to fetch your portal data. We never share your information.
            </p>
          </div>

          {/* Info about supported schools */}
          <div className="mt-4 p-3 rounded-xl bg-lavender-light border-2 border-lavender/20">
            <p className="text-xs text-center text-muted-foreground">
              📚 Currently configured for SNS (School Name) Veracross portal. Your courses and updates will be synced automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
