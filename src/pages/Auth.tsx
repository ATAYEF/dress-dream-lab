import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, User, Sparkles, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('ایمیل یا رمز عبور اشتباه است');
          }
          throw error;
        }

        toast({
          title: 'خوش آمدید!',
          description: 'با موفقیت وارد شدید',
        });
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('این ایمیل قبلا ثبت شده است');
          }
          throw error;
        }

        toast({
          title: 'ثبت‌نام موفق!',
          description: 'حساب شما ایجاد شد',
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'مشکلی پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4" dir="rtl">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <div className="bg-card rounded-3xl shadow-elevated p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-gold rounded-xl flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-semibold">استایلر</span>
          </div>

          <h1 className="text-2xl font-display font-semibold text-center mb-2">
            {isLogin ? 'ورود به حساب' : 'ایجاد حساب جدید'}
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            {isLogin ? 'به کمد هوشمند خود دسترسی پیدا کنید' : 'به جمع کاربران استایلر بپیوندید'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">نام</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="نام شما"
                    className="w-full pr-12 pl-4 py-3 bg-cream border border-border rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">ایمیل</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full pr-12 pl-4 py-3 bg-cream border border-border rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  required
                  minLength={6}
                  className="w-full pr-12 pl-4 py-3 bg-cream border border-border rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                'ورود'
              ) : (
                'ثبت‌نام'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? (
                <>
                  حساب ندارید؟{' '}
                  <span className="text-gold font-medium">ثبت‌نام کنید</span>
                </>
              ) : (
                <>
                  حساب دارید؟{' '}
                  <span className="text-gold font-medium">وارد شوید</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
