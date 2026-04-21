import { View, Text, Svg, Path, Circle } from '@react-pdf/renderer';
import type { ConsultationTrend } from '../types/reports.types';

interface NativeAreaChartProps {
  data: ConsultationTrend[];
  timeframe?: string;
  color?: string;
}

// ─── Same padding logic as ConsultationTrends.tsx ────────────────────────────

function buildPaddedData(data: ConsultationTrend[], timeframe: string) {
  let daysDiff = 0;
  let monthsDiff = 0;
  let baseEndDate = new Date();

  switch (timeframe) {
    case '1w':
      daysDiff = 6;
      break;
    case '1m':
      daysDiff = 29;
      break;
    case '3m':
      monthsDiff = 2;
      break;
    case '6m':
      monthsDiff = 5;
      baseEndDate = new Date(baseEndDate.getFullYear(), 5, 30);
      break;
    case '9m':
      monthsDiff = 8;
      baseEndDate = new Date(baseEndDate.getFullYear(), 8, 30);
      break;
    case '1y':
      monthsDiff = 11;
      baseEndDate = new Date(baseEndDate.getFullYear(), 11, 31);
      break;
    default:
      monthsDiff = 5;
      baseEndDate = new Date(baseEndDate.getFullYear(), 5, 30);
  }

  const isDaily = timeframe === '1w' || timeframe === '1m';
  const intervalsCount = isDaily ? daysDiff : monthsDiff;
  const result: { dateStr: string; count: number; label: string }[] = [];

  for (let i = intervalsCount; i >= 0; i--) {
    const d = new Date(baseEndDate.getTime());
    if (isDaily) {
      d.setDate(d.getDate() - i);
    } else {
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
    }
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    const dateStr = isDaily
      ? `${d.getFullYear()}-${monthStr}-${dayStr}`
      : `${d.getFullYear()}-${monthStr}`;

    const found = data.find(item => item.date === dateStr);
    const label = isDaily
      ? d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).replace('.', '')
      : d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');

    result.push({ dateStr, count: found ? Number(found.count) : 0, label });
  }

  return { paddedData: result, isDaily };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const NativeAreaChart = ({ data = [], timeframe = '6m', color = '#4F46E5' }: NativeAreaChartProps) => {
  const { paddedData, isDaily } = buildPaddedData(data, timeframe);

  const chartWidth = 460;
  const chartHeight = 120;
  const paddingLeft = 32;
  const svgWidth = chartWidth + 10;
  const svgHeight = chartHeight + 8;

  const maxVal = Math.max(...paddedData.map(d => d.count), 1);
  const roundedMax = Math.ceil(maxVal / 5) * 5 || 5;
  const n = paddedData.length;
  const totalWidth = chartWidth - paddingLeft;
  const stepX = n > 1 ? totalWidth / (n - 1) : totalWidth;

  const getX = (i: number) => paddingLeft + i * stepX;
  const getY = (val: number) => chartHeight - (val / roundedMax) * chartHeight;

  // Build bezier area + line paths
  const buildPath = (isArea: boolean) => {
    if (n === 0) return '';
    if (n === 1) {
      // Single point: draw a horizontal line across the chart
      const y = getY(paddedData[0].count);
      if (isArea) return `M ${paddingLeft} ${chartHeight} L ${paddingLeft} ${y} L ${chartWidth} ${y} L ${chartWidth} ${chartHeight} Z`;
      return `M ${paddingLeft} ${y} L ${chartWidth} ${y}`;
    }

    let d = isArea
      ? `M ${getX(0)} ${chartHeight} L ${getX(0)} ${getY(paddedData[0].count)}`
      : `M ${getX(0)} ${getY(paddedData[0].count)}`;

    for (let i = 1; i < n; i++) {
      const x0 = getX(i - 1);
      const y0 = getY(paddedData[i - 1].count);
      const x1 = getX(i);
      const y1 = getY(paddedData[i].count);
      const cpx = x0 + (x1 - x0) / 2;
      d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
    }

    if (isArea) d += ` L ${getX(n - 1)} ${chartHeight} Z`;
    return d;
  };

  // Y-axis grid values
  const yLabels = [0, Math.round(roundedMax / 2), roundedMax];

  // X-axis labels — show at most 7 evenly spaced
  const maxXLabels = isDaily ? 7 : 6;
  const interval = Math.max(1, Math.floor(n / maxXLabels));
  const xLabels = paddedData
    .map((d, i) => ({ i, label: d.label }))
    .filter((_, idx) => idx % interval === 0 || idx === n - 1);

  return (
    <View style={{ width: '100%' }}>
      {/* Chart + Y-axis labels */}
      <View style={{ position: 'relative' }}>
        <Svg width={svgWidth} height={svgHeight}>
          {/* Grid lines */}
          {yLabels.map((val, i) => (
            <Path
              key={i}
              d={`M ${paddingLeft} ${getY(val)} L ${chartWidth} ${getY(val)}`}
              stroke={val === 0 ? '#e2e8f0' : '#f1f5f9'}
              strokeWidth={val === 0 ? 1 : 0.8}
            />
          ))}

          {/* Area fill */}
          <Path d={buildPath(true)} fill={color} fillOpacity={0.14} />

          {/* Line */}
          <Path d={buildPath(false)} stroke={color} strokeWidth={2} fill="none" />

          {/* Dots — only if not too many points */}
          {n <= 32 && paddedData.map((d, i) => (
            <Circle
              key={i}
              cx={getX(i)}
              cy={getY(d.count)}
              r={d.count > 0 ? 3 : 2}
              fill={d.count > 0 ? color : '#e2e8f0'}
              stroke="#fff"
              strokeWidth={1}
            />
          ))}
        </Svg>

        {/* Y-axis labels — absolute overlay */}
        {yLabels.map((val, i) => (
          <Text
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: getY(val) - 4,
              width: 28,
              fontSize: 6.5,
              color: '#94a3b8',
              textAlign: 'right',
            }}
          >
            {val}
          </Text>
        ))}
      </View>

      {/* X-axis labels row */}
      <View style={{ position: 'relative', height: 14, width: svgWidth }}>
        {xLabels.map(({ i, label }) => (
          <Text
            key={i}
            style={{
              position: 'absolute',
              left: getX(i) - 12,
              top: 2,
              width: 28,
              fontSize: 6.5,
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};
