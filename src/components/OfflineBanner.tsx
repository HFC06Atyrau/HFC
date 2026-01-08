import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

/**
 * Баннер, показывающий потерю интернет-соединения
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground p-3 text-center z-50 shadow-lg animate-fade-in">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <WifiOff className="w-5 h-5" />
        <span className="font-medium">Нет подключения к интернету</span>
      </div>
    </div>
  );
}
