/**
 * Canvas Chart Helpers for Excel Export
 * Generates ultra-crisp, high-DPI chart PNG images using HTML5 Canvas API in browser
 * and embeds them cleanly into ExcelJS Worksheets.
 */

// Helper to create a high-DPI canvas
function createHDCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; scale: number } {
  const canvas = document.createElement('canvas');
  const scale = 2; // 2x retina scale for sharp rendering
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  return { canvas, ctx, scale };
}

// Draw rounded rectangle
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill?: string,
  stroke?: string
) {
  if (width <= 0 || height <= 0) return;
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/**
 * 1. Horizontal Bar Chart (Ideal for Top Diagnoses & Gerencias)
 */
export function generateHorizontalBarChartImage(options: {
  title: string;
  subtitle?: string;
  items: { label: string; value: number; color?: string }[];
  width?: number;
  height?: number;
}): string {
  const width = options.width || 600;
  const height = options.height || Math.max(280, (options.items.length * 36) + 100);
  const { canvas, ctx } = createHDCanvas(width, height);

  // Background card
  drawRoundedRect(ctx, 0, 0, width, height, 16, '#FFFFFF', '#E2E8F0');

  // Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(options.title, 24, 34);

  if (options.subtitle) {
    ctx.fillStyle = '#64748B';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText(options.subtitle, 24, 52);
  }

  const startY = options.subtitle ? 70 : 55;
  const items = options.items.slice(0, 10);
  const maxValue = Math.max(...items.map(i => i.value), 1);
  const defaultColors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

  const labelWidth = 180;
  const chartRight = width - 70;
  const availableBarWidth = chartRight - (24 + labelWidth + 10);
  const itemHeight = Math.min(28, (height - startY - 20) / (items.length || 1));

  items.forEach((item, index) => {
    const y = startY + (index * itemHeight);
    const barY = y + 4;
    const barHeight = Math.max(12, itemHeight - 10);
    const color = item.color || defaultColors[index % defaultColors.length];

    // Label
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'left';
    const truncatedLabel = item.label.length > 25 ? item.label.substring(0, 23) + '...' : item.label;
    ctx.fillText(truncatedLabel, 24, y + (itemHeight / 2) + 2);

    // Bar background track
    const barStartX = 24 + labelWidth + 10;
    drawRoundedRect(ctx, barStartX, barY, availableBarWidth, barHeight, 6, '#F1F5F9');

    // Filled Bar
    const barWidth = Math.max(6, (item.value / maxValue) * availableBarWidth);
    drawRoundedRect(ctx, barStartX, barY, barWidth, barHeight, 6, color);

    // Value text
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.value.toLocaleString(), barStartX + barWidth + 8, y + (itemHeight / 2) + 2);
  });

  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
}

/**
 * 2. Grouped Vertical Bar Chart (e.g. Consultas vs Reposos por Gerencia)
 */
export function generateGroupedBarChartImage(options: {
  title: string;
  subtitle?: string;
  labels: string[];
  datasets: { name: string; values: number[]; color: string }[];
  width?: number;
  height?: number;
}): string {
  const width = options.width || 620;
  const height = options.height || 320;
  const { canvas, ctx } = createHDCanvas(width, height);

  // Background
  drawRoundedRect(ctx, 0, 0, width, height, 16, '#FFFFFF', '#E2E8F0');

  // Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(options.title, 24, 34);

  if (options.subtitle) {
    ctx.fillStyle = '#64748B';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText(options.subtitle, 24, 52);
  }

  // Legend
  const legendY = 30;
  let legendX = width - 24;
  options.datasets.slice().reverse().forEach((ds) => {
    ctx.font = 'bold 11px Arial, sans-serif';
    const textWidth = ctx.measureText(ds.name).width;
    legendX -= (textWidth + 24);

    ctx.fillStyle = ds.color;
    drawRoundedRect(ctx, legendX, legendY - 10, 12, 12, 3, ds.color);

    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText(ds.name, legendX + 16, legendY);
  });

  const chartLeft = 50;
  const chartRight = width - 24;
  const chartTop = 80;
  const chartBottom = height - 45;
  const chartHeight = chartBottom - chartTop;
  const chartWidth = chartRight - chartLeft;

  let allVals: number[] = [];
  options.datasets.forEach(d => allVals.push(...d.values));
  const maxVal = Math.max(...allVals, 1);
  const niceMax = Math.ceil(maxVal * 1.15) || 5;

  // Grid lines
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const y = chartBottom - (i / gridCount) * chartHeight;
    const val = Math.round((i / gridCount) * niceMax);

    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toString(), chartLeft - 8, y + 3);
  }

  const categoryCount = options.labels.length;
  const categoryWidth = chartWidth / (categoryCount || 1);
  const datasetCount = options.datasets.length;
  const groupBarWidth = Math.min(22, (categoryWidth * 0.7) / datasetCount);

  options.labels.forEach((label, catIdx) => {
    const groupCenterX = chartLeft + (catIdx * categoryWidth) + (categoryWidth / 2);
    const totalGroupWidth = datasetCount * groupBarWidth + (datasetCount - 1) * 3;
    const groupStartX = groupCenterX - (totalGroupWidth / 2);

    options.datasets.forEach((ds, dsIdx) => {
      const val = ds.values[catIdx] || 0;
      const barHeight = (val / niceMax) * chartHeight;
      const barX = groupStartX + (dsIdx * (groupBarWidth + 3));
      const barY = chartBottom - barHeight;

      drawRoundedRect(ctx, barX, barY, groupBarWidth, barHeight, 4, ds.color);

      // Value label on top of bar if space
      if (barHeight > 10) {
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 9px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(val.toString(), barX + (groupBarWidth / 2), barY - 4);
      }
    });

    // X Axis Label
    ctx.fillStyle = '#475569';
    ctx.font = '10px Arial, sans-serif';
    ctx.textAlign = 'center';
    const truncatedLabel = label.length > 12 ? label.substring(0, 10) + '..' : label;
    ctx.fillText(truncatedLabel, groupCenterX, chartBottom + 16);
  });

  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
}

