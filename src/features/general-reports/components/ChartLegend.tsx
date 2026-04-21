

export interface LegendItem {
  color: string;
  name: string;
  value: number;
}

interface ChartLegendProps {
  data: LegendItem[];
  total?: number;
  columns?: 1 | 2 | 3 | 4;
  compact?: boolean;
}

export function ChartLegend({ data, total, columns = 2, compact = false }: ChartLegendProps) {
  const calculatedTotal = total ?? data.reduce((acc, curr) => acc + curr.value, 0);

  const colClasses: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-4 md:grid-cols-3",
    4: "grid-cols-4",
  };

  const gridClass = colClasses[columns] || colClasses[2];

  return (
    <div className={`grid ${gridClass} gap-y-2 gap-x-3 w-full`}>
      {data.map((item, index) => {
        const percentage = calculatedTotal > 0 ? ((item.value / calculatedTotal) * 100).toFixed(1) : "0.0";
        return (
          <div key={`${item.name}-${index}`} className="flex items-center gap-2 group transition-all">
            <div 
              className="flex-shrink-0 h-2.5 w-2.5 rounded-full shadow-sm border border-white/20 group-hover:scale-125 transition-transform" 
              style={{ backgroundColor: item.color }} 
            />
            <span className="text-[10px] font-black text-muted-foreground/80 uppercase truncate shrink" title={item.name}>
              {item.name}
            </span>
            <span className="ml-auto flex items-center gap-1 whitespace-nowrap shrink-0">
              <span className="font-black text-foreground text-[11px]">{item.value.toLocaleString()}</span>
              {!compact && <span className="text-[9px] font-bold text-muted-foreground opacity-60">({percentage}%)</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
