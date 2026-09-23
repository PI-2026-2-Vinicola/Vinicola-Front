import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type Plugin,
} from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler);

export const INK = {
  primary: '#1f1a1d',
  secondary: '#5f575b',
  muted: '#9c9397',
  grid: '#f1ebee',
  axis: '#e2d8dc',
  surface: '#ffffff',
};

Chart.defaults.font.family = "'Inter Variable', Inter, system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = INK.muted;
Chart.defaults.borderColor = INK.grid;
Chart.defaults.animation = { duration: 900, easing: 'easeOutQuart' };
Chart.defaults.plugins.legend.display = false;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.responsive = true;

const tooltip = Chart.defaults.plugins.tooltip;
tooltip.backgroundColor = '#ffffff';
tooltip.titleColor = INK.primary;
tooltip.bodyColor = INK.secondary;
tooltip.borderColor = '#eadfe4';
tooltip.borderWidth = 1;
tooltip.padding = 12;
tooltip.cornerRadius = 12;
tooltip.boxPadding = 6;
tooltip.usePointStyle = true;
tooltip.titleFont = { weight: 600, size: 13 };
tooltip.bodyFont = { size: 12.5 };
tooltip.caretSize = 6;

/** Rótulo de valor na ponta das barras horizontais (rotulagem seletiva, texto em tinta neutra). */
export const barValueLabels: Plugin<'bar'> = {
  id: 'barValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const horizontal = chart.options.indexAxis === 'y';
    ctx.save();
    ctx.font = "600 12px 'Inter Variable', Inter, system-ui, sans-serif";
    ctx.fillStyle = INK.secondary;
    chart.data.datasets.forEach((ds, di) => {
      const meta = chart.getDatasetMeta(di);
      if (meta.hidden) return;
      meta.data.forEach((el, i) => {
        const v = ds.data[i] as number;
        if (!v) return;
        const { x, y } = el.getProps(['x', 'y'], true) as { x: number; y: number };
        const text = v.toLocaleString('pt-BR');
        if (horizontal) {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x + 8, y);
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(text, x, y - 6);
        }
      });
    });
    ctx.restore();
  },
};

/** Linha vertical de mira (crosshair) em gráficos de linha. */
export const crosshair: Plugin<'line'> = {
  id: 'crosshair',
  afterDraw(chart) {
    const active = chart.tooltip?.getActiveElements();
    if (!active?.length) return;
    const x = active[0].element.x;
    const { top, bottom } = chart.chartArea;
    const ctx = chart.ctx;
    ctx.save();
    ctx.strokeStyle = '#d9cdd2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.restore();
  },
};

export { Chart };
