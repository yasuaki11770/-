'use strict';
(function(){
/* ============================================================
   三国タクティクス
   CT制ターン / ジョブ・アビリティ / 高低差 / 向き / ランダム地形
   ============================================================ */
const $=s=>document.querySelector(s);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
let SPD=1;
const sleep=ms=>new Promise(r=>setTimeout(r,ms/SPD));
const LSX={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R=()=>Math.random();
const pick=a=>a[Math.floor(R()*a.length)];

/* ---------------- sound ---------------- */
document.addEventListener('pointerdown',()=>{SND.init();if(SND.ctx&&SND.ctx.state==='suspended')SND.ctx.resume();},{capture:true});
const WSND={'槍':'spear','蛇矛':'spear','方天画戟':'spear','戟':'spear','鉄脊蛇矛':'spear','朴刀':'spear','双戟':'spear','鉞':'axe','大鎚':'club','鞭':'club','三節棍':'club','拳':'fist','トンファー':'fist','爪':'fist','弓':'bow','弩':'bow','杖':'staff','羽扇':'staff'};

/* ---------------- jobs & abilities ---------------- */
// 数値は小さめ：序盤はHP2桁、ダメージ10前後。乱数なし（予想ダメージ＝実ダメージ）
const JOBS={
  senshi:{n:'戦士',hp:1.1,mp:.5,pa:1,ma:.7,sp:1,mv:4,jp:3,ev:10,wp:2.8,atk:'melee',wpn:'剣',ab:['tameru','ishi','teate'],d:'攻守の基本。どのジョブにも向く'},
  knight:{n:'ナイト',hp:1.2,mp:.6,pa:1.05,ma:.6,sp:.95,mv:3,jp:3,ev:22,wp:2.8,atk:'melee',wpn:'剣',shield:1,ab:['pbreak','sbreak','kenshu'],d:'盾で正面の攻撃を防ぐ。崩し技'},
  yumi:{n:'弓',hp:1,mp:.6,pa:1,ma:.7,sp:1,mv:3,jp:3,ev:10,wp:3,atk:'bow',wpn:'弓',ab:['nerai','hiya','kensei'],d:'高い所ほど遠くを射る'},
  monk:{n:'モンク',hp:1.3,mp:.5,pa:1.1,ma:.8,sp:1.05,mv:3,jp:4,ev:15,wp:0,atk:'fist',wpn:'拳',ab:['hado','chakra','sosei_m'],d:'素手で殴る。ブレイブが高いほど強い'},
  shiro:{n:'白魔',hp:.85,mp:1.5,pa:.6,ma:1.1,sp:1,mv:3,jp:3,ev:5,wp:1.5,atk:'melee',wpn:'杖',ab:['kaifuku','shugo','sosei','daikaifuku'],d:'回復と守り。詠唱に時間がかかる'},
  kuro:{n:'黒魔',hp:.8,mp:1.5,pa:.6,ma:1.25,sp:1,mv:3,jp:3,ev:5,wp:1.5,atk:'melee',wpn:'杖',hat:1,ab:['kaen','raigeki','hyoketsu','kaenjin'],d:'範囲の攻撃術。城門も焼ける'},
  toki:{n:'時魔',hp:.85,mp:1.3,pa:.6,ma:1.1,sp:1.05,mv:3,jp:3,ev:5,wp:1.5,atk:'melee',wpn:'杖',ab:['kasoku','gensoku','juryoku','teishi'],d:'速さを操る。重力は大将にも効く'},
  ryu:{n:'竜騎',hp:1.15,mp:.5,pa:1.1,ma:.6,sp:1,mv:4,jp:4,ev:10,wp:3,atk:'melee',wpn:'槍',ab:['jump','nagi'],d:'跳んで城壁の上にも降りられる'},
  samurai:{n:'侍',hp:1.1,mp:.8,pa:1.1,ma:.9,sp:1,mv:3,jp:3,ev:15,wp:3,atk:'melee',wpn:'刀',ab:['kagero','meikyo','kamaitachi'],d:'居合で周りの敵だけを斬る'},
  ninja:{n:'忍者',hp:.9,mp:.5,pa:1.05,ma:.6,sp:1.25,mv:5,jp:4,ev:25,wp:1.8,atk:'dual',wpn:'双剣',ab:['shuriken','kagenui','bakuen'],d:'二刀流で2回攻撃。足が速い'}
};
const JOBORDER=['senshi','knight','yumi','monk','shiro','kuro','toki','ryu','samurai','ninja'];
// kind: phys 物理 / mag 術 / heal 回復 / buff / debuff / revive 蘇生 / grav 割合 / jump
const AB={
  tameru:{n:'ためる',jp:60,mp:0,rg:0,aoe:0,tg:'self',kind:'buff',pa:1,fx:'light',d:'PA+1'},
  ishi:{n:'石投げ',jp:80,mp:0,rg:4,aoe:0,kind:'phys',pow:c=>c.pa*1.5,d:'離れた敵に小石'},
  teate:{n:'応急手当',jp:100,mp:0,rg:1,aoe:0,tg:'ally',kind:'heal',amt:(c,t)=>Math.round(t.mhp*.25),d:'HPを25%回復'},
  pbreak:{n:'パワーブレイク',jp:120,mp:0,rg:'w',aoe:0,kind:'phys',mul:.8,after:t=>{t.pa=Math.max(1,t.pa-1);return 'PA-1';},d:'攻撃してPA-1'},
  sbreak:{n:'スピードブレイク',jp:160,mp:0,rg:'w',aoe:0,kind:'phys',mul:.8,after:t=>{t.sp=Math.max(3,t.sp-1);return 'Sp-1';},d:'攻撃してSp-1'},
  kenshu:{n:'堅守',jp:90,mp:0,rg:0,aoe:0,tg:'self',kind:'buff',st:{protect:36},d:'物理ダメージを減らす'},
  nerai:{n:'狙い撃ち',jp:120,mp:0,rg:'w',aoe:0,kind:'phys',mul:1.6,hitAdd:20,ctr:3,d:'溜めて強く射る'},
  hiya:{n:'火矢',jp:100,mp:0,rg:'w',aoe:0,kind:'phys',mul:1.1,el:'fire',gate:2.5,fx:'fire',d:'城門によく効く'},
  kensei:{n:'足止め射ち',jp:150,mp:0,rg:'w',aoe:0,kind:'phys',mul:.6,st:{slow:24},ch:60,d:'当てるとスロウ'},
  hado:{n:'波動撃',jp:150,mp:0,rg:3,aoe:0,kind:'phys',pow:c=>c.pa*c.br/34,noEv:1,fx:'light',d:'気を飛ばす。避けられない'},
  chakra:{n:'チャクラ',jp:120,mp:0,rg:0,aoe:1,tg:'ally',smart:1,kind:'heal',amt:c=>c.pa*3,d:'自分と周りを回復'},
  sosei_m:{n:'蘇生',jp:250,mp:0,rg:1,aoe:0,tg:'ko',kind:'revive',ch:70,pct:.2,d:'倒れた味方を起こす'},
  kaifuku:{n:'回復',jp:50,mp:6,rg:4,aoe:1,tg:'ally',kind:'heal',q:4,ctr:3,d:'範囲を回復'},
  shugo:{n:'守護',jp:70,mp:6,rg:4,aoe:1,tg:'ally',kind:'buff',st:{protect:36},ctr:3,d:'範囲に物理防御'},
  sosei:{n:'蘇生術',jp:200,mp:10,rg:4,aoe:0,tg:'ko',kind:'revive',ch:85,pct:.3,ctr:4,d:'倒れた味方を起こす'},
  daikaifuku:{n:'大回復',jp:180,mp:14,rg:4,aoe:1,tg:'ally',kind:'heal',q:7,ctr:5,d:'範囲を大きく回復'},
  kaen:{n:'火炎',jp:50,mp:6,rg:4,aoe:1,kind:'mag',q:4,el:'fire',gate:2,fx:'fire',ctr:3,d:'範囲を焼く'},
  raigeki:{n:'雷撃',jp:60,mp:6,rg:5,aoe:0,kind:'mag',q:5.5,fx:'thunder',ctr:2,d:'一体に強い雷'},
  hyoketsu:{n:'氷結',jp:80,mp:8,rg:4,aoe:1,kind:'mag',q:3.5,fx:'ice',st:{slow:16},ch:30,ctr:3,d:'凍らせて時にスロウ'},
  kaenjin:{n:'火炎陣',jp:250,mp:18,rg:4,aoe:2,kind:'mag',q:6,el:'fire',gate:2,fx:'fire',ctr:6,d:'広い範囲を焼き払う'},
  kasoku:{n:'加速',jp:100,mp:8,rg:3,aoe:0,tg:'ally',kind:'buff',st:{haste:32},ctr:2,d:'ヘイスト'},
  gensoku:{n:'減速',jp:80,mp:8,rg:4,aoe:1,kind:'debuff',st:{slow:24},ch:70,ctr:3,d:'範囲にスロウ'},
  juryoku:{n:'重力',jp:150,mp:10,rg:4,aoe:1,kind:'grav',pct:.25,ch:75,ctr:4,d:'今のHPの1/4を削る'},
  teishi:{n:'停止',jp:250,mp:14,rg:4,aoe:0,kind:'debuff',st:{stop:20},ch:50,ctr:4,d:'時を止める'},
  jump:{n:'ジャンプ',jp:150,mp:0,rg:3,aoe:0,kind:'jump',mul:1.6,d:'跳んで降り立つ。高さを無視'},
  nagi:{n:'薙ぎ払い',jp:120,mp:0,rg:0,aoe:1,kind:'phys',mul:.8,smart:1,ring:1,d:'周りの敵をまとめて'},
  kagero:{n:'居合・陽炎',jp:150,mp:0,rg:0,aoe:2,kind:'phys',pow:c=>c.pa*2.5,noEv:1,smart:1,ring:1,fx:'fire',d:'周りの敵を斬る'},
  meikyo:{n:'居合・明鏡',jp:150,mp:0,rg:0,aoe:2,tg:'ally',smart:1,kind:'heal',amt:c=>c.ma*3,d:'周りの味方を癒す'},
  kamaitachi:{n:'居合・鎌鼬',jp:200,mp:0,rg:0,aoe:3,kind:'phys',pow:c=>c.pa*2,noEv:1,smart:1,ring:1,fx:'slash',d:'広く周りの敵を斬る'},
  shuriken:{n:'手裏剣',jp:80,mp:0,rg:4,aoe:0,kind:'phys',pow:c=>c.pa*2.5,d:'投げて当てる'},
  kagenui:{n:'影縫い',jp:150,mp:0,rg:'w',aoe:0,kind:'phys',mul:.7,st:{stop:12},ch:35,d:'当てると時に停止'},
  bakuen:{n:'爆炎',jp:150,mp:0,rg:3,aoe:1,kind:'phys',pow:c=>c.pa*2,noEv:1,el:'fire',gate:2,fx:'fire',d:'火薬で範囲を焼く'}
};
for(const j in JOBS)JOBS[j].ab.forEach(k=>{AB[k].job=j;});
/* リアクション・サポート・ムーブ */
const RSM={
  // reaction（ブレイブの確率で発動）
  konjo:{n:'根性',slot:'ra',job:'senshi',jp:200,d:'攻撃を受けるとPA+1'},
  ukenagashi:{n:'受け流し',slot:'ra',job:'knight',jp:300,d:'物理ダメージを半分にする'},
  osha:{n:'応射',slot:'ra',job:'yumi',jp:300,d:'射程内から攻撃されたら撃ち返す'},
  hangeki:{n:'反撃',slot:'ra',job:'monk',jp:300,d:'隣から攻撃されたら殴り返す'},
  shizen:{n:'自然治癒',slot:'ra',job:'shiro',jp:250,d:'攻撃を受けるとHP回復'},
  shoheki:{n:'魔力障壁',slot:'ra',job:'kuro',jp:300,d:'ダメージをMPで受ける'},
  kiki:{n:'危機加速',slot:'ra',job:'toki',jp:300,d:'HPが1/3以下になると、すぐ行動できる'},
  ryukon:{n:'竜の魂',slot:'ra',job:'ryu',jp:300,d:'攻撃を受けるとヘイスト'},
  shirahadori:{n:'白刃取り',slot:'ra',job:'samurai',jp:400,d:'物理攻撃を受け止めて無効'},
  utsusemi:{n:'空蝉',slot:'ra',job:'ninja',jp:400,d:'攻撃をかわす（術も）'},
  // support
  atkup:{n:'攻撃強化',slot:'su',job:'senshi',jp:400,d:'物理ダメージ×1.25'},
  defup:{n:'防御強化',slot:'su',job:'knight',jp:400,d:'受ける物理ダメージ×0.8'},
  shuchu:{n:'集中',slot:'su',job:'yumi',jp:300,d:'物理攻撃が回避されない'},
  hpup:{n:'HP増強',slot:'su',job:'monk',jp:300,d:'最大HP+20%'},
  healup:{n:'回復強化',slot:'su',job:'shiro',jp:300,d:'回復量×1.3'},
  maup:{n:'術強化',slot:'su',job:'kuro',jp:400,d:'術のダメージ×1.3'},
  tanshuku:{n:'詠唱短縮',slot:'su',job:'toki',jp:500,d:'詠唱の時間が半分'},
  totsugeki:{n:'突撃',slot:'su',job:'ryu',jp:300,d:'移動した後の物理攻撃×1.2'},
  ryote:{n:'両手持ち',slot:'su',job:'samurai',jp:400,d:'盾のないジョブで物理×1.4'},
  nito:{n:'二刀流',slot:'su',job:'ninja',jp:500,d:'通常攻撃が2回になる'},
  // movement
  mv1:{n:'移動+1',slot:'mo',job:'senshi',jp:200,d:'移動力+1'},
  hpmove:{n:'移動でHP回復',slot:'mo',job:'monk',jp:200,d:'動くとHPが10%回復'},
  jp1:{n:'跳躍+1',slot:'mo',job:'yumi',jp:150,d:'跳躍力+1'},
  mpmove:{n:'移動でMP回復',slot:'mo',job:'shiro',jp:200,d:'動くとMPが10%回復'},
  float:{n:'浮遊',slot:'mo',job:'toki',jp:300,d:'水の上や毒沼を歩ける'},
  jp2:{n:'跳躍+2',slot:'mo',job:'ryu',jp:250,d:'跳躍力+2'},
  mv2:{n:'移動+2',slot:'mo',job:'ninja',jp:550,d:'移動力+2'}
};
const SLOTN={ra:'リアクション',su:'サポート',mo:'ムーブ'};
function jobLearnables(j){return JOBS[j].ab.concat(Object.keys(RSM).filter(k=>RSM[k].job===j));}
const anyAb=k=>AB[k]||RSM[k];

/* 武将の必殺技（三国決戦伝の技名を流用） */
const SPN={lubu:'天下無双・方天戟',guan:'青龍偃月・天裂斬',zhangf:'燕人咆哮・蛇矛',zhaoy:'龍胆・七進七出',mac:'西涼迅雷槍',dianw:'双戟・鉄壁砕',xuc:'虎痴大鎚',tsc:'神亭鞭',suns:'小覇王連撃',zhangl:'遼来来・八百突',xhd:'隻眼烈斬',gann:'錦帆・鈴音斬',huangz:'老将必中斬',weiy:'反骨の鉞',jiangw:'麒麟槍',liub:'雌雄一対・仁剣',caoc:'倚天剣・覇道',zhouy:'赤壁炎舞',zhugel:'東風・八陣',sima:'狼顧の計',sunj:'江東猛虎斬',pangd:'背棺決死斬',huax:'華雄大刀・豪断',wenc:'河北豪槍',menghuo:'南蛮大鎚',zhangj:'太平妖術',
  gaos:'陥陣営・鉄壁突',chengong:'智謀・連環の火',yanl:'河北の双璧・剛断',quyi:'先登死士・強弩',chengpu:'鉄脊蛇矛・老練',yuans:'四世三公・総号令',dongz:'暴虐・魔王鎚',yuej:'先登・猛進',xhy:'神速・急襲',caor:'鉄壁・八門金鎖',huanggai:'鉄鞭・苦肉',gaolan:'河北の猛槍',luxun:'火計・連営焼き',lumeng:'白衣渡江',sunq:'碧眼の号令',pangt:'鳳雛・連環計',zhangh:'巧変・千変爪',xuh:'大斧・長駆',tadun:'烏桓突騎',gongsunz:'白馬義従'};
const SPKIND={liub:'heal',yuans:'rally',caoc:'rally',sunq:'rally',lubu:'musou'};
function spKind(h){if(SPKIND[h.id])return SPKIND[h.id];return h.i>h.p+8?'mag':'phys';}
const WPOW={'方天画戟':3.5,'青龍偃月刀':3.3,'蛇矛':3.3,'鉄脊蛇矛':3,'大刀':3,'朴刀':3,'槍':3,'戟':3,'刀':3,'曲刀':3,'大鎚':3.3,'鉞':3.3,'剣':2.7,'宝剣':2.9,'大剣':3.3,'双剣':1.8,'双戟':1.9,'鞭':3,'トンファー':2.6,'三節棍':3,'爪':2.6,'羽扇':1.5,'弓':3,'弩':3.3};
const POLE={'方天画戟':1,'青龍偃月刀':1,'蛇矛':1,'鉄脊蛇矛':1,'大刀':1,'朴刀':1,'槍':1,'戟':1};
const FISTW={'トンファー':1,'拳':1,'大鎚':1,'鞭':1,'爪':1,'三節棍':1};
function defJob(h){
  const o={liub:'knight',dianw:'monk',yuans:'knight',caoc:'knight',dongz:'monk',suns:'monk',huanggai:'monk',zhangl:'ryu',chengong:'kuro',zhouy:'kuro',quyi:'yumi',xhy:'yumi',zhangf:'ryu',lubu:'ryu',guan:'samurai',sunj:'samurai',huangz:'yumi',guohuai:'yumi',zhugel:'kuro',pangt:'kuro',sima:'kuro',luxun:'kuro',huangquan:'shiro',sunq:'knight',zhangj:'kuro',zhangb:'kuro',zhangh:'monk',menghuo:'monk',zhurong:'ninja',gann:'ninja',lingt:'monk'};
  if(o[h.id])return o[h.id];
  const w=h.w;
  if(w==='弓'||w==='弩')return 'yumi';
  if(h.i>=85&&h.p<80)return 'kuro';
  if(FISTW[w])return 'monk';
  if({'双剣':1,'双戟':1}[w])return 'ninja';
  if({'刀':1,'大刀':1,'青龍偃月刀':1,'曲刀':1}[w])return 'samurai';
  if(POLE[w])return 'ryu';
  return 'knight';
}

/* ---------------- 兵の見た目 ---------------- */
const SOLD={
  wei:{sol:'魏兵',key:'魏',look:{c:0x2b3a6a,t:0xaab0c0,h:'cap',hc:0x22305a}},
  wu:{sol:'呉兵',key:'呉',look:{c:0x8a2a24,t:0xd0a040,h:'cap',hc:0x6a1f1a}},
  shu:{sol:'蜀兵',key:'蜀',look:{c:0x2a6a42,t:0xd0c080,h:'cap',hc:0x1f5034}},
  yuan:{sol:'袁紹兵',key:'群',look:{c:0x8a7a2a,t:0xe0d080,h:'cap',hc:0x6a5a1a}},
  lu:{sol:'呂布兵',key:'群',look:{c:0x4a1e22,t:0xa08060,h:'cap',hc:0x3a1418}},
  kokin:{sol:'黄巾兵',key:'群',look:{c:0x9a7a2a,t:0xe0c040,h:'band',hc:0xe0c040}},
  dong:{sol:'董卓兵',key:'群',look:{c:0x3a2a4a,t:0x9a8060,h:'cap',hc:0x2a1a3a}},
  rengo:{sol:'連合兵',key:'群',look:{c:0x6a5a3a,t:0xc0b080,h:'cap',hc:0x4a3a22}},
  uhan:{sol:'烏桓兵',key:'烏桓',look:{c:0x6a6a7a,t:0xa08a60,h:'band',hc:0x5a4a3a}},
  nanban:{sol:'南蛮兵',key:'南蛮',look:{c:0x8a5a2a,t:0xd0a040,h:'none'}},
  gongsun:{sol:'白馬義従',key:'群',look:{c:0xe0e4ea,t:0xc0c8d8,h:'plume',hc:0xd0d6de,pl:0xffffff}}
};
const FCHAR={wei:'魏',wu:'呉',shu:'漢',yuan:'袁',lu:'呂',kokin:'黄',dong:'董',rengo:'連',uhan:'烏',nanban:'蛮',gongsun:'公'};
const FCOL={wei:'#2b3a6a',wu:'#8a2a24',shu:'#2a6a42',yuan:'#8a7a2a',lu:'#6a1c1c',kokin:'#b8902a',dong:'#3a2a4a',rengo:'#6a5a3a',uhan:'#5a5a6a',nanban:'#8a5a2a',gongsun:'#9aa0aa'};

/* ---------------- 戦場 ---------------- */
const BATTLES={
  kokin:{n:'黄巾討伐',y:184,p:'冀州',map:'plain',opt:{village:1}},
  koso:{n:'広宗の森',y:184,p:'冀州',map:'forest',opt:{}},
  shisui:{n:'汜水関',y:190,p:'司隷',map:'gate',opt:{valley:1}},
  koro:{n:'虎牢関',y:190,p:'司隷',map:'gate',opt:{}},
  kaikyo:{n:'界橋',y:191,p:'冀州',map:'river',opt:{}},
  kahi:{n:'下邳',y:198,p:'徐州',map:'castle',opt:{river:1}},
  hakuba:{n:'白馬',y:200,p:'兗州',map:'plain',opt:{}},
  kanto:{n:'官渡',y:200,p:'兗州',map:'plain',opt:{camp:1}},
  hakuro:{n:'白狼山',y:207,p:'幽州',map:'hills',opt:{}},
  chohan:{n:'長坂',y:208,p:'荊州',map:'river',opt:{narrow:1}},
  sekiheki:{n:'赤壁',y:208,p:'荊州',map:'yangtze',opt:{}},
  gappi:{n:'合肥',y:215,p:'揚州',map:'river',opt:{}},
  teigun:{n:'定軍山',y:219,p:'漢中',map:'mountain',opt:{}},
  hanjo:{n:'樊城',y:219,p:'荊州',map:'castle',opt:{river:1}},
  iryo:{n:'夷陵',y:222,p:'荊州',map:'forest',opt:{camps:1}},
  nanban:{n:'南蛮征伐',y:225,p:'益州',map:'forest',opt:{swamp:1}},
  gojo:{n:'五丈原',y:234,p:'雍州',map:'hills',opt:{plateau:1,river:1}}
};
const MAPN={plain:'平原',forest:'森',gate:'関所',castle:'城',river:'川',yangtze:'長江',hills:'丘',mountain:'山'};
/* 敵の書き方: *=総大将 !=ボス  id:ジョブ / g:ジョブ=兵 */
const F_KOKIN1='*zhangb:kuro zhangliang:samurai zhangj:shiro',
  F_KOSO='*zhangj:kuro zhangliang:samurai zhangb:toki',
  F_SHISUI='*huax:samurai',
  F_LUKORO='*!lubu:ryu zhangl:ryu gaos:knight chengong:kuro dongz:monk',
  F_RENGO='*yuans:knight liub:knight guan:samurai zhangf:ryu caoc:knight sunj:samurai',
  F_KAHI='*!lubu:ryu gaos:knight chengong:kuro zhangl:ryu',
  F_SEKI_WU='*zhouy:kuro huanggai:monk gann:ninja lumeng:knight chengpu:ryu',
  F_SEKI_WEI='*caoc:knight caor:knight xuc:monk yuej:samurai zhangl:ryu',
  F_GOJO_SHU='*zhugel:kuro jiangw:ryu weiy:samurai madai:ryu wangping:knight',
  F_GOJO_WEI='*sima:kuro guohuai:yumi simashi:knight zhangh:monk xuh:samurai',
  F_UHAN='*tadun:ryu';
const CAMP={
 wei:{n:'魏',col:'#3c62b0',lead:'caoc',start:['caoc','xhd','xhy','caor','yuej'],gen:7,diff:['ふつう','#3c62b0'],d:'仲間になる武将が多い。曹操の統率と猛将たち。',list:[
  {b:'koso',side:'atk',ef:'kokin',foe:F_KOSO,s:'黄巾の乱。騎都尉の曹操は官軍とともに、張角が籠もる広宗の森へ攻め入る。',w:'張角は病に倒れ、黄巾の主力は崩れた。曹操の名が知られはじめる。'},
  {b:'shisui',side:'atk',ef:'dong',foe:F_SHISUI,s:'董卓の暴政に、曹操は檄を飛ばして諸侯を集めた。最初の関門・汜水関を猛将華雄が守る。',w:'華雄は討たれ、汜水関は開いた。',join:['dianw']},
  {b:'koro',side:'atk',ef:'lu',foe:F_LUKORO,s:'洛陽の喉元・虎牢関。関の前に立つのは天下無双・呂布。',w:'呂布は退き、董卓は長安へ逃れた。',join:['lidian']},
  {b:'kahi',side:'atk',ef:'lu',foe:F_KAHI,ev:'flood',s:'徐州を奪った呂布を、曹操は下邳城に追い詰めた。川を切って城を水に沈める策が動く。',w:'白門楼に呂布は散った。張遼が曹操に降る。',join:['zhangl','xuc']},
  {b:'hakuba',side:'atk',ef:'yuan',foe:'*yanl:samurai wenc:ryu gaolan:ryu quyi:yumi',s:'袁紹の大軍が南下した。先鋒の顔良が白馬を囲む。',w:'顔良・文醜は討たれ、袁紹軍は官渡へ退いた。'},
  {b:'kanto',side:'atk',ef:'yuan',foe:'*yuans:knight zhangh:monk gaolan:ryu quyi:yumi',ev:'usou',s:'天下分け目の官渡。袁紹の陣は土塁で固い。だが烏巣の兵糧庫を焼けば崩れる。',w:'袁紹は河北へ逃げ帰った。張郃と徐晃が力を貸す。',join:['zhangh','xuh']},
  {b:'hakuro',side:'atk',ef:'uhan',foe:F_UHAN,s:'袁氏の残党は北の烏桓に逃れた。曹操は砂漠を越えて白狼山に迫る。',w:'蹋頓は討たれ、河北は平定された。'},
  {b:'chohan',side:'atk',ef:'shu',foe:'*liub:knight zhaoy:ryu zhangf:ryu guan:samurai zhugel:kuro',s:'荊州へ南下した曹操。逃げる劉備を長坂で捕らえよ。細い橋には張飛が立つ。',w:'劉備は討たれ、荊州は曹操のものとなった。（もしもの勝利）'},
  {b:'sekiheki',side:'def',ef:'wu',foe:F_SEKI_WU,ev:'wind',s:'鎖でつないだ大船団で長江に陣取る曹操。周瑜は火を狙っている。東南の風が吹く前に討て。',w:'火計を退けた曹操は、ついに江東の地を踏んだ。（もしもの勝利）',join:['sima','guohuai']},
  {b:'gappi',side:'def',ef:'wu',foe:'*sunq:knight gann:ninja lingt:monk zhout:samurai lumeng:knight',ev:'bridge',s:'孫権が十万の兵で合肥に迫る。守る張遼は打って出る。',w:'「遼来来」。張遼の名に江東の子は泣きやんだ。',join:['simashi']},
  {b:'gojo',side:'def',ef:'shu',lead:'sima',roster:['sima','zhangh','guohuai','simashi','xuh','caochun'],foe:F_GOJO_SHU,s:'曹操亡き後、魏を支えるのは司馬懿。諸葛亮の北伐を、五丈原の高台で迎え撃つ。',w:'星は落ちた。諸葛亮は陣中に没し、天下は魏へと傾いた。'}]},
 wu:{n:'呉',col:'#c0392b',lead:'sunj',start:['sunj','huanggai','chengpu','suns'],gen:5,diff:['ふつう','#a8322e'],d:'江東の虎の一族。数はふつう。',list:[
  {b:'kokin',side:'atk',ef:'kokin',foe:F_KOKIN1,s:'黄巾の乱。孫堅は義勇の兵を率いて黄巾賊の討伐に向かう。',w:'孫堅の武勇は朝廷に知られた。'},
  {b:'shisui',side:'atk',ef:'dong',foe:F_SHISUI,s:'反董卓連合の先鋒、孫堅。兵糧は届かないが、汜水関の華雄を討つ。',w:'華雄の首は孫堅が挙げた。'},
  {b:'koro',side:'atk',ef:'lu',foe:F_LUKORO,s:'江東の虎・孫堅は虎牢関の城門を睨む。門を破れ、呂布を討て。',w:'洛陽に一番乗りした孫堅は、井戸から玉璽を拾い上げた。',join:['zhouy','tsc']},
  {b:'sekiheki',side:'atk',ef:'wei',lead:'zhouy',roster:['zhouy','huanggai','gann','lumeng','chengpu','sunq','tsc'],foe:F_SEKI_WEI,ev:'wind',s:'孫堅も孫策も世を去り、江東は若き孫権が継いだ。曹操の大船団が長江に迫る。都督・周瑜は東南の風を待つ。',w:'赤壁の炎は天を焦がした。曹操は北へ逃れた。',join:['gann','lumeng','sunq','lingt','zhout']},
  {b:'gappi',side:'atk',ef:'wei',lead:'sunq',roster:['sunq','gann','lingt','zhout','lumeng','chengpu','tsc'],foe:'*!zhangl:ryu yuej:samurai lidian:yumi',ev:'bridge',s:'孫権は十万の兵で合肥を囲む。守将張遼の兵はわずか。だが油断するな。',w:'合肥は落ちた。張遼は北へ退いた。（もしもの勝利）'},
  {b:'hanjo',side:'atk',ef:'shu',lead:'lumeng',roster:['lumeng','sunq','gann','zhout','lingt','jiangqin'],foe:'*guan:samurai guanp:samurai zhoucang:ryu liaohua:knight',s:'関羽が北の樊城を攻める隙に、呂蒙は白衣の商人に化けて荊州を奪う。関羽を捕らえよ。',w:'関羽は麦城で捕らえられた。荊州は呉のものとなった。',join:['luxun','xusheng']},
  {b:'iryo',side:'def',ef:'shu',lead:'luxun',roster:['luxun','sunq','zhout','xusheng','gann','lingt','lumeng'],foe:'*liub:knight huangquan:shiro zhangbao2:ryu guanxing:samurai madai:ryu',s:'関羽の仇を討つため、劉備が大軍で攻め寄せる。若き陸遜は森の陣で迎え撃つ。',w:'七百里の陣は燃え落ちた。劉備は白帝城へ退いた。'},
  {b:'gojo',side:'atk',ef:'wei',lead:'luxun',roster:['luxun','sunq','zhout','xusheng','lingt','gann'],foe:F_GOJO_WEI,s:'諸葛亮の北伐に呼応して、呉も兵を北へ。五丈原の高台に陣取る司馬懿を討ち、天下を一つに。',w:'司馬懿は敗れ、魏は崩れた。長江の国が天下の主となる。'}]},
 shu:{n:'蜀',col:'#2f8a50',lead:'liub',start:['liub','guan','zhangf'],gen:3,diff:['ハード','#7a2a1a'],d:'最初は三兄弟だけ。義兄弟の武が頼り。',list:[
  {b:'kokin',side:'atk',ef:'kokin',foe:F_KOKIN1,s:'桃園で義兄弟の契りを結んだ劉備・関羽・張飛。わずかな義勇兵で黄巾賊に挑む。',w:'三兄弟の初陣は勝利に終わった。'},
  {b:'koso',side:'atk',ef:'kokin',foe:F_KOSO,s:'官軍に加わった三兄弟は、張角の籠もる広宗の森へ。',w:'黄巾の乱は収まった。だが劉備への恩賞はわずかだった。'},
  {b:'koro',side:'atk',ef:'lu',foe:F_LUKORO,s:'公孫瓚の陣に身を寄せる三兄弟。誰も呂布に挑まぬなら、我らが行く。',w:'三英、呂布と戦う。その名は天下に響いた。',join:['zhaoy']},
  {b:'kahi',side:'atk',ef:'lu',foe:F_KAHI,ev:'flood',s:'呂布に徐州を奪われた劉備は、曹操と組んで下邳城を攻める。',w:'呂布は散った。劉備は曹操のもとを離れ、やがて三顧の礼で諸葛亮を迎える。',join:['zhugel']},
  {b:'chohan',side:'def',ef:'wei',cond:{k:'survive',t:70},foe:'*caoc:knight caochun:ryu xuc:monk zhangl:ryu xhd:knight',s:'曹操の大軍が荊州へ。民を連れて逃げる劉備を虎豹騎が追う。長坂の橋で耐え抜け。',w:'張飛の一喝に曹操軍は退いた。劉備は江夏へ逃れる。'},
  {b:'sekiheki',side:'atk',ef:'wei',roster:['liub','guan','zhangf','zhaoy','zhugel'],foe:F_SEKI_WEI,ev:'wind',s:'孫権と手を結んだ劉備。諸葛亮が東南の風を呼ぶ。',w:'曹操は北へ逃れた。劉備は荊州の南を得た。',join:['huangz','weiy','pangt','mac']},
  {b:'teigun',side:'atk',ef:'wei',foe:'*xhy:yumi zhangh:monk xuh:samurai guohuai:yumi',s:'漢中を賭けた戦い。老将黄忠が、山上から夏侯淵を狙う。',w:'夏侯淵は討たれ、劉備は漢中王となった。',join:['wangping']},
  {b:'hanjo',side:'atk',ef:'wei',lead:'guan',roster:['guan','guanp','zhoucang','liaohua','wangping','huangz'],ev:'flood',foe:'*caor:knight pangd:samurai yujin:samurai xuh:samurai',s:'荊州を守る関羽が北へ出た。秋の長雨で漢水が溢れる。樊城の曹仁を討て。',w:'于禁の七軍は水に沈んだ。だが背後では呉が動いていた。'},
  {b:'iryo',side:'atk',ef:'wu',lead:'liub',roster:['liub','zhaoy','huangquan','zhangbao2','guanxing','madai','huangz'],foe:'*luxun:kuro zhout:samurai xusheng:samurai gann:ninja lingt:monk',s:'関羽と張飛を失った劉備は、仇を討つため東へ。森に陣を連ねて陸遜に迫る。',w:'陸遜は退いた。劉備は荊州を取り戻した。（もしもの勝利）',join:['huangquan','zhangbao2','guanxing','madai']},
  {b:'nanban',side:'atk',ef:'nanban',lead:'zhugel',roster:['zhugel','zhaoy','weiy','wangping','madai','guanxing','mac'],foe:'*menghuo:monk zhurong:ninja',s:'劉備亡き後、蜀を託された諸葛亮。北伐の前に、南の孟獲を心から従わせる。',w:'七度捕らえ、七度放つ。孟獲はついに心から服した。',join:['jiangw']},
  {b:'gojo',side:'atk',ef:'wei',lead:'zhugel',roster:['zhugel','jiangw','weiy','madai','wangping','guanxing','zhangbao2'],foe:F_GOJO_WEI,s:'最後の北伐。五丈原の高台に司馬懿は籠もって動かない。命の尽きる前に、討て。',w:'秋風の五丈原に勝鬨が上がった。漢室は再び興る。'}]},
 lu:{n:'呂布',col:'#7a1c1c',lead:'lubu',start:['lubu','zhangl','gaos','chengong'],gen:5,diff:['ふつう','#7a1c1c'],d:'少数精鋭。呂布が一人で戦場を壊す。',list:[
  {b:'kokin',side:'atk',ef:'kokin',foe:F_KOKIN1,s:'并州の丁原に仕える若き呂布。黄巾の残党を蹴散らせ。',w:'人中に呂布あり。その武名は都に届いた。'},
  {b:'koro',side:'def',ef:'rengo',foe:F_RENGO,s:'董卓の命で虎牢関を守る。押し寄せる連合軍の盟主・袁紹の首を取れ。',w:'連合軍は崩れた。やがて呂布は董卓を討ち、徐州へ流れる。'},
  {b:'kahi',side:'def',ef:'wei',ev:'flood',foe:'*caoc:knight xhd:knight xuc:monk guan:samurai zhangf:ryu liub:knight',s:'徐州を得た呂布を、曹操と劉備が下邳城に囲む。城を水に沈める策が来る。耐えて曹操を討て。',w:'曹操は退いた。呂布は徐州の主となった。（もしもの勝利）'},
  {b:'kanto',side:'atk',ef:'wei',foe:'*caoc:knight xhd:knight xuc:monk dianw:monk xhy:yumi',s:'曹操と袁紹が争う官渡。呂布は横から曹操の本陣を突く。',w:'曹操は討たれた。中原は呂布のものとなった。',join:['zhangx','matengg']},
  {b:'sekiheki',side:'atk',ef:'wu',foe:F_SEKI_WU,s:'中原を制した呂布は長江を渡る。江東の周瑜が船を並べて待つ。',w:'呉は降った。残るは西の蜀のみ。'},
  {b:'gojo',side:'atk',ef:'shu',foe:F_GOJO_SHU,s:'最後の敵は諸葛亮。五丈原の高台に陣を敷いた。天下無双の名にかけて、討て。',w:'天下に呂布の敵なし。乱世は呂布の手で終わった。'}]},
 yuan:{n:'袁紹',col:'#b8902a',lead:'yuans',start:['yuans','yanl','wenc','quyi','gaolan'],gen:7,diff:['やさしい','#5a7a2a'],d:'名門の盟主。河北の猛将が最初からそろう。',list:[
  {b:'kokin',side:'atk',ef:'kokin',foe:F_KOKIN1,s:'名門袁家の袁紹。黄巾の乱を討ち、その名を上げる。',w:'四世三公の名に恥じぬ初陣。'},
  {b:'koro',side:'atk',ef:'lu',foe:F_LUKORO,s:'反董卓連合の盟主となった袁紹。虎牢関を落とし、天下に威を示せ。',w:'董卓は長安へ逃れた。袁紹は冀州を手に入れる。'},
  {b:'kaikyo',side:'atk',ef:'gongsun',foe:'*gongsunz:ryu zhaoy:ryu liub:knight guan:samurai zhangf:ryu',s:'河北の覇を争う公孫瓚。白馬義従の騎兵が界橋を渡ってくる。麴義の弩で迎え撃て。',w:'白馬義従は崩れた。公孫瓚は易京へ籠もる。',join:['zhangh']},
  {b:'hakuba',side:'atk',ef:'wei',foe:'*caoc:knight guan:samurai zhangl:ryu xuh:samurai',s:'河北を平らげた袁紹が南へ。曹操の守る白馬を落とせ。曹操のもとには関羽がいる。',w:'顔良は生き残り、白馬は落ちた。（もしもの勝利）'},
  {b:'kanto',side:'atk',ef:'wei',foe:'*caoc:knight xuc:monk xhd:knight zhangl:ryu yuej:samurai xhy:yumi',s:'官渡の曹操の陣は土塁で固められている。烏巣の兵糧を守り、曹操を討て。',w:'曹操は討たれた。天下の半ばは袁紹のものとなった。（もしもの勝利）'},
  {b:'hakuro',side:'atk',ef:'uhan',foe:F_UHAN,s:'北の烏桓が背いた。白狼山の騎馬兵を討ち、北方を固める。',w:'烏桓は降り、北の憂いは消えた。'},
  {b:'gojo',side:'atk',ef:'shu',foe:F_GOJO_SHU,s:'残る敵は蜀の諸葛亮。五丈原の高台を攻め落とせ。',w:'名門袁家が天下を一つにした。'}]}
};
const FAC_ORDER=['wei','wu','shu','yuan','lu'];

/* ---------------- save ---------------- */
const SAVE=LSX.get('s3t_save2',{u:{},camp:{},joined:{}});
SAVE.u=SAVE.u||{};SAVE.camp=SAVE.camp||{};SAVE.joined=SAVE.joined||{};
function rec(key){if(!SAVE.u[key])SAVE.u[key]={jp:{},ln:{},lv:1,exp:0,eq:{}};const r=SAVE.u[key];r.lv=r.lv||1;r.exp=r.exp||0;r.eq=r.eq||{};return r;}
function persist(){LSX.set('s3t_save2',SAVE);}

/* ---------------- unit stats ---------------- */
const byIdH=id=>HEROES.find(h=>h.id===id);
function genSoldier(sk,i,job,tag){
  const S=SOLD[sk];const r=mulberry((i+1)*977+sk.length*31+(tag||0));
  const L=Object.assign({},S.look,{sk:[0xe0b090,0xd89a74,0xeac3a2][i%3]});
  if(job==='kuro'||job==='toki')L.h='hat';
  if(job==='shiro'){L.c=MODEL.dk(S.look.c,1.6);L.h='band';}
  return {id:'g_'+sk+'_'+i+(tag?'_'+tag:''),n:S.sol+(i+1),s:S.sol[0],f:S.key,w:JOBS[job].wpn,p:Math.round(52+r()*12),i:Math.round(42+r()*16),hp:82,df:60,cmd:Math.round(50+r()*14),lk:L,gen:1};
}
function calcStats(u){
  const h=u.h,J=JOBS[u.job],lv=u.lv;
  u.pa=Math.round((2+h.p/25)*J.pa)+Math.floor((lv-1)/2);
  u.ma=Math.round((2+h.i/25)*J.ma)+Math.floor((lv-1)/2);
  let mhp=(30+h.hp*.35)*J.hp*(1+.06*(lv-1));if(u.boss)mhp*=1.6;else if(u.leader)mhp*=1.3;if(u.su==='hpup')mhp*=1.2;
  u.mhp=Math.round(mhp);
  u.mmp=Math.round((8+h.i*.25)*J.mp*(1+.04*(lv-1)));
  u.sp=Math.max(4,Math.round((5.5+(h.cmd||60)/45)*J.sp))+Math.floor((lv-1)/5);
  u.mv=J.mv+(u.mo==='mv1'?1:u.mo==='mv2'?2:0);
  u.jpw=J.jp+(u.mo==='jp1'?1:u.mo==='jp2'?2:0);
  u.br=clamp(Math.round(40+h.p/2.2),40,97);u.fa=clamp(Math.round(30+h.i/2),30,90);
  u.df=h.df||60;u.ev=J.ev;
  u.wp=u.job==='yumi'?(WPOW[u.wname]||3):(h.gen?J.wp:(WPOW[u.wname]||J.wp));
  u.atk=J.atk;if(u.su==='nito'&&u.atk==='melee')u.atk='dual';
}
function mkUnit(h,job,side,fk,opt){
  opt=opt||{};const J=JOBS[job];
  const key=fk+':'+h.id;const rc=opt.ai?{jp:{},ln:{},lv:opt.lv||1,exp:0,eq:opt.eq||{}}:rec(key);
  if(!opt.ai&&!rc.init){rc.init=1;rc.jp[job]=(rc.jp[job]||0)+150;rc.ln[J.ab[0]]=1;}
  let wname=h.gen?J.wpn:h.w;
  if(job==='yumi'&&!h.gen&&h.w!=='弓'&&h.w!=='弩')wname='弓';
  if(job==='monk'&&!h.gen&&!FISTW[h.w])wname='拳';
  if(job==='ninja'&&!h.gen&&!{'双剣':1,'双戟':1}[h.w])wname='双剣';
  const u={h,job,side,fk,key,rc,lv:rc.lv,wname,ra:rc.eq.ra||null,su:rc.eq.su||null,mo:rc.eq.mo||null,
    ct:Math.floor(R()*40),x:0,z:0,dir:3,alive:true,ko:0,gone:false,st:{},sec:opt.sec||null,leader:!!opt.leader,boss:!!opt.boss,hero:!h.gen,spUsed:false,jpGain:0,expGain:0,lvUps:0,ai:!!opt.ai,role:opt.role||''};
  calcStats(u);u.hp=u.mhp;u.mp=u.mmp;
  return u;
}
function learned(u,k){return !!u.rc.ln[k];}
function jobAbils(u,j){return JOBS[j].ab.filter(k=>learned(u,k));}
/* ============================================================
   MAP GENERATION — 戦場の型ごとに毎回ちがう地形を作る
   北(z小)=守る側 / 南(z大)=攻める側
   ============================================================ */
const W=12,D=16,HU=.32;
function vnoise(r,gw,gd){const g=[];for(let i=0;i<(gw+1)*(gd+1);i++)g.push(r());
  return function(x,z){const fx=x/(W-1)*gw,fz=z/(D-1)*gd,ix=Math.min(gw-1,Math.floor(fx)),iz=Math.min(gd-1,Math.floor(fz)),tx=fx-ix,tz=fz-iz;
    const s=t=>t*t*(3-2*t),a=g[iz*(gw+1)+ix],b=g[iz*(gw+1)+ix+1],c=g[(iz+1)*(gw+1)+ix],d=g[(iz+1)*(gw+1)+ix+1];
    return lerp(lerp(a,b,s(tx)),lerp(c,d,s(tx)),s(tz));};}
function newM(kind){const T=[];for(let z=0;z<D;z++)for(let x=0;x<W;x++)T.push({x,z,h:3,t:'grass',block:0,deep:0,prop:null});
  const at=(x,z)=>(x<0||z<0||x>=W||z>=D)?null:T[z*W+x];return {T,at,kind,feats:[]};}
function passable(M,t,gateOpen){if(!t||t.block||t.deep)return false;if(t.t==='gate'&&!gateOpen&&G&&G.gate&&G.gate.hp>0)return false;return true;}
function nbrs(M,t){const o=[];[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dz])=>{const n=M.at(t.x+dx,t.z+dz);if(n)o.push(n);});return o;}
function bfsAll(M,src,jump,gateOpen){const d=new Map();const q=[];src.forEach(s=>{d.set(s,0);q.push(s);});
  while(q.length){const t=q.shift();for(const n of nbrs(M,t)){if(d.has(n)||!passable(M,n,gateOpen))continue;if(Math.abs(n.h-t.h)>jump)continue;d.set(n,d.get(t)+1);q.push(n);}}return d;}
function smooth(M,maxd,keep){for(let it=0;it<6;it++)for(const t of M.T){if(keep&&keep(t))continue;for(const n of nbrs(M,t)){if(keep&&keep(n))continue;if(t.h-n.h>maxd)t.h=n.h+maxd;}}}
function scatter(M,r,filter,n,prop){const c=M.T.filter(filter);for(let i=0;i<n&&c.length;i++){const t=c.splice(Math.floor(r()*c.length),1)[0];t.prop=prop;t.block=1;}}
function hillsBase(M,r,amp,base,tilt){const n1=vnoise(r,3,4),n2=vnoise(r,5,6);for(const t of M.T){t.h=clamp(Math.round(base+(n1(t.x,t.z)-.5)*amp+(n2(t.x,t.z)-.5)*amp*.4+(tilt||0)*(D-1-t.z)/(D-1)),1,12);}}
function finishM(M){ // 配置候補と通行チェック
  const south=M.T.filter(t=>t.z>=D-3&&passable(M,t,true));
  if(south.length<10)return null;
  const d=bfsAll(M,[south[Math.floor(south.length/2)]],3,true);
  const sOK=south.filter(t=>d.has(t));if(sOK.length<10)return null;
  const north=M.T.filter(t=>t.z<=5&&passable(M,t,true)&&d.has(t));if(north.length<10)return null;
  M.starts=sOK;M.northT=north;return M;
}
function genMap(kind,opt,seed){
  const f={plain:genPlain,forest:genForest,gate:genGate,castle:genGate,river:genRiver,yangtze:genYangtze,hills:genHills,mountain:genMountain}[kind]||genPlain;
  for(let t=0;t<80;t++){const M=f(mulberry(seed+t*7919),opt||{},kind,false);if(M){M.seed=seed;M.tries=t+1;return M;}}
  console.warn('genMap fallback',kind);let M=f(mulberry(seed),opt||{},kind,true)||genPlain(mulberry(seed),{},kind,true);
  if(!M){M=newM('plain');M.feats.push('平原');M.starts=M.T.filter(t=>t.z>=D-3);M.northT=M.T.filter(t=>t.z<=5);}M.seed=seed;return M;
}
/* 平原：村・土塁 */
function genPlain(r,opt,kind,safe){
  const M=newM('plain');hillsBase(M,r,3,3,r()*.8);smooth(M,2);
  M.T.forEach(t=>{if(t.h<=2&&r()<.3)t.t='dirt';});
  M.feats.push('平原');
  if(opt.village){const n=3+Math.floor(r()*3);scatter(M,r,t=>t.z>=4&&t.z<=11&&!t.prop,n,'house');M.feats.push('村 '+n+'軒');}
  if(opt.camp){[4,11].forEach((zz,ci)=>{const gaps=new Set();const ng=2+Math.floor(r()*2);while(gaps.size<ng)gaps.add(1+Math.floor(r()*(W-2)));
      for(let x=0;x<W;x++){const t=M.at(x,zz);if(gaps.has(x)){t.t='road';continue;}t.t='mound';t.h=Math.max(t.h,M.at(x,zz+(ci?1:-1)).h)+2;}});
    M.feats.push('土塁');const st=M.at(W-2,1);st.prop='store';st.block=1;M.feats.push('兵糧庫');}
  scatter(M,r,t=>t.t==='grass'&&!t.prop&&t.z>2&&t.z<D-3,4+Math.floor(r()*5),'tree');
  scatter(M,r,t=>t.t==='grass'&&!t.prop&&t.z>2&&t.z<D-3,1+Math.floor(r()*3),'rock');
  return finishM(M);
}
/* 森：密林・陣営・毒沼 */
function genForest(r,opt,kind,safe){
  const M=newM('forest');hillsBase(M,r,3.4,3,0);smooth(M,2);
  const dens=safe?.12:opt.camps?.2:.3;
  M.T.forEach(t=>{if(t.z>2&&t.z<D-3&&r()<dens){t.prop='tree';t.block=1;}});
  M.feats.push(dens>.25?'深い森':'森');
  if(opt.swamp){let n=0;for(let i=0;i<3;i++){const cx=1+Math.floor(r()*(W-2)),cz=4+Math.floor(r()*8);M.T.forEach(t=>{if(Math.abs(t.x-cx)+Math.abs(t.z-cz)<=1+(r()<.5?1:0)){t.t='swamp';t.prop=null;t.block=0;t.h=Math.max(1,t.h-1);n++;}});}M.feats.push('毒沼');}
  if(opt.camps){scatter(M,r,t=>t.z>=1&&t.z<=6&&!t.prop,5+Math.floor(r()*3),'tent');M.feats.push('連なる陣営');}
  // 小道
  let x=Math.floor(W/2);for(let z=D-1;z>=0;z--){const t=M.at(x,z);if(t.prop==='tree'){t.prop=null;t.block=0;}t.t=t.t==='swamp'?'swamp':'road';if(r()<.4)x=clamp(x+(r()<.5?-1:1),1,W-2);}
  return finishM(M);
}
/* 関所・城 */
function genGate(r,opt,kind,safe){
  const castle=kind==='castle';
  const M=newM(castle?'castle':'gate');const{T,at}=M;
  const wz=castle?5:(r()<.5?4:5);
  const n1=vnoise(r,3,4),n2=vnoise(r,5,6);
  const lw=[],rw=[];let a=1+(r()<.4?1:0),b=1+(r()<.4?1:0);
  for(let z=0;z<D;z++){if(r()<.25)a=clamp(a+(r()<.5?-1:1),1,2);if(r()<.25)b=clamp(b+(r()<.5?-1:1),1,2);lw[z]=castle?0:a;rw[z]=castle?0:b;}
  const tilt=r()*1.2;
  for(const t of T){const{x,z}=t;
    if(z<wz){t.h=3;t.t='stone';if(z===0&&r()<.7&&!castle)t.h=4;}
    else{t.h=clamp(Math.round(2.6+(n1(x,z)-.5)*3.6+(n2(x,z)-.5)*1.4+(z-wz)/D*tilt),2,6);t.t='grass';}
    if(x<lw[z]||x>=W-rw[z]){t.h=Math.abs(z-wz)<=1?11:7+Math.round(n2(x,z)*2);t.t='cliff';t.block=1;}
  }
  const L0=lw[wz],R0=W-rw[wz];
  for(let x=L0;x<R0;x++){const t=at(x,wz);t.h=9;t.t='wall';}
  if(castle){for(let z=0;z<wz;z++){[0,W-1].forEach(x=>{const t=at(x,z);t.h=9;t.t='wall';});}}
  const gx=L0+2+Math.floor(r()*Math.max(1,(R0-L0-5)));
  [gx,gx+1].forEach(x=>{const t=at(x,wz);t.h=3;t.t='gate';});
  at(L0,wz).h=11;at(L0,wz).t='tower';at(R0-1,wz).h=11;at(R0-1,wz).t='tower';
  if(R0-L0>8&&r()<.5){const tx=gx<(L0+R0)/2?R0-3:L0+2;if(at(tx,wz).t==='wall'){at(tx,wz).h=11;at(tx,wz).t='tower';}}
  const zi=wz-1,li=castle?1:L0;const ri=castle?W-1:R0;
  if(gx-li>=3){const sx=li+Math.floor(r()*(gx-li-2));at(sx,zi).h=5;at(sx,zi).t='stair';at(sx+1,zi).h=7;at(sx+1,zi).t='stair';}else if(!safe)return null;
  if(ri-(gx+2)>=3){const sx=gx+2+Math.floor(r()*(ri-gx-4));at(sx,zi).h=7;at(sx,zi).t='stair';at(sx+1,zi).h=5;at(sx+1,zi).t='stair';}else if(!safe)return null;
  const fz0=castle?wz+2:wz+1;
  for(let z=fz0;z<=fz0+1;z++)for(let x=gx-1;x<=gx+2;x++){const t=at(x,z);if(t&&t.t!=='cliff'){t.h=3;t.t='dirt';}}
  let rx=clamp(gx+Math.round((r()-.5)*6),lw[D-1]+1,W-rw[D-1]-2);const road=[];
  for(let z=D-1;z>wz;z--){const tgt=gx+(r()<.5?0:1);if(z<D-2&&r()<.6)rx+=Math.sign(tgt-rx);rx=clamp(rx,lw[z],W-rw[z]-1);const t=at(rx,z);if(t.t!=='cliff'){t.t=t.t==='dirt'?'dirt':'road';road.push(t);}}
  for(let i=1;i<road.length;i++){const p=road[i-1],t=road[i];if(t.h-p.h>1)t.h=p.h+1;if(p.h-t.h>1)t.h=p.h-1;}
  if(castle){ // 城の堀（門の前に橋）
    for(let x=0;x<W;x++){const t=at(x,wz+1);if(x===gx||x===gx+1){t.t='bridge';t.h=3;}else{t.t='water';t.h=1;t.deep=1;}}
    M.feats.push('堀');
    if(opt.river){let z=wz+5+Math.floor(r()*2);for(let x=0;x<W;x++){const t=at(x,z);t.t='ford';t.h=Math.max(1,Math.min(t.h,3)-1);t.prop=null;t.block=0;if(r()<.3)z=clamp(z+(r()<.5?-1:1),wz+4,D-4);}M.feats.push('川の浅瀬');}
  }else{
    const zm=wz+3;const roll=safe?1:r();
    if(roll<.55&&zm<D-4){M.feats.push('堀');let br=0;const rt=road.find(q=>q.z===zm);
      for(let x=0;x<W;x++){const t=at(x,zm);if(t.t==='cliff')continue;if(rt&&rt.x===x){t.t='bridge';t.h=Math.max(3,at(x,zm+1).h);br++;}else{t.t='water';t.h=1;t.deep=1;}}
      if(r()<.55){const cands=T.filter(t=>t.z===zm&&t.t==='water'&&Math.abs(t.x-(rt||{x:-9}).x)>2);if(cands.length){const t=pick(cands);t.t='bridge';t.h=Math.max(3,at(t.x,zm+1).h);br++;}}
      M.feats.push('橋'+br+'本');}
    else if(roll<.85){M.feats.push('浅瀬の小川');let z=wz+4+Math.floor(r()*3);
      for(let x=0;x<W;x++){const t=at(x,z);if(t&&t.t!=='cliff'){t.t='ford';t.h=Math.max(1,Math.min(t.h,3)-1);}if(r()<.3)z=clamp(z+(r()<.5?-1:1),wz+3,D-4);}}
    if(r()<.6){const side=r()<.5?-1:1;const z=wz+2+Math.floor(r()*4);const cx=side<0?lw[z]-1:W-rw[z];const fx=cx-side;
      const c=at(cx,z),f=at(fx,z);if(c&&f&&c.t==='cliff'&&f.t!=='water'&&!f.block){c.h=7;c.t='hill';c.block=0;f.h=Math.max(f.h,4);if(f.t==='grass')f.t='dirt';M.feats.push((side<0?'西':'東')+'の崖に登り道');}}
    if(opt.valley)M.feats.push('谷道');
  }
  const free=T.filter(t=>(t.t==='grass')&&t.z>wz+2&&t.z<D-3);
  const nt=(opt.valley?3:6)+Math.floor(r()*5),nr=2+Math.floor(r()*3);
  for(let i=0;i<nt&&free.length;i++){const t=free.splice(Math.floor(r()*free.length),1)[0];t.prop='tree';t.block=1;}
  for(let i=0;i<nr&&free.length;i++){const t=free.splice(Math.floor(r()*free.length),1)[0];t.prop='rock';t.block=1;}
  M.feats.unshift('城門','城壁');
  Object.assign(M,{wz,gx});
  const fin=finishM(M);if(!fin)return null;
  const dist=bfsAll(M,[M.starts[0]],3,true);
  if(!dist.has(at(gx,wz+1))||!dist.has(at(gx,wz-1)))return null;
  if(!T.some(t=>(t.t==='wall'||t.t==='tower')&&dist.has(t)))return null;
  return M;
}
/* 川：橋・浅瀬 */
function genRiver(r,opt,kind,safe){
  const M=newM('river');hillsBase(M,r,3,3,0);smooth(M,2);
  let z=6+Math.floor(r()*3);const rows=[];
  for(let x=0;x<W;x++){rows.push(z);[z,z+1].forEach(zz=>{const t=M.at(x,zz);t.t='water';t.h=1;t.deep=1;});if(r()<.25)z=clamp(z+(r()<.5?-1:1),5,9);}
  const nb=opt.narrow?1:1+(r()<.6?1:0);const used=[];
  for(let i=0;i<nb;i++){let x;let g=0;do{x=1+Math.floor(r()*(W-2));}while(used.some(u=>Math.abs(u-x)<3)&&g++<20);used.push(x);
    const z0=rows[x];[z0,z0+1].forEach(zz=>{const t=M.at(x,zz);t.t='bridge';t.deep=0;t.h=3;});
    [z0-1,z0+2].forEach(zz=>{const t=M.at(x,zz);if(t){t.h=3;t.prop=null;t.block=0;if(t.t==='grass')t.t='road';}});}
  M.feats.push('川',(opt.narrow?'細い橋1本':'橋'+nb+'本'));
  if(!opt.narrow&&r()<.6){const x=used.length?((used[0]+5+Math.floor(r()*3))%W):3;const z0=rows[x];if(M.at(x,z0).t==='water'){[z0,z0+1].forEach(zz=>{const t=M.at(x,zz);t.t='ford';t.deep=0;t.h=2;});M.feats.push('浅瀬');}}
  M.bridges=M.T.filter(t=>t.t==='bridge');
  scatter(M,r,t=>t.t==='grass'&&!t.prop&&(t.z<5||t.z>10)&&t.z>1&&t.z<D-3,4+Math.floor(r()*4),'tree');
  scatter(M,r,t=>t.t==='grass'&&!t.prop&&t.z>1&&t.z<D-3,1+Math.floor(r()*2),'rock');
  return finishM(M);
}
/* 長江：連環の船 */
function genYangtze(r,opt,kind,safe){
  const M=newM('yangtze');
  M.T.forEach(t=>{if(t.z>=5&&t.z<=10){t.t='water';t.h=0;t.deep=1;}else{t.h=t.z<5?3+(r()<.3?1:0):3;t.t=t.z<5?'grass':'dirt';}});
  const ship=(x0,z0,w,d)=>{for(let z=z0;z<z0+d;z++)for(let x=x0;x<x0+w;x++){const t=M.at(x,z);if(t){t.t='ship';t.h=3;t.deep=0;}}const m=M.at(x0+w-1,z0===5?z0:z0+d-1);if(m&&w*d>4){m.prop='mast';m.block=1;}};
  const plank=(x,z)=>{const t=M.at(x,z);if(t&&t.t==='water'){t.t='bridge';t.h=3;t.deep=0;}};
  // 北の船団（鎖でつながる）
  let x=0;const nShips=[];while(x<W-2){const w=3+Math.floor(r()*2);if(x+w>W)break;ship(x,5,w,2);nShips.push([x,w]);x+=w+1;if(x<W)plank(x-1,5);}
  nShips.forEach(([sx,w])=>{if(r()<.6)plank(sx+1,4);});plank(nShips[0][0]+1,4);
  // 南の船団
  const sShips=[];x=Math.floor(r()*2);while(x<W-2){const w=3;ship(x,8,w,2);sShips.push([x,w]);x+=w+1+Math.floor(r()*2);}
  sShips.forEach(([sx,w])=>{plank(sx+1,10);});
  // 乗り込み板（北と南の船をつなぐ）
  const nb=1+(r()<.6?1:0);for(let i=0;i<nb;i++){const s=pick(sShips);plank(s[0]+1+(i?1:0),7);}
  M.feats.push('長江','連環の船'+nShips.length+'隻','味方の船'+sShips.length+'隻');
  scatter(M,r,t=>t.t==='grass'&&t.z<4&&!t.prop,2+Math.floor(r()*3),'tree');
  return finishM(M);
}
/* 丘：高台・川 */
function genHills(r,opt,kind,safe){
  const M=newM('hills');hillsBase(M,r,7,4,opt.plateau?1.5:.5);
  if(opt.plateau){M.T.forEach(t=>{if(t.z<=3){t.h=8;t.t='hill';}});}
  smooth(M,opt.plateau?3:2,opt.plateau?(t=>t.z<=3):null);
  if(opt.plateau){const xs=[1+Math.floor(r()*4),6+Math.floor(r()*5)];xs.forEach(x=>{[[4,6],[5,4]].forEach(([z,h])=>{const t=M.at(x,z);t.h=Math.min(t.h,h);t.t='road';t.prop=null;t.block=0;});});
    M.T.forEach(t=>{if(t.z===4&&!xs.includes(t.x)&&t.t!=='road')t.h=Math.min(t.h,4);});M.feats.push('五丈原の高台','登り道2本');}
  if(opt.river){let z=10+Math.floor(r()*2);for(let x=0;x<W;x++){const t=M.at(x,z);t.t='ford';t.h=Math.max(1,Math.min(t.h,3)-1);if(r()<.3)z=clamp(z+(r()<.5?-1:1),9,12);}M.feats.push('渭水の浅瀬');}
  M.feats.unshift('起伏の多い丘');
  scatter(M,r,t=>t.t==='grass'&&!t.prop&&t.z>4&&t.z<D-3,3+Math.floor(r()*4),'tree');
  scatter(M,r,t=>t.t==='grass'&&!t.prop&&t.z>2&&t.z<D-3,2+Math.floor(r()*3),'rock');
  return finishM(M);
}
/* 山：山頂 */
function genMountain(r,opt,kind,safe){
  const M=newM('mountain');const n=vnoise(r,4,5);
  M.T.forEach(t=>{t.h=clamp(Math.round(2+(D-1-t.z)/(D-1)*7+(n(t.x,t.z)-.5)*4),1,11);t.t=t.h>=7?'hill':'grass';});
  smooth(M,3);
  scatter(M,r,t=>!t.prop&&t.z>1&&t.z<D-3,6+Math.floor(r()*4),'rock');
  scatter(M,r,t=>t.t==='grass'&&!t.prop&&t.z>4&&t.z<D-3,4+Math.floor(r()*4),'tree');
  M.feats.push('定軍山の山頂','急な斜面');
  return finishM(M);
}
/* ============================================================
   THREE.JS SCENE
   ============================================================ */
let renderer,scene,camera,terrainMesh,gridLines,waterMesh,hlGroup,fxGroup,propGroup,cursorMesh,activeGem;
const TEX={};
const cam={az:Math.PI*.25,el:.62,zoom:1,tx:0,ty:1,tz:0,az0:Math.PI*.25,el0:.62,z0:1};
let faceTile=[];
const wpos=(x,z,h)=>new THREE.Vector3(x-W/2+.5,(h||0)*HU,z-D/2+.5);
function initGL(){
  const cv=$('#gl');
  renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();
  camera=new THREE.OrthographicCamera(-10,10,10,-10,-100,200);
  scene.add(new THREE.HemisphereLight(0xdfe8ff,0x4a3a28,.62));
  const dl=new THREE.DirectionalLight(0xfff0d8,.95);dl.position.set(-8,16,10);dl.castShadow=true;
  dl.shadow.mapSize.set(2048,2048);const sc=dl.shadow.camera;sc.left=-14;sc.right=14;sc.top=14;sc.bottom=-14;sc.near=1;sc.far=60;dl.shadow.bias=-.0008;
  scene.add(dl);scene.add(dl.target);
  MODEL.init();
  const ld=new THREE.TextureLoader();
  ['fire','flame','magic','star','slash','spark','smoke','light','circle','twirl'].forEach(k=>{TEX[k]=ld.load('fx/'+k+'.png');});
  window.addEventListener('resize',resize);resize();
  requestAnimationFrame(frame);
  bindInput();
}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);}
function updCam(){
  const w=innerWidth,h=innerHeight,asp=w/h;const base=(asp<1?13.5:9.6)/cam.zoom;
  camera.left=-base*asp;camera.right=base*asp;camera.top=base;camera.bottom=-base;camera.updateProjectionMatrix();
  const R=40;camera.position.set(cam.tx+Math.sin(cam.az)*Math.cos(cam.el)*R,cam.ty+Math.sin(cam.el)*R,cam.tz+Math.cos(cam.az)*Math.cos(cam.el)*R);
  camera.lookAt(cam.tx,cam.ty,cam.tz);
}
const COLS={grass:[0x6f8d3c,0x5f7a32],dirt:[0xa07f52,0x8a6b44],road:[0xb59f70,0x9a845a],stone:[0x8e897c,0x7e796e],wall:[0x9c968a,0x6e695f],tower:[0xa49a86,0x6e695f],gate:[0x7c7468,0x6e695f],stair:[0x958f82,0x6e695f],
  cliff:[0x7d7058,0x5e523e],hill:[0x83914a,0x6a5c46],water:[0x2a4a5a,0x3a3428],bridge:[0x8a5a2e,0x5a3a1e],ford:[0x6a8a7a,0x5a5040],ship:[0x9a6a3a,0x6a4422],mound:[0x9a7a4a,0x7a5e38],swamp:[0x5a5a3a,0x4a4030]};
