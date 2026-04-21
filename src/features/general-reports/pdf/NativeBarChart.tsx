import { View, Text, Svg, Rect, G } from '@react-pdf/renderer';

interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface NativeBarChartProps {
  data: BarItem[];
  height?: number;
  color?: string;
}

export const NativeBarChart = ({ data = [], height = 120, color = '#4F46E5' }: NativeBarChartProps) => {
  if (data.length === 0) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 9, color: '#94a3b8' }}>Sin datos disponibles</Text>
      </View>
    );
  }

  const chartWidth = 220;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const barWidth = Math.floor((chartWidth - 20) / data.length) - 6;
  const gap = Math.floor((chartWidth - barWidth * data.length) / (data.length + 1));

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      {/* Bars SVG */}
      <View style={{ position: 'relative' }}>
        <Svg width={chartWidth} height={height}>
          {/* Baseline */}
          <Rect x={0} y={height - 1} width={chartWidth} height={1} fill="#e2e8f0" />

          {data.map((item, i) => {
            const barHeight = Math.max((item.value / maxVal) * (height - 30), 2);
            const x = gap + i * (barWidth + gap);
            const barColor = item.color ?? color;
            return (
              <G key={i}>
                <Rect
                  x={x}
                  y={height - barHeight - 1}
                  width={barWidth}
                  height={barHeight}
                  fill={barColor}
                  rx={2}
                  ry={2}
                />
              </G>
            );
          })}
        </Svg>

        {/* Value + percentage labels above bars */}
        {data.map((item, i) => {
          const barHeight = Math.max((item.value / maxVal) * (height - 30), 2);
          const x = gap + i * (barWidth + gap);
          const topPos = height - barHeight - 26;
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: Math.max(topPos, 0),
                width: barWidth,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 7, color: '#111827', fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>
                {item.value}
              </Text>
              <Text style={{ fontSize: 6, color: '#6b7280', textAlign: 'center' }}>
                ({pct}%)
              </Text>
            </View>
          );
        })}
      </View>

      {/* X-axis labels row */}
      <View style={{ flexDirection: 'row', width: chartWidth, paddingTop: 4 }}>
        {data.map((item, i) => {
          const x = gap + i * (barWidth + gap);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x,
                width: barWidth,
                top: 0,
              }}
            >
              <Text style={{ fontSize: 7, color: '#6b7280', textAlign: 'center' }}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
