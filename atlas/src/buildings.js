// 72 buildings, one plate each. Years are completion (or first completion) dates;
// "c." / 约 marks an approximate date. Facts are deliberately short for a 4.5 s plate.
export const ERA = [
  { id: 'ancient', cn: '古代', en: 'ANCIENT', from: -2600, to: 500, bg: '#efe6d3', ink: '#241a12', accent: '#b5643c', mode: 'engraving' },
  { id: 'medieval', cn: '中世纪', en: 'MEDIEVAL', from: 500, to: 1400, bg: '#1b1612', ink: '#e8d3a2', accent: '#d4a441', mode: 'lapis' },
  { id: 'renaissance', cn: '文艺复兴与巴洛克', en: 'RENAISSANCE & BAROQUE', from: 1400, to: 1750, bg: '#f1e8d2', ink: '#3b2a1a', accent: '#b46b4a', mode: 'wash' },
  { id: 'industrial', cn: '工业', en: 'INDUSTRIAL', from: 1750, to: 1910, bg: '#17336b', ink: '#e9f2fb', accent: '#9fc8f0', mode: 'blueprint' },
  { id: 'modern', cn: '现代主义', en: 'MODERN', from: 1910, to: 1975, bg: '#f0efe9', ink: '#111111', accent: '#e30613', mode: 'swiss' },
  { id: 'postmodern', cn: '后现代', en: 'POSTMODERN', from: 1975, to: 2000, bg: '#f7efdd', ink: '#17131f', accent: '#ff5a5f', mode: 'memphis' },
  { id: 'contemporary', cn: '当代', en: 'CONTEMPORARY', from: 2000, to: 2026, bg: '#05080c', ink: '#dff6f2', accent: '#7fe7e0', mode: 'points' },
];