function jit(c,a){const r=((c>>16)&255),g=((c>>8)&255),b=c&255;const k=1+(Math.random()-.5)*a;return new THREE.Color(clamp(r*k,0,255)/255,clamp(g*k,0,255)/255,clamp(b*k,0,255)/255);}
function buildTerrain(M){
  [terrainMesh,gridLines,waterMesh,propGroup].forEach(o=>{if(o){scene.remove(o);o.traverse&&o.traverse(m=>{if(m.geometry)m.geometry.dispose();});}});
  const pos=[],col=[],idx=[];faceTile=[];
  const quad=(a,b,c,d,cl,t)=>{const i=pos.length/3;[a,b,c,d].forEach(p=>{pos.push(p.x,p.y,p.z);col.push(cl.r,cl.g,cl.b);});idx.push(i,i+1,i+2,i,i+2,i+3);faceTile.push(t,t);};
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  for(const t of M.T){
    const cx=t.x-W/2+.5,cz=t.z-D/2+.5,y=t.h*HU,c=COLS[t.t]||COLS.grass;
    const top=jit(c[0],.1);
    if(t.t==='bridge'&&(t.x+t.z)%2===0)top.multiplyScalar(.9);
    quad(V(cx-.5,y,cz-.5),V(cx-.5,y,cz+.5),V(cx+.5,y,cz+.5),V(cx+.5,y,cz-.5),top,t);
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dz])=>{
      const n=M.at(t.x+dx,t.z+dz);const nh=n?n.h:-2;if(nh>=t.h)return;
      for(let lv=nh;lv<t.h;lv++){
        const y0=lv*HU,y1=(lv+1)*HU;let sc=c[1];
        if((t.t==='grass'||t.t==='hill')&&lv===t.h-1)sc=0x56702c;if(t.t==='ship'&&lv>=t.h-2)sc=0x5a361a;
        const cl=jit(sc,.08);if((lv+t.x*(dz?1:0)+t.z*(dx?1:0))%2)cl.multiplyScalar(.93);
        if(t.t==='wall'||t.t==='tower'){if(lv%2)cl.multiplyScalar(.9);}
        cl.multiplyScalar(dx===1?.8:dx===-1?.95:dz===1?.88:.72);
        let a,b,cc,d;
        if(dx===1){a=V(cx+.5,y0,cz-.5);b=V(cx+.5,y1,cz-.5);cc=V(cx+.5,y1,cz+.5);d=V(cx+.5,y0,cz+.5);}
        else if(dx===-1){a=V(cx-.5,y0,cz+.5);b=V(cx-.5,y1,cz+.5);cc=V(cx-.5,y1,cz-.5);d=V(cx-.5,y0,cz-.5);}
        else if(dz===1){a=V(cx+.5,y0,cz+.5);b=V(cx+.5,y1,cz+.5);cc=V(cx-.5,y1,cz+.5);d=V(cx-.5,y0,cz+.5);}
        else{a=V(cx-.5,y0,cz-.5);b=V(cx-.5,y1,cz-.5);cc=V(cx+.5,y1,cz-.5);d=V(cx+.5,y0,cz-.5);}
        quad(a,b,cc,d,cl,t);
      }
    });
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  terrainMesh=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));terrainMesh.receiveShadow=true;terrainMesh.castShadow=true;scene.add(terrainMesh);
  // grid lines
  const lp=[];for(const t of M.T){if(t.deep)continue;const cx=t.x-W/2+.5,cz=t.z-D/2+.5,y=t.h*HU+.006;lp.push(cx-.5,y,cz-.5,cx+.5,y,cz-.5,cx+.5,y,cz-.5,cx+.5,y,cz+.5,cx+.5,y,cz+.5,cx-.5,y,cz+.5,cx-.5,y,cz+.5,cx-.5,y,cz-.5);}
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));
  gridLines=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x000000,transparent:true,opacity:.16}));scene.add(gridLines);
  // water
  const wp=[];for(const t of M.T){if(t.t!=='water'&&t.t!=='ford'&&t.t!=='swamp')continue;const cx=t.x-W/2+.5,cz=t.z-D/2+.5,y=(t.t==='water'?t.h+1.4:t.h+.45)*HU;wp.push(cx-.5,y,cz-.5,cx-.5,y,cz+.5,cx+.5,y,cz+.5,cx-.5,y,cz-.5,cx+.5,y,cz+.5,cx+.5,y,cz-.5);}
  const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(wp,3));wg.computeVertexNormals();
  waterMesh=new THREE.Mesh(wg,new THREE.MeshLambertMaterial({color:0x3f8fb8,transparent:true,opacity:.62,emissive:0x0a2a3a}));scene.add(waterMesh);
  // props
  propGroup=new THREE.Group();scene.add(propGroup);
  const lam=c=>new THREE.MeshLambertMaterial({color:c});
  const trunkM=lam(0x5a3a22),leafM=lam(0x3f6a2a),leaf2=lam(0x4f7f34),rockM=lam(0x8a8478),woodM=lam(0x6a4422),stoneM=lam(0x8c877a),roofM=lam(0x3a3430),goldM=lam(0xc9962e);
  const add=(m,p)=>{m.position.copy(p);m.castShadow=true;m.receiveShadow=true;propGroup.add(m);return m;};
  for(const t of M.T){
    const p=wpos(t.x,t.z,t.h);
    if(t.prop==='tree'){const s=.8+Math.random()*.4;add(new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,.5*s,6),trunkM),p.clone().add(new THREE.Vector3(0,.25*s,0)));
      add(new THREE.Mesh(new THREE.ConeGeometry(.42*s,.8*s,7),leafM),p.clone().add(new THREE.Vector3(0,.75*s,0)));add(new THREE.Mesh(new THREE.ConeGeometry(.32*s,.6*s,7),leaf2),p.clone().add(new THREE.Vector3(0,1.15*s,0)));}
    if(t.prop==='house'){const b=add(new THREE.Mesh(new THREE.BoxGeometry(.8,.55,.7),lam(0xc8b48a)),p.clone().add(new THREE.Vector3(0,.27,0)));const rf=add(new THREE.Mesh(new THREE.ConeGeometry(.66,.4,4),roofM),p.clone().add(new THREE.Vector3(0,.74,0)));rf.rotation.y=Math.PI/4;}
    if(t.prop==='tent'){const tn=add(new THREE.Mesh(new THREE.ConeGeometry(.45,.8,6),lam(0xd8cfb8)),p.clone().add(new THREE.Vector3(0,.4,0)));add(new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.1,4),woodM),p.clone().add(new THREE.Vector3(0,.55,0)));}
    if(t.prop==='store'){add(new THREE.Mesh(new THREE.BoxGeometry(.85,.5,.85),lam(0x8a6a3a)),p.clone().add(new THREE.Vector3(0,.25,0)));const rf=add(new THREE.Mesh(new THREE.ConeGeometry(.7,.35,4),roofM),p.clone().add(new THREE.Vector3(0,.67,0)));rf.rotation.y=Math.PI/4;}
    if(t.prop==='mast'){add(new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,2.2,6),woodM),p.clone().add(new THREE.Vector3(0,1.1,0)));const sl=add(new THREE.Mesh(new THREE.PlaneGeometry(.9,1.1),new THREE.MeshLambertMaterial({color:0xe8dcc0,side:THREE.DoubleSide})),p.clone().add(new THREE.Vector3(0,1.3,.06)));}
    if(t.prop==='rock'){const m=add(new THREE.Mesh(new THREE.DodecahedronGeometry(.36,0),rockM),p.clone().add(new THREE.Vector3(0,.22,0)));m.scale.set(1,.7,1.1);m.rotation.y=Math.random()*3;}
    if(t.t==='wall'||t.t==='tower'){ // 南側の狭間（凸凹）
      for(let i=0;i<2;i++){add(new THREE.Mesh(new THREE.BoxGeometry(.26,.2,.12),stoneM),p.clone().add(new THREE.Vector3(-.25+i*.5,.1,.44)));}
      if(t.t==='tower'){add(new THREE.Mesh(new THREE.BoxGeometry(.12,.7,.12),woodM),p.clone().add(new THREE.Vector3(-.4,.35,-.4)));add(new THREE.Mesh(new THREE.BoxGeometry(.12,.7,.12),woodM),p.clone().add(new THREE.Vector3(.4,.35,-.4)));
        const rf=add(new THREE.Mesh(new THREE.ConeGeometry(.78,.32,4),roofM),p.clone().add(new THREE.Vector3(0,.86,-.15)));rf.rotation.y=Math.PI/4;rf.scale.z=.6;}
    }
    if(t.t==='bridge'){[-.45,.45].forEach(dx=>{add(new THREE.Mesh(new THREE.BoxGeometry(.06,.22,1),woodM),p.clone().add(new THREE.Vector3(dx,.11,0)));});}
  }
  if(M.gx!=null){
  // 城門の上の楼
  const gc=wpos(M.gx+.5,M.wz,9);
  add(new THREE.Mesh(new THREE.BoxGeometry(2,.5,1),stoneM),gc.clone().add(new THREE.Vector3(0,-.25,0)));
  const roof=add(new THREE.Mesh(new THREE.CylinderGeometry(.01,1.5,.5,4,1),roofM),gc.clone().add(new THREE.Vector3(0,.55,0)));roof.rotation.y=Math.PI/4;roof.scale.z=.6;
  }
  // 旗
  const flagChar=G.northChar||'董',flagCol=G.northCol||'#7a1c1c';
  M.T.filter(t=>t.t==='tower'||(M.gx==null&&t.z===0&&(t.x===1||t.x===W-2)&&!t.block)).forEach(t=>{const p=wpos(t.x,t.z,t.h);add(new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.4,5),woodM),p.clone().add(new THREE.Vector3(.35,.7,.3)));
    const f=add(new THREE.Mesh(new THREE.PlaneGeometry(.42,.6),new THREE.MeshLambertMaterial({map:flagTex(flagChar,flagCol),side:THREE.DoubleSide})),p.clone().add(new THREE.Vector3(.35,1.1,.08)));f.rotation.y=Math.PI/2;});
  const atkChar=G.southChar||'連',atkCol=G.southCol||'#6a5a3a';
  [[1,D-1],[W-2,D-1]].forEach(([x,z])=>{const t=M.at(x,z);if(!t||t.block)return;const p=wpos(x,z,t.h);add(new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.4,5),woodM),p.clone().add(new THREE.Vector3(.35,.7,.35)));
    const f=add(new THREE.Mesh(new THREE.PlaneGeometry(.42,.6),new THREE.MeshLambertMaterial({map:flagTex(atkChar,atkCol),side:THREE.DoubleSide})),p.clone().add(new THREE.Vector3(.35,1.1,.13)));f.rotation.y=Math.PI/2;});
  G.gateMesh=null;
  if(M.gx!=null){
  // 城門
  const gate=new THREE.Group();const gp=wpos(M.gx+.5,M.wz,3);gate.position.copy(gp);
  const door=new THREE.MeshLambertMaterial({color:0x5a361a});
  [-.5,.5].forEach(dx=>{const d=new THREE.Mesh(new THREE.BoxGeometry(.98,6*HU-.02,.22),door);d.position.set(dx,3*HU,.1);d.castShadow=true;gate.add(d);
    for(let i=0;i<3;i++)for(let j=0;j<3;j++){const s=new THREE.Mesh(new THREE.SphereGeometry(.04,6,4),goldM);s.position.set(dx-.3+i*.3,.35+j*.55,.23);gate.add(s);}
    const bar=new THREE.Mesh(new THREE.BoxGeometry(.98,.08,.24),lam(0x2a1a0e));bar.position.set(dx,1.0,.1);gate.add(bar);});
  propGroup.add(gate);G.gateMesh=gate;gate.visible=!G.gate||G.gate.hp>0;
  }
  hlGroup=hlGroup||new THREE.Group();if(!hlGroup.parent)scene.add(hlGroup);
  fxGroup=fxGroup||new THREE.Group();if(!fxGroup.parent)scene.add(fxGroup);
  if(!activeGem){activeGem=new THREE.Mesh(new THREE.OctahedronGeometry(.13,0),new THREE.MeshBasicMaterial({color:0xf1cf72}));scene.add(activeGem);}
  if(!cursorMesh){const cg=new THREE.EdgesGeometry(new THREE.PlaneGeometry(.96,.96));cursorMesh=new THREE.LineSegments(cg,new THREE.LineBasicMaterial({color:0xffffff}));cursorMesh.rotation.x=-Math.PI/2;cursorMesh.visible=false;scene.add(cursorMesh);}
}
function flagTex(ch,col){const c=document.createElement('canvas');c.width=64;c.height=96;const x=c.getContext('2d');x.fillStyle=col;x.fillRect(0,0,64,96);x.strokeStyle='#e6c068';x.lineWidth=4;x.strokeRect(4,4,56,88);
  x.fillStyle='#fbf0d0';x.font='bold 44px "Shippori Mincho B1","Hiragino Mincho ProN",serif';x.textAlign='center';x.textBaseline='middle';x.fillText(ch,32,50);return new THREE.CanvasTexture(c);}

