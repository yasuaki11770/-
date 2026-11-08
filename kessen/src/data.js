// 三国英雄伝 — データ（兵種・地形・武将・シナリオ登録）
'use strict';

// 兵種。mv=移動力, rg=射程, hp/at/df=補正, mt=移動タイプ, st=使える計略
const CLS = {
  lord:   { n: '君主', mv: 5, rg: [1, 1], hp: 1.15, at: 5, df: 5, mt: 'foot', st: ['援助', '鼓舞'], ic: '君' },
  inf:    { n: '歩兵', mv: 4, rg: [1, 1], hp: 1.15, at: 5, df: 7, mt: 'foot', ic: '歩' },
  brute:  { n: '猛将', mv: 5, rg: [1, 1], hp: 1.25, at: 9, df: 4, mt: 'foot', ic: '猛' },
  cav:    { n: '騎兵', mv: 6, rg: [1, 1], hp: 1.05, at: 7, df: 4, mt: 'horse', ic: '騎' },
  arc:    { n: '弓兵', mv: 4, rg: [1, 2], hp: 0.95, at: 5, df: 3, mt: 'foot', ic: '弓' },
  strat:  { n: '軍師', mv: 4, rg: [1, 1], hp: 0.9, at: 1, df: 3, mt: 'foot', st: ['火計', '落石', '混乱', '援助'], ic: '策' },
  sage:   { n: '軍師', mv: 4, rg: [1, 1], hp: 0.95, at: 2, df: 4, mt: 'foot', st: ['火計', '落石', '混乱', '援助', '大援助', '鼓舞'], ic: '策' },
  taoist: { n: '道士', mv: 4, rg: [1, 1], hp: 0.95, at: 2, df: 3, mt: 'foot', st: ['妖術', '混乱'], ic: '道' },
  bandit: { n: '賊兵', mv: 5, rg: [1, 1], hp: 1.0, at: 5, df: 2, mt: 'bandit', ic: '賊' },
  rattan: { n: '藤甲兵', mv: 4, rg: [1, 1], hp: 1.1, at: 6, df: 16, mt: 'bandit', ic: '藤', fireWeak: 1 },
  beast:  { n: '象兵', mv: 4, rg: [1, 1], hp: 1.35, at: 10, df: 6, mt: 'foot', ic: '象' },
  civ:    { n: '民', mv: 3, rg: [0, 0], hp: 0.8, at: 0, df: 2, mt: 'foot', ic: '民' },
};
// 三すくみ: 騎は歩に強く、歩は弓に強く、弓は騎に強い
const TRI = { cav: ['inf', 'lord', 'bandit', 'strat', 'sage', 'taoist'], inf: ['arc', 'bandit'], arc: ['cav', 'beast'], brute: ['bandit'] };

// 地形。c=移動コスト(foot/horse/bandit), d=防御効果%, h=回復%
const X = 99;
const TER = {
  '.': { n: '平地', c: [1, 1, 1], d: 0, col: '#8fae5a' },
  'r': { n: '街道', c: [1, 1, 1], d: 0, col: '#c9b07a' },
  'l': { n: '低地', c: [1, 1, 1], d: 0, col: '#9cb866' },
  'f': { n: '森', c: [2, 3, 1], d: 20, col: '#4c7d3c' },
  'h': { n: '丘', c: [2, 2, 1], d: 15, col: '#a59a5a' },
  'm': { n: '山', c: [3, X, 2], d: 30, col: '#8a7458' },
  'M': { n: '峻嶺', c: [X, X, X], d: 0, col: '#5d4c3c' },
  's': { n: '荒地', c: [2, 2, 1], d: 5, col: '#b8a072' },
  'n': { n: '雪原', c: [2, 3, 2], d: 5, col: '#dfe8ee' },
  'w': { n: '浅瀬', c: [3, 4, 2], d: -10, col: '#5d9ad0' },
  'W': { n: '大河', c: [X, X, X], d: 0, col: '#2e5fa0' },
  'b': { n: '橋', c: [1, 1, 1], d: 0, col: '#9a6a3a' },
  'S': { n: '船', c: [1, 2, 1], d: 10, col: '#7a5230' },
  'c': { n: '城', c: [1, 1, 1], d: 30, h: 15, col: '#c9c2b2' },
  'g': { n: '関所', c: [1, 1, 1], d: 35, h: 10, col: '#b0a48e' },
  'v': { n: '村', c: [1, 1, 1], d: 10, h: 10, col: '#c8a86a' },
  'k': { n: '陣', c: [1, 1, 1], d: 20, h: 10, col: '#b58a5a' },
  'x': { n: '柵', c: [3, X, 3], d: 20, col: '#7a5a3a' },
  '#': { n: '城壁', c: [X, X, X], d: 0, col: '#6e6a62' },
  'p': { n: '屋内', c: [1, 1, 1], d: 5, col: '#a8794a' },
  'z': { n: '鉄鎖', c: [X, X, X], d: 0, col: '#2e5fa0' },
  'a': { n: '祭壇', c: [1, 1, 1], d: 25, h: 10, col: '#d9c06a' },
};
const MT = { foot: 0, horse: 1, bandit: 2 };

