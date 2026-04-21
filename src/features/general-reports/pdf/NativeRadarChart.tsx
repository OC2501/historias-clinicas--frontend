import { View, Text, Svg, Path, Circle } from '@react-pdf/renderer';
import type { SpecialtyDistribution } from '../types/reports.types';

interface NativeRadarChartProps {
  data: SpecialtyDistribution[];
  size?: number;
  color?: string;
}

export const NativeRadarChart = ({ data = [], size = 170, color = '#4F46E5' }: NativeRadarChartProps) => {
  const safeData = data.slice(0, 8).map(d => ({
    label: d.specialty,
    value: Number(d.count),
  }));

  if (safeData.length < 3) {
    return (
      <View style={{ height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 9, color: '#94a3b8' }}>
          {safeData.length === 0 ? 'Sin datos disponibles' : 'Se necesitan al menos 3 especialidades'}
        </Text>
      </View>
    );
  }

  // Use slightly smaller radius to leave room for labels in the View
  const svgSize = size;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = svgSize * 0.32;
  const n = safeData.length;
  const maxVal = Math.max(...safeData.map(d => d.value), 1);
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

  const dataPoints = safeData.map((d, i) => toXY(i, (d.value / maxVal) * r));
  const dataPath = polyPath(dataPoints);

  const spokes = Array.from({ length: n }, (_, i) => {
    const end = toXY(i, r);
    return `M ${cx.toFixed(1)} ${cy.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  });

  // Label positions — pushed further out so they don't overlap the chart
  const labelRadius = r + 22;

  return (
    <View style={{ position: 'relative', width: svgSize, height: svgSize }}>
      <Svg width={svgSize} height={svgSize}>
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

        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} stroke="#fff" strokeWidth={1} />
        ))}
      </Svg>

      {/* Labels overlaid as absolute PDF Text elements */}
      {safeData.map((d, i) => {
        const pos = toXY(i, labelRadius);
        const label = d.label.length > 11 ? d.label.substring(0, 11) + '…' : d.label;
        // Determine alignment based on position relative to center
        const isLeft = pos.x < cx - 5;
        const isRight = pos.x > cx + 5;
        const textWidth = 52;
        const leftOffset = isLeft
          ? pos.x - textWidth
          : isRight
          ? pos.x
          : pos.x - textWidth / 2;

        return (
          <Text
            key={i}
            style={{
              position: 'absolute',
              left: leftOffset,
              top: pos.y - 5,
              width: textWidth,
              fontSize: 6,
              color: '#475569',
              textAlign: isLeft ? 'right' : isRight ? 'left' : 'center',
            }}
          >
            {label}
          </Text>
        );
      })}
    </View>
  );
};