/* ---------------- unit models (三国決戦伝の3D武将を流用) ---------------- */
function bowBuild(){const g=new THREE.Group();const M=MODEL.M;const arc=new THREE.Mesh(new THREE.TorusGeometry(.42,.025,5,14,Math.PI*1.1),M(0x5a3a1e));arc.rotation.z=-Math.PI*.55;arc.position.y=.0;g.add(arc);
  const str=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.82,3),M(0xeeeeee));str.position.x=-.08;g.add(str);g.userData.bow=1;return g;}
function staffBuild(){const g=new THREE.Group();const M=MODEL.M;g.add(MODEL.mk(MODEL.cylG(.025,.03,1.6,6),M(0x6b4a2b),0,.3,0,1.3));g.add(MODEL.mk(MODEL.sphG(.08),M(0x8ad0ff,{emissive:0x204060}),0,1.15,0,1.15));return g;}
function buildModel(u){
  const h=u.h;const Mo=MODEL;
  const L=Object.assign({},Mo.DEFL,h.lk||{},Mo.LOOK[h.id]||{});
  if(u.job==='kuro'&&h.gen)L.h='hat';
  const U=L.sc||1,ww=Math.sqrt(L.w||1),PI=Math.PI;
  const M=Mo.M,mk=Mo.mk,cylG=Mo.cylG,sphG=Mo.sphG,boxG=Mo.boxG,dk=Mo.dk;
  const arm=M(L.c),trim=M(L.t),dark=M(dk(L.c,.55)),cloth=M(dk(L.c,.75)),skin=M(L.sk);
  const root=new THREE.Group(),body=new THREE.Group(),pelvis=new THREE.Group(),torso=new THREE.Group();
  root.add(body);body.add(pelvis);pelvis.add(torso);pelvis.position.y=.9*U;
  pelvis.add(mk(cylG(.17*U*ww,.18*U*ww,.2*U,8),dark,0,0,0,1.06));
  pelvis.add(mk(cylG(.19*U*ww,.19*U*ww,.06*U,10),trim,0,.1*U,0,1.05));
  const sk=mk(new THREE.CylinderGeometry(.2*U*ww,.3*U*ww,.34*U,10,1,true),Mo.MC(dk(L.c,.8)),0,-.14*U,0);sk.scale.x=.92;pelvis.add(sk);
  torso.position.y=.09*U;
  torso.add(mk(cylG(.15*U*ww,.17*U*ww,.26*U,8),cloth,0,.12*U,0,1.07));
  const chest=mk(cylG(.25*U*ww,.19*U*ww,.4*U,8),arm,0,.45*U,0,1.05);chest.scale.z=.78;torso.add(chest);
  torso.add(mk(boxG(.03*U,.3*U,.3*U*ww),trim,.2*U*ww,.46*U,0,1.1));
  torso.add(mk(cylG(.13*U,.16*U,.09*U,8),trim,0,.68*U,0,1.07));
  function limbArm(side){
    const sh=new THREE.Group();sh.position.set(0,.58*U,side*.235*U*ww);torso.add(sh);
    const pad=mk(sphG(.13*U,8),trim,0,0,0,1.07);pad.scale.set(1,.72,1.05);pad.position.copy(sh.position);pad.position.y+=.025*U;torso.add(pad);
    const L1=.3*U,L2=.3*U;
    sh.add(mk(cylG(.062*U,.052*U,L1,6),arm,0,-L1/2,0,1.16));
    const el=new THREE.Group();el.position.y=-L1;sh.add(el);
    el.add(mk(cylG(.052*U,.045*U,L2,6),skin,0,-L2/2,0,1.18));
    el.add(mk(cylG(.062*U,.058*U,L2*.5,6),trim,0,-L2*.68,0,1.1));
    el.add(mk(sphG(.062*U,6),M(dk(L.t,.7)),0,-L2,0,1.2));
    return {sh,el,L2};
  }
  const aR=limbArm(1),aL=limbArm(-1);
  const head=new THREE.Group();head.position.y=.84*U;torso.add(head);
  torso.add(mk(cylG(.05*U,.06*U,.1*U,6),skin,0,.72*U,0));
  const hr=.142*U;const face=mk(sphG(hr,10),skin,0,0,0,1.06);face.scale.set(1,1.06,.96);head.add(face);
  const fdummy={};Mo.makeFace(fdummy,head,hr,L,skin);head.scale.setScalar(1.18);
  if(L.b===1){const b=mk(new THREE.SphereGeometry(hr*1.04,10,6,0,PI*2,PI*.66,PI*.34),M(L.bc),0,-.02*U,0,1.06);head.add(b);}
  if(L.b===2){const b=mk(new THREE.ConeGeometry(.075*U,.5*U,8),M(L.bc),hr*.62,-hr*2.7,0,1.07);b.rotation.z=PI;b.scale.z=.8;head.add(b);head.add(mk(new THREE.SphereGeometry(hr*1.04,10,6,0,PI*2,PI*.66,PI*.34),M(L.bc),0,-.02*U,0,1.06));}
  if(L.patch)head.add(mk(boxG(.014*U,.06*U,.06*U),M(0x0c0a0a),hr*.92,.025*U,-.055*U));
  Mo.headgear(head,L,U);
  if(L.cape){const cp=mk(new THREE.PlaneGeometry(.5*U*ww,.95*U),Mo.MC(L.cape),-.24*U*ww,.2*U,0);cp.rotation.y=PI/2;cp.rotation.x=0;cp.rotation.z=-.12;torso.add(cp);}
  function limbLeg(side){
    const hp=new THREE.Group();hp.position.set(0,-.02*U,side*.1*U*ww);pelvis.add(hp);
    const L1=.46*U,L2=.46*U;
    hp.add(mk(cylG(.088*U,.066*U,L1,6),dark,0,-L1/2,0,1.14));
    const kn=new THREE.Group();kn.position.y=-L1;hp.add(kn);
    kn.add(mk(cylG(.066*U,.052*U,L2,6),dark,0,-L2/2,0,1.16));
    kn.add(mk(cylG(.074*U,.06*U,L2*.62,6),trim,.012*U,-L2*.36,0,1.08));
    kn.add(mk(boxG(.27*U,.075*U,.11*U),M(0x2a1f18),.07*U,-L2-.02*U,0,1.14));
    return {hp,kn};
  }
  const lF=limbLeg(-1),lB=limbLeg(1);
  // weapon
  let wg;const wn=u.wname;
  if(wn==='弓'||wn==='弩')wg=bowBuild();else if(wn==='杖'||(u.job==='shiro'||u.job==='kuro'||u.job==='toki')&&h.gen)wg=staffBuild();
  else{const wp=Mo.WP[wn]||Mo.WP['剣'];wg=wp.build();if(wp.dual){const w2=wp.build();w2.position.y=-aL.L2;w2.rotation.z=-1.6;aL.el.add(w2);}}
  wg.position.y=-aR.L2;aR.el.add(wg);
  if(JOBS[u.job].shield){const sh=mk(new THREE.CylinderGeometry(.22*U,.22*U,.04*U,12),trim,.06*U,-aL.L2*.6,-.06*U,1.06);sh.rotation.x=PI/2;sh.rotation.z=PI/2;aL.el.add(sh);
    sh.add(mk(new THREE.CylinderGeometry(.16*U,.16*U,.05*U,12),arm,0,.005,0));}
  const S=.56;root.scale.setScalar(S);
  const mats=[];root.traverse(m=>{if(m.isMesh){m.castShadow=true;if(m.material&&m.material.side!==THREE.BackSide){m.material=m.material.clone();mats.push({m:m.material,c:m.material.color.clone()});}}});
  // 足元の印
  const ring=new THREE.Mesh(new THREE.RingGeometry(.3,.4,20),new THREE.MeshBasicMaterial({color:u.side===0?0x3f86d8:0xd04a36,transparent:true,opacity:.75,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.02;
  const pick=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,1.1,6),new THREE.MeshBasicMaterial({visible:false}));pick.position.y=.55;pick.userData.unit=u;
  const holder=new THREE.Group();holder.add(root);holder.add(ring);holder.add(pick);
  const m={holder,root,body,pelvis,torso,head,aR,aL,lF,lB,wg,mats,ring,pick,bob:Math.random()*6,pose:'idle',pt:0,bow:!!wg.userData.bow};
  setPose(m,'idle',0);
  return m;
}
function setPose(m,p,k){ // 腕・脚の角度
  const A={
    idle:{rs:.45,re:1.0,ls:.25,le:.6,w:-1.75,lean:0},
    windup:{rs:-.9,re:1.7,ls:.6,le:.9,w:-1.5,lean:-.15},
    strike:{rs:1.5,re:.25,ls:-.2,le:.4,w:-1.6,lean:.28},
    bow:{rs:1.55,re:.05,ls:1.5,le:.0,w:-1.55,lean:.05},
    cast:{rs:2.5,re:.2,ls:2.4,le:.2,w:-2.5,lean:-.1},
    hurt:{rs:.1,re:.6,ls:.0,le:.6,w:-1.3,lean:-.35},
    win:{rs:2.7,re:.1,ls:.3,le:.5,w:-2.6,lean:-.05}
  }[p]||{};
  m.tp=A;m.pose=p;if(k===0)applyPose(m,1);
}
function applyPose(m,t){const A=m.tp;if(!A)return;
  const d=(o,key,v)=>{o.rotation[key]=lerp(o.rotation[key],v,t);};
  d(m.aR.sh,'z',A.rs);d(m.aR.el,'z',A.re);d(m.aL.sh,'z',A.ls);d(m.aL.el,'z',A.le);d(m.wg,'z',A.w-0);d(m.torso,'z',A.lean||0);
  if(m.bow){m.wg.rotation.z=lerp(m.wg.rotation.z,-1.55,t);m.wg.rotation.y=lerp(m.wg.rotation.y,Math.PI/2,t);}
}
function placeModel(u){const t=G.M.at(u.x,u.z);u.m.holder.position.copy(wpos(u.x,u.z,t.h));u.m.holder.rotation.y=-u.dir*Math.PI/2;}
const DIRV=[[1,0],[0,1],[-1,0],[0,-1]];
function dirTo(ax,az,bx,bz){const dx=bx-ax,dz=bz-az;if(Math.abs(dx)>=Math.abs(dz))return dx>=0?0:2;return dz>=0?1:3;}

/* ---------------- FX ---------------- */
const parts=[];
function fxSprite(tex,pos,o){
  const mat=new THREE.SpriteMaterial({map:TEX[tex],color:o.color||0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:o.op==null?1:o.op});
  const s=new THREE.Sprite(mat);s.position.copy(pos);s.scale.setScalar(o.size||.6);fxGroup.add(s);
  parts.push({s,life:o.life||.7,t:0,v:o.v||new THREE.Vector3(),g:o.g||0,grow:o.grow||0,size:o.size||.6,spin:o.spin||0,op:o.op==null?1:o.op});
}
function fx(kind,p,n){
  p=p.clone();const V=(x,y,z)=>new THREE.Vector3(x,y,z),rr=()=>Math.random()-.5;
  if(kind==='fire'){for(let i=0;i<(n||14);i++)fxSprite(i%3?'fire':'flame',p.clone().add(V(rr()*.7,Math.random()*.3,rr()*.7)),{color:i%2?0xff7a20:0xffc040,size:.5+Math.random()*.5,life:.6+Math.random()*.5,v:V(rr()*.3,.9+Math.random(),rr()*.3),grow:.6,spin:rr()*3});
    fxSprite('light',p.clone().add(V(0,.3,0)),{color:0xff6a20,size:2.2,life:.4,grow:-1});}
  else if(kind==='ice'){for(let i=0;i<12;i++)fxSprite(i%2?'star':'circle',p.clone().add(V(rr()*.8,Math.random()*.8,rr()*.8)),{color:0x8fe0ff,size:.3+Math.random()*.4,life:.8,v:V(0,.3,0),spin:rr()*4});fxSprite('light',p.clone().add(V(0,.4,0)),{color:0x5ac8ff,size:2,life:.5,grow:-1});}
  else if(kind==='thunder'){for(let i=0;i<6;i++){const s=p.clone().add(V(rr()*.2,1.6-i*.3,rr()*.2));fxSprite('spark',s,{color:0xfff09a,size:.9,life:.35,spin:rr()*6});}fxSprite('light',p.clone().add(V(0,.4,0)),{color:0xfff4a0,size:3,life:.35,grow:-2});}
  else if(kind==='heal'){for(let i=0;i<12;i++)fxSprite(i%2?'magic':'twirl',p.clone().add(V(rr()*.7,Math.random()*.4,rr()*.7)),{color:0x8dffb0,size:.35+Math.random()*.3,life:.9,v:V(0,.8,0),spin:rr()*3});}
  else if(kind==='buff'){fxSprite('circle',p.clone().add(V(0,.08,0)),{color:0xf1cf72,size:1.2,life:.8,grow:.8});for(let i=0;i<8;i++)fxSprite('star',p.clone().add(V(rr()*.6,Math.random()*.9,rr()*.6)),{color:0xffe08a,size:.25,life:.8,v:V(0,.6,0)});}
  else if(kind==='debuff'){for(let i=0;i<10;i++)fxSprite('twirl',p.clone().add(V(rr()*.6,.3+Math.random()*.6,rr()*.6)),{color:0xb08aff,size:.45,life:.9,spin:4});}
  else if(kind==='slash'){fxSprite('slash',p.clone().add(V(0,.5,0)),{color:0xffffff,size:1.1,life:.3,spin:rr()*2});for(let i=0;i<5;i++)fxSprite('star',p.clone().add(V(rr()*.3,.5+rr()*.3,rr()*.3)),{color:0xffe0a0,size:.25,life:.4,v:V(rr()*2,rr()*2,rr()*2)});}
  else if(kind==='hit'){fxSprite('star',p.clone().add(V(0,.5,0)),{color:0xffffff,size:.7,life:.25,grow:2});for(let i=0;i<6;i++)fxSprite('spark',p.clone().add(V(0,.5,0)),{color:0xffc070,size:.2,life:.35,v:V(rr()*3,Math.random()*2,rr()*3),g:-5});}
  else if(kind==='dust'){for(let i=0;i<(n||10);i++)fxSprite('smoke',p.clone().add(V(rr()*.8,Math.random()*.4,rr()*.8)),{color:0xb0a080,size:.6+Math.random()*.6,life:1+Math.random(),v:V(rr()*.6,.3,rr()*.6),grow:.8,op:.5});}
  else if(kind==='musou'){for(let i=0;i<24;i++){const a=i/24*Math.PI*2;fxSprite(i%2?'flame':'spark',p.clone().add(V(Math.cos(a)*.3,.4,Math.sin(a)*.3)),{color:0xff4020,size:.6,life:.6,v:V(Math.cos(a)*3,.6,Math.sin(a)*3)});}fxSprite('light',p.clone().add(V(0,.5,0)),{color:0xff3010,size:4,life:.5,grow:-2});}
}
function stepFx(dt){for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.t+=dt;const k=q.t/q.life;if(k>=1){fxGroup.remove(q.s);q.s.material.dispose();parts.splice(i,1);continue;}
  q.v.y+=q.g*dt;q.s.position.addScaledVector(q.v,dt);q.s.scale.setScalar(Math.max(.01,q.size*(1+q.grow*k)));q.s.material.opacity=q.op*(k<.15?k/.15:1-(k-.15)/.85);q.s.material.rotation+=q.spin*dt;}}