export const B = [
  // — ANCIENT —
  { y: -2560, yl: '前 2560', name: '胡夫金字塔', en: 'Great Pyramid', city: '吉萨', era: 0, type: 'pyramid', s: 1.0, tag: '陵墓' },
  { y: -447, yl: '前 447', name: '帕特农神庙', en: 'Parthenon', city: '雅典', era: 0, type: 'temple', s: 1.0, tag: '神庙' },
  { y: -250, yl: '前 250', name: '桑奇大塔', en: 'Great Stupa', city: '桑奇', era: 0, type: 'stupa', s: 1.0, tag: '佛塔' },
  { y: 80, yl: '80', name: '罗马斗兽场', en: 'Colosseum', city: '罗马', era: 0, type: 'amphitheater', s: 1.0, tag: '剧场' },
  { y: 125, yl: '125', name: '万神殿', en: 'Pantheon', city: '罗马', era: 0, type: 'dome', s: 1.0, tag: '穹顶', p: { portico: 1, ribs: 1 } },
  { y: 537, yl: '537', name: '圣索菲亚', en: 'Hagia Sophia', city: '君士坦丁堡', era: 0, type: 'basilica', s: 1.0, tag: '帆拱', p: { minarets: 0, dome: 1 } },
  { y: 691, yl: '691', name: '圆顶清真寺', en: 'Dome of the Rock', city: '耶路撒冷', era: 0, type: 'basilica', s: .95, tag: '八角', p: { octagon: 1, minarets: 0, dome: 1 } },
  { y: 785, yl: '785', name: '科尔多瓦大清真寺', en: 'Great Mosque of Córdoba', city: '科尔多瓦', era: 0, type: 'basilica', s: 1.0, tag: '柱林', p: { hypostyle: 1, minarets: 1, dome: 0 } },

  // — MEDIEVAL —
  { y: 1056, yl: '1056', name: '应县木塔', en: 'Yingxian Pagoda', city: '山西', era: 1, type: 'pagoda', s: 1.0, tag: '木构', p: { tiers: 5 } },
  { y: 1150, yl: '1150', name: '吴哥窟', en: 'Angkor Wat', city: '暹粒', era: 1, type: 'angkor', s: 1.0, tag: '须弥山' },
  { y: 1163, yl: '1163', name: '巴黎圣母院', en: 'Notre-Dame', city: '巴黎', era: 1, type: 'gothic', s: 1.0, tag: '飞扶壁' },
  { y: 1194, yl: '1194', name: '沙特尔大教堂', en: 'Chartres', city: '沙特尔', era: 1, type: 'gothic', s: 1.0, tag: '彩窗' },
  { y: 1248, yl: '1248', name: '圣礼拜堂', en: 'Sainte-Chapelle', city: '巴黎', era: 1, type: 'gothic', s: .9, tag: '光盒' },
  { y: 1354, yl: '约 1354', name: '阿尔罕布拉宫', en: 'Alhambra', city: '格拉纳达', era: 1, type: 'palace', s: 1.0, tag: '摩尔' },
  { y: 1420, yl: '1420', name: '紫禁城', en: 'Forbidden City', city: '北京', era: 1, type: 'palace', s: 1.0, tag: '中轴' },
  { y: 1436, yl: '1436', name: '佛罗伦萨穹顶', en: 'Florence Duomo', city: '佛罗伦萨', era: 1, type: 'dome', s: 1.0, tag: '双层穹顶', p: { portico: 0, ribs: 1, octagon: 1 } },

  // — RENAISSANCE & BAROQUE —
  { y: 1502, yl: '1502', name: '坦比哀多', en: 'Tempietto', city: '罗马', era: 2, type: 'dome', s: .72, tag: '圆形' },
  { y: 1567, yl: '1567', name: '圆厅别墅', en: 'Villa Rotonda', city: '维琴察', era: 2, type: 'villa', s: 1.0, tag: '对称', p: { rotonda: 1 } },
  { y: 1653, yl: '1653', name: '泰姬陵', en: 'Taj Mahal', city: '阿格拉', era: 2, type: 'basilica', s: 1.0, tag: '白色大理石', p: { minarets: 4, dome: 1 } },
  { y: 1667, yl: '1667', name: '卢浮宫东立面', en: 'Louvre Colonnade', city: '巴黎', era: 2, type: 'colonnade', s: 1.0, tag: '巨柱式' },
  { y: 1710, yl: '1710', name: '圣保罗大教堂', en: "St Paul's", city: '伦敦', era: 2, type: 'dome', s: 1.0, tag: '巴洛克', p: { portico: 1, ribs: 1 } },
  { y: 1747, yl: '1747', name: '无忧宫', en: 'Sanssouci', city: '波茨坦', era: 2, type: 'palace', s: .95, tag: '洛可可', p: { rococo: 1 } },
  { y: 1780, yl: '1780', name: '波尔多大剧院', en: 'Grand Théâtre', city: '波尔多', era: 2, type: 'temple', s: .9, tag: '新古典' },
  { y: 1800, yl: '1800', name: '美国国会大厦', en: 'US Capitol', city: '华盛顿', era: 2, type: 'dome', s: 1.0, tag: '新古典', p: { portico: 1, wings: 1 } },

  // — INDUSTRIAL —
  { y: 1851, yl: '1851', name: '水晶宫', en: 'Crystal Palace', city: '伦敦', era: 3, type: 'glasshouse', s: 1.0, tag: '铁与玻璃' },
  { y: 1857, yl: '1857', name: '大英博物馆阅览室', en: 'Reading Room', city: '伦敦', era: 3, type: 'dome', s: .85, tag: '铸铁穹顶' },
  { y: 1883, yl: '1883', name: '布鲁克林大桥', en: 'Brooklyn Bridge', city: '纽约', era: 3, type: 'bridge', s: 1.0, tag: '钢缆' },
  { y: 1889, yl: '1889', name: '埃菲尔铁塔', en: 'Eiffel Tower', city: '巴黎', era: 3, type: 'tower', s: 1.0, tag: '铁塔', p: { lattice: 1, spire: 1 } },
  { y: 1891, yl: '1891', name: '温赖特大厦', en: 'Wainwright', city: '圣路易斯', era: 3, type: 'tower', s: 1.0, tag: '钢框架', p: { floors: 10 } },
  { y: 1906, yl: '1906', name: '巴特罗之家', en: 'Casa Batlló', city: '巴塞罗那', era: 3, type: 'museum', s: .9, tag: '无直线', p: { form: 'organic' } },
  { y: 1910, yl: '1910', name: '罗比住宅', en: 'Robie House', city: '芝加哥', era: 3, type: 'villa', s: 1.0, tag: '草原', p: { prairie: 1 } },
  { y: 1913, yl: '1913', name: '伍尔沃斯大厦', en: 'Woolworth', city: '纽约', era: 3, type: 'tower', s: 1.0, tag: '哥特摩天楼', p: { floors: 16, spire: 1 } },
  { y: 1923, yl: '1923', name: '兰西圣母教堂', en: 'Notre-Dame du Raincy', city: '巴黎', era: 3, type: 'concreteChurch', s: .9, tag: '清水混凝土' },

  // — MODERN —
  { y: 1926, yl: '1926', name: '包豪斯校舍', en: 'Bauhaus', city: '德绍', era: 4, type: 'villa', s: 1.0, tag: '玻璃幕墙', p: { bauhaus: 1 } },
  { y: 1930, yl: '1930', name: '图根哈特住宅', en: 'Villa Tugendhat', city: '布尔诺', era: 4, type: 'villa', s: 1.0, tag: '钢与玻璃', p: { pilotis: 1 } },
  { y: 1930, yl: '1930', name: '克莱斯勒大厦', en: 'Chrysler Building', city: '纽约', era: 4, type: 'tower', s: 1.0, tag: '装饰艺术', p: { deco: 1, spire: 1 } },
  { y: 1931, yl: '1931', name: '萨伏伊别墅', en: 'Villa Savoye', city: '普瓦西', era: 4, type: 'villa', s: 1.0, tag: '底层架空', p: { pilotis: 1, ribbon: 1 } },
  { y: 1937, yl: '1937', name: '流水别墅', en: 'Fallingwater', city: '宾州', era: 4, type: 'villa', s: 1.0, tag: '悬挑', p: { cantilever: 1 } },
  { y: 1951, yl: '1951', name: '范斯沃斯住宅', en: 'Farnsworth House', city: '伊利诺伊', era: 4, type: 'villa', s: .95, tag: '玻璃盒子', p: { glassBox: 1 } },
  { y: 1952, yl: '1952', name: '马赛公寓', en: 'Unité d’Habitation', city: '马赛', era: 4, type: 'tower', s: 1.0, tag: '粗野主义', p: { floors: 12, pilotis: 1 } },
  { y: 1958, yl: '1958', name: '西格拉姆大厦', en: 'Seagram Building', city: '纽约', era: 4, type: 'tower', s: 1.0, tag: '青铜玻璃', p: { floors: 18, plaza: 1 } },
  { y: 1959, yl: '1959', name: '古根海姆博物馆', en: 'Guggenheim', city: '纽约', era: 4, type: 'spiral', s: 1.0, tag: '螺旋' },
  { y: 1962, yl: '1962', name: 'TWA 航站楼', en: 'TWA Terminal', city: '纽约', era: 4, type: 'shell', s: 1.0, tag: '混凝土壳体', p: { form: 'wings' } },
  { y: 1970, yl: '1970', name: '巴西利亚大教堂', en: 'Brasília Cathedral', city: '巴西利亚', era: 4, type: 'shell', s: 1.0, tag: '皇冠', p: { form: 'crown' } },
  { y: 1972, yl: '1972', name: '金贝尔美术馆', en: 'Kimbell Art Museum', city: '沃思堡', era: 4, type: 'museum', s: 1.0, tag: '摆线拱', p: { form: 'kimbell' } },
  { y: 1973, yl: '1973', name: '悉尼歌剧院', en: 'Sydney Opera House', city: '悉尼', era: 4, type: 'shell', s: 1.0, tag: '壳片', p: { form: 'sails' } },
  { y: 1977, yl: '1977', name: '蓬皮杜中心', en: 'Centre Pompidou', city: '巴黎', era: 4, type: 'hightech', s: 1.0, tag: '管道外露' },
  { y: 1978, yl: '1978', name: '意大利广场', en: 'Piazza d’Italia', city: '新奥尔良', era: 4, type: 'piazza', s: 1.0, tag: '后现代先声' },

  // — POSTMODERN —
  { y: 1984, yl: '1984', name: 'AT&T 大厦', en: 'AT&T Building', city: '纽约', era: 5, type: 'tower', s: 1.0, tag: '断裂山花', p: { floors: 14, broken: 1 } },
  { y: 1987, yl: '1987', name: '梅尼尔收藏馆', en: 'Menil Collection', city: '休斯敦', era: 5, type: 'museum', s: .95, tag: '光叶', p: { form: 'white' } },
  { y: 1989, yl: '1989', name: '卢浮宫金字塔', en: 'Louvre Pyramid', city: '巴黎', era: 5, type: 'pyramid', s: .8, tag: '玻璃', p: { glass: 1 } },
  { y: 1991, yl: '1991', name: '塞恩斯伯里翼', en: 'Sainsbury Wing', city: '伦敦', era: 5, type: 'colonnade', s: .95, tag: '古典拼贴' },
  { y: 1996, yl: '1996', name: '跳舞的房子', en: 'Dancing House', city: '布拉格', era: 5, type: 'dancing', s: .9, tag: '解构玩笑' },
  { y: 1997, yl: '1997', name: '毕尔巴鄂古根海姆', en: 'Guggenheim Bilbao', city: '毕尔巴鄂', era: 5, type: 'museum', s: 1.0, tag: '钛金属', p: { form: 'titanium' } },
  { y: 1997, yl: '1997', name: '盖蒂中心', en: 'Getty Center', city: '洛杉矶', era: 5, type: 'museum', s: 1.0, tag: '白色石材', p: { form: 'white' } },
  { y: 2000, yl: '2000', name: '泰特现代美术馆', en: 'Tate Modern', city: '伦敦', era: 5, type: 'museum', s: 1.0, tag: '电厂改造', p: { form: 'brick' } },
  { y: 2000, yl: '2000', name: '体验音乐博物馆', en: 'Experience Music Project', city: '西雅图', era: 5, type: 'museum', s: .95, tag: '彩色金属', p: { form: 'color' } },
  { y: 2003, yl: '2003', name: '特内里费音乐厅', en: 'Auditorio de Tenerife', city: '特内里费', era: 5, type: 'shell', s: 1.0, tag: '混凝土浪', p: { form: 'wave' } },

  // — CONTEMPORARY —
  { y: 2005, yl: '2005', name: '波尔图音乐厅', en: 'Casa da Música', city: '波尔图', era: 6, type: 'museum', s: .95, tag: '多面体', p: { form: 'angular' } },
  { y: 2008, yl: '2008', name: '国家体育场', en: 'Bird’s Nest', city: '北京', era: 6, type: 'nest', s: 1.0, tag: '钢编织' },
  { y: 2008, yl: '2008', name: '宁波博物馆', en: 'Ningbo Museum', city: '宁波', era: 6, type: 'museum', s: .95, tag: '瓦爿墙', p: { form: 'ningbo' } },
  { y: 2010, yl: '2010', name: '中国馆', en: 'China Pavilion', city: '上海', era: 6, type: 'expo', s: 1.0, tag: '斗拱' },
  { y: 2010, yl: '2010', name: '广州大剧院', en: 'Guangzhou Opera', city: '广州', era: 6, type: 'museum', s: .95, tag: '圆润双砾', p: { form: 'pebble' } },
  { y: 2012, yl: '2012', name: '央视总部', en: 'CCTV Headquarters', city: '北京', era: 6, type: 'cctv', s: 1.0, tag: '空中折环' },
  { y: 2012, yl: '2012', name: '盖达尔·阿利耶夫中心', en: 'Heydar Aliyev Center', city: '巴库', era: 6, type: 'museum', s: 1.0, tag: '流动曲面', p: { form: 'flow' } },
  { y: 2014, yl: '2014', name: '垂直森林', en: 'Bosco Verticale', city: '米兰', era: 6, type: 'green', s: 1.0, tag: '垂直绿化' },
  { y: 2015, yl: '2015', name: '上海中心', en: 'Shanghai Tower', city: '上海', era: 6, type: 'tower', s: 1.0, tag: '632 米', p: { floors: 22, twist: 1 } },
  { y: 2019, yl: '2019', name: '大兴机场', en: 'Daxing Airport', city: '北京', era: 6, type: 'airport', s: 1.0, tag: '五指廊' },
  { y: 2019, yl: '2019', name: '卡塔尔国家博物馆', en: 'National Museum of Qatar', city: '多哈', era: 6, type: 'museum', s: .95, tag: '沙漠玫瑰', p: { form: 'petals' } },
  { y: 2022, yl: '2022', name: '台北表演艺术中心', en: 'Taipei Performing Arts Center', city: '台北', era: 6, type: 'museum', s: .9, tag: '球体' , p: { form: 'spherebox' } },
  { y: 2023, yl: '2023', name: '拉斯维加斯球体', en: 'Sphere', city: '拉斯维加斯', era: 6, type: 'sphere', s: 1.0, tag: '球幕' },
  { y: 2025, yl: '2025', name: '大埃及博物馆', en: 'Grand Egyptian Museum', city: '吉萨', era: 6, type: 'museum', s: 1.0, tag: '三角面', p: { form: 'chamfer' } },
];

export const ENTRY = 4.5;
export const INTRO = 8;
export const OUTRO = 28;
export const DUR = INTRO + B.length * ENTRY + OUTRO; // 360 s
export const ERA_START = (() => {
  let i = 0; return ERA.map(e => { const s = i; i += B.filter(b => b.era === e.id).length; return s; });
})();

export function entryAt(t) {
  if (t < INTRO) return { i: 0, local: t, entry: B[0], intro: true };
  if (t >= INTRO + B.length * ENTRY) return { i: B.length - 1, local: t, entry: B[B.length - 1], outro: true };
  const i = Math.floor((t - INTRO) / ENTRY);
  return { i, local: t - INTRO - i * ENTRY, entry: B[i] };
}
