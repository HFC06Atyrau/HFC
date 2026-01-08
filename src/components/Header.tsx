import { useAuth } from '@/lib/auth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, LogOut, Shield, User, History, Star, Users } from 'lucide-react';

export function Header() {
  const { user, isAdmin, isOwner, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-11 h-11 bg-primary/15 rounded-xl flex items-center justify-center group-hover:bg-primary/25 transition-all duration-300 group-hover:scale-105">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-display font-bold text-foreground tracking-wide">
              HFC <span className="gradient-text">Stats</span>
            </span>
          </Link>
          
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              Главная
            </Link>
            <Link
              to="/players"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname === '/players'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Игроки</span>
            </Link>
            <Link
              to="/history"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname === '/history'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">История</span>
            </Link>
            <Link
              to="/season-teams"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname === '/season-teams'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Сборные</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isOwner ? (
                  <Shield className="w-4 h-4 text-primary" />
                ) : isAdmin ? (
                  <User className="w-4 h-4 text-primary" />
                ) : null}
                <span className="hidden sm:inline">{user.email}</span>
                {isOwner && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Owner</span>}
                {isAdmin && !isOwner && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Admin</span>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
              className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Войти
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