function chargeRing(u,on,color){if(on){if(u.cring)return;const m=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.3),new THREE.MeshBasicMaterial({map:TEX.magic,color:color||0xa08aff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.04;u.m.holder.add(m);u.cring=m;}
  else if(u.cring){u.m.holder.remove(u.cring);u.cring.material.dispose();u.cring=null;}}

/* ---------------- tween / frame ---------------- */
const tweens=[];
function tween(dur,fn){return new Promise(res=>{tweens.push({t:0,d:dur/1000/SPD,fn,res});});}
let lastT=0,clock=0;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-lastT)/1000||0);lastT=now;clock+=dt;
  for(let i=tweens.length-1;i>=0;i--){const w=tweens[i];w.t+=dt;const k=Math.min(1,w.t/w.d);w.fn(k);if(k>=1){tweens.splice(i,1);w.res();}}
  if(G&&G.units){
    for(const u of G.units){if(!u.m||u.gone)continue;const m=u.m;
      if(m.pose==='idle'&&u.alive){m.body.position.y=Math.sin(clock*2.2+m.bob)*.012;}
      applyPose(m,Math.min(1,dt*14));
      if(u.cring)u.cring.rotation.z+=dt*1.5;
    }
    if(G.active&&G.active.m&&!G.active.away){const p=G.active.m.holder.position;activeGem.visible=true;activeGem.position.set(p.x,p.y+1.35+Math.sin(clock*3)*.06,p.z);activeGem.rotation.y+=dt*2;}else if(activeGem)activeGem.visible=false;
    if(waterMesh)waterMesh.material.opacity=.55+Math.sin(clock*1.5)*.06;
  }
  // camera smoothing
  cam.az=lerp(cam.az,cam.az0,Math.min(1,dt*8));cam.el=lerp(cam.el,cam.el0,Math.min(1,dt*8));cam.zoom=lerp(cam.zoom,cam.z0,Math.min(1,dt*8));
  if(cam.ftx!=null){cam.tx=lerp(cam.tx,cam.ftx,Math.min(1,dt*5));cam.ty=lerp(cam.ty,cam.fty,Math.min(1,dt*5));cam.tz=lerp(cam.tz,cam.ftz,Math.min(1,dt*5));}
  if(fxGroup)stepFx(dt);
  if(hlGroup)for(const m of hlGroup.children){const b=m.material.userData.base;if(b!=null)m.material.opacity=b*(.72+.28*Math.sin(clock*5));}
  if(renderer){updCam();renderer.render(scene,camera);updLabels();}
}
function focus(x,z,h){const p=wpos(x,z,h||0);cam.ftx=p.x*.8;cam.fty=p.y*.6+.6;cam.ftz=p.z*.8;}

/* ---------------- labels (HP bars / pops) ---------------- */
const _v=new THREE.Vector3();
function scr(p){_v.copy(p).project(camera);return {x:(_v.x+1)/2*innerWidth,y:(1-_v.y)/2*innerHeight};}
function updLabels(){if(!G||!G.units)return;
  for(const u of G.units){if(!u.bar)continue;if(u.gone||u.away){u.bar.hidden=true;continue;}u.bar.hidden=false;
    const p=u.m.holder.position.clone();p.y+=1.18;const s=scr(p);u.bar.style.transform='translate('+s.x.toFixed(1)+'px,'+s.y.toFixed(1)+'px)';
    u.bar.firstChild.style.width=(u.hp/u.mhp*100)+'%';u.bar.classList.toggle('ko',!u.alive);
    if(u.ctrEl){const p2=u.m.holder.position.clone();p2.y+=1.45;const s2=scr(p2);u.ctrEl.style.left=s2.x+'px';u.ctrEl.style.top=s2.y+'px';}}
  for(const q of pops){const s=scr(q.p);q.e.style.left=s.x+'px';q.e.style.top=s.y+'px';}
  for(const q of says){const p=q.u.m.holder.position.clone();p.y+=1.55;const s=scr(p);q.e.style.left=s.x+'px';q.e.style.top=s.y+'px';q.e.hidden=!!(q.u.gone||q.u.away);}
  if(G.dirBtns)G.dirBtns.forEach(b=>{const s=scr(b.p);b.e.style.left=s.x+'px';b.e.style.top=s.y+'px';});
}
const pops=[];
function pop(u,text,cls){const p=u.m?u.m.holder.position.clone():wpos(u.x,u.z,G.M.at(u.x,u.z).h);p.y+=1.0;const e=el('div','pop '+(cls||''),text);$('#labels').appendChild(e);const q={p,e};pops.push(q);
  setTimeout(()=>{e.remove();pops.splice(pops.indexOf(q),1);},1150);}
function popAt(p,text,cls){const e=el('div','pop '+(cls||''),text);$('#labels').appendChild(e);const q={p:p.clone(),e};pops.push(q);setTimeout(()=>{e.remove();pops.splice(pops.indexOf(q),1);},1150);}

/* ============================================================
   BATTLE STATE
   ============================================================ */
