import { View, Text } from '@react-pdf/renderer';
import type { TopDiagnosis } from '../types/reports.types';

interface NativeHorizontalBarChartProps {
  data: TopDiagnosis[];
  width?: number;
}

const COLORS = [
  '#1e3a8a', '#3b82f6', '#3b82f6', '#60a5fa', '#60a5fa',
  '#93c5fd', '#93c5fd', '#bfdbfe', '#bfdbfe', '#dbeafe',
];

export const NativeHorizontalBarChart = ({ data = [], width = 380 }: NativeHorizontalBarChartProps) => {
  if (data.length === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 80 }}>
        <Text style={{ fontSize: 9, color: '#94a3b8' }}>Sin datos disponibles</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((acc, d) => acc + d.count, 0);
  const labelWidth = 115;

  return (
    <View style={{ paddingVertical: 4 }}>
      {data.map((item, i) => {
        const barWidth = Math.max((item.count / maxVal) * width, 3);
        const barColor = COLORS[i % COLORS.length];
        const label = item.name.length > 18 ? item.name.substring(0, 18) + '…' : item.name;
        return (
          <View
            key={i}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}
          >
            {/* Rank */}
            <Text style={{ fontSize: 7, color: '#94a3b8', width: 14, textAlign: 'right', marginRight: 4 }}>
              {i + 1}.
            </Text>
            {/* Label */}
            <Text style={{ fontSize: 7.5, width: labelWidth - 18, color: '#374151', textAlign: 'right', paddingRight: 8 }}>
              {label}
            </Text>
            {/* Bar */}
            <View
              style={{
                width: barWidth,
                height: 14,
                backgroundColor: barColor,
                borderRadius: 3,
              }}
            />
            {/* Value + Percentage */}
            <Text style={{ fontSize: 7.5, marginLeft: 6, color: '#1e293b', fontFamily: 'Helvetica-Bold' }}>
              {item.count}
            </Text>
            <Text style={{ fontSize: 7, marginLeft: 4, color: '#6b7280' }}>
              ({total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0'}%)
            </Text>
          </View>
        );
      })}
    </View>
  );
};