// 武将。n=名前, c=兵種, b/i/t=武力/知力/統率, f=勢力, p=顔
// 顔: sk=肌, h=被り物, hc=色, b=髭, bc=髭色, r=衣, e=特徴
const CH = {};
function C(id, n, c, b, i, t, f, p) { CH[id] = { id, n, c, b, i, t, f, p }; }
const SK = '#f0c9a0', SKD = '#c99a6c', SKR = '#c0473a', SKW = '#f6dcc4', SKB = '#7a5236';
// 蜀
C('liubei', '劉備', 'lord', 72, 76, 78, 'shu', { sk: SK, h: 'crown', hc: '#2f7a46', b: 'short', bc: '#2a1a10', r: '#3a8a52', e: 'ears' });
C('guanyu', '関羽', 'cav', 97, 75, 95, 'shu', { sk: SKR, h: 'kerchief', hc: '#2a7a3a', b: 'long', bc: '#120a06', r: '#2e8a44' });
C('zhangfei', '張飛', 'brute', 98, 30, 86, 'shu', { sk: SKB, h: 'helm', hc: '#222', b: 'bushy', bc: '#0a0a0a', r: '#333a44', e: 'brow' });
C('zhaoyun', '趙雲', 'cav', 96, 76, 91, 'shu', { sk: SKW, h: 'helm', hc: '#e8ecf2', b: 'none', r: '#dfe6ef' });
C('zhugeliang', '諸葛亮', 'sage', 38, 100, 95, 'shu', { sk: SKW, h: 'scholar', hc: '#222', b: 'goatee', bc: '#222', r: '#f2f2ea', e: 'fan' });
C('xushu', '徐庶', 'strat', 65, 93, 80, 'shu', { sk: SK, h: 'scholar', hc: '#334', b: 'short', bc: '#222', r: '#6a7aa0' });
C('pangtong', '龐統', 'strat', 34, 97, 82, 'shu', { sk: SKD, h: 'topknot', hc: '#333', b: 'mustache', bc: '#222', r: '#7a6a4a', e: 'ugly' });
C('huangzhong', '黄忠', 'arc', 93, 60, 86, 'shu', { sk: SK, h: 'helm', hc: '#c9a227', b: 'long', bc: '#eeeeee', r: '#c9a227', e: 'old' });
C('weiyan', '魏延', 'brute', 92, 68, 84, 'shu', { sk: SKD, h: 'helm', hc: '#5a2a2a', b: 'short', bc: '#111', r: '#7a3030', e: 'brow' });
C('machao', '馬超', 'cav', 97, 44, 89, 'shu', { sk: SKW, h: 'feather', hc: '#e0e6ee', b: 'none', r: '#e8ecf2', e: 'lion' });
C('madai', '馬岱', 'cav', 82, 55, 78, 'shu', { sk: SK, h: 'helm', hc: '#8a9aaa', b: 'short', bc: '#222', r: '#7a8aa0' });
C('yanyan', '厳顔', 'arc', 82, 66, 80, 'shu', { sk: SK, h: 'helm', hc: '#6a5a3a', b: 'long', bc: '#ddd', r: '#7a6a4a', e: 'old' });
C('guanping', '関平', 'cav', 80, 68, 78, 'shu', { sk: SK, h: 'kerchief', hc: '#3a7a4a', b: 'none', r: '#4a8a5a' });
C('zhoucang', '周倉', 'brute', 84, 30, 70, 'shu', { sk: SKB, h: 'bald', hc: '#222', b: 'bushy', bc: '#111', r: '#3a3a2a' });
C('jiangwei', '姜維', 'cav', 90, 90, 92, 'shu', { sk: SKW, h: 'helm', hc: '#4a6aa0', b: 'none', r: '#4a6aa0' });
C('masu', '馬謖', 'strat', 60, 84, 66, 'shu', { sk: SKW, h: 'scholar', hc: '#334', b: 'none', r: '#8a7aa8' });
C('wangping', '王平', 'inf', 78, 72, 84, 'shu', { sk: SKD, h: 'helm', hc: '#5a6a4a', b: 'short', bc: '#222', r: '#5a6a4a' });
C('guanxing', '関興', 'cav', 86, 60, 78, 'shu', { sk: SK, h: 'kerchief', hc: '#2a7a3a', b: 'none', r: '#3a9a4a', e: 'young' });
C('zhangbao', '張苞', 'brute', 87, 40, 76, 'shu', { sk: SKD, h: 'helm', hc: '#333', b: 'none', r: '#444b55', e: 'young' });
C('liaohua', '廖化', 'inf', 76, 60, 76, 'shu', { sk: SK, h: 'helm', hc: '#6a6a4a', b: 'short', bc: '#333', r: '#6a7a4a' });
C('sunshangxiang', '孫尚香', 'arc', 80, 60, 76, 'shu', { sk: SKW, h: 'woman', hc: '#111', b: 'none', r: '#c84a5a', e: 'woman' });
C('jianyong', '簡雍', 'strat', 30, 74, 50, 'shu', { sk: SK, h: 'cap', hc: '#555', b: 'short', bc: '#222', r: '#8a8a6a' });
C('mizhu', '糜竺', 'inf', 40, 70, 60, 'shu', { sk: SK, h: 'cap', hc: '#555', b: 'short', bc: '#222', r: '#8a7a5a' });
C('mifuren', '糜夫人', 'civ', 10, 60, 30, 'shu', { sk: SKW, h: 'woman', hc: '#111', b: 'none', r: '#d8a0b0', e: 'woman' });
C('liushan', '劉禅', 'lord', 30, 30, 40, 'shu', { sk: SKW, h: 'crown', hc: '#c9a227', b: 'none', r: '#c9a227', e: 'young' });
C('yangyi', '楊儀', 'strat', 30, 80, 60, 'shu', { sk: SK, h: 'scholar', hc: '#333', b: 'goatee', bc: '#222', r: '#7a8a9a' });
C('fazheng', '法正', 'strat', 40, 94, 74, 'shu', { sk: SK, h: 'scholar', hc: '#333', b: 'goatee', bc: '#222', r: '#5a6a8a' });
C('maliang', '馬良', 'strat', 30, 86, 60, 'shu', { sk: SK, h: 'scholar', hc: '#333', b: 'short', bc: '#ddd', r: '#7a9a8a', e: 'whitebrow' });
// 魏
C('caocao', '曹操', 'lord', 86, 96, 99, 'wei', { sk: SK, h: 'crown', hc: '#1a2a5a', b: 'short', bc: '#111', r: '#2a3a7a' });
C('xiahoudun', '夏侯惇', 'cav', 90, 58, 88, 'wei', { sk: SK, h: 'helm', hc: '#334', b: 'short', bc: '#111', r: '#3a4a6a', e: 'eyepatch' });
C('xiahouyuan', '夏侯淵', 'arc', 91, 54, 86, 'wei', { sk: SK, h: 'helm', hc: '#445', b: 'short', bc: '#111', r: '#4a5a7a' });
C('xuchu', '許褚', 'brute', 96, 36, 72, 'wei', { sk: SKD, h: 'bald', hc: '#222', b: 'short', bc: '#111', r: '#3a3a5a' });
C('dianwei', '典韋', 'brute', 95, 35, 70, 'wei', { sk: SKB, h: 'kerchief', hc: '#222', b: 'bushy', bc: '#111', r: '#3a3030' });
C('zhangliao', '張遼', 'cav', 93, 78, 93, 'wei', { sk: SK, h: 'helm', hc: '#556', b: 'short', bc: '#111', r: '#4a5a8a' });
C('caoren', '曹仁', 'inf', 86, 62, 88, 'wei', { sk: SK, h: 'helm', hc: '#334', b: 'short', bc: '#222', r: '#3a4a7a' });
C('xuhuang', '徐晃', 'brute', 90, 66, 84, 'wei', { sk: SK, h: 'helm', hc: '#445', b: 'goatee', bc: '#222', r: '#4a4a6a' });
C('yujin', '于禁', 'inf', 78, 66, 84, 'wei', { sk: SK, h: 'helm', hc: '#556', b: 'short', bc: '#222', r: '#5a6a8a' });
C('pangde', '龐徳', 'cav', 94, 60, 82, 'wei', { sk: SKD, h: 'helm', hc: '#444', b: 'bushy', bc: '#111', r: '#555a6a' });
C('simayi', '司馬懿', 'sage', 63, 97, 98, 'wei', { sk: SK, h: 'scholar', hc: '#111', b: 'goatee', bc: '#333', r: '#2a2a4a', e: 'sly' });
C('simashi', '司馬師', 'cav', 70, 88, 90, 'wei', { sk: SK, h: 'helm', hc: '#222', b: 'mustache', bc: '#111', r: '#2a2a4a', e: 'eyepatch' });
C('simazhao', '司馬昭', 'lord', 66, 88, 88, 'wei', { sk: SK, h: 'crown', hc: '#2a2a4a', b: 'goatee', bc: '#111', r: '#3a3a5a' });
C('simayan', '司馬炎', 'lord', 60, 70, 80, 'jin', { sk: SKW, h: 'crown', hc: '#7a1a1a', b: 'short', bc: '#111', r: '#8a2a2a' });
C('caoshuang', '曹爽', 'inf', 50, 40, 52, 'wei', { sk: SKW, h: 'crown', hc: '#334', b: 'none', r: '#4a5a8a' });
C('zhanghe', '張郃', 'cav', 90, 70, 88, 'wei', { sk: SK, h: 'helm', hc: '#556', b: 'mustache', bc: '#222', r: '#4a6a8a' });
C('dengai', '鄧艾', 'cav', 86, 90, 94, 'wei', { sk: SKD, h: 'helm', hc: '#5a4a3a', b: 'goatee', bc: '#222', r: '#5a5a7a' });
C('zhonghui', '鍾会', 'strat', 60, 92, 86, 'wei', { sk: SKW, h: 'scholar', hc: '#223', b: 'none', r: '#4a4a8a', e: 'sly' });
C('xuyou', '許攸', 'strat', 20, 80, 30, 'wei', { sk: SK, h: 'scholar', hc: '#444', b: 'goatee', bc: '#444', r: '#7a7a5a', e: 'sly' });
C('chengong', '陳宮', 'strat', 40, 88, 76, 'qun', { sk: SK, h: 'scholar', hc: '#333', b: 'short', bc: '#222', r: '#6a6a4a' });
C('caiyang', '蔡陽', 'cav', 74, 40, 70, 'wei', { sk: SK, h: 'helm', hc: '#555', b: 'long', bc: '#ccc', r: '#5a5a7a', e: 'old' });
C('guojia', '郭嘉', 'strat', 20, 98, 70, 'wei', { sk: SKW, h: 'scholar', hc: '#223', b: 'none', r: '#5a6aa0' });
C('caozhen', '曹真', 'cav', 80, 70, 86, 'wei', { sk: SK, h: 'helm', hc: '#334', b: 'short', bc: '#222', r: '#3a4a7a' });
C('guanqiujian', '毌丘倹', 'cav', 78, 72, 80, 'wei', { sk: SK, h: 'helm', hc: '#444', b: 'short', bc: '#222', r: '#5a5a5a' });
C('caizhong', '蔡中', 'inf', 60, 40, 50, 'wei', { sk: SK, h: 'helm', hc: '#556', b: 'short', bc: '#222', r: '#5a6a8a' });
C('caihe', '蔡和', 'inf', 58, 40, 48, 'wei', { sk: SK, h: 'helm', hc: '#556', b: 'none', r: '#5a6a8a' });
C('caimao', '蔡瑁', 'inf', 66, 60, 70, 'wei', { sk: SK, h: 'helm', hc: '#556', b: 'short', bc: '#222', r: '#3a5a7a' });
C('xiandi', '献帝', 'civ', 10, 60, 30, 'han', { sk: SKW, h: 'crown', hc: '#c9a227', b: 'none', r: '#c9a227' });
C('xumu', '徐庶の母', 'civ', 5, 70, 30, 'han', { sk: SK, h: 'woman', hc: '#bbb', b: 'none', r: '#7a6a5a', e: 'old' });
// 呉
C('sunjian', '孫堅', 'cav', 92, 74, 92, 'wu', { sk: SK, h: 'helm', hc: '#a02020', b: 'short', bc: '#2a1a10', r: '#b03030' });
C('sunce', '孫策', 'cav', 94, 72, 92, 'wu', { sk: SKW, h: 'helm', hc: '#c03030', b: 'none', r: '#c84040' });
C('sunquan', '孫権', 'lord', 68, 80, 86, 'wu', { sk: SK, h: 'crown', hc: '#a02020', b: 'short', bc: '#6a3010', r: '#a83030', e: 'green' });
C('zhouyu', '周瑜', 'sage', 72, 96, 96, 'wu', { sk: SKW, h: 'scholar', hc: '#7a1a1a', b: 'none', r: '#c84040' });
C('lusu', '魯粛', 'strat', 50, 88, 80, 'wu', { sk: SK, h: 'scholar', hc: '#5a1a1a', b: 'short', bc: '#222', r: '#a8603a' });
C('huanggai', '黄蓋', 'inf', 83, 70, 82, 'wu', { sk: SK, h: 'helm', hc: '#7a3a2a', b: 'long', bc: '#ddd', r: '#a04a3a', e: 'old' });
C('taishici', '太史慈', 'cav', 93, 66, 84, 'wu', { sk: SK, h: 'helm', hc: '#7a2a2a', b: 'short', bc: '#222', r: '#a03a3a' });
C('lumeng', '呂蒙', 'inf', 82, 88, 90, 'wu', { sk: SK, h: 'helm', hc: '#6a2a2a', b: 'short', bc: '#222', r: '#a03030' });
C('luxun', '陸遜', 'sage', 66, 95, 96, 'wu', { sk: SKW, h: 'scholar', hc: '#6a1a1a', b: 'none', r: '#c05050' });
C('ganning', '甘寧', 'brute', 92, 60, 82, 'wu', { sk: SKD, h: 'kerchief', hc: '#a03a2a', b: 'short', bc: '#222', r: '#b05a2a', e: 'bell' });
C('zhangzhao', '張昭', 'strat', 20, 84, 50, 'wu', { sk: SK, h: 'scholar', hc: '#444', b: 'long', bc: '#ddd', r: '#8a5a4a', e: 'old' });
C('panzhang', '潘璋', 'inf', 76, 50, 70, 'wu', { sk: SKD, h: 'helm', hc: '#6a2a2a', b: 'short', bc: '#222', r: '#8a3a3a' });
C('mazhong', '馬忠', 'arc', 70, 50, 64, 'wu', { sk: SK, h: 'helm', hc: '#6a2a2a', b: 'short', bc: '#222', r: '#8a4a3a' });
C('sunhao', '孫皓', 'lord', 50, 50, 30, 'wu', { sk: SKW, h: 'crown', hc: '#7a1a1a', b: 'none', r: '#8a2a2a', e: 'sly' });
// 群雄・その他
C('dongzhuo', '董卓', 'brute', 82, 50, 70, 'qun', { sk: SKD, h: 'crown', hc: '#222', b: 'bushy', bc: '#222', r: '#5a2a5a', e: 'fat' });
C('lubu', '呂布', 'cav', 100, 30, 90, 'qun', { sk: SKW, h: 'feather', hc: '#c03030', b: 'none', r: '#c84a2a' });
C('diaochan', '貂蝉', 'civ', 20, 80, 40, 'qun', { sk: SKW, h: 'woman', hc: '#111', b: 'none', r: '#e07a9a', e: 'woman' });
C('wangyun', '王允', 'strat', 20, 80, 50, 'han', { sk: SK, h: 'scholar', hc: '#444', b: 'long', bc: '#ddd', r: '#5a5a7a', e: 'old' });
C('huaxiong', '華雄', 'cav', 88, 50, 78, 'qun', { sk: SKD, h: 'helm', hc: '#5a2a2a', b: 'bushy', bc: '#111', r: '#6a3a3a' });
C('lijue', '李傕', 'cav', 74, 30, 66, 'qun', { sk: SKD, h: 'helm', hc: '#4a3a2a', b: 'short', bc: '#111', r: '#6a4a3a' });
C('guosi', '郭汜', 'cav', 72, 28, 62, 'qun', { sk: SKD, h: 'helm', hc: '#3a3a2a', b: 'bushy', bc: '#111', r: '#5a4a3a' });
C('yuanshao', '袁紹', 'lord', 70, 70, 82, 'qun', { sk: SKW, h: 'crown', hc: '#c9a227', b: 'short', bc: '#333', r: '#c9a227' });
C('yanliang', '顔良', 'brute', 93, 40, 78, 'qun', { sk: SKD, h: 'helm', hc: '#8a7a2a', b: 'bushy', bc: '#111', r: '#8a7a3a' });
C('wenchou', '文醜', 'cav', 92, 30, 78, 'qun', { sk: SKD, h: 'helm', hc: '#7a6a2a', b: 'bushy', bc: '#111', r: '#8a6a3a' });
C('zhangjiao', '張角', 'taoist', 30, 84, 80, 'qun', { sk: SK, h: 'turban', hc: '#e0c020', b: 'long', bc: '#ddd', r: '#e0c020', e: 'old' });
C('zhangbao2', '張宝', 'taoist', 50, 70, 60, 'qun', { sk: SK, h: 'turban', hc: '#e0c020', b: 'short', bc: '#222', r: '#d0b020' });
C('chengyuanzhi', '程遠志', 'bandit', 70, 20, 50, 'qun', { sk: SKD, h: 'turban', hc: '#e0c020', b: 'bushy', bc: '#111', r: '#a08a2a' });
C('duyou', '督郵', 'civ', 10, 30, 20, 'han', { sk: SKW, h: 'cap', hc: '#333', b: 'mustache', bc: '#222', r: '#6a3a7a', e: 'sly' });
C('luboshe', '呂伯奢', 'civ', 10, 40, 20, 'han', { sk: SK, h: 'cap', hc: '#555', b: 'long', bc: '#ddd', r: '#7a6a4a', e: 'old' });
C('kongxiu', '孔秀', 'inf', 66, 30, 56, 'wei', { sk: SK, h: 'helm', hc: '#556', b: 'short', bc: '#222', r: '#5a6a8a' });
C('hanfu', '韓福', 'arc', 60, 40, 60, 'wei', { sk: SK, h: 'helm', hc: '#556', b: 'goatee', bc: '#555', r: '#5a6a8a' });
C('mengtan', '孟坦', 'cav', 70, 30, 56, 'wei', { sk: SKD, h: 'helm', hc: '#556', b: 'short', bc: '#222', r: '#5a6a8a' });
C('bianxi', '卞喜', 'brute', 72, 40, 56, 'wei', { sk: SKD, h: 'bald', hc: '#222', b: 'short', bc: '#222', r: '#5a5a7a' });
C('wangzhi', '王植', 'strat', 40, 60, 56, 'wei', { sk: SK, h: 'scholar', hc: '#333', b: 'goatee', bc: '#222', r: '#5a6a8a', e: 'sly' });
C('qinqi', '秦琪', 'cav', 72, 30, 60, 'wei', { sk: SK, h: 'helm', hc: '#556', b: 'none', r: '#5a6a8a' });
C('zhaofan', '趙範', 'inf', 50, 50, 50, 'qun', { sk: SK, h: 'cap', hc: '#555', b: 'short', bc: '#222', r: '#7a6a4a' });
C('menghuo', '孟獲', 'beast', 90, 40, 80, 'nan', { sk: SKB, h: 'feather', hc: '#e0a020', b: 'bushy', bc: '#111', r: '#a05a2a', e: 'fat' });
C('zhurong', '祝融', 'arc', 84, 40, 70, 'nan', { sk: SKD, h: 'woman', hc: '#a02020', b: 'none', r: '#c04a2a', e: 'woman' });
C('wutugu', '兀突骨', 'rattan', 88, 20, 76, 'nan', { sk: '#7a6a3a', h: 'bald', hc: '#222', b: 'bushy', bc: '#111', r: '#a08a4a' });
C('liuzhang', '劉璋', 'lord', 30, 50, 50, 'qun', { sk: SKW, h: 'crown', hc: '#5a5a2a', b: 'short', bc: '#333', r: '#7a7a3a' });
C('zhangren', '張任', 'arc', 84, 70, 82, 'qun', { sk: SK, h: 'helm', hc: '#5a5a3a', b: 'short', bc: '#222', r: '#6a6a3a' });
C('liubiao', '劉表', 'lord', 40, 70, 60, 'qun', { sk: SK, h: 'crown', hc: '#2a5a5a', b: 'long', bc: '#ccc', r: '#3a6a6a', e: 'old' });
C('fanjiang', '范彊', 'inf', 50, 20, 30, 'shu', { sk: SKD, h: 'helm', hc: '#444', b: 'short', bc: '#111', r: '#555' });
C('zhangda', '張達', 'inf', 50, 20, 30, 'shu', { sk: SKD, h: 'helm', hc: '#444', b: 'mustache', bc: '#111', r: '#555' });
C('duyu', '杜預', 'strat', 40, 90, 86, 'jin', { sk: SK, h: 'scholar', hc: '#7a1a1a', b: 'goatee', bc: '#222', r: '#8a2a2a' });
C('wangjun', '王濬', 'inf', 70, 74, 84, 'jin', { sk: SK, h: 'helm', hc: '#7a1a1a', b: 'long', bc: '#ccc', r: '#8a3a2a', e: 'old' });
C('yuanshu', '袁術', 'lord', 50, 50, 50, 'qun', { sk: SKW, h: 'crown', hc: '#c9a227', b: 'goatee', bc: '#333', r: '#b09020', e: 'fat' });
C('xugongke', '許貢の食客', 'arc', 60, 30, 40, 'qun', { sk: SKD, h: 'kerchief', hc: '#222', b: 'none', r: '#333' });
C('chunyuqiong', '淳于瓊', 'inf', 70, 40, 62, 'qun', { sk: SKD, h: 'helm', hc: '#7a6a2a', b: 'bushy', bc: '#222', r: '#8a7a3a', e: 'fat' });
C('xiahouen', '夏侯恩', 'cav', 60, 30, 50, 'wei', { sk: SK, h: 'helm', hc: '#445', b: 'none', r: '#4a5a7a' });
C('xiahoumao', '夏侯楙', 'cav', 50, 30, 48, 'wei', { sk: SKW, h: 'helm', hc: '#445', b: 'none', r: '#5a6a9a', e: 'sly' });
C('xiahouba', '夏侯覇', 'cav', 84, 60, 80, 'shu', { sk: SK, h: 'helm', hc: '#3a6a4a', b: 'short', bc: '#222', r: '#3a7a4a' });
C('gongsunzan', '公孫瓚', 'cav', 82, 66, 82, 'qun', { sk: SK, h: 'helm', hc: '#ddd', b: 'short', bc: '#222', r: '#e0e0e0' });
C('sunqian', '孫乾', 'strat', 30, 72, 50, 'shu', { sk: SK, h: 'scholar', hc: '#444', b: 'short', bc: '#222', r: '#6a7a5a' });
C('jiangwan', '蒋琬', 'strat', 30, 82, 70, 'shu', { sk: SK, h: 'scholar', hc: '#333', b: 'short', bc: '#222', r: '#5a7a6a' });
C('hanxuan', '韓玄', 'inf', 40, 30, 40, 'qun', { sk: SK, h: 'cap', hc: '#555', b: 'goatee', bc: '#333', r: '#7a6a4a', e: 'sly' });
C('wangjing', '王経', 'cav', 60, 60, 66, 'wei', { sk: SK, h: 'helm', hc: '#445', b: 'short', bc: '#222', r: '#4a5a7a' });
C('wenyang', '文鴦', 'cav', 90, 40, 70, 'wei', { sk: SKW, h: 'helm', hc: '#556', b: 'none', r: '#5a6a8a', e: 'young' });
C('chengpu', '程普', 'inf', 80, 70, 82, 'wu', { sk: SK, h: 'helm', hc: '#6a2a20', b: 'long', bc: '#ddd', r: '#8a3a2a', e: 'old' });
C('jiling', '紀霊', 'inf', 84, 50, 78, 'qun', { sk: SK, h: 'helm', hc: '#2a4a2a', b: 'short', bc: '#222', r: '#3a5a3a' });
C('xusheng', '徐盛', 'cav', 82, 70, 80, 'wu', { sk: SK, h: 'helm', hc: '#8a2a28', b: 'short', bc: '#222', r: '#a8322e' });
C('chengyu', '程昱', 'strat', 40, 88, 70, 'wei', { sk: SK, h: 'scholar', hc: '#223', b: 'long', bc: '#ccc', r: '#3a4a7a', e: 'old' });
C('wuguotai', '呉国太', 'civ', 5, 70, 30, 'wu', { sk: SK, h: 'woman', hc: '#bbb', b: 'none', r: '#a0303a', e: 'woman' });
C('caomao', '曹髦', 'lord', 50, 70, 50, 'wei', { sk: SKW, h: 'crown', hc: '#c9a227', b: 'none', r: '#3a4a8a', e: 'young' });
C('dengzhi', '鄧芝', 'strat', 50, 80, 70, 'shu', { sk: SK, h: 'scholar', hc: '#333', b: 'short', bc: '#222', r: '#4a6a5a' });
C('sima', '使者', 'civ', 10, 40, 20, 'han', { sk: SK, h: 'cap', hc: '#444', b: 'short', bc: '#222', r: '#6a6a6a' });

// 汎用兵の名前（勢力・兵種から）
const GEN = { b: 45, i: 25, t: 45 };

// 名シーン一覧（目録）— 各シーンの tags に入っているものを並べる
const SC = [];        // シーン一覧（時系列）
const CHAPTERS = [
  '第一章　黄巾の乱〜董卓討伐', '第二章　群雄割拠〜官渡の戦い', '第三章　劉備の飛躍〜赤壁の戦い',
  '第四章　荊州争奪〜蜀の建国', '第五章　劉備の復讐〜夷陵の戦い', '第六章　諸葛亮の北伐', '第七章　三国の終焉',
];
let CUR_CH = 0;
function chap(n) { CUR_CH = n; }
// 会話イベント
function ev(title, place, bg, text, opt) {
  SC.push(Object.assign({ type: 'ev', ch: CUR_CH, title, place, bg, text, tags: [title] }, opt || {}));
}
// 戦闘
function bt(title, place, def) {
  SC.push(Object.assign({ type: 'bt', ch: CUR_CH, title, place, tags: [title] }, def));
}
if (typeof module !== 'undefined') module.exports = { CLS, TER, CH, SC, CHAPTERS, TRI, MT, chap, ev, bt, GEN };
