import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, UserCircle2 } from 'lucide-react';

interface PatientStatusBadgeProps {
  status?: string;
  className?: string;
  showIcon?: boolean;
}

export function PatientStatusBadge({ status, className, showIcon = true }: PatientStatusBadgeProps) {
  const isDischarged = status === 'DISCHARGED';

  return (
    <Badge
      variant={isDischarged ? "outline" : "secondary"}
      className={cn(
        "gap-1.5 px-3 py-1 font-semibold transition-all duration-300",
        isDischarged 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
          : "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100",
        className
      )}
    >
      {showIcon && (
        isDischarged 
          ? <CheckCircle2 className="h-3.5 w-3.5" /> 
          : <UserCircle2 className="h-3.5 w-3.5" />
      )}
      {isDischarged ? 'Alta Médica' : 'Activo'}
    </Badge>
  );
}