let G=null;
const unitAt=(x,z)=>G.units.find(u=>!u.gone&&!u.away&&u.x===x&&u.z===z);
const tileOf=u=>G.M.at(u.x,u.z);
const foes=u=>G.units.filter(o=>o.side!==u.side&&o.alive&&!o.gone);
const effSp=u=>u.st.stop?0:u.sp*(u.st.haste?1.5:1)*(u.st.slow?.5:1);
function gateAt(x,z){return G.gate&&G.gate.hp>0&&G.M.gx!=null&&z===G.M.wz&&(x===G.M.gx||x===G.M.gx+1);}
function canEnter(u,n,go){if(u.mo==='float'&&n.deep&&!n.block)return true;return passable(G.M,n,go);}
function stepCost(u,n){if(u.mo==='float')return 1;return (n.t==='ford'||n.t==='swamp')?2:1;}
function reach(u){ // 移動できるマス
  const go=u.side===G.defSide;const M=G.M,start=tileOf(u),d=new Map([[start,0]]),q=[start];
  while(q.length){q.sort((a,b)=>d.get(a)-d.get(b));const t=q.shift();const c=d.get(t);
    for(const n of nbrs(M,t)){if(!canEnter(u,n,go))continue;if(Math.abs(n.h-t.h)>u.jpw&&!(u.mo==='float'&&n.deep))continue;
      const o=unitAt(n.x,n.z);if(o&&o.side!==u.side&&o.alive)continue;
      const nc=c+stepCost(u,n);if(nc>u.mv)continue;if(!d.has(n)||d.get(n)>nc){d.set(n,nc);q.push(n);}}}
  const out=[];for(const[t]of d){const o=unitAt(t.x,t.z);if(!o||o===u)out.push(t);}return {tiles:out,d};
}
function pathTo(u,goal){
  const go=u.side===G.defSide;const M=G.M,start=tileOf(u),prev=new Map(),d=new Map([[start,0]]),q=[start];
  while(q.length){q.sort((a,b)=>d.get(a)-d.get(b));const t=q.shift();if(t===goal)break;const c=d.get(t);
    for(const n of nbrs(M,t)){if(!canEnter(u,n,go))continue;if(Math.abs(n.h-t.h)>u.jpw&&!(u.mo==='float'&&n.deep))continue;const o=unitAt(n.x,n.z);if(o&&o.side!==u.side&&o.alive)continue;
      const nc=c+stepCost(u,n);if(!d.has(n)||d.get(n)>nc){d.set(n,nc);prev.set(n,t);q.push(n);}}}
  const p=[];let t=goal;while(t&&t!==start){p.unshift(t);t=prev.get(t);}return p;
}
function abRange(u,ab,fromT){
  const t=fromT||tileOf(u);
  if(ab==='attack'||(AB[ab]&&AB[ab].rg==='w')){
    if(u.atk==='bow')return {r:clamp(5+Math.floor((t.h-3)/2),3,8),min:1,vert:99};
    return {r:1,min:1,vert:3};
  }
  const a=AB[ab]||SPEC(u);if(a.rg==='w')return abRange(u,'attack',fromT);
  return {r:a.rg,min:(a.kind==='phys'||a.kind==='jump')?1:0,vert:99};
}
function tilesInRange(cx,cz,r,min,vert,h0){const o=[];for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){const t=G.M.at(cx+dx,cz+dz);if(!t)continue;const d=Math.abs(dx)+Math.abs(dz);if(d>r||d<min)continue;if(vert<99&&Math.abs(t.h-h0)>vert)continue;o.push(t);}return o;}
function aoeTilesAt(a,c){const o=[];const r=a.aoe||0;for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){const t=G.M.at(c.x+dx,c.z+dz);if(!t)continue;const d=Math.abs(dx)+Math.abs(dz);if(d>r)continue;if(a.ring&&d===0)continue;if(r>0&&!a.ring&&Math.abs(t.h-c.h)>3)continue;o.push(t);}return o;}
function abDef(u,ab){return ab==='attack'?null:ab==='special'?SPEC(u):AB[ab];}
function aoeTiles(ab,cx,cz,caster){const a=abDef(caster,ab)||{aoe:0};return aoeTilesAt(a,G.M.at(cx,cz));}
function SPEC(u){
  const k=spKind(u.h),n=SPN[u.h.id]||(u.h.s+'家の奥義');
  if(k==='musou')return {n,kind:'phys',rg:0,aoe:2,ring:1,smart:1,mul:1.6,noEv:1,fx:'musou',sp:1};
  if(k==='heal')return {n,kind:'heal',rg:0,aoe:2,tg:'ally',smart:1,amt:c=>c.ma*5,fx:'heal',sp:1};
  if(k==='rally')return {n,kind:'buff',rg:0,aoe:3,tg:'ally',smart:1,st:{haste:28},pa:1,fx:'buff',sp:1};
  if(k==='mag')return {n,kind:'mag',rg:4,aoe:2,smart:1,q:7,el:'fire',gate:2,fx:'fire',sp:1};
  return {n,kind:'phys',rg:u.atk==='bow'?5:1,aoe:0,mul:2.2,noEv:1,fx:'slash',sp:1};
}
function relDir(att,def){const f=DIRV[def.dir],dx=att.x-def.x,dz=att.z-def.z;const al=dx*f[0]+dz*f[1],lat=Math.abs(dx*f[1]-dz*f[0]);if(al>lat)return 'front';if(-al>lat)return 'back';return 'side';}
function hitChance(c,t,a){
  if(a&&a.noEv)return 100;if(t.st.stop||t.charging)return 100;if(c.su==='shuchu')return 100;
  const rd=relDir(c,t);let ev=t.ev;ev=rd==='front'?ev:rd==='side'?ev*.5:0;
  return clamp(Math.round(100-ev+((a&&a.hitAdd)||0)),5,100);
}
function physBase(c){
  if(c.atk==='fist')return c.pa*c.br/30;
  return c.pa*c.wp;
}
function dmgPhys(c,t,a,fromT,movedHint){
  const ct=fromT||tileOf(c),tt=tileOf(t);
  let d=a&&a.pow?a.pow(c):physBase(c)*((a&&a.mul)||1);
  const dh=ct.h-tt.h;if(dh>=2)d*=1.2;else if(dh<=-2)d*=.9;
  if(relDir(c,t)==='back')d*=1.15;
  d*=clamp((100-(t.df-60)*.6)/100,.6,1.2);
  if(t.st.protect)d*=.67;
  if(c.su==='atkup')d*=1.25;if(t.su==='defup')d*=.8;
  if(c.su==='ryote'&&!JOBS[c.job].shield&&c.atk==='melee'&&!(a&&a.pow))d*=1.4;
  if(c.su==='totsugeki'&&(movedHint!=null?movedHint:c.moved))d*=1.2;
  if(c.atk==='dual'&&(!a||a.mul))d*=2;
  if(a&&a.el==='fire'&&G.wind&&c.side===G.windSide)d*=1.5;
  return Math.max(1,Math.round(d));
}
function dmgMag(c,t,a){let d=c.ma*a.q*(c.fa+t.fa)/200;if(t.st.shell)d*=.67;if(c.su==='maup')d*=1.3;if(a.el==='fire'&&G.wind&&c.side===G.windSide)d*=1.5;return Math.max(1,Math.round(d));}
function healAmt(c,t,a){let v=a.amt?a.amt(c,t):c.ma*a.q*(.5+c.fa/200);if(c.su==='healup')v*=1.3;return Math.round(v);}
function chargeTicks(u,a){let c=Math.max(1,Math.round(a.ctr*10/Math.max(4,effSp(u))));if(u.su==='tanshuku')c=Math.max(1,Math.round(c/2));return c;}

/* ---------------- start battle ---------------- */
function parseFoe(str){return str.split(/\s+/).map(s=>{let leader=0,boss=0;while(s[0]==='*'||s[0]==='!'){if(s[0]==='*')leader=1;else boss=1;s=s.slice(1);}const[id,job]=s.split(':');return {id,job,leader,boss};});}
const ENEMY_EQ={senshi:{ra:'konjo',su:'atkup',mo:'mv1'},knight:{ra:'ukenagashi',su:'defup'},yumi:{ra:'osha',su:'shuchu',mo:'jp1'},monk:{ra:'hangeki',su:'hpup',mo:'hpmove'},shiro:{ra:'shizen',su:'healup',mo:'mpmove'},kuro:{ra:'shoheki',su:'maup'},toki:{ra:'kiki',su:'tanshuku'},ryu:{ra:'ryukon',su:'totsugeki',mo:'jp1'},samurai:{ra:'shirahadori',su:'ryote'},ninja:{ra:'utsusemi',su:'nito',mo:'mv1'}};
function newBattle(fk,idx,party,seed,mode){
  const C=CAMP[fk],E=C.list[idx],B=BATTLES[E.b];
  G={fk,idx,E,B,party,seed,units:[],pend:[],over:false,tick:0,auto:G&&G.auto,mode:mode||{k:'all'}};
  G.defSide=E.side==='def'?0:1;
  G.M=genMap(B.map,B.opt,seed);
  G.gate=G.M.gx!=null?{hp:110+idx*14,mhp:110+idx*14}:null;
  const M=G.M;
  const pSide=E.side==='def'?'n':'s';
  G.northChar=pSide==='n'?FCHAR[fk]:FCHAR[E.ef];G.northCol=pSide==='n'?FCOL[fk]:FCOL[E.ef];
  G.southChar=pSide==='s'?FCHAR[fk]:FCHAR[E.ef];G.southCol=pSide==='s'?FCOL[fk]:FCOL[E.ef];
  const avgLv=party.reduce((s,p)=>s+(rec(fk+':'+p.h.id).lv||1),0)/Math.max(1,party.length);
  const eLv=Math.max(1+Math.floor(idx*.6),Math.round(avgLv));
  // 敵は兵で人数を補う（6〜8人）
  const foeList=parseFoe(E.foe);const want=Math.max(parseFoe(E.foe).length,clamp(party.length+1+Math.floor(idx/4),4,8));const GJ=['yumi','knight','shiro','senshi','kuro','ryu','yumi','monk'];
  for(let k=0;foeList.length<want;k++)foeList.push({id:'g',job:GJ[k%GJ.length],leader:0,boss:0});
  const pu=party.map(p=>{const u=mkUnit(p.h,p.job,0,fk,{sec:p.sec,leader:p.leader});if(mode&&mode.k==='hero'&&mode.id!==p.h.id)u.ai=true;return u;});
  let gi=0;
  const eu=foeList.map(e=>{const h=e.id==='g'?genSoldier(E.ef,gi++,e.job,idx+1):byIdH(e.id);
    const lv=eLv+(e.boss?2:e.leader?1:0);const u=mkUnit(h,e.job,1,'enemy',{boss:e.boss,leader:e.leader,ai:1,lv,eq:lv>=3?ENEMY_EQ[e.job]:{}});
    JOBS[u.job].ab.forEach((k,i)=>{if(i<Math.min(4,1+Math.floor(lv/2)))u.rc.ln[k]=1;});calcStats(u);u.hp=u.mhp;u.mp=u.mmp;return u;});
  G.units=pu.concat(eu);
  // 配置
  const used=new Set();
  const take=list=>{for(const t of list){if(!used.has(t)&&passable(M,t,false)&&!t.deep){used.add(t);return t;}}return null;};
  const ranged=u=>u.atk==='bow'||u.job==='kuro'||u.job==='shiro'||u.job==='toki';
  const placeNorth=units=>{
    if(M.gx!=null){
      const gateF=M.T.filter(t=>t.z>M.wz&&t.z<=M.wz+3).sort((a,b)=>(Math.abs(a.x-M.gx-.5)+Math.abs(a.z-M.wz))-(Math.abs(b.x-M.gx-.5)+Math.abs(b.z-M.wz)));
      const wallT=M.T.filter(t=>t.t==='wall'||t.t==='tower').sort((a,b)=>Math.abs(a.x-M.gx-.5)-Math.abs(b.x-M.gx-.5));
      const inT=M.T.filter(t=>t.z<M.wz&&t.t!=='stair').sort((a,b)=>Math.abs(a.x-M.gx-.5)-Math.abs(b.x-M.gx-.5)+(b.z-a.z)*.3);
      const castle=M.kind==='castle';
      units.forEach(u=>{const role=ranged(u)?'wall':u.leader?(castle?'inside':'front'):(castle?pick(['inside','inside','front']):pick(['front','front','inside']));u.role=role;
        const t=(role==='wall'?take(wallT):role==='inside'?take(inT):take(gateF))||take(inT)||take(gateF)||take(M.T);u.x=t.x;u.z=t.z;u.dir=1;});
    }else{
      const N=M.northT.slice();
      const back=N.slice().sort((a,b)=>(a.z-b.z)*2-(a.h-b.h)*.5+Math.abs(a.x-W/2)*.2-Math.abs(b.x-W/2)*.2);
      const high=N.slice().sort((a,b)=>(b.h-a.h)+(a.z-b.z)*.2);
      const front=N.slice().sort((a,b)=>(b.z-a.z)+Math.abs(a.x-W/2)*.3-Math.abs(b.x-W/2)*.3);
      units.forEach(u=>{const t=(u.leader?take(back):ranged(u)?take(high):take(front))||take(N)||take(M.T);u.x=t.x;u.z=t.z;u.dir=1;});
    }
  };
  const placeSouth=units=>{const S=M.starts.slice().sort((a,b)=>(b.z-a.z)*2+Math.abs(a.x-W/2)-Math.abs(b.x-W/2));
    units.slice().sort((a,b)=>(b.leader?1:0)-(a.leader?1:0)).forEach(u=>{const t=take(S)||take(M.T.filter(t=>t.z>8));u.x=t.x;u.z=t.z;u.dir=3;});};
  if(pSide==='n'){placeNorth(pu);placeSouth(eu);}else{placeSouth(pu);placeNorth(eu);}
  for(const u of G.units){u.m=buildModel(u);scene.add(u.m.holder);placeModel(u);
    const b=el('div','hpb'+(u.side?' foe':''),'<i></i>'+(u.leader?'<b>帥</b>':u.hero?'<b>将</b>':''));$('#labels').appendChild(b);u.bar=b;}
  const pl=G.units.find(u=>u.side===0&&u.leader)||pu[0];pl.leader=true;
  focus(W/2,pSide==='s'?D-4:3,3);
  cam.az0=pSide==='s'?Math.PI*.25:Math.PI*1.25;cam.el0=.62;cam.z0=1;
  const enemyLead=eu.find(u=>u.leader);
  G.cond=E.cond||null;
  G.goal=(G.cond&&G.cond.k==='survive'?'勝利: '+G.cond.t+'カウント耐える・'+enemyLead.h.n+'を倒す':'勝利: '+enemyLead.h.n+'を倒す・敵の全滅')+' / 敗北: '+pl.h.n+'が倒れる';
  $('#bname').textContent=B.n;$('#bgoal').textContent=G.goal;
  // 戦場の仕掛け
  G.ev=E.ev?EVENTS[E.ev]:null;
  if(E.ev==='wind')G.windSide=FAC_SIDE_OF(fk,E)==='wu'?0:1;
  setLog(E.side==='def'?'敵が迫ってきた。':'敵陣が見えた。');
}
function FAC_SIDE_OF(fk,E){return (fk==='wu'||fk==='shu')&&E.side==='atk'?'wu':'wei';}
/* 戦場の仕掛け */
const EVENTS={
  flood:{t:45,n:'水攻め',run:async()=>{ // 城の中が水浸しになる
    banner('水攻め','城の中に水が流れ込んだ');SND.play('cave-in',.5,.6);
    const M=G.M;M.T.forEach(t=>{if(M.gx!=null&&t.z<M.wz&&(t.t==='stone')){t.t='ford';}});
    buildTerrain(M);G.units.forEach(u=>{if(!u.gone&&!u.away)placeModel(u);});
    for(const u of G.units){if(u.alive&&!u.gone&&!u.away&&tileOf(u).t==='ford'&&tileOf(u).z<M.wz){addStatus(u,{slow:16});await damage(u,Math.max(1,Math.round(u.mhp*.12)),null);}}
    setLog('城の中は膝まで水に浸かった（移動しにくく、スロウ）');}},
  wind:{t:30,n:'東南の風',run:async()=>{
    G.wind=true;banner('東南の風','火の力が増した');SND.play('fire',.6);
    const victims=G.units.filter(u=>u.alive&&!u.gone&&!u.away&&u.side!==G.windSide&&tileOf(u).t==='ship');
    for(const u of victims){fx('fire',u.m.holder.position);await damage(u,Math.max(1,Math.round(u.mhp*.2)),null);}
    setLog('船が燃えている！'+(G.windSide===0?'味方':'敵')+'の火の技が1.5倍になった');}},
  usou:{t:35,n:'烏巣焼き討ち',run:async()=>{
    banner('烏巣焼き討ち','敵の兵糧庫が燃えた');SND.play('fire',.6);
    const st=G.M.T.find(t=>t.prop==='store');if(st)fx('fire',wpos(st.x,st.z,st.h),24);
    G.units.filter(u=>u.side===1&&u.alive).forEach(u=>{u.pa=Math.max(1,u.pa-1);u.ct=Math.max(0,u.ct-25);pop(u,'PA-1','st');});
    setLog('兵糧を失って敵は動揺している（敵全員PA-1）');}},
  bridge:{t:40,n:'橋落とし',run:async()=>{
    const br=G.M.T.filter(t=>t.t==='bridge');if(!br.length)return;
    banner('橋が落ちた','小師橋の橋板が外された');SND.play('cave-in',.6);
    br.forEach(t=>{t.t='water';t.h=1;t.deep=1;});buildTerrain(G.M);
    for(const u of G.units){if(u.gone||u.away)continue;const t=tileOf(u);if(t.deep&&u.mo!=='float'){const c=G.M.T.filter(q=>passable(G.M,q,true)&&!unitAt(q.x,q.z)).sort((a,b)=>(Math.abs(a.x-u.x)+Math.abs(a.z-u.z))-(Math.abs(b.x-u.x)+Math.abs(b.z-u.z)))[0];if(c){u.x=c.x;u.z=c.z;}placeModel(u);if(u.alive)await damage(u,Math.max(1,Math.round(u.mhp*.1)),null);}else placeModel(u);}
    setLog('橋はもう渡れない。浅瀬を探せ');}}
};
function clearBattle(){if(!G)return;for(const u of G.units){if(u.m)scene.remove(u.m.holder);if(u.bar)u.bar.remove();if(u.ctrEl)u.ctrEl.remove();}clearHL();}

/* ---------------- main loop (CT) ---------------- */
async function battleLoop(){
  const my=G;
  while(!G.over&&G===my){
    G.tick++;
    if(G.ev&&!G.evDone&&G.tick>=G.ev.t){G.evDone=true;await G.ev.run();if(G!==my||checkEnd())return;}
    if(G.cond&&G.cond.k==='survive'){const left=G.cond.t-G.tick;$('#bgoal').textContent=G.goal+'（あと'+Math.max(0,left)+'）';if(left<=0&&checkEnd(true))return;}
    for(const u of G.units){for(const k in u.st){if(typeof u.st[k]==='number'){u.st[k]--;if(u.st[k]<=0)delete u.st[k];}}}
    for(const p of G.pend.slice()){p.ctr--;if(p.ctr<=0){G.pend.splice(G.pend.indexOf(p),1);await resolvePending(p);if(G!==my||checkEnd())return;}}
    for(const u of G.units){if(u.gone||u.away)continue;u.ct+=u.alive?effSp(u):6;}
    const ready=G.units.filter(u=>!u.gone&&!u.away&&u.ct>=100).sort((a,b)=>b.ct-a.ct);
    for(const u of ready){if(G.over||G!==my)return;if(u.gone||u.ct<100)continue;
      if(!u.alive){u.ct=0;u.ko--;updKO(u);if(u.ko<=0){await retreat(u);if(checkEnd())return;}continue;}
      await takeTurn(u);if(G!==my||checkEnd())return;}
    if(!ready.length&&G.tick%3===0)await new Promise(r=>requestAnimationFrame(r));
  }
}
function updKO(u){if(!u.bar)return;let b=u.bar.querySelector('b');if(!b){b=el('b','','');u.bar.appendChild(b);}b.textContent=u.alive?(u.leader?'帥':u.hero?'将':''):String(Math.max(0,u.ko));}
async function retreat(u){u.gone=true;setLog(u.h.n+'は戦場を去った');fx('dust',u.m.holder.position,8);await tween(500,k=>{u.m.holder.scale.setScalar(1-k);});scene.remove(u.m.holder);if(u.bar)u.bar.remove();}
async function takeTurn(u){
  G.active=u;u.moved=false;u.acted=false;renderAT();showCard(u);
  {const pl=G.units.find(v=>v.side===0&&v.leader);const n=G.units.filter(v=>v.side===0&&v.alive&&!v.gone).length;BGM.play(pl&&(pl.hp<pl.mhp*.35||n<=1)?'crisis':'battle');}
  focus(u.x,u.z,tileOf(u).h);
  SND.play('ui-turn',.25);
  await sleep(220);
  if(u.side===0&&!G.auto&&!u.ai)await playerTurn(u);else await aiTurn(u);
  if(G.over)return;
  if(u.alive&&!u.away&&tileOf(u).t==='swamp'&&u.mo!=='float'){pop(u,'毒','st');await damage(u,Math.max(1,Math.round(u.mhp*.08)),null);}
  u.ct=u.moved&&u.acted?0:(u.moved||u.acted)?20:40;
  G.active=null;
}
function checkEnd(timeUp){if(G.over)return true;
  const pl=G.units.find(u=>u.side===0&&u.leader),el_=G.units.find(u=>u.side===1&&u.leader);
  const pAlive=G.units.some(u=>u.side===0&&u.alive&&!u.gone),eAlive=G.units.some(u=>u.side===1&&u.alive&&!u.gone);
  let res=null;
  if(!pl.alive||!pAlive)res='lose';else if(!el_.alive||!eAlive)res='win';
  else if(timeUp&&G.cond&&G.cond.k==='survive')res='win';
  if(res){G.over=true;endBattle(res);return true;}return false;}

/* ---------------- EXP / LV ---------------- */
function gainExp(u,targets){
  if(u.side!==0)return;
  let e=0;const ts=targets&&targets.length?targets:[null];
  ts.forEach(t=>{e+=t?clamp(10+(t.lv-u.lv)*3,4,30):8;});e=Math.min(e,40);
  u.expGain+=e;u.rc.exp+=e;
  while(u.rc.exp>=100){u.rc.exp-=100;u.rc.lv++;u.lv=u.rc.lv;u.lvUps++;const omh=u.mhp,omm=u.mmp;calcStats(u);u.hp+=u.mhp-omh;u.mp+=u.mmp-omm;
    pop(u,'Lv'+u.lv+'！','heal');SND.play('ui-ok',.4,1.2);setLog(u.h.n+'はLv'+u.lv+'になった');}
}
function gainJP(u,n){if(u.side!==0)return;const j=u.job;u.rc.jp[j]=(u.rc.jp[j]||0)+n;u.jpGain+=n;if(u.sec){u.rc.jp[u.sec]=(u.rc.jp[u.sec]||0)+Math.round(n/4);}}

/* ---------------- actions ---------------- */
async function moveUnit(u,goal){
  const path=pathTo(u,goal);if(!path.length)return;
  const m=u.m;
  for(const t of path){const from=tileOf(u);u.dir=dirTo(u.x,u.z,t.x,t.z);m.holder.rotation.y=-u.dir*Math.PI/2;
    const a=wpos(u.x,u.z,from.h),b=wpos(t.x,t.z,t.h);const hop=Math.abs(t.h-from.h)>0?.35+Math.abs(t.h-from.h)*HU*.5:0;
    await tween(hop?260:170,k=>{m.holder.position.lerpVectors(a,b,k);m.holder.position.y=lerp(a.y,b.y,k)+Math.sin(k*Math.PI)*hop;
      const s=Math.sin(k*Math.PI*2)*.55;m.lF.hp.rotation.z=s;m.lB.hp.rotation.z=-s;m.lF.kn.rotation.z=-Math.max(0,s)*.6;m.lB.kn.rotation.z=-Math.max(0,-s)*.6;});
    u.x=t.x;u.z=t.z;}
  m.lF.hp.rotation.z=m.lB.hp.rotation.z=m.lF.kn.rotation.z=m.lB.kn.rotation.z=0;
  placeModel(u);u.moved=true;
  if(u.mo==='hpmove'&&u.hp<u.mhp){const v=Math.max(1,Math.round(u.mhp*.1));u.hp=Math.min(u.mhp,u.hp+v);pop(u,v,'heal');}
  if(u.mo==='mpmove'&&u.mp<u.mmp){const v=Math.max(1,Math.round(u.mmp*.1));u.mp=Math.min(u.mmp,u.mp+v);pop(u,'MP+'+v,'heal');}
}
function wsound(u){return WSND[u.wname]||'sword-1';}

