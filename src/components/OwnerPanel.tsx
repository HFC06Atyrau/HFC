import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useAdmins, useAssignAdmin, useRemoveAdmin } from '@/hooks/useAdminManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Некорректный email');

export function OwnerPanel() {
  const { isOwner } = useAuth();
  const { data: admins = [] } = useAdmins();
  const assignAdmin = useAssignAdmin();
  const removeAdmin = useRemoveAdmin();
  const [email, setEmail] = useState('');

  if (!isOwner) return null;

  const handleAssignAdmin = () => {
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    assignAdmin.mutate(email);
    setEmail('');
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Управление администраторами
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Email пользователя"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-secondary border-border text-foreground"
          />
          <Button
            size="sm"
            onClick={handleAssignAdmin}
            disabled={assignAdmin.isPending}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Назначить
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Текущие администраторы:</p>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет администраторов</p>
          ) : (
            <div className="space-y-1">
              {admins.map(admin => (
                <div key={admin.id} className="flex items-center justify-between text-sm py-1 px-2 bg-secondary/50 rounded">
                  <div className="flex items-center gap-2">
                    <span>{admin.email}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      admin.role === 'owner' 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {admin.role === 'owner' ? 'Owner' : 'Admin'}
                    </span>
                  </div>
                  {admin.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeAdmin.mutate(admin.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
