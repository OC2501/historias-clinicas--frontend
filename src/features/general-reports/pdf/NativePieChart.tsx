import { View, Text, Svg, Path, Circle } from '@react-pdf/renderer';

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface NativePieChartProps {
  data: PieSlice[];
  size?: number;
  isDonut?: boolean;
}

export const NativePieChart = ({ data = [], size = 140, isDonut = false }: NativePieChartProps) => {
  const safeData = data.filter(d => d.value > 0);
  const total = safeData.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height: size }}>
        <Text style={{ fontSize: 9, color: '#94a3b8' }}>Sin datos disponibles</Text>
      </View>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  let currentAngle = -Math.PI / 2;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Svg width={size} height={size}>
        {safeData.map((slice, i) => {
          const sliceAngle = (slice.value / total) * (2 * Math.PI);
          const x1 = cx + r * Math.cos(currentAngle);
          const y1 = cy + r * Math.sin(currentAngle);
          currentAngle += sliceAngle;
          const x2 = cx + r * Math.cos(currentAngle);
          const y2 = cy + r * Math.sin(currentAngle);
          const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
          const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          return <Path key={i} d={pathData} fill={slice.color} stroke="#fff" strokeWidth={1.5} />;
        })}
        {isDonut && <Circle cx={cx} cy={cy} r={r * 0.55} fill="#fff" />}
      </Svg>

      {/* Legend */}
      <View style={{ gap: 6 }}>
        {safeData.map((slice, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 9, height: 9, backgroundColor: slice.color, borderRadius: 2 }} />
            <Text style={{ fontSize: 8, color: '#374151' }}>
              {slice.label}:{' '}
            </Text>
            <Text style={{ fontSize: 8, color: '#111827', fontFamily: 'Helvetica-Bold' }}>
              {((slice.value / total) * 100).toFixed(0)}%
            </Text>
            <Text style={{ fontSize: 7, color: '#6b7280' }}>
              ({slice.value.toLocaleString()})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