async function doAction(u,ab,tx,tz,opt){ // ab: 'attack' | ability key | 'special'
  opt=opt||{};const a=abDef(u,ab);
  const name=ab==='attack'?'攻撃':a.n;
  u.dir=(tx===u.x&&tz===u.z)?u.dir:dirTo(u.x,u.z,tx,tz);placeModel(u);
  if(a&&a.mp)u.mp-=a.mp;
  if(ab==='special'){u.spUsed=true;await cutin(u,a.n);}
  if(a&&a.ctr&&!opt.now){
    const ctr=chargeTicks(u,a);
    G.pend.push({u,ab,tx,tz,ctr});u.charging=ab;chargeRing(u,true,a.kind==='heal'||a.kind==='buff'||a.kind==='revive'?0x8dffb0:0xa08aff);
    setPose(u.m,'cast');u.ctrEl=el('div','ctrtag',a.n+' 詠唱中');$('#labels').appendChild(u.ctrEl);
    setLog(u.h.n+'は「'+a.n+'」の詠唱を始めた（'+ctr+'）');u.acted=true;gainJP(u,10);
    await sleep(500);setPose(u.m,'idle');return;
  }
  if(a&&a.kind==='jump'){
    u.away=true;u.acted=true;u.moved=true;setLog(u.h.n+'は高く跳んだ！');SND.play('dagger-swish',.5);
    const p0=u.m.holder.position.clone();await tween(380,k=>{u.m.holder.position.y=p0.y+k*9;});u.m.holder.visible=false;
    const ctr=Math.max(1,Math.round(50/Math.max(4,effSp(u))));G.pend.push({u,ab,tx,tz,ctr,jump:1});gainJP(u,10);return;
  }
  setLog(u.h.n+'の'+(ab==='attack'?'攻撃':'「'+name+'」'));
  await executeEffect(u,ab,a,tx,tz);
  u.acted=true;
}
async function resolvePending(p){
  const u=p.u;
  if(p.jump){
    const t=G.M.at(p.tx,p.tz);u.m.holder.visible=true;
    const tg=unitAt(p.tx,p.tz);let land=t;
    if(tg||!passable(G.M,t,false)){const c=nbrs(G.M,t).filter(n=>passable(G.M,n,false)&&!unitAt(n.x,n.z));land=c[0]||tileOf(u);}
    const b=wpos(land.x,land.z,land.h);u.away=false;u.x=land.x;u.z=land.z;
    focus(land.x,land.z,land.h);
    await tween(300,k=>{u.m.holder.position.set(b.x,b.y+(1-k)*9,b.z);});placeModel(u);
    if(tg&&tg.alive&&tg!==u){u.dir=dirTo(u.x,u.z,tg.x,tg.z);placeModel(u);const d=jumpDmg(u,tg);
      fx('hit',tg.m.holder.position);fx('dust',b,6);SND.play('spear',.7);await hitUnit(u,tg,d,'phys',{noEv:1});gainExp(u,[tg]);}
    else if(gateAt(p.tx,p.tz)){await damageGate(Math.round(physBase(u)*1.6),u);gainExp(u,null);}
    else{popAt(b.clone().add(new THREE.Vector3(0,1,0)),'MISS','miss');fx('dust',b,6);}
    return;
  }
  chargeRing(u,false);u.charging=null;if(u.ctrEl){u.ctrEl.remove();u.ctrEl=null;}
  if(!u.alive||u.gone||u.st.stop){setLog(u.h.n+'の詠唱は途切れた');return;}
  const a=AB[p.ab];setLog(u.h.n+'の「'+a.n+'」！');focus(p.tx,p.tz,G.M.at(p.tx,p.tz).h);
  setPose(u.m,'cast');await sleep(250);
  await executeEffect(u,p.ab,a,p.tx,p.tz);setPose(u.m,'idle');
}
function jumpDmg(u,tg){let d=physBase(u)*AB.jump.mul*clamp((100-(tg.df-60)*.6)/100,.6,1.2)*(tg.st.protect?.67:1);if(u.su==='atkup')d*=1.25;if(tg.su==='defup')d*=.8;return Math.max(1,Math.round(d));}
function collectTargets(u,ab,a,tx,tz){
  const kind=a?a.kind:'phys';const targets=[];
  const tiles=ab==='attack'?[G.M.at(tx,tz)]:aoeTiles(ab,tx,tz,u);
  for(const t of tiles){const o=G.units.find(v=>!v.gone&&!v.away&&v.x===t.x&&v.z===t.z);if(!o)continue;
    if(a&&a.smart){if((a.tg==='ally'||a.tg==='self')!==(o.side===u.side))continue;}
    if(a&&a.tg==='self'&&o!==u)continue;
    if(kind==='revive'){if(!o.alive)targets.push(o);continue;}
    if(!o.alive)continue;if(o===u&&(kind==='phys'))continue;targets.push(o);}
  if(a&&a.tg==='self'&&!targets.includes(u))targets.push(u);
  return {targets,tiles};
}
async function executeEffect(u,ab,a,tx,tz){
  const kind=a?a.kind:'phys';
  const{targets,tiles}=collectTargets(u,ab,a,tx,tz);
  if(u.hero&&ab!=='special'&&Math.random()<(ab==='attack'?.3:.45))say(u,lineOf(u.h,'atk'));
  const gateHit=tiles.some(t=>gateAt(t.x,t.z));
  const tp=wpos(tx,tz,G.M.at(tx,tz).h);
  const melee=kind==='phys'&&(ab==='attack'||(a&&(a.rg==='w'||a.rg===1)))&&!(a&&a.ring);
  if(melee||(kind==='phys'&&a&&a.rg>1&&!a.ring)){
    if((u.atk==='bow'&&(ab==='attack'||a.rg==='w'))||(a&&a.rg>1)){setPose(u.m,'bow');await sleep(220);SND.play(u.atk==='bow'?'bow':'dagger-swish',.6);await arrowFly(u,tp);}
    else{setPose(u.m,'windup');await sleep(170);setPose(u.m,'strike');const p0=u.m.holder.position.clone(),dv=tp.clone().sub(p0).setY(0).normalize().multiplyScalar(.3);
      await tween(120,k=>{u.m.holder.position.copy(p0).addScaledVector(dv,Math.sin(k*Math.PI));});SND.play(wsound(u),.65);}
  }else{setPose(u.m,'cast');await sleep(260);}
  if(a&&a.fx)fx(a.fx,a.ring?u.m.holder.position:tp);
  if(a&&a.fx==='fire')SND.play('fire',.55);if(a&&a.fx==='thunder')SND.play('lightning',.6);if(a&&a.fx==='musou')SND.play('explosion',.6);
  if(kind==='heal'||kind==='revive')SND.play('staff',.35,1.3);
  let any=false;
  for(const t of targets){
    if(kind==='phys'){
      const hc=hitChance(u,t,a);
      if(Math.random()*100>=hc){pop(t,'MISS','miss');if(t.hero&&Math.random()<.5)say(t,lineOf(t.h,'dodge'));SND.play('spear-miss',.4);any=true;continue;}
      const d=dmgPhys(u,t,a);
      fx(a&&a.fx==='fire'?'fire':'hit',t.m.holder.position,6);
      const ok=await hitUnit(u,t,d,'phys',{melee:ab==='attack'&&u.atk!=='bow',noEv:a&&a.noEv});any=true;
      if(ok&&a&&a.after&&t.alive){const s=a.after(t);pop(t,s,'st');}
      if(ok&&a&&a.st&&t.alive&&Math.random()*100<(a.ch||100))addStatus(t,a.st);
    }else if(kind==='mag'){const ok=await hitUnit(u,t,dmgMag(u,t,a),'mag',{});any=true;if(ok&&a.st&&t.alive&&Math.random()*100<(a.ch||100))addStatus(t,a.st);}
    else if(kind==='heal'){const v=healAmt(u,t,a);t.hp=Math.min(t.mhp,t.hp+v);pop(t,v,'heal');fx('heal',t.m.holder.position);any=true;}
    else if(kind==='buff'){if(a.pa){t.pa+=a.pa;pop(t,'PA+'+a.pa,'st');}if(a.st)addStatus(t,a.st);fx('buff',t.m.holder.position);any=true;}
    else if(kind==='debuff'){if(Math.random()*100<a.ch*(t.boss?.5:1)){addStatus(t,a.st);fx('debuff',t.m.holder.position);}else pop(t,'MISS','miss');any=true;}
    else if(kind==='grav'){if(Math.random()*100<a.ch){fx('debuff',t.m.holder.position);await hitUnit(u,t,Math.max(1,Math.round(t.hp*a.pct)),'mag',{});}else pop(t,'MISS','miss');any=true;}
    else if(kind==='revive'){if(Math.random()*100<a.ch){t.alive=true;t.ko=0;t.hp=Math.max(1,Math.round(t.mhp*a.pct));setPose(t.m,'idle');t.m.root.rotation.x=0;t.m.root.position.y=0;t.m.mats.forEach(q=>q.m.color.copy(q.c));pop(t,'復活','heal');fx('heal',t.m.holder.position);updKO(t);setLog(t.h.n+'は立ち上がった');}else pop(t,'MISS','miss');any=true;}
  }
  if(gateHit&&(kind==='phys'||kind==='mag')){
    const base=kind==='mag'?u.ma*a.q*1.2:(a&&a.pow?a.pow(u):physBase(u)*((a&&a.mul)||1)*(u.atk==='dual'?2:1));
    await damageGate(Math.round(base*((a&&a.gate)||1)),u);any=true;
  }
  if(!any&&kind!=='phys')popAt(tp.clone().add(new THREE.Vector3(0,.8,0)),'効果なし','miss');
  gainJP(u,10);gainExp(u,targets.filter(t=>t.side!==u.side||kind==='heal'||kind==='buff'||kind==='revive'));
  await sleep(380);setPose(u.m,'idle');placeModel(u);
}
/* 攻撃を受ける（リアクションを含む） */
async function hitUnit(src,t,d,kind,meta){
  meta=meta||{};
  const br=t.br,enemy=src&&src.side!==t.side;
  if(enemy&&t.alive&&!t.st.stop&&!t.charging){
    if(t.ra==='shirahadori'&&kind==='phys'&&!meta.noEv&&Math.random()*100<br*.6){pop(t,'白刃取り','st');if(t.hero)say(t,lineOf(t.h,'parry'));SND.play('sword-1',.5,1.4);return false;}
    if(t.ra==='utsusemi'&&Math.random()*100<br*.4){pop(t,'空蝉','st');if(t.hero)say(t,lineOf(t.h,'dodge'));fx('dust',t.m.holder.position,4);return false;}
    if(t.ra==='ukenagashi'&&kind==='phys'&&Math.random()*100<br){d=Math.max(1,Math.round(d/2));pop(t,'受け流し','st');}
    if(t.ra==='shoheki'&&t.mp>0&&Math.random()*100<br){const m=Math.min(t.mp,d);t.mp-=m;d-=m;pop(t,'MP-'+m,'st');if(d<=0)return true;}
  }
  await damage(t,d,src);
  if(!enemy||!t.alive||!src)return true;
  const roll=()=>Math.random()*100<br;
  if(t.ra==='konjo'&&roll()){t.pa+=1;pop(t,'根性 PA+1','st');}
  if(t.ra==='ryukon'&&!t.st.haste&&Math.random()*100<br*.6){addStatus(t,{haste:24});}
  if(t.ra==='shizen'&&roll()){const v=Math.max(1,Math.round(t.mhp*.15));t.hp=Math.min(t.mhp,t.hp+v);pop(t,v,'heal');}
  if(t.ra==='kiki'&&t.hp<=t.mhp/3&&t.ct<100){t.ct=100;pop(t,'危機加速','st');}
  if(!meta.counter&&src.alive){
    const dist=Math.abs(src.x-t.x)+Math.abs(src.z-t.z);
    if(t.ra==='hangeki'&&kind==='phys'&&dist===1&&roll()){await sleep(150);pop(t,'反撃','st');t.dir=dirTo(t.x,t.z,src.x,src.z);placeModel(t);await counterAttack(t,src);}
    else if(t.ra==='osha'&&t.atk==='bow'&&kind==='phys'&&dist<=abRange(t,'attack').r&&roll()){await sleep(150);pop(t,'応射','st');t.dir=dirTo(t.x,t.z,src.x,src.z);placeModel(t);await counterAttack(t,src);}
  }
  return true;
}
async function counterAttack(u,t){
  setPose(u.m,u.atk==='bow'?'bow':'strike');SND.play(wsound(u),.6);
  if(Math.random()*100<hitChance(u,t,null)){fx('hit',t.m.holder.position,5);await hitUnit(u,t,dmgPhys(u,t,null),'phys',{counter:1});}else pop(t,'MISS','miss');
  await sleep(200);setPose(u.m,'idle');
}
async function arrowFly(u,tp){const a=u.m.holder.position.clone().add(new THREE.Vector3(0,.7,0)),b=tp.clone().add(new THREE.Vector3(0,.5,0));
  const ar=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.5,4),new THREE.MeshBasicMaterial({color:0x2a1a0e}));scene.add(ar);
  const dist=a.distanceTo(b),hgt=.6+dist*.18;let prev=a.clone();
  await tween(200+dist*45,k=>{const p=a.clone().lerp(b,k);p.y+=Math.sin(k*Math.PI)*hgt;ar.position.copy(p);const d=p.clone().sub(prev);if(d.lengthSq()>1e-6){ar.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());}prev=p;});
  scene.remove(ar);ar.geometry.dispose();}
function addStatus(t,st){for(const k in st){t.st[k]=st[k];if(k==='haste'&&t.st.slow)delete t.st.slow;if(k==='slow'&&t.st.haste)delete t.st.haste;}
  const nm={haste:'ヘイスト',slow:'スロウ',stop:'ストップ',protect:'プロテス',shell:'シェル'};pop(t,Object.keys(st).map(k=>nm[k]||k).join(' '),'st');}
async function damage(t,d,src){
  const hp0=t.hp;t.hp=Math.max(0,t.hp-d);pop(t,d);
  if(t.hero&&t.hp>0){if(t.hp<=t.mhp*.3&&!t.saidLow){t.saidLow=1;say(t,lineOf(t.h,'fury'));}else if(d>=t.mhp*.3&&Math.random()<.5)say(t,lineOf(t.h,'big'));else if(Math.random()<.2)say(t,lineOf(t.h,'hurt'));}SND.play(pick(['human-hit-1','human-hit-2','human-hit-3']),.45);
  t.m.mats.forEach(q=>{q.m.emissive&&q.m.emissive.setHex(0x883322);});setPose(t.m,'hurt');
  setTimeout(()=>{t.m.mats.forEach(q=>{q.m.emissive&&q.m.emissive.setHex(0);});if(t.alive)setPose(t.m,'idle');},220/SPD);
  if(t.hp<=0&&t.alive){t.alive=false;t.ko=3;t.charging=null;chargeRing(t,false);if(t.ctrEl){t.ctrEl.remove();t.ctrEl=null;}G.pend=G.pend.filter(p=>p.u!==t);
    SND.play(pick(['human-die-1','human-die-2']),.5);setLog(t.h.n+'は倒れた'+(t.leader?'！':''));if(t.hero)say(t,lineOf(t.h,'lose'),2400);
    await tween(380,k=>{t.m.root.rotation.x=-k*Math.PI/2*.95;t.m.root.position.y=-k*.1;});
    t.m.mats.forEach(q=>q.m.color.lerp(new THREE.Color(0x777777),.5));updKO(t);
    if(src&&src.side===0){gainJP(src,10);src.rc.exp+=10;src.expGain+=10;}
  }
  await sleep(120);
}
async function damageGate(d,src){
  if(!G.gate||G.gate.hp<=0)return;
  G.gate.hp=Math.max(0,G.gate.hp-d);const gp=wpos(G.M.gx+.5,G.M.wz,3);gp.y+=1;
  popAt(gp,d);fx('hit',gp.clone().add(new THREE.Vector3(0,-.5,0)));SND.play('club',.6,.8);
  if(G.gateMesh){G.gateMesh.position.x+=.04;setTimeout(()=>{if(G.gateMesh)G.gateMesh.position.x-=.04;},90);}
  setLog('城門 '+G.gate.hp+' / '+G.gate.mhp);
  if(G.gate.hp<=0){SND.play('cave-in',.8);fx('dust',gp.clone().add(new THREE.Vector3(0,-.9,0)),20);
    if(G.gateMesh){const g0=G.gateMesh.position.y;await tween(500,k=>{G.gateMesh.position.y=g0-k*1.6;G.gateMesh.rotation.x=k*.25;});G.gateMesh.visible=false;}
    banner('城門突破','門が破れた');setLog('城門が破られた！');}
}
function banner(t,s){const b=el('div','banner',t+(s?'<small>'+s+'</small>':''));$('#fxl').appendChild(b);setTimeout(()=>b.remove(),2300);}
async function cutin(u,name){
  const q=lineOf(u.h,'sp');
  const c=el('div','cutin'+(u.side?' foe':''),'<img alt="" src="'+portrait(u.h)+'"><div><small>'+u.h.n+(u.h.az?'（'+u.h.az+'）':'')+'</small><b>'+name+'</b>'+(q?'<span class="cq">「'+q+'」</span>':'')+'</div>');
  $('#fxl').appendChild(c);setTimeout(()=>c.remove(),2300);SND.play('horse',.4);
  const z=cam.z0;cam.z0=1.9;const p=u.m.holder.position;cam.ftx=p.x;cam.fty=p.y+.5;cam.ftz=p.z;const az=cam.az0;cam.az0+=.5;
  setPose(u.m,'win');await sleep(1300);cam.z0=z;cam.az0=az;setPose(u.m,'idle');
}

/* ---------------- 一騎打ち（一騎打ち英雄伝を呼び出す） ---------------- */
const DF={frame:null,ready:false,pending:null,cb:null,id:0};
function duelFoes(u){return G.units.filter(o=>o.side!==u.side&&o.alive&&!o.gone&&!o.away&&o.hero&&Math.abs(o.x-u.x)+Math.abs(o.z-u.z)===1);}
function dframe(){if(DF.frame)return DF.frame;const f=document.createElement('iframe');f.src='duel.html';f.title='一騎打ち';f.setAttribute('allow','autoplay');
  f.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:200;visibility:hidden;pointer-events:none;background:#0b1519';document.body.appendChild(f);DF.frame=f;return f;}
window.addEventListener('message',e=>{if(!DF.frame||e.source!==DF.frame.contentWindow)return;const m=e.data||{};
  if(m.t==='duelReady'){DF.ready=true;if(DF.pending){DF.frame.contentWindow.postMessage(DF.pending,'*');DF.pending=null;}}
  else if(m.t==='duelStarted'){setTimeout(()=>{DF.frame.style.visibility='visible';DF.frame.style.pointerEvents='auto';const i=$('#dIntro');if(i)i.remove();},350);}
  else if(m.t==='duelEnd'&&m.id===DF.id&&DF.cb){const cb=DF.cb;DF.cb=null;DF.frame.style.visibility='hidden';DF.frame.style.pointerEvents='none';const i=$('#dIntro');if(i)i.remove();try{BGM.duck(false);}catch(_){}cb(m);}
});
function duelIntro(a,b){const d=el('div','');d.id='dIntro';
  d.style.cssText='position:fixed;inset:0;z-index:150;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:radial-gradient(ellipse at 50% 60%,#5a2a12 0%,#140904 72%);color:#f4e6c4;font-family:var(--f-disp);text-align:center';
  const f=(u,c)=>'<div><img alt="" src="'+portrait(u.h)+'" style="width:110px;height:124px;border-radius:6px;border:3px solid '+c+'"><div style="font-size:24px">'+u.h.n+'</div></div>';
  d.innerHTML='<div style="font-size:clamp(34px,9vw,60px);letter-spacing:.3em;color:var(--gold2);text-shadow:0 0 18px rgba(255,170,60,.8)">一騎打ち</div><div style="display:flex;gap:18px;align-items:center">'+f(a,'var(--me)')+'<b style="font-size:34px">対</b>'+f(b,'var(--foe)')+'</div><div style="font-size:20px">両軍が見守る中、いざ尋常に勝負!</div>';
  document.body.appendChild(d);}
async function duelFight(x,y){
  const a=x.side===0?x:y,b=x.side===0?y:x;
  try{BGM.duck(true);SND.horn();}catch(_){}
  duelIntro(a,b);dframe();DF.id++;
  const stg=({plain:'plain',forest:'night',gate:'night',castle:'plain',river:'river',yangtze:'river',hills:'desert',mountain:'mountain'})[G.M.kind]||'plain';
  const m=await new Promise(res=>{DF.cb=res;const msg={t:'duel',id:DF.id,me:a.h.id,foe:b.h.id,strat:'bal',stage:stg,mm:1+.02*(a.lv-1),fm:1+.02*(b.lv-1)};
    if(DF.ready)DF.frame.contentWindow.postMessage(msg,'*');else DF.pending=msg;});
  const win=!!m.win,W=win?a:b,L=win?b:a;
  G.duels=G.duels||[];G.duels.push({me:a.h.id,foe:b.h.id,res:win?0:1});
  focus(L.x,L.z,tileOf(L).h);banner(W.h.n+' 勝利','一騎打ち');say(W,lineOf(W.h,'win'),2200);
  await damage(L,L.hp,W);
  const hv=Math.round(W.mhp*.15);W.hp=Math.min(W.mhp,W.hp+hv);pop(W,hv,'heal');
  if(W.side===0)gainExp(W,[{lv:L.lv+6}]);
  return win;
}
function askDuel(u,t){return new Promise(res=>{const d=el('div','pp pad');
  d.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:60;width:min(420px,calc(100vw - 24px));text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center';
  d.innerHTML='<div class="row" style="justify-content:center"><img alt="" src="'+portrait(u.h)+'" style="width:70px;height:79px;border-radius:4px;border:2px solid var(--foe)"></div><b style="font-family:var(--f-disp);font-size:20px;color:var(--seal)">'+u.h.n+'が一騎打ちを申し込んできた!</b><p class="story" style="margin:0">「'+(lineOf(u.h,'open')||u.h.sp||'いざ勝負!')+'」</p><p class="note" style="margin:0">相手：'+t.h.n+'（負けた方はその場で倒れる。断ると'+t.h.n+'は臆してスロウになる）</p><div class="row" style="justify-content:center"><button type="button" class="btn pri" data-k="1">受けて立つ</button><button type="button" class="btn" data-k="0">断る</button></div>';
  document.body.appendChild(d);focus(u.x,u.z,tileOf(u).h);try{SND.horn();}catch(_){}
  d.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{d.remove();res(b.dataset.k==='1');});});}
async function aiChallenge(u){
  if(u.side!==1||!u.hero||u.asked||G.auto)return false;
  const tg=duelFoes(u).filter(o=>!o.ai);if(!tg.length)return false;
  if(R()>(u.h.p>=95?.55:u.h.p>=85?.35:.15))return false;
  u.asked=1;const t=tg.sort((p,q)=>q.h.p-p.h.p)[0];
  const ok=await askDuel(u,t);
  if(!ok){pop(t,'臆した','st');addStatus(t,{slow:12});setLog(t.h.n+'は一騎打ちを断った（スロウ）');return false;}
  await duelFight(t,u);return true;
}

/* ---------------- AI ---------------- */
function actsOf(u){
  const o=['attack'];
  [u.job,u.sec].filter(Boolean).forEach(j=>JOBS[j].ab.forEach(k=>{if(learned(u,k)&&u.mp>=(AB[k].mp||0)&&!(u.boss&&k==='jump'))o.push(k);}));
  if(u.hero&&!u.spUsed)o.push('special');
  return o;
}
function targetsFor(u,ab,from){
  const a=abDef(u,ab);
  if(a&&a.rg===0)return [from];
  const r=abRange(u,ab,from);
  return tilesInRange(from.x,from.z,r.r,r.min,r.vert,from.h);
}
function evalAct(u,ab,from,tt){
  const a=abDef(u,ab);const kind=a?a.kind:'phys';
  const tiles=ab==='attack'?[tt]:a.rg===0?aoeTilesAt(a,from):aoeTilesAt(a,tt);
  let s=0;const ox=u.x,oz=u.z;u.x=from.x;u.z=from.z;const moved=from.x!==ox||from.z!==oz||u.moved;
  for(const t of tiles){const target=G.units.find(v=>!v.gone&&!v.away&&v.x===t.x&&v.z===t.z);if(!target)continue;
    if(target===u&&!(a&&(a.tg==='ally'||a.tg==='self'||kind==='heal'||kind==='buff')))continue;
    const enemy=target.side!==u.side;
    if(a&&a.smart&&((a.tg==='ally'||a.tg==='self')===enemy))continue;
    if(kind==='revive'){if(!enemy&&!target.alive)s+=60;continue;}
    if(!target.alive)continue;
    if(kind==='phys'||kind==='mag'||kind==='grav'||kind==='jump'){
      if(kind==='phys'&&(ab==='attack'||a.rg==='w')&&u.atk!=='bow'){const tt2=tileOf(target);if(Math.abs(tt2.h-from.h)>3)continue;}
      const d=kind==='jump'?jumpDmg(u,target):kind==='phys'?dmgPhys(u,target,a,from,moved)*hitChance(u,target,a)/100:kind==='mag'?dmgMag(u,target,a):target.hp*a.pct*a.ch/100;
      const v=Math.min(d,target.hp)/target.mhp*100+(d>=target.hp?45:0)+(target.leader?25:0)+(target.hero?8:0);
      s+=enemy?v:-v*1.6;
      if(a&&a.st&&enemy)s+=12*(a.ch||100)/100;
      if(enemy&&target.ra==='hangeki'&&kind==='phys'&&Math.abs(target.x-from.x)+Math.abs(target.z-from.z)===1)s-=6;
    }else if(kind==='heal'){if(!enemy){const miss=target.mhp-target.hp;s+=Math.min(miss,healAmt(u,target,a))/target.mhp*90*(miss/target.mhp>.35?1.3:.6);}else s-=10;}
    else if(kind==='buff'){if(!enemy){for(const k in (a.st||{}))if(!target.st[k])s+=16;if(a.pa)s+=8;}}
    else if(kind==='debuff'){if(enemy){for(const k in a.st)if(!target.st[k])s+=a.ch*.35;}else s-=20;}
  }
  if(tiles.some(t=>gateAt(t.x,t.z))&&(kind==='phys'||kind==='mag')&&u.side!==G.defSide)s+=G.needGate?40:6;
  u.x=ox;u.z=oz;
  if(a&&a.ctr)s*=.75;if(a&&a.mp)s-=a.mp*.4;
  if(ab==='special')s=s>70?s*1.2:s*.3;
  return s;
}
async function aiTurn(u){
  await sleep(200);
  if(await aiChallenge(u)){if(G.over||checkEnd()||!u.alive)return;}
  const R0=reach(u);let opts=R0.tiles;
  if(u.role==='wall'&&u.side===G.defSide&&u.side!==0){const near=foes(u).some(f=>Math.abs(f.x-u.x)+Math.abs(f.z-u.z)<=7);if(!near)opts=[tileOf(u)];}
  const acts=actsOf(u);let best={s:8};
  for(const from of opts){for(const ab of acts){for(const tt of targetsFor(u,ab,from)){const s=evalAct(u,ab,from,tt)-(R0.d.get(from)||0)*.2;if(s>best.s)best={s,from,ab,tt};}}}
  G.needGate=false;
  if(!best.from){
    const goal=moveGoal(u,opts);
    if(goal&&goal!==tileOf(u)){await moveUnit(u,goal);}
    const from=tileOf(u);let b2={s:8};for(const ab of acts){for(const tt of targetsFor(u,ab,from)){const s=evalAct(u,ab,from,tt);if(s>b2.s)b2={s,ab,tt};}}
    if(b2.ab)await doAction(u,b2.ab,b2.tt.x,b2.tt.z);
  }else{
    if(best.from!==tileOf(u))await moveUnit(u,best.from);
    await doAction(u,best.ab,best.tt.x,best.tt.z);if(G.over)return;
    if(!u.moved&&!u.away){const g=retreatTile(u);if(g&&g!==tileOf(u))await moveUnit(u,g);}
  }
  const f=foes(u).sort((a,b)=>(Math.abs(a.x-u.x)+Math.abs(a.z-u.z))-(Math.abs(b.x-u.x)+Math.abs(b.z-u.z)))[0];
  if(f&&!u.away&&u.alive){u.dir=dirTo(u.x,u.z,f.x,f.z);placeModel(u);}
  await sleep(150);
}
function moveGoal(u,opts){
  const fs=foes(u);if(!fs.length)return null;
  const src=fs.map(tileOf);const jump=Math.max(u.jpw,3);
  const dOpen=bfsAll(G.M,src,jump,true);const dClosed=bfsAll(G.M,src,jump,u.side===G.defSide);
  const me=tileOf(u);const blocked=G.M.gx!=null&&!dClosed.has(me)&&dOpen.has(me);
  G.needGate=blocked;
  const ranged=u.atk==='bow'||u.job==='kuro'||u.job==='shiro'||u.job==='toki';
  // 長坂などで守る側の総大将は下がる
  if(u.leader&&u.side===G.defSide&&G.cond&&G.cond.k==='survive'){let best=me,bs=-1;for(const t of opts){const d=dClosed.get(t);const v=d==null?99:d;if(v>bs){bs=v;best=t;}}return best;}
  let best=null,bs=1e9;
  for(const t of opts){let d=(blocked?dOpen:dClosed).get(t);if(d==null)d=99;
    let s=d;if(blocked){s=Math.abs(t.x-G.M.gx-.5)+Math.abs(t.z-G.M.wz-1);}
    if(ranged&&d<2)s+=3;if(u.atk==='bow')s-=t.h*.15;if(t.t==='swamp')s+=2;
    if(s<bs){bs=s;best=t;}}
  return best;
}
function retreatTile(u){if(!(u.atk==='bow'||u.job==='kuro'||u.job==='shiro'||u.job==='toki'))return null;const R0=reach(u);let best=tileOf(u),bs=-1;
  for(const t of R0.tiles){const d=Math.min(...foes(u).map(f=>Math.abs(f.x-t.x)+Math.abs(f.z-t.z)));if(d>bs&&d<=6){bs=d;best=t;}}return best;}

