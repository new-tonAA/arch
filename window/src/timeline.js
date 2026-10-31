// The film's single source of truth. Times in seconds.
export const DUR = 112.0;

export const SEC = [
  { id: 'stone', a: 0.0, b: 22.0, name: '石', en: 'STONE' },
  { id: 'glass', a: 22.0, b: 37.0, name: '光', en: 'LIGHT' },
  { id: 'line', a: 37.0, b: 50.0, name: '线', en: 'LINE' },
  { id: 'iron', a: 50.0, b: 64.0, name: '铁', en: 'IRON' },
  { id: 'grid', a: 64.0, b: 77.0, name: '网格', en: 'GRID' },
  { id: 'play', a: 77.0, b: 89.0, name: '玩笑', en: 'PLAY' },
  { id: 'data', a: 89.0, b: 103.0, name: '数据', en: 'DATA' },
  { id: 'coda', a: 103.0, b: 112.0, name: '窗', en: 'WINDOW' },
];

// Narration. t0 is when the voice starts; t1 when the burned-in line leaves.
// Filled from the real voice durations (voice/dur.json) by tools/timing.py.
export const LINES = [
  { id: 'l1', t0: 1.6, t1: 8.2, text: '建筑史，也许只是墙上的一道缝，慢慢张开。', scene: 'stone' },
  { id: 'l2', t0: 9.2, t1: 16.8, text: '公元前五世纪，石柱之间，光和风第一次被允许进来。', scene: 'stone' },
  { id: 'l3', t0: 23.0, t1: 31.6, text: '中世纪，人们把光砌进墙里；哥特式窗户，向上帝借来颜色。', scene: 'glass' },
  { id: 'l4', t0: 38.2, t1: 45.4, text: '文艺复兴，阿尔伯蒂说：画，是一扇敞开的窗。', scene: 'line' },
  { id: 'l5', t0: 51.0, t1: 58.8, text: '一八五一年，铁与玻璃把墙变成一层薄膜。', scene: 'iron' },
  { id: 'l6', t0: 65.2, t1: 72.4, text: '现代主义者说：墙就是窗；网格统治一切。', scene: 'grid' },
  { id: 'l7', t0: 78.2, t1: 84.6, text: '后现代来了，窗开始开玩笑。', scene: 'play' },
  { id: 'l8', t0: 90.2, t1: 98.0, text: '今天，窗学会了计算；建筑变成一层会呼吸的皮肤。', scene: 'data' },
  { id: 'l9', t0: 104.2, t1: 110.2, text: '而最初的那道缝，至今仍在。', scene: 'coda' },
];

export function sceneAt(t) {
  for (const s of SEC) if (t >= s.a && t < s.b) return s;
  return SEC[SEC.length - 1];
}
