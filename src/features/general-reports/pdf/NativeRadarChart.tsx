import { View, Text, Svg, Path, Circle } from '@react-pdf/renderer';
import type { SpecialtyDistribution } from '../types/reports.types';

interface NativeRadarChartProps {
  data: SpecialtyDistribution[];
  size?: number;
  color?: string;
}

export const NativeRadarChart = ({ data = [], size = 145, color = '#4F46E5' }: NativeRadarChartProps) => {
  const rawData = (data || []).slice(0, 8).map(d => ({
    label: d.specialty,
    value: Number(d.count),
  }));

  if (rawData.length === 0) {
    return (
      <View style={{ height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 8.5, color: '#94a3b8' }}>Sin datos disponibles</Text>
      </View>
    );
  }

  // Si hay menos de 3 especialidades, rellenamos con vértices vacíos para que el radar se pueda dibujar correctamente
  const chartData = [...rawData];
  while (chartData.length < 3) {
    chartData.push({ label: `__dummy_${chartData.length}`, value: 0 });
  }

  const chartWidth = 230;
  const chartHeight = size || 145;
  const cx = chartWidth / 2;
  const cy = chartHeight / 2;
  const r = 44; // Radio del polígono
  const labelRadius = r + 13; // Radio de posición de etiquetas
  const n = chartData.length;
  const maxVal = Math.max(...chartData.map(d => d.value), 1);
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const toXY = (index: number, radius: number) => {
    const angle = startAngle + index * angleStep;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const gridLevels = [0.33, 0.66, 1.0];
  const polyPath = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  const gridPaths = gridLevels.map(level =>
    polyPath(Array.from({ length: n }, (_, i) => toXY(i, r * level)))
  );

  const dataPoints = chartData.map((d, i) => toXY(i, (d.value / maxVal) * r));
  const dataPath = polyPath(dataPoints);

  const spokes = Array.from({ length: n }, (_, i) => {
    const end = toXY(i, r);
    return `M ${cx.toFixed(1)} ${cy.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  });

  const textWidth = 56;

  return (
    <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'relative', width: chartWidth, height: chartHeight }}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid polygons */}
          {gridPaths.map((path, i) => (
            <Path key={i} d={path} fill="none" stroke="#e2e8f0" strokeWidth={0.8} />
          ))}

          {/* Spokes */}
          {spokes.map((d, i) => (
            <Path key={i} d={d} stroke="#e2e8f0" strokeWidth={0.8} />
          ))}

          {/* Data area fill */}
          <Path d={dataPath} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={1.5} />

          {/* Data dots (only for real data points) */}
          {dataPoints.map((p, i) => {
            if (chartData[i].label.startsWith('__dummy_')) return null;
            return (
              <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} stroke="#fff" strokeWidth={1} />
            );
          })}
        </Svg>

        {/* Labels overlaid as absolute PDF Text elements */}
        {chartData.map((d, i) => {
          if (d.label.startsWith('__dummy_')) return null;

          const pos = toXY(i, labelRadius);
          const rawName = d.label.length > 10 ? d.label.substring(0, 9) + '…' : d.label;
          const displayLabel = `${rawName} (${d.value})`;

          const isLeft = pos.x < cx - 4;
          const isRight = pos.x > cx + 4;

          let leftOffset = pos.x - textWidth / 2;
          let textAlign: 'center' | 'left' | 'right' = 'center';

          if (isLeft) {
            leftOffset = Math.max(0, pos.x - textWidth - 2);
            textAlign = 'right';
          } else if (isRight) {
            leftOffset = Math.min(chartWidth - textWidth, pos.x + 2);
            textAlign = 'left';
          }

          let topOffset = pos.y - 4;
          if (pos.y < cy - 10) {
            topOffset = Math.max(2, pos.y - 8);
          } else if (pos.y > cy + 10) {
            topOffset = Math.min(chartHeight - 12, pos.y - 1);
          }

          return (
            <Text
              key={i}
              style={{
                position: 'absolute',
                left: leftOffset,
                top: topOffset,
                width: textWidth,
                fontSize: 6,
                color: '#475569',
                textAlign,
              }}
            >
              {displayLabel}
            </Text>
          );
        })}
      </View>
    </View>
  );
};
