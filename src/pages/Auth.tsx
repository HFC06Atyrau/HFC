import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';
import { Trophy } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (mode: 'signin' | 'signup') => {
    try {
      const validation = authSchema.safeParse({ email, password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      setIsLoading(true);
      const { error } = mode === 'signin' 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Пользователь уже зарегистрирован');
        } else if (error.message.includes('Invalid login')) {
          toast.error('Неверный email или пароль');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (mode === 'signup') {
        toast.success('Аккаунт создан! Войдите в систему.');
      } else {
        toast.success('Добро пожаловать!');
        navigate('/');
      }
    } catch (err) {
      toast.error('Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            HFC <span className="text-primary glow-text">Stats</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Управление футбольной статистикой
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Вход
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Регистрация
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-foreground">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-foreground">Пароль</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleAuth('signin')}
                disabled={isLoading}
              >
                {isLoading ? 'Загрузка...' : 'Войти'}
              </Button>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-foreground">Пароль</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleAuth('signup')}
                disabled={isLoading}
              >
                {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
