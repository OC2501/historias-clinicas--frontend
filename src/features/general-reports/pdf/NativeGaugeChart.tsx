import { View, Text, Svg, Path, Circle } from '@react-pdf/renderer';

interface NativeGaugeChartProps {
  rate: number; // 0–100
  size?: number;
  color?: string;
}

export const NativeGaugeChart = ({ rate = 0, size = 160, color = '#10b981' }: NativeGaugeChartProps) => {
  const clampedRate = Math.max(0, Math.min(100, rate));

  const cx = size / 2;
  const cy = size * 0.55;
  const r = size * 0.38;
  const strokeWidth = size * 0.09;

  // Semicircle from left (180°) to right (0°), going clockwise
  const polarToCartesian = (angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),   // subtract because SVG y-axis is inverted
  });

  const trackStart = polarToCartesian(Math.PI);   // left endpoint
  const trackEnd = polarToCartesian(0);             // right endpoint

  // Background track: full semicircle
  const trackPath = `M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 0 1 ${trackEnd.x} ${trackEnd.y}`;

  // Value arc: from left endpoint to angle proportional to rate
  // rate=0 → angle PI (stays at left), rate=100 → angle 0 (reaches right)
  const valueAngle = Math.PI - (clampedRate / 100) * Math.PI;
  const valueEnd = polarToCartesian(valueAngle);
  const largeArc = clampedRate > 50 ? 1 : 0;
  const valuePath = clampedRate > 0
    ? `M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 ${largeArc} 1 ${valueEnd.x} ${valueEnd.y}`
    : '';

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ position: 'relative' }}>
        <Svg width={size} height={size * 0.65}>
          {/* Background track */}
          <Path
            d={trackPath}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          {/* Colored value arc */}
          {clampedRate > 0 && (
            <Path
              d={valuePath}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
          )}
          {/* Center dot */}
          <Circle cx={cx} cy={cy} r={4} fill={color} />
        </Svg>

        {/* Percentage text - overlaid using absolute position */}
        <Text
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: size * 0.35,
            fontSize: 20,
            fontFamily: 'Helvetica-Bold',
            color: '#1e293b',
            textAlign: 'center',
          }}
        >
          {clampedRate.toFixed(1)}%
        </Text>
      </View>

      <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>
        Tasa de Altas Médicas
      </Text>
    </View>
  );
};
