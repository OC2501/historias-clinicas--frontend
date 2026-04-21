interface CustomPercentTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  total: number;
}

export function CustomPercentTooltip({ active, payload, total }: CustomPercentTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const data = item.payload;
    const value = item.value;

    const name = item.name || data.name || data.specialty || data.gender || data.range || 'Total';
    const color = item.color || item.fill || data.fill || 'var(--primary)';

    // Normalize value extract
    const numericValue = typeof value === 'number' ? value : (typeof data.count === 'number' ? data.count : 0);

    // Formatting
    const percentage = total && total > 0 ? ((numericValue / total) * 100).toFixed(1) : "0.0";
    const formattedValue = numericValue.toLocaleString();

    return (
      <div className="rounded-xl border bg-background px-4 py-3 shadow-xl flex items-center gap-3 font-sans">
        {color && (
          <div
            className="h-3 w-3 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          />
        )}
        <div className="flex flex-col">
          <span className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider truncate max-w-[180px]">
            {name}
          </span>
          <span className="font-bold text-base whitespace-nowrap">
            {formattedValue} <span className="opacity-60 font-medium text-sm ml-1">({percentage}%)</span>
          </span>
        </div>
      </div>
    );
  }
  return null;
}