/* ---------------- player turn UI ---------------- */
let UI={mode:'',u:null,res:null,ab:null,tiles:null,sel:null};
function playerTurn(u){return new Promise(res=>{UI={mode:'menu',u,res,ab:null};showMenu();});}
function endPlayerTurn(){const r=UI.res;UI={mode:''};$('#menu').hidden=true;clearHL();clearDirs();if(r)r();}
function showMenu(){
  const u=UI.u;const m=$('#menu');m.hidden=false;clearHL();
  let h='<h3>'+u.h.n+'<small>Lv'+u.lv+' '+JOBS[u.job].n+(u.sec?' / '+JOBS[u.sec].n:'')+'</small></h3>';
  const item=(id,label,dis,cls,em)=>'<button type="button" class="mi '+(cls||'')+'" data-a="'+id+'"'+(dis?' disabled':'')+'>'+label+(em?'<em>'+em+'</em>':'')+'</button>';
  if(UI.sub){
    const j=UI.sub;h+='<h3>'+JOBS[j].n+'の技<small>MP '+u.mp+'</small></h3>';
    jobAbils(u,j).forEach(k=>{const a=AB[k];h+=item('ab:'+k,a.n,u.mp<(a.mp||0),'',(a.mp?'MP'+a.mp:'')+(a.ctr?' 詠唱':''));});
    h+=item('back','戻る');
  }else{
    h+=item('move','移動',u.moved);
    h+=item('attack','攻撃',u.acted);
    [u.job,u.sec].filter(Boolean).forEach(j=>{if(jobAbils(u,j).length)h+=item('sub:'+j,JOBS[j].n+'の技',u.acted,'','▸');});
    if(u.hero&&duelFoes(u).length)h+=item('duel','一騎打ちを挑む',u.acted,'sp','隣の敵将');
    if(u.hero)h+=item('special','必殺「'+SPEC(u).n+'」',u.acted||u.spUsed,'sp',u.spUsed?'使用済み':'1回');
    h+=item('wait','待機');
  }
  m.innerHTML=h;
  m.querySelectorAll('.mi').forEach(b=>b.onclick=()=>{SND.play('ui-click',.4);menuPick(b.dataset.a);});
}
function menuPick(a){
  const u=UI.u;
  if(a==='back'){UI.sub=null;showMenu();return;}
  if(a.startsWith('sub:')){UI.sub=a.slice(4);showMenu();return;}
  if(a==='move'){UI.mode='move';const R0=reach(u);UI.tiles=R0.tiles;showHL(R0.tiles,0x2fb4ff,.6);cancelMenu('移動先を選ぶ');return;}
  if(a==='wait'){chooseFacing();return;}
  if(a==='duel'){UI.mode='duel';UI.tiles=duelFoes(u).map(tileOf);showHL(UI.tiles,0xff4a3a,.7);cancelMenu('一騎打ちの相手を選ぶ');return;}
  const ab=a.startsWith('ab:')?a.slice(3):a;
  UI.ab=ab;UI.mode='target';
  const sa=abDef(u,ab);
  if(sa&&sa.rg===0){UI.tiles=[tileOf(u)];UI.sel=tileOf(u);preview(tileOf(u));return;}
  const r=abRange(u,ab);UI.tiles=tilesInRange(u.x,u.z,r.r,r.min,r.vert,tileOf(u).h);showHL(UI.tiles,0xffd34a);cancelMenu('対象を選ぶ（タップで予想が出る）');
}
function cancelMenu(msg){const m=$('#menu');m.innerHTML='<h3>'+UI.u.h.n+'<small>'+msg+'</small></h3><div id="pv"></div><button type="button" class="mi" data-a="x">戻る</button>';
  m.querySelector('[data-a="x"]').onclick=()=>{SND.play('ui-back',.4);UI.mode='menu';UI.sel=null;showMenu();};}
const RAN={konjo:'根性',ukenagashi:'受け流し',osha:'応射',hangeki:'反撃',shizen:'自然治癒',shoheki:'魔力障壁',kiki:'危機加速',ryukon:'竜の魂',shirahadori:'白刃取り',utsusemi:'空蝉'};
function preview(t){
  const u=UI.u,ab=UI.ab;const a=abDef(u,ab);
  const tiles=ab==='attack'?[t]:(a.rg===0?aoeTiles(ab,u.x,u.z,u):aoeTiles(ab,t.x,t.z,u));
  clearHL();showHL(UI.tiles,0xffd34a,.25);showHL(tiles,0xff5a3a,.55);
  const lines=[];const kind=a?a.kind:'phys';
  const hpTail=(o,d)=>' → 残り<b>'+Math.max(0,o.hp-d)+'</b>'+(d>=o.hp?' <b style="color:var(--seal)">倒せる</b>':'');
  for(const tt of tiles){const o=unitAt(tt.x,tt.z);if(!o)continue;
    if(o===u&&!(a&&(a.tg==='ally'||a.tg==='self'||kind==='heal'||kind==='buff')))continue;
    if(a&&a.smart&&((a.tg==='ally'||a.tg==='self')!==(o.side===u.side)))continue;
    const ra=o.side!==u.side&&o.ra?'<br><span class="note">'+RAN[o.ra]+'（'+(o.ra==='shirahadori'?Math.round(o.br*.6):o.ra==='utsusemi'?Math.round(o.br*.4):o.br)+'%）あり</span>':'';
    const nm='<b>'+o.h.n+'</b> ';
    if(kind==='phys'){if(!o.alive)continue;const d=dmgPhys(u,o,a);lines.push(nm+'命中'+hitChance(u,o,a)+'% ダメージ<b>'+d+'</b>'+hpTail(o,d)+ra);}
    else if(kind==='mag'){if(!o.alive)continue;const d=dmgMag(u,o,a);lines.push(nm+'ダメージ<b>'+d+'</b>'+hpTail(o,d)+ra);}
    else if(kind==='heal'){if(!o.alive)continue;const v=healAmt(u,o,a);lines.push(nm+'回復<b>'+Math.min(v,o.mhp-o.hp)+'</b>（'+o.hp+'→'+Math.min(o.mhp,o.hp+v)+'）');}
    else if(kind==='revive'){if(!o.alive)lines.push(nm+'成功'+a.ch+'%');}
    else if(kind==='grav'){if(o.alive){const d=Math.max(1,Math.round(o.hp*a.pct));lines.push(nm+'成功'+a.ch+'% ダメージ<b>'+d+'</b>'+hpTail(o,d));}}
    else if(kind==='debuff'){if(o.alive)lines.push(nm+'成功'+Math.round(a.ch*(o.boss?.5:1))+'%');}
    else if(kind==='jump'){const d=jumpDmg(u,o);lines.push(nm+'ダメージ<b>'+d+'</b>'+hpTail(o,d)+'（着地まで動かなければ）');}
    else lines.push(nm+(a.pa?'PA+'+a.pa+' ':'')+(a.st?Object.keys(a.st).map(k=>({haste:'ヘイスト',protect:'プロテス'}[k]||k)).join(''):''));}
  if(tiles.some(q=>gateAt(q.x,q.z)))lines.push('<b>城門</b> 残り '+G.gate.hp);
  if(a&&a.ctr)lines.push('詠唱 '+chargeTicks(u,a)+'カウント（その間に動かれると外れる）');
  const m=$('#menu');m.innerHTML='<h3>'+(a?a.n:'攻撃')+'<small>'+(a&&a.mp?'MP'+a.mp:'')+'</small></h3><div id="pv">'+(lines.join('<br>')||'対象がいない')+'</div>'+
    '<button type="button" class="mi sp" data-a="ok">実行</button><button type="button" class="mi" data-a="x">戻る</button>';
  m.querySelector('[data-a="ok"]').onclick=async()=>{SND.play('ui-ok',.4);const ab2=UI.ab;UI.mode='busy';m.hidden=true;clearHL();await doAction(u,ab2,t.x,t.z);afterAct();};
  m.querySelector('[data-a="x"]').onclick=()=>{SND.play('ui-back',.4);UI.mode='menu';UI.sel=null;showMenu();};
}
function afterAct(){if(G.over)return;if(checkEnd()){endPlayerTurn();return;}const u=UI.u;if(!u.alive){endPlayerTurn();return;}if(u.away||(u.moved&&u.acted)){chooseFacing();return;}UI.mode='menu';UI.sub=null;showMenu();showCard(u);}
async function tileClick(t){
  if(UI.mode==='move'){if(!UI.tiles.includes(t))return;UI.mode='busy';clearHL();$('#menu').hidden=true;SND.play('ui-ok',.3);await moveUnit(UI.u,t);showCard(UI.u);afterAct();return;}
  if(UI.mode==='target'){if(!UI.tiles.includes(t))return;UI.sel=t;preview(t);return;}
  if(UI.mode==='duel'){if(!UI.tiles.includes(t))return;const o=unitAt(t.x,t.z);if(!o)return;UI.mode='busy';clearHL();$('#menu').hidden=true;await duelFight(UI.u,o);UI.u.acted=true;afterAct();return;}
  const o=unitAt(t.x,t.z);if(o)showCard(o);
}
function chooseFacing(){
  const u=UI.u;if(u.away||!u.alive){endPlayerTurn();return;}
  UI.mode='facing';$('#menu').hidden=false;$('#menu').innerHTML='<h3>向きを決める<small>矢印をタップ</small></h3><button type="button" class="mi" data-a="k">このまま</button>';
  $('#menu').querySelector('[data-a="k"]').onclick=()=>{endPlayerTurn();};
  clearHL();clearDirs();G.dirBtns=[];
  const p0=u.m.holder.position;
  DIRV.forEach((v,i)=>{const p=p0.clone().add(new THREE.Vector3(v[0]*.8,.45,v[1]*.8));const s0=scr(p0),s1=scr(p);const ang=Math.atan2(s1.y-s0.y,s1.x-s0.x);
    const b=el('button','dirb','➜');b.type='button';b.style.transform='rotate('+ang+'rad)';b.setAttribute('aria-label','向き'+(i+1));
    b.onclick=()=>{u.dir=i;placeModel(u);SND.play('ui-click',.4);endPlayerTurn();};$('#fxl').appendChild(b);b.style.pointerEvents='auto';G.dirBtns.push({e:b,p});});
}
function clearDirs(){if(G&&G.dirBtns){G.dirBtns.forEach(b=>b.e.remove());G.dirBtns=null;}}
function showHL(tiles,color,op){const base=op||.55;const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:base,depthWrite:false});mat.userData.base=base;const g=new THREE.PlaneGeometry(.9,.9);
  const lm=new THREE.LineBasicMaterial({color:base<.3?color:0xffffff,transparent:true,opacity:base<.3?.5:.95});const eg=new THREE.EdgesGeometry(new THREE.PlaneGeometry(.84,.84));
  for(const t of tiles){const m=new THREE.Mesh(g,mat);m.rotation.x=-Math.PI/2;m.position.copy(wpos(t.x,t.z,t.h));m.position.y+=.03;m.renderOrder=5;hlGroup.add(m);
    const l=new THREE.LineSegments(eg,lm);l.rotation.x=-Math.PI/2;l.position.copy(m.position);l.position.y+=.006;l.renderOrder=6;hlGroup.add(l);}}
function clearHL(){if(!hlGroup)return;while(hlGroup.children.length){const m=hlGroup.children.pop();m.material.dispose();}}
/* ---------------- input ---------------- */
function bindInput(){
  const cv=$('#gl');let down=null,ptrs=new Map(),pinch=0;
  cv.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});down={x:e.clientX,y:e.clientY,az:cam.az0,el:cam.el0,moved:false};if(ptrs.size===2){const a=[...ptrs.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}});
  cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptrs.size===2){const a=[...ptrs.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch){cam.z0=clamp(cam.z0*d/pinch,.6,2.4);}pinch=d;if(down)down.moved=true;return;}
    if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.abs(dx)+Math.abs(dy)>8)down.moved=true;
    if(down.moved){cam.az0=down.az-dx*.008;cam.el0=clamp(down.el+dy*.004,.35,1.2);}
    else hover(e);});
  const up=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=0;if(down&&!down.moved&&e.type==='pointerup')click(e);if(!ptrs.size)down=null;};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{e.preventDefault();cam.z0=clamp(cam.z0*(e.deltaY<0?1.1:.9),.6,2.4);},{passive:false});
  $('#cL').onclick=()=>{cam.az0-=Math.PI/2;};$('#cR').onclick=()=>{cam.az0+=Math.PI/2;};
  $('#cT').onclick=()=>{cam.el0=cam.el0>.8?.55:1.05;};
  $('#cZ').onclick=()=>{cam.z0=cam.z0>1.3?.8:cam.z0<.95?1:1.6;};
  $('#cM').onclick=()=>{SND.init();BGM.setOn(!SND.bgmOn);$('#cM').classList.toggle('on',SND.bgmOn);};
  $('#cS').onclick=()=>{SPD=SPD===1?2:SPD===2?3:1;$('#cS').textContent='×'+SPD;};
  $('#cA').onclick=()=>{if(!G)return;G.auto=!G.auto;$('#cA').classList.toggle('on',G.auto);if(G.auto&&UI.res){const r=UI.res;$('#menu').hidden=true;clearHL();clearDirs();UI={mode:''};aiTurn(G.active).then(r);}};
}
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
function pickTile(e){if(!terrainMesh||!G)return null;mv.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(mv,camera);
  const picks=G.units.filter(u=>!u.gone&&!u.away).map(u=>u.m.pick);const hu=ray.intersectObjects(picks,false)[0];
  const ht=ray.intersectObject(terrainMesh,false)[0];
  if(hu&&(!ht||hu.distance<ht.distance+.6)){const u=hu.object.userData.unit;return G.M.at(u.x,u.z);}
  if(ht)return faceTile[ht.faceIndex]||null;return null;}
function click(e){const t=pickTile(e);if(!t)return;tileClick(t);}
function hover(e){const t=pickTile(e);if(!t){cursorMesh.visible=false;return;}cursorMesh.visible=true;cursorMesh.position.copy(wpos(t.x,t.z,t.h));cursorMesh.position.y+=.03;
  if(UI.mode==='target'&&UI.tiles&&UI.tiles.includes(t)&&UI.sel!==t){/* preview on tap */}}

/* ---------------- セリフ・会話（三国決戦伝から流用） ---------------- */
function lineOf(h,key){
  if(!h||h.gen)return null;const id=h.id,X=HL[id]||{};let p=null;
  if(key==='open')p=LN.open[id]||(X.taunt&&pick(X.taunt))||(h.sp?[0,h.sp]:null)||pick(LN.taunt);
  else if(key==='sp')p=(X.sp&&pick(X.sp))||(h.sp?[0,h.sp]:null)||pick(LN.sp);
  else if(key==='win')p=(X.win&&pick(X.win))||(h.win?[0,h.win]:null)||pick(LN.win);
  else if(key==='lose')p=(X.lose&&pick(X.lose))||(h.lose?[0,h.lose]:null)||pick(LN.lose);
  else if(key==='fury')p=(X.fury&&pick(X.fury))||pick(LN.fury.concat(LN.low));
  else p=LN[key]?pick(LN[key]):null;
  return p?dial(p[1],id):null;
}
const says=[];
function say(u,text,ms){if(!text||!u||!u.m||!u.bar)return;const old=says.find(q=>q.u===u);if(old){old.e.remove();says.splice(says.indexOf(old),1);}
  const e=el('div','say'+(u.side?' foe':''),'<b>'+u.h.n+'</b>'+text);$('#labels').appendChild(e);const q={u,e};says.push(q);
  setTimeout(()=>{e.remove();const i=says.indexOf(q);if(i>=0)says.splice(i,1);},(ms||1900)/Math.min(SPD,2));}
function convoSeq(){
  const P=G.units.filter(u=>u.side===0&&u.hero),E=G.units.filter(u=>u.side===1&&u.hero);
  const pl=P.find(u=>u.leader)||P[0],en=E.find(u=>u.leader)||E[0];const seq=[[null,G.E.s]];
  if(en)seq.push([en,lineOf(en.h,'open')]);if(pl)seq.push([pl,lineOf(pl.h,'open')]);
  let done=false;
  for(const a of P){if(done)break;for(const b of E){const k=[a.h.id,b.h.id].sort().join('|');
    if(PAIRCONV[k]){pick(PAIRCONV[k]).forEach(r=>{seq.push([r[0]===a.h.id?a:b,dial(r[2],r[0])]);});done=true;break;}
    if(PAIR[k]){[b,a].forEach(u=>{const o=PAIR[k][u.h.id];if(o)seq.push([u,dial(o[1],u.h.id)]);});done=true;break;}}}
  outer:for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const k=[P[i].h.id,P[j].h.id].sort().join('|');
    if(PAIRCONV[k]){pick(PAIRCONV[k]).forEach(r=>{seq.push([r[0]===P[i].h.id?P[i]:P[j],dial(r[2],r[0])]);});break outer;}}
  return seq.filter(q=>q[1]);
}
function talkScene(seq){return new Promise(res=>{
  if(!seq.length){res();return;}
  let i=0;const box=el('div','talk pp','');$('#fxl').appendChild(box);
  const fin=()=>{clearInterval(tm);box.remove();res();};
  const show=()=>{if(i>=seq.length){fin();return;}const[u,t]=seq[i];
    if(u){focus(u.x,u.z,tileOf(u).h);if(u.hero)setPose(u.m,i%2?'win':'idle');}
    box.className='talk pp'+(u&&u.side?' foe':'')+(u?'':' nar');
    box.innerHTML=(u?'<img alt="" src="'+portrait(u.h)+'">':'')+'<div style="min-width:0">'+(u?'<b>'+u.h.n+'</b>':'<b>'+G.B.n+'の戦い（'+G.B.y+'年）</b>')+'<p>'+t+'</p></div><span class="tnext">▼</span><button type="button" class="tskip">スキップ</button>';
    box.querySelector('.tskip').onclick=ev=>{ev.stopPropagation();i=seq.length;G.units.forEach(u2=>{if(u2.alive)setPose(u2.m,'idle');});fin();};SND.play('ui-click',.25);};
  box.onclick=()=>{if(seq[i]&&seq[i][0])setPose(seq[i][0].m,'idle');i++;show();};
  const tm=setInterval(()=>{if(G&&G.auto)box.onclick();},1000);
  show();
});}

/* ---------------- HUD ---------------- */
function setLog(s){$('#log').textContent=s;}
function showCard(u){const c=$('#card');c.hidden=false;
  const st=[];if(u.st.haste)st.push('ヘイスト');if(u.st.slow)st.push('スロウ');if(u.st.stop)st.push('ストップ');if(u.st.protect)st.push('プロテス');if(u.charging)st.push('詠唱中');if(!u.alive)st.push('戦闘不能 '+u.ko);
  const eq=[u.ra&&RSM[u.ra].n,u.su&&RSM[u.su].n,u.mo&&RSM[u.mo].n].filter(Boolean).join('・');
  c.innerHTML='<img alt="" src="'+portrait(u.h)+'"><div style="min-width:0"><div class="nm">'+u.h.n+'<small>Lv'+u.lv+' '+JOBS[u.job].n+(u.sec?'/'+JOBS[u.sec].n:'')+'</small></div>'+
    '<div style="margin-top:2px"><span class="chip '+(u.side?'foe':'me')+'">'+(u.side?'敵':u.ai?'味方AI':'味方')+'</span> '+(u.leader?'<span class="chip ld">総大将</span> ':'')+(st.length?'<span class="chip">'+st.join('・')+'</span>':'')+'</div>'+
    '<div class="bars"><span>HP</span><u><i style="width:'+(u.hp/u.mhp*100)+'%;background:#3a9a5a"></i></u><span>'+u.hp+'/'+u.mhp+'</span>'+
    '<span>MP</span><u><i style="width:'+(u.mmp?u.mp/u.mmp*100:0)+'%;background:#4a7ad8"></i></u><span>'+u.mp+'/'+u.mmp+'</span>'+
    '<span>CT</span><u><i style="width:'+Math.min(100,u.ct)+'%;background:#c9962e"></i></u><span>'+Math.min(100,Math.round(u.ct))+'</span></div></div>'+
    '<div class="st"><span>PA <b>'+u.pa+'</b></span><span>MA <b>'+u.ma+'</b></span><span>Sp <b>'+u.sp+'</b></span><span>移動 <b>'+u.mv+'</b></span><span>跳躍 <b>'+u.jpw+'</b></span><span>Br <b>'+u.br+'</b></span><span>Fa <b>'+u.fa+'</b></span><span>回避 <b>'+u.ev+'</b></span>'+(eq?'<span>'+eq+'</span>':'')+'</div>';}
function renderAT(){
  const sim=G.units.filter(u=>!u.gone&&!u.away&&u.alive).map(u=>({u,ct:u.ct,sp:effSp(u)}));const out=[];
  if(G.active)out.push(G.active);
  let guard=0;while(out.length<8&&guard++<400){sim.forEach(s=>s.ct+=s.sp);sim.filter(s=>s.ct>=100).sort((a,b)=>b.ct-a.ct).forEach(s=>{if(out.length<8)out.push(s.u);s.ct-=100;});}
  $('#at').innerHTML=out.map((u,i)=>'<div class="'+(u.side?'foe':'me')+(i===0&&G.active?' now':'')+'"><img alt="" src="'+portrait(u.h)+'">'+u.h.n+'<em>'+(i===0&&G.active?'行動中':'Lv'+u.lv)+'</em></div>').join('');
}

/* ============================================================
   SCREENS
   ============================================================ */
