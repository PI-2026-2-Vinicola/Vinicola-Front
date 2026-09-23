import { memo, useId, useMemo, type ReactElement } from 'react';
import { ANOMALY_LABELS, clusterHalfWidth } from '../../data/generate';
import type { Detection, VarietyId } from '../../data/types';
import { GRAPE_TONES, VARIETY_BY_ID } from '../../data/varieties';
import { formatTime } from '../../lib/format';
import { between, mulberry32, type Rng } from '../../lib/random';

const W = 400;
const H = 300;

interface GrapeSceneProps {
  seed: number;
  varietyId: VarietyId;
  detections: Detection[];
  capturedAt?: string;
  sensorId?: string;
  block?: string;
  imageUrl?: string;
  hud?: boolean;
  showBoxes?: boolean;
  animateBoxes?: boolean;
  scanning?: boolean;
  className?: string;
  title?: string;
}

interface Berry {
  x: number;
  y: number;
  r: number;
  effect?: string;
  seed: number;
}

const SEVERE = new Set(ANOMALY_LABELS.critica);

function buildBerries(rng: Rng, box: Detection['box'], varietyId: VarietyId, anomalies: Detection[]): Berry[] {
  const [bx, by, bw, bh] = [box[0] * W, box[1] * H, box[2] * W, box[3] * H];
  const r = Math.min(12, Math.max(7.5, bw / 14.5));
  const loose = varietyId === 'touriga-nacional' ? 0.12 : 0.035;
  const berries: Berry[] = [];
  const step = r * 1.6;
  for (let i = 0, yy = by + r * 1.1; yy < by + bh - r * 0.4; i++, yy += step) {
    const v = (yy - by) / bh;
    const half = Math.max(r * 0.2, (clusterHalfWidth(v) * bw) / 2 - r * 0.7);
    const n = Math.max(1, Math.floor((2 * half) / (r * 1.78)) + 1);
    const offset = i % 2 ? r * 0.45 : -r * 0.2;
    for (let j = 0; j < n; j++) {
      if (rng() < loose) continue;
      const t = n === 1 ? 0.5 : j / (n - 1);
      const x = bx + bw / 2 - half + t * 2 * half + offset + between(rng, -r * 0.2, r * 0.2);
      const y = yy + between(rng, -r * 0.18, r * 0.18);
      berries.push({ x, y, r: r * between(rng, 0.9, 1.08), seed: rng() });
    }
  }
  // Aplica efeitos visuais nas bagas dentro das caixas de anomalia.
  for (const a of anomalies) {
    const [ax, ay, aw, ah] = [a.box[0] * W, a.box[1] * H, a.box[2] * W, a.box[3] * H];
    for (const b of berries) {
      if (b.x > ax - r * 0.3 && b.x < ax + aw + r * 0.3 && b.y > ay - r * 0.3 && b.y < ay + ah + r * 0.3) b.effect = a.label;
    }
  }
  // Bagas centrais e inferiores ficam à frente.
  const cx = bx + bw / 2;
  return berries.sort((p, q) => p.y + (1 - Math.abs(p.x - cx) / bw) * r * 1.4 - (q.y + (1 - Math.abs(q.x - cx) / bw) * r * 1.4));
}

function lightingFor(capturedAt?: string) {
  const h = capturedAt ? new Date(capturedAt).getHours() : 11;
  if (h < 9) return { color: '#cfe0ff', opacity: 0.14 };
  if (h >= 15) return { color: '#ffae5c', opacity: 0.2 };
  return { color: '#fff3c9', opacity: 0.12 };
}

const LEAF_PATH =
  'M0 60 C -6 48 -20 50 -34 42 C -48 44 -60 34 -56 22 C -70 14 -66 -4 -52 -6 C -60 -22 -46 -36 -32 -30 C -30 -46 -14 -54 -4 -44 C 0 -58 14 -58 18 -44 C 30 -54 46 -44 42 -30 C 58 -34 68 -18 56 -6 C 70 0 68 18 54 22 C 60 36 46 46 34 42 C 20 50 6 48 0 60 Z';

