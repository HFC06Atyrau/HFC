import { useAuth } from '@/lib/auth';
import { useToursBySeason, useCreateTour, Tour } from '@/hooks/useTours';
import { useCurrentSeason } from '@/hooks/useSeasons';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface TourSelectorProps {
  selectedTourId: string | null;
  onTourChange: (tourId: string | null) => void;
}

export function TourSelector({ selectedTourId, onTourChange }: TourSelectorProps) {
  const { isAdmin } = useAuth();
  const { data: currentSeason } = useCurrentSeason();
  const { data: tours = [] } = useToursBySeason(currentSeason?.id ?? null);
  const createTour = useCreateTour();

  const handleCreateTour = () => {
    if (currentSeason) {
      createTour.mutate(currentSeason.id, {
        onSuccess: (newTour) => {
          onTourChange(newTour.id);
        },
      });
    }
  };

  if (!currentSeason) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedTourId ?? ''}
        onValueChange={(value) => onTourChange(value || null)}
      >
        <SelectTrigger className="w-[180px] bg-secondary border-border">
          <SelectValue placeholder="Выберите тур" />
        </SelectTrigger>
        <SelectContent>
          {tours.map((tour) => (
            <SelectItem key={tour.id} value={tour.id}>
              Тур {tour.number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isAdmin && (
        <Button
          size="sm"
          onClick={handleCreateTour}
          disabled={createTour.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-1" />
          Новый тур
        </Button>
      )}
    </div>
  );
}