/**
 * 3. Doughnut / Pie Chart (Demographics, Gender, Appointment Status)
 */
export function generateDoughnutChartImage(options: {
  title: string;
  subtitle?: string;
  items: { label: string; value: number; color: string }[];
  centerText?: string;
  centerSubtext?: string;
  width?: number;
  height?: number;
}): string {
  const width = options.width || 480;
  const height = options.height || 290;
  const { canvas, ctx } = createHDCanvas(width, height);

  // Background
  drawRoundedRect(ctx, 0, 0, width, height, 16, '#FFFFFF', '#E2E8F0');

  // Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(options.title, 24, 34);

  if (options.subtitle) {
    ctx.fillStyle = '#64748B';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText(options.subtitle, 24, 52);
  }

  const total = options.items.reduce((sum, item) => sum + item.value, 0);
  const centerX = 130;
  const centerY = (height / 2) + 15;
  const outerRadius = 80;
  const innerRadius = 50;

  if (total === 0) {
    // Empty state
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#F1F5F9';
    ctx.fill();

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sin Datos', centerX, centerY + 4);
  } else {
    let currentAngle = -Math.PI / 2;

    options.items.forEach((item) => {
      if (item.value <= 0) return;
      const sliceAngle = (item.value / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();

      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(options.centerText || total.toLocaleString(), centerX, centerY + (options.centerSubtext ? 0 : 6));

    if (options.centerSubtext) {
      ctx.fillStyle = '#64748B';
      ctx.font = '10px Arial, sans-serif';
      ctx.fillText(options.centerSubtext, centerX, centerY + 16);
    }
  }

  // Legend on right
  const legendStartX = 240;
  const legendStartY = 85;
  const itemGap = 28;

  options.items.forEach((item, index) => {
    const y = legendStartY + (index * itemGap);
    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';

    // Color square
    drawRoundedRect(ctx, legendStartX, y - 9, 14, 14, 4, item.color);

    // Label
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, legendStartX + 22, y + 2);

    // Value & percentage
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.value.toLocaleString()} (${pct}%)`, width - 24, y + 2);
  });

  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
}

/**
 * 4. Line / Area Trend Chart (Evolution of Consultations)
 */
export function generateLineTrendChartImage(options: {
  title: string;
  subtitle?: string;
  labels: string[];
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}): string {
  const width = options.width || 620;
  const height = options.height || 300;
  const { canvas, ctx } = createHDCanvas(width, height);

  const mainColor = options.color || '#4F46E5';

  // Background
  drawRoundedRect(ctx, 0, 0, width, height, 16, '#FFFFFF', '#E2E8F0');

  // Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(options.title, 24, 34);

  if (options.subtitle) {
    ctx.fillStyle = '#64748B';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText(options.subtitle, 24, 52);
  }

  const chartLeft = 50;
  const chartRight = width - 30;
  const chartTop = 80;
  const chartBottom = height - 45;
  const chartHeight = chartBottom - chartTop;
  const chartWidth = chartRight - chartLeft;

  const maxVal = Math.max(...options.data, 1);
  const niceMax = Math.ceil(maxVal * 1.2) || 5;

  // Grid lines
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const y = chartBottom - (i / gridCount) * chartHeight;
    const val = Math.round((i / gridCount) * niceMax);

    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toString(), chartLeft - 8, y + 3);
  }

  const count = options.labels.length;
  if (count <= 0) return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');

  const stepX = count > 1 ? chartWidth / (count - 1) : chartWidth / 2;

  // Calculate points
  const points = options.data.map((val, idx) => {
    const x = count === 1 ? chartLeft + (chartWidth / 2) : chartLeft + (idx * stepX);
    const y = chartBottom - ((val / niceMax) * chartHeight);
    return { x, y, val, label: options.labels[idx] };
  });

  // Gradient area fill
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, chartBottom);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, chartBottom);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, chartTop, 0, chartBottom);
    gradient.addColorStop(0, `${mainColor}40`);
    gradient.addColorStop(1, `${mainColor}05`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // Draw line
  ctx.beginPath();
  points.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw points & labels
  points.forEach((p) => {
    // Dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Value label
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.val.toString(), p.x, p.y - 8);

    // X Axis Label
    ctx.fillStyle = '#475569';
    ctx.font = '10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, p.x, chartBottom + 16);
  });

  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
}