function GrapeSceneInner(props: GrapeSceneProps) {
  const { seed, varietyId, detections, capturedAt, sensorId, block, imageUrl, hud = false, showBoxes = true, animateBoxes = false, scanning = false, className, title } = props;
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const tones = GRAPE_TONES[varietyId];
  const white = VARIETY_BY_ID[varietyId].type === 'Branca';

  const scene = useMemo(() => {
    const rng = mulberry32(seed);
    const bokeh = Array.from({ length: 14 }, () => ({
      x: between(rng, 0, W),
      y: between(rng, 0, H),
      r: between(rng, 8, 34),
      o: between(rng, 0.12, 0.35),
      c: rng() < 0.5 ? '#d9f0a3' : '#f5f0c8',
    }));
    const leaves = [
      { x: between(rng, -10, 40), y: between(rng, 30, 90), s: between(rng, 1.3, 1.7), rot: between(rng, -40, 10) },
      { x: between(rng, 340, 410), y: between(rng, 10, 70), s: between(rng, 1.1, 1.5), rot: between(rng, 120, 200) },
      { x: between(rng, 330, 400), y: between(rng, 220, 290), s: between(rng, 1.2, 1.6), rot: between(rng, 30, 90) },
      { x: between(rng, -20, 40), y: between(rng, 230, 300), s: between(rng, 1.0, 1.4), rot: between(rng, -120, -60) },
    ];
    const wireY = between(rng, 30, 46);
    const clusters = detections.filter((d) => d.kind === 'cacho');
    const anomalies = detections.filter((d) => d.kind === 'anomalia');
    const clusterBerries = clusters.map((c, i) => buildBerries(mulberry32(seed + i * 97), c.box, varietyId, i === 0 ? anomalies : []));
    return { bokeh, leaves, wireY, clusters, clusterBerries };
  }, [seed, detections, varietyId]);

  const light = lightingFor(capturedAt);
  const unripe = white ? ['#a6c25e', '#6f9a3a', '#4d7328'] : ['#d27a95', '#a8466a', '#6e2443'];
  const rotten = white ? ['#b69a63', '#86683c', '#4f3a1e'] : ['#8a6a55', '#5b3f33', '#2e1d17'];
  const dry = white ? ['#b59a55', '#8a6c32', '#5a4219'] : ['#6b4a5a', '#452c3a', '#24141c'];

  const gradient = (name: string, [l, m, d]: string[]) => (
    <radialGradient id={`${uid}-${name}`} cx="38%" cy="32%" r="75%" fx="32%" fy="26%">
      <stop offset="0" stopColor={l} />
      <stop offset="0.3" stopColor={m} />
      <stop offset="0.9" stopColor={d} />
    </radialGradient>
  );

  const renderBerry = (b: Berry, k: number) => {
    const rr = mulberry32(Math.floor(b.seed * 1e9));
    const effect = b.effect;
    let fill = `url(#${uid}-berry)`;
    let r = b.r;
    const extras: ReactElement[] = [];
    if (effect === 'maturacao_desigual') fill = `url(#${uid}-unripe)`;
    if (effect === 'baga_irregular') r = b.r * 0.62;
    if (effect === 'podridao') {
      fill = `url(#${uid}-rotten)`;
      for (let i = 0; i < 5; i++)
        extras.push(<circle key={i} cx={b.x + between(rr, -r * 0.6, r * 0.6)} cy={b.y + between(rr, -r * 0.6, r * 0.6)} r={between(rr, r * 0.12, r * 0.28)} fill="#dcd6ca" opacity={0.6} />);
    }
    if (effect === 'mancha_leve')
      for (let i = 0; i < 3; i++)
        extras.push(<circle key={i} cx={b.x + between(rr, -r * 0.5, r * 0.5)} cy={b.y + between(rr, -r * 0.5, r * 0.5)} r={r * 0.12} fill="#5a3b22" opacity={0.75} />);
    if (effect === 'lesao') {
      extras.push(<circle key="s" cx={b.x + r * 0.15} cy={b.y + r * 0.1} r={r * 0.38} fill="#24150d" opacity={0.8} />);
      extras.push(<path key="c" d={`M${b.x - r * 0.5} ${b.y - r * 0.2} l${r * 0.35} ${r * 0.25} l${r * 0.2} -${r * 0.3} l${r * 0.35} ${r * 0.35}`} stroke="#1a0f0a" strokeWidth={0.9} fill="none" />);
    }
    if (effect === 'baga_murcha') {
      return (
        <g key={k}>
          <ellipse cx={b.x} cy={b.y} rx={r * 0.8} ry={r * 0.66} fill={`url(#${uid}-dry)`} stroke="rgba(0,0,0,.35)" strokeWidth={0.6} />
          <path d={`M${b.x - r * 0.5} ${b.y - r * 0.1} q ${r * 0.3} ${r * 0.25} ${r * 0.6} 0 M${b.x - r * 0.2} ${b.y + r * 0.3} q ${r * 0.25} -${r * 0.2} ${r * 0.5} 0`} stroke="rgba(0,0,0,.4)" strokeWidth={0.8} fill="none" />
        </g>
      );
    }
    const bloom = tones.bloom && !effect;
    return (
      <g key={k}>
        <circle cx={b.x} cy={b.y} r={r} fill={fill} stroke="rgba(0,0,0,.22)" strokeWidth={0.6} />
        {bloom && <circle cx={b.x} cy={b.y} r={r} fill={`url(#${uid}-bloom)`} />}
        {extras}
        <ellipse cx={b.x - r * 0.36} cy={b.y - r * 0.4} rx={r * 0.26} ry={r * 0.16} fill="#fff" opacity={white ? 0.55 : 0.4} transform={`rotate(-30 ${b.x - r * 0.36} ${b.y - r * 0.4})`} />
      </g>
    );
  };

  const hudTime = capturedAt ? formatTime(capturedAt) : '--:--';

  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title ?? `Imagem capturada — ${VARIETY_BY_ID[varietyId].name}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#6c8a44" />
          <stop offset="0.5" stopColor="#35502a" />
          <stop offset="1" stopColor="#1c2b17" />
        </linearGradient>
        <linearGradient id={`${uid}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f7a32" />
          <stop offset="1" stopColor="#253f1b" />
        </linearGradient>
        <radialGradient id={`${uid}-vig`} cx="50%" cy="50%" r="70%">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
        <radialGradient id={`${uid}-bloom`} cx="50%" cy="40%" r="60%">
          <stop offset="0.3" stopColor="#c9d2ee" stopOpacity="0" />
          <stop offset="1" stopColor="#c9d2ee" stopOpacity="0.2" />
        </radialGradient>
        {gradient('berry', [tones.light, tones.mid, tones.dark])}
        {gradient('unripe', unripe)}
        {gradient('rotten', rotten)}
        {gradient('dry', dry)}
        <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
        </filter>
        <linearGradient id={`${uid}-scan`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0b9cb" stopOpacity="0" />
          <stop offset="0.9" stopColor="#f0b9cb" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
        </linearGradient>
        <pattern id={`${uid}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#fff" strokeOpacity="0.08" strokeWidth="0.6" />
        </pattern>
      </defs>

      {imageUrl ? (
        <image href={imageUrl} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <g>
          <rect width={W} height={H} fill={`url(#${uid}-bg)`} />
          <g filter={`url(#${uid}-blur)`}>
            {scene.bokeh.map((b, i) => (
              <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity={b.o} />
            ))}
          </g>
          <g filter={`url(#${uid}-soft)`} opacity="0.9">
            {scene.leaves.map((l, i) => (
              <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(${l.s})`}>
                <path d={LEAF_PATH} fill={`url(#${uid}-leaf)`} />
                <path d="M0 55 L0 -40 M0 10 L-40 -20 M0 10 L40 -20 M0 30 L-45 20 M0 30 L45 20" stroke="#7fa35a" strokeOpacity="0.35" strokeWidth="1.4" fill="none" />
              </g>
            ))}
          </g>
          {/* Arame da espaldeira e ramo */}
          <path d={`M-10 ${scene.wireY} Q 200 ${scene.wireY + 10} 410 ${scene.wireY - 4}`} stroke="#d8d2c0" strokeOpacity="0.55" strokeWidth="1.2" fill="none" />
          <path d={`M-10 ${scene.wireY + 6} C 90 ${scene.wireY - 6} 170 ${scene.wireY + 16} 250 ${scene.wireY + 4} S 380 ${scene.wireY + 12} 410 ${scene.wireY}`} stroke="#6e5536" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d={`M-10 ${scene.wireY + 6} C 90 ${scene.wireY - 6} 170 ${scene.wireY + 16} 250 ${scene.wireY + 4} S 380 ${scene.wireY + 12} 410 ${scene.wireY}`} stroke="#9a7b50" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />

          {scene.clusters.map((c, ci) => {
            const [bx, by, bw] = [c.box[0] * W, c.box[1] * H, c.box[2] * W];
            const topX = bx + bw / 2;
            return (
              <g key={ci} filter={`url(#${uid}-shadow)`}>
                <path d={`M${topX} ${by + 6} C ${topX + 4} ${by - 10} ${topX - 6} ${scene.wireY + 18} ${topX + 2} ${scene.wireY + 8}`} stroke="#7a643d" strokeWidth="3.4" fill="none" strokeLinecap="round" />
                <path d={`M${topX} ${by + 6} L ${topX - bw * 0.25} ${by + bw * 0.35} M${topX} ${by + 6} L ${topX + bw * 0.22} ${by + bw * 0.4} M${topX} ${by + 6} L ${topX + 2} ${by + bw * 0.9}`} stroke="#86704a" strokeWidth="1.8" fill="none" />
                {scene.clusterBerries[ci].map(renderBerry)}
              </g>
            );
          })}

          <rect width={W} height={H} fill={light.color} opacity={light.opacity} style={{ mixBlendMode: 'soft-light' }} />
          <rect width={W} height={H} fill={`url(#${uid}-vig)`} />
        </g>
      )}

      {scanning && (
        <g>
          <rect width={W} height={H} fill={`url(#${uid}-grid)`} />
          <g>
            <rect x="0" y="-60" width={W} height="60" fill={`url(#${uid}-scan)`} />
            <rect x="0" y="-1.5" width={W} height="1.5" fill="#fff" opacity="0.85" />
            <animateTransform attributeName="transform" type="translate" from="0 0" to={`0 ${H + 60}`} dur="1.8s" repeatCount="indefinite" />
          </g>
        </g>
      )}

      {showBoxes &&
        detections.map((d, i) => {
          const [x, y, w, h] = [d.box[0] * W, d.box[1] * H, d.box[2] * W, d.box[3] * H];
          const isCluster = d.kind === 'cacho';
          const color = isCluster ? '#f7d6e1' : SEVERE.has(d.label) ? '#ff6b6b' : '#ffc53d';
          const text = `${d.label} ${d.confidence.toFixed(2)}`;
          const tw = text.length * 5.3 + 10;
          const labelY = y - 13 < 2 ? y + 1 : y - 13;
          const labelX = Math.min(x, W - tw - 2);
          return (
            <g key={i} className={animateBoxes ? 'yolo-box animate' : 'yolo-box'} style={{ animationDelay: `${i * 220}ms` }}>
              <rect x={x} y={y} width={w} height={h} fill={isCluster ? 'rgba(247,214,225,.06)' : 'none'} stroke={color} strokeWidth={isCluster ? 1.6 : 1.3} rx="2" pathLength={100} className="yolo-rect" />
              {isCluster &&
                [
                  [x, y, 1, 1],
                  [x + w, y, -1, 1],
                  [x, y + h, 1, -1],
                  [x + w, y + h, -1, -1],
                ].map(([cx, cy, sx, sy], k) => <path key={k} d={`M${cx} ${cy + sy * 12} V${cy} H${cx + sx * 12}`} stroke="#fff" strokeWidth="2.6" fill="none" />)}
              <g className="yolo-label">
                <rect x={labelX} y={labelY} width={tw} height="12" rx="2" fill={isCluster ? '#86264e' : color} />
                <text x={labelX + 5} y={labelY + 8.6} fontSize="8.4" fontFamily="ui-monospace, Menlo, monospace" fill={isCluster ? '#fff' : '#2a1a10'} fontWeight="600">
                  {text}
                </text>
              </g>
            </g>
          );
        })}

      {hud && (
        <g fontFamily="ui-monospace, Menlo, monospace" fontSize="9" fill="#fff">
          {[
            [10, 10, 1, 1],
            [W - 10, 10, -1, 1],
            [10, H - 10, 1, -1],
            [W - 10, H - 10, -1, -1],
          ].map(([cx, cy, sx, sy], k) => (
            <path key={k} d={`M${cx} ${cy + sy * 16} V${cy} H${cx + sx * 16}`} stroke="#fff" strokeOpacity="0.75" strokeWidth="1.5" fill="none" />
          ))}
          <text x="20" y="25" opacity="0.9">
            {sensorId ?? 'S-000'} · {(block ?? '').toUpperCase()}
          </text>
          <circle cx={W - 80} cy="22" r="3" fill="#ff5a5a">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" />
          </circle>
          <text x={W - 73} y="25" opacity="0.9">
            REC {hudTime}
          </text>
          <text x="20" y={H - 17} opacity="0.75">
            ESP32-CAM · 1600×1200 · JPEG
          </text>
          <text x={W - 20} y={H - 17} opacity="0.75" textAnchor="end">
            OSAIS
          </text>
        </g>
      )}
    </svg>
  );
}

export const GrapeScene = memo(GrapeSceneInner);