const scr$=()=>$('#scr');
function showScreen(html){const s=scr$();s.hidden=false;s.innerHTML=html;s.scrollTop=0;$('#hud').hidden=true;}
function hideScreen(){scr$().hidden=true;$('#hud').hidden=false;}
const prog=fk=>SAVE.camp[fk]||0;
function titleScreen(){
  if(EXT){extPost({t:'tacCancel',id:EXT.id});return;}
  BGM.play('camp');
  let h='<div class="wrap"><div class="ttl"><small>黄巾の乱 ― 五丈原</small><h1>三国タクティクス</h1><p>高低差のある戦場で、武将と兵を一手ずつ動かす戦術シミュレーション。戦場は毎回ちがう地形になる。勢力を選び、五丈原まで戦い抜け。</p></div>';
  h+='<h2 class="sec" style="color:var(--gold2)">勢力を選ぶ</h2><div class="facs">';
  FAC_ORDER.forEach(k=>{const C=CAMP[k],i=prog(k),n=C.list.length;
    const st=i>=n?'天下統一（クリア）':i>0?'次は第'+(i+1)+'戦「'+BATTLES[C.list[i].b].n+'」':'全'+n+'戦';
    h+='<button type="button" class="pp fac" data-f="'+k+'"><div class="hd"><b style="color:'+C.col+'">'+C.n+'</b><span class="diff" style="background:'+C.diff[1]+'">'+C.diff[0]+'</span></div>'+
      '<div class="pts">'+C.start.slice(0,4).map(id=>'<img alt="" src="'+portrait(byIdH(id))+'">').join('')+'</div><small>'+C.d+'<br>最初の武将 '+C.start.length+'人・'+st+'</small></button>';});
  h+='</div><p class="note" style="color:#b8a888">素材: 武将の顔・3Dモデル・効果音は「三国決戦伝」から。術のエフェクトとボタン音は Kenney（CC0）。</p></div>';
  showScreen(h);
  scr$().querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{SND.play('ui-ok',.4);campScreen(b.dataset.f);});
}
function campScreen(fk){
  if(EXT){extPost({t:'tacCancel',id:EXT.id});return;}
  BGM.play('camp');
  const C=CAMP[fk],cur=prog(fk);
  let h='<div class="wrap"><div class="row" style="justify-content:space-between"><button type="button" class="btn sm" id="cBack">← 勢力を選び直す</button><button type="button" class="btn sm" id="cReset">最初からやり直す</button></div>';
  h+='<div class="pp pad"><h2 class="sec">'+C.n+'の戦い</h2><div class="list" style="display:flex;flex-direction:column;gap:5px;margin-top:8px">';
  C.list.forEach((E,i)=>{const B=BATTLES[E.b];const done=i<cur,next=i===cur;
    h+='<div class="ru" style="grid-template-columns:3.2em minmax(0,1fr);'+(next?'border-color:var(--seal);background:rgba(184,50,31,.08)':'')+(i>cur?';opacity:.5':'')+'"><div style="font-family:var(--f-disp);font-size:22px;color:var(--seal);text-align:center;line-height:1.1">'+(i+1)+'<div class="note">'+B.y+'年</div></div>'+
      '<div style="min-width:0"><div class="nm">'+B.n+'<small>'+B.p+'・'+MAPN[B.map]+(E.side==='def'?'・守る':'')+(E.ev?'・'+EVENTS[E.ev].n:'')+'</small>'+(done?'<span class="chip" style="background:var(--good)">勝利</span>':next?'<span class="chip ld">次の戦</span>':'')+'</div><div class="note">'+(i<=cur?E.s:'？？？')+'</div></div></div>';});
  h+='</div></div>';
  if(cur<C.list.length)h+='<div class="row" style="justify-content:center"><button type="button" class="btn pri" id="cGo">第'+(cur+1)+'戦「'+BATTLES[C.list[cur].b].n+'」の準備へ</button></div>';
  else h+='<div class="pp pad" style="text-align:center"><p class="story">'+C.n+'は天下を統一した。</p></div>';
  h+='</div>';
  showScreen(h);const s=scr$();
  s.querySelector('#cBack').onclick=()=>{SND.play('ui-back',.4);titleScreen();};
  const rb=s.querySelector('#cReset');let armed=false;
  rb.onclick=()=>{if(!armed){armed=true;rb.textContent='もう一度押すと、'+C.n+'のレベル・JP・進行を消す';rb.style.background='#e8735e';return;}
    SAVE.camp[fk]=0;SAVE.joined[fk]=[];Object.keys(SAVE.u).forEach(k=>{if(k.startsWith(fk+':'))delete SAVE.u[k];});persist();PREP=null;SND.play('ui-back',.4);campScreen(fk);};
  const g=s.querySelector('#cGo');if(g)g.onclick=()=>{SND.play('ui-ok',.4);prepScreen(fk);};
}
let PREP=null;
function rosterFor(fk,idx){const C=CAMP[fk],E=C.list[idx];if(E.roster)return E.roster.slice();return C.start.concat(SAVE.joined[fk]||[]).filter((v,i,a)=>a.indexOf(v)===i);}
function prepScreen(fk){
  const C=CAMP[fk],idx=prog(fk);const E=C.list[idx];
  if(!PREP||PREP.fk!==fk||PREP.idx!==idx){
    const lead=E.lead||C.lead;const ids=rosterFor(fk,idx);if(!ids.includes(lead))ids.unshift(lead);ids.sort((a,b)=>(b===lead)-(a===lead));
    const heroes=ids.map((id,i)=>{const h=byIdH(id);const r=rec(fk+':'+id);const job=r.job||defJob(h);return {h,on:i<5,job,sec:r.sec||null,leader:id===lead};});
    const gens=[];const gjobs=['yumi','shiro','kuro','senshi','knight','yumi','ryu'];
    for(let i=0;i<0;i++){const r=rec(fk+':g_'+fk+'_'+i);const job=r.job||gjobs[i%gjobs.length];const h=genSoldier(fk,i,job);h.id='g_'+fk+'_'+i;gens.push({h,on:false,job,sec:r.sec||null});}
    PREP={fk,idx,heroes,gens,open:null,mode:(PREP&&PREP.fk===fk&&PREP.mode)||{k:'all',id:lead}};
    [...heroes,...gens].forEach(p=>{const r=rec(fk+':'+p.h.id);if(!r.init){r.init=1;r.jp[p.job]=(r.jp[p.job]||0)+150;r.ln[JOBS[p.job].ab[0]]=1;}r.job=p.job;});persist();
  }
  renderPrep();
}
function renderPrep(){
  BGM.play('council');
  const C=CAMP[PREP.fk],E=C.list[PREP.idx],B=BATTLES[E.b];const all=[...PREP.heroes,...PREP.gens];
  const nH=PREP.heroes.filter(p=>p.on).length,nG=PREP.gens.filter(p=>p.on).length,tot=nH+nG;
  const deployedHeroes=PREP.heroes.filter(p=>p.on);
  if(PREP.mode.k==='hero'&&!deployedHeroes.some(p=>p.h.id===PREP.mode.id))PREP.mode.id=(deployedHeroes[0]||{h:{id:null}}).h.id;
  const foeIds=parseFoe(E.foe).filter(f=>f.id!=='g');
  let h='<div class="wrap"><div class="row" style="justify-content:space-between"><button type="button" class="btn sm" id="pBack">← 戦の一覧</button><span class="note" style="color:#d8cbb0">第'+(PREP.idx+1)+'戦 / 全'+C.list.length+'戦</span></div>';
  h+='<div class="pp pad"><h2 class="sec">'+C.n+' ― '+B.n+'の戦い（'+B.y+'年・'+B.p+'）</h2><p class="story">'+E.s+'</p>'+
     '<dl class="kv" style="margin-top:8px"><dt>勝利</dt><dd>'+(E.cond&&E.cond.k==='survive'?E.cond.t+'カウント耐え抜く、または':'')+(foeIds.find(f=>f.leader)?byIdH(foeIds.find(f=>f.leader).id).n:'敵の大将')+'を倒す、または敵の全滅</dd><dt>敗北</dt><dd>総大将が倒れる、または味方の全滅</dd>'+
     '<dt>戦場</dt><dd>'+MAPN[B.map]+(E.side==='def'?'（守る側）':'（攻める側）')+(E.ev?'・途中で「'+EVENTS[E.ev].n+'」が起きる':'')+'。地形は戦うたびに変わる</dd>'+
     '<dt>敵将</dt><dd>'+foeIds.map(f=>byIdH(f.id).n+(f.leader?'（総大将）':'')).join('・')+'、ほかに兵'+Math.max(0,clamp(PREP.heroes.filter(p=>p.on).length+1+Math.floor(PREP.idx/4),4,8)-foeIds.length)+'人（出陣の人数で変わる）</dd></dl></div>';
  // プレイ方式
  h+='<div class="pp pad"><h2 class="sec">プレイ方式</h2><div class="row" style="margin-top:6px"><button type="button" class="tog'+(PREP.mode.k==='all'?' on':'')+'" data-m="all">全体プレイ（全員を操作）</button><button type="button" class="tog'+(PREP.mode.k==='hero'?' on':'')+'" data-m="hero">武将プレイ（1人だけ操作）</button>';
  if(PREP.mode.k==='hero')h+='<select id="mHero" aria-label="操作する武将">'+deployedHeroes.map(p=>'<option value="'+p.h.id+'"'+(p.h.id===PREP.mode.id?' selected':'')+'>'+p.h.n+'</option>').join('')+'</select>';
  h+='</div><p class="note" style="margin:6px 0 0">'+(PREP.mode.k==='hero'?'選んだ武将だけを動かし、他の味方はAIが動く。':'出陣した全員を自分で動かす。')+'</p></div>';
  h+='<div class="pp pad"><div class="row" style="justify-content:space-between"><h2 class="sec">出陣する部隊</h2><span class="note">武将 <b>'+nH+'</b>/5</span></div><div class="roster" style="margin-top:8px">';
  all.forEach((p,i)=>{
    const r=rec(PREP.fk+':'+p.h.id);const J=JOBS[p.job];
    const opts=(sel,none)=>(none?'<option value="">（なし）</option>':'')+JOBORDER.map(j=>'<option value="'+j+'"'+(j===sel?' selected':'')+'>'+JOBS[j].n+'</option>').join('');
    const eqSel=slot=>{const ks=Object.keys(RSM).filter(k=>RSM[k].slot===slot&&r.ln[k]);return '<select data-q="'+i+':'+slot+'" aria-label="'+SLOTN[slot]+'" id="q'+i+slot+'"><option value="">'+SLOTN[slot]+'なし</option>'+ks.map(k=>'<option value="'+k+'"'+(r.eq[slot]===k?' selected':'')+'>'+RSM[k].n+'</option>').join('')+'</select>';};
    const ld=p.leader?'<span class="chip ld">総大将</span>':'';
    h+='<div class="ru'+(p.on?'':' off')+'"><img alt="" src="'+portrait(p.h)+'"><div style="min-width:0"><div class="nm">'+p.h.n+ld+'<small>Lv'+r.lv+' '+(p.h.gen?'兵':'武将')+'</small></div>'+
      '<div class="sx">武力 '+p.h.p+' ・ 知力 '+p.h.i+' ・ 統率 '+p.h.cmd+' ・ EXP '+r.exp+'/100 ・ JP '+(r.jp[p.job]||0)+'</div>'+
      '<div class="ctl"><button type="button" class="tog'+(p.on?' on':'')+'" data-t="'+i+'"'+(p.leader?' disabled':'')+'>'+(p.on?'出陣':'待機')+'</button>'+
      '<select id="j'+i+'" data-j="'+i+'" aria-label="ジョブ">'+opts(p.job)+'</select><select id="s'+i+'" data-s="'+i+'" aria-label="サブの技">'+opts(p.sec,1)+'</select></div>'+
      '<div class="ctl">'+eqSel('ra')+eqSel('su')+eqSel('mo')+'<button type="button" class="tog" data-o="'+i+'">'+(PREP.open===i?'閉じる':'技を覚える')+'</button></div>';
    if(PREP.open===i){
      h+='<div class="abl">';
      jobLearnables(p.job).forEach(k=>{const a=anyAb(k),got=!!r.ln[k],can=(r.jp[p.job]||0)>=a.jp;const tag=AB[k]?'':'〔'+SLOTN[RSM[k].slot]+'〕';
        h+='<button type="button" data-l="'+i+':'+k+'" class="'+(got?'got':'')+'"'+(got||!can?' disabled':'')+'><span>'+tag+a.n+' <span class="note">'+a.d+'</span></span><span>'+(got?'習得済み':a.jp+'JP')+'</span></button>';});
      h+='<span class="note">'+J.n+': '+J.d+'。JPは戦うと増え、負けても残る。</span></div>';
    }
    h+='</div></div>';
  });
  h+='</div></div><div class="row" style="justify-content:center"><button type="button" class="btn pri" id="pGo"'+(tot<1?' disabled':'')+'>出陣</button></div>'+
    '<p class="note" style="text-align:center;color:#b8a888">ジョブ・サブの技・リアクション・サポート・ムーブは自由に組める。覚えた技だけが選べる。</p></div>';
  showScreen(h);
  const s=scr$();
  s.querySelector('#pBack').onclick=()=>{SND.play('ui-back',.4);campScreen(PREP.fk);};
  s.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{PREP.mode.k=b.dataset.m;SND.play('ui-click',.4);renderPrep();});
  const mh=s.querySelector('#mHero');if(mh)mh.onchange=()=>{PREP.mode.id=mh.value;};
  s.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const p=all[+b.dataset.t];
    if(!p.on){const nh=PREP.heroes.filter(q=>q.on).length,ng=PREP.gens.filter(q=>q.on).length;if(nh>=5){SND.play('ui-err',.4);return;}}
    p.on=!p.on;SND.play('ui-click',.4);renderPrep();});
  s.querySelectorAll('[data-j]').forEach(sel=>sel.onchange=()=>{const p=all[+sel.dataset.j];p.job=sel.value;if(p.sec===p.job)p.sec=null;
    if(p.h.gen){const id=p.h.id;const nh=genSoldier(PREP.fk,+id.split('_')[2],p.job);nh.id=id;p.h=nh;delete PTC[id];}
    const r=rec(PREP.fk+':'+p.h.id);r.job=p.job;r.sec=p.sec;if(r.jp[p.job]==null)r.jp[p.job]=100;if(!JOBS[p.job].ab.some(k=>r.ln[k]))r.ln[JOBS[p.job].ab[0]]=1;persist();renderPrep();});
  s.querySelectorAll('[data-s]').forEach(sel=>sel.onchange=()=>{const p=all[+sel.dataset.s];p.sec=sel.value||null;if(p.sec===p.job)p.sec=null;rec(PREP.fk+':'+p.h.id).sec=p.sec;persist();renderPrep();});
  s.querySelectorAll('[data-q]').forEach(sel=>sel.onchange=()=>{const[i,slot]=sel.dataset.q.split(':');const p=all[+i];const r=rec(PREP.fk+':'+p.h.id);r.eq[slot]=sel.value||null;persist();});
  s.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{PREP.open=PREP.open===+b.dataset.o?null:+b.dataset.o;renderPrep();});
  s.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const[i,k]=b.dataset.l.split(':');const p=all[+i];const r=rec(PREP.fk+':'+p.h.id);const a=anyAb(k);
    if((r.jp[p.job]||0)<a.jp)return;r.jp[p.job]-=a.jp;r.ln[k]=1;if(RSM[k]&&!r.eq[RSM[k].slot])r.eq[RSM[k].slot]=k;persist();SND.play('ui-ok',.4);renderPrep();});
  s.querySelector('#pGo').onclick=()=>{SND.play('ui-ok',.5);startBattle();};
}
function startBattle(seed){
  const all=[...PREP.heroes,...PREP.gens].filter(p=>p.on);
  let party=all.map(p=>({h:p.h,job:p.job,sec:p.sec,leader:!!p.leader}));
  if(!party.some(p=>p.leader)){const f=party.find(p=>!p.h.gen)||party[0];f.leader=true;}
  party.sort((a,b)=>(b.leader?1:0)-(a.leader?1:0));
  const mode=PREP.mode.k==='hero'?{k:'hero',id:PREP.mode.id}:{k:'all'};
  clearBattle();hideScreen();
  newBattle(PREP.fk,PREP.idx,party,seed||Math.floor(Math.random()*1e9),mode);
  buildTerrain(G.M);G.units.forEach(placeModel);
  renderAT();
  banner(G.B.n+'の戦い',G.M.feats.join('・'));
  BGM.play('battle');
  const my=G;setTimeout(async()=>{if(G!==my)return;await talkScene(convoSeq());if(G===my)battleLoop();},1700);
}
function endBattle(res){
  if(EXT){extEnd(res);return;}
  const C=CAMP[G.fk],E=G.E;
  clearDirs();$('#menu').hidden=true;
  const win=res==='win';
  if(win){G.units.filter(u=>u.side===0&&!u.gone).forEach(u=>{gainJP(u,50);gainExp(u,[{lv:u.lv+3}]);});
    if(prog(G.fk)===G.idx){SAVE.camp[G.fk]=G.idx+1;SAVE.joined[G.fk]=(SAVE.joined[G.fk]||[]).concat(E.join||[]);}PREP=null;}
  persist();
  banner(win?'勝利':'敗北',win?G.B.n+'を制した':'');
  if(win){G.units.filter(u=>u.side===0&&u.alive).forEach(u=>setPose(u.m,'win'));SND.play('fanfare-short',.5);}else SND.play('groan',.5);
  SND[win?'win':'lose']();
  const spk=G.units.find(u=>u.side===0&&u.leader&&u.hero)||G.units.find(u=>u.side===0&&u.hero);const quote=spk?lineOf(spk.h,win?'win':'lose'):null;if(spk&&quote)say(spk,quote,2400);
  const last=win&&G.idx>=C.list.length-1;
  setTimeout(()=>{
    const gains=G.units.filter(u=>u.side===0).map(u=>'<span>'+u.h.n+' Lv'+u.lv+(u.lvUps?'<b style="color:var(--seal)">↑'+u.lvUps+'</b>':'')+' +'+u.expGain+'EXP +'+u.jpGain+'JP</span>').join('');
    const joins=(win&&E.join||[]).map(id=>byIdH(id).n);
    let h='<div class="wrap" style="max-width:680px"><div class="verdict '+(win?'win':'lose')+'">'+(last?'天下統一':win?'勝利':'敗北')+'</div>';
    if(spk&&quote)h+='<div class="pp pad" style="display:grid;grid-template-columns:56px minmax(0,1fr);gap:10px;align-items:center"><img alt="" src="'+portrait(spk.h)+'" style="width:56px;height:63px;border-radius:4px"><div><b style="font-family:var(--f-disp);color:var(--seal)">'+spk.h.n+'</b><p class="story" style="margin:2px 0 0">「'+quote+'」</p></div></div>';
    h+='<div class="pp pad"><p class="story">'+(win?E.w:'総崩れとなった。だが戦はまだ終わらない。地形を変えて、もう一度。')+'</p>'+
      (joins.length?'<p class="story" style="margin-top:6px;color:var(--seal)">'+joins.join('・')+'が仲間になった。</p>':'')+
      '<h2 class="sec" style="margin-top:10px">得たもの（負けても残る）</h2><div class="terr" style="margin-top:6px">'+gains+'</div>'+
      '<h2 class="sec" style="margin-top:10px">今回の地形</h2><div class="terr" style="margin-top:6px">'+G.M.feats.map(f=>'<span>'+f+'</span>').join('')+'</div>'+
      (win&&!last?'<h2 class="sec" style="margin-top:10px">次の戦</h2><p class="story" style="font-size:14px">'+BATTLES[C.list[G.idx+1].b].n+'（'+BATTLES[C.list[G.idx+1].b].y+'年）― '+C.list[G.idx+1].s+'</p>':'')+
      (last?'<p class="story" style="margin-top:10px">'+C.n+'の物語はここで終わる。ほかの勢力でも遊べる。</p>':'')+'</div>';
    h+='<div class="row" style="justify-content:center">'+(win&&!last?'<button type="button" class="btn pri" id="rNext">次の戦の準備へ</button>':'')+(!win?'<button type="button" class="btn pri" id="rNew">再戦（新しい地形）</button><button type="button" class="btn" id="rPrep">編成を変える</button>':'')+'<button type="button" class="btn" id="rCamp">戦の一覧</button><button type="button" class="btn" id="rTitle">勢力選択へ</button></div></div>';
    showScreen(h);
    const s=scr$();const fk=G.fk;
    const b1=s.querySelector('#rNext');if(b1)b1.onclick=()=>{SND.play('ui-ok',.5);clearBattle();prepScreen(fk);};
    const b2=s.querySelector('#rNew');if(b2)b2.onclick=()=>{SND.play('ui-ok',.5);startBattle();};
    const b3=s.querySelector('#rPrep');if(b3)b3.onclick=()=>{SND.play('ui-click',.4);clearBattle();prepScreen(fk);};
    s.querySelector('#rCamp').onclick=()=>{SND.play('ui-click',.4);clearBattle();campScreen(fk);};
    s.querySelector('#rTitle').onclick=()=>{SND.play('ui-click',.4);clearBattle();titleScreen();};
  },2400);
}

/* ---------------- 三国覇王伝から呼ばれたとき ---------------- */
let EXT=null;
const extPost=m=>{try{parent.postMessage(m,'*');}catch(e){}};
function extStart(m){
  EXT={id:m.id};
  const ids=m.party.map(p=>p.id);
  CAMP.ext={n:m.fname,col:m.fcol,lead:ids[0],start:ids,gen:0,diff:['',''],d:'',list:[{b:'ext',side:m.side,ef:m.ef,foe:m.foe,s:m.s||'',w:m.w||'',roster:ids}]};
  BATTLES.ext={n:m.n,y:m.y||194,p:m.p||'',map:m.map,opt:m.opt||{}};
  FCHAR.ext=m.fch;FCOL.ext=m.fcol;FCHAR[m.ef]=m.ech;FCOL[m.ef]=m.ecol;
  SAVE.camp.ext=0;
  m.party.forEach(p=>{const r=rec('ext:'+p.id);if((p.lv||1)>r.lv)r.lv=p.lv;});persist();
  PREP=null;prepScreen('ext');
}
function extEnd(res){
  clearDirs();$('#menu').hidden=true;const win=res==='win';
  if(win)G.units.filter(u=>u.side===0&&!u.gone).forEach(u=>{gainJP(u,50);gainExp(u,[{lv:u.lv+3}]);});
  persist();
  banner(win?'勝利':'敗北',win?G.B.n+'を制した':'');
  if(win){G.units.filter(u=>u.side===0&&u.alive).forEach(u=>setPose(u.m,'win'));SND.play('fanfare-short',.5);}else SND.play('groan',.5);
  SND[win?'win':'lose']();
  const spk=G.units.find(u=>u.side===0&&u.leader&&u.hero)||G.units.find(u=>u.side===0&&u.hero);const quote=spk?lineOf(spk.h,win?'win':'lose'):null;if(spk&&quote)say(spk,quote,2400);
  const out={t:'tacEnd',id:EXT.id,win,
    mine:G.units.filter(u=>u.side===0&&u.hero).map(u=>({id:u.h.id,down:!u.alive||u.gone})),
    foes:G.units.filter(u=>u.side===1).map(u=>({id:u.hero?u.h.id:'',down:!u.alive||u.gone})),duels:G.duels||[]};
  setTimeout(()=>{
    const gains=G.units.filter(u=>u.side===0).map(u=>'<span>'+u.h.n+' Lv'+u.lv+(u.lvUps?'<b style="color:var(--seal)">↑'+u.lvUps+'</b>':'')+' +'+u.expGain+'EXP +'+u.jpGain+'JP</span>').join('');
    let h='<div class="wrap" style="max-width:680px"><div class="verdict '+(win?'win':'lose')+'">'+(win?'勝利':'敗北')+'</div>';
    if(spk&&quote)h+='<div class="pp pad" style="display:grid;grid-template-columns:56px minmax(0,1fr);gap:10px;align-items:center"><img alt="" src="'+portrait(spk.h)+'" style="width:56px;height:63px;border-radius:4px"><div><b style="font-family:var(--f-disp);color:var(--seal)">'+spk.h.n+'</b><p class="story" style="margin:2px 0 0">「'+quote+'」</p></div></div>';
    h+='<div class="pp pad"><h2 class="sec">得たもの（ジョブとJPはこの先の戦術戦でも残る）</h2><div class="terr" style="margin-top:6px">'+gains+'</div></div>';
    h+='<div class="row" style="justify-content:center"><button type="button" class="btn pri" id="rBack">天下図へ戻る</button></div></div>';
    showScreen(h);scr$().querySelector('#rBack').onclick=()=>{SND.play('ui-ok',.5);clearBattle();extPost(out);};
  },2400);
}
window.addEventListener('message',e=>{const m=e.data||{};if(m.t==='tac')extStart(m);});

/* ---------------- boot ---------------- */
function boot(){
  initGL();
  G={fk:'wei',units:[],pend:[]};G.M=genMap('gate',{},Math.floor(Math.random()*1e9));G.gate={hp:1,mhp:1};buildTerrain(G.M);
  cam.ftx=0;cam.fty=1;cam.ftz=0;cam.z0=.9;
  const spin=()=>{if(!scr$().hidden)cam.az0+=.0016;requestAnimationFrame(spin);};spin();
  if(/ext/.test(location.hash)){showScreen('<div class="wrap"><div class="ttl"><small>三国覇王伝</small><h1>戦術戦</h1><p>軍を整えている…</p></div></div>');extPost({t:'tacReady'});}else titleScreen();
  window.__S3T={get G(){return G;},duel:(a,b)=>duelFight(a,b),CAMP,BATTLES,genMap,speed(n){SPD=n;},
    quick(fk,idx,mode){SAVE.camp[fk]=idx;PREP=null;prepScreen(fk);if(mode==='hero'){PREP.mode={k:'hero',id:PREP.heroes[0].h.id};}startBattle();}};
}
if(window.THREE)boot();else window.addEventListener('load',boot);
})();
