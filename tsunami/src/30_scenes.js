/* =========================================================
   背景（viewBox 400×250、地面 y≈215）
   ========================================================= */
const roofs=(y,list,col)=>list.map(([x,w,h],i)=>`<rect x="${x}" y="${y-h}" width="${w}" height="${h}" fill="${col||['#efe3cf','#e6dccb','#f3eadb'][i%3]}"/><path d="M${x-4} ${y-h} L${x+w/2} ${y-h-h*.55} L${x+w+4} ${y-h}z" fill="${['#5e6f86','#6e5e55','#4f6a6a'][i%3]}"/>`).join('');
const SCENES = {
  /* 下田小学校：教室 */
  class4:{bg:`<rect width="400" height="250" fill="#fff4dc"/><rect x="40" y="30" width="210" height="96" rx="4" fill="#2f6b4f" stroke="#a0683e" stroke-width="6"/>
    <text x="145" y="66" font-size="13" fill="#fff" text-anchor="middle" opacity=".9">4年　算数</text><text x="145" y="92" font-size="12" fill="#fff" text-anchor="middle" opacity=".75">84 ÷ 4 ＝ ？</text><text x="230" y="118" font-size="8" fill="#fff" text-anchor="end" opacity=".55">10月　日直</text>
    <rect x="280" y="26" width="104" height="114" fill="#bfe6ff" stroke="#fff" stroke-width="6"/><path d="M332 26 v114" stroke="#fff" stroke-width="4"/><path d="M286 110 q20 -24 46 -10 q24 -20 50 2 v32 h-96z" fill="#7cb87a"/>
    <rect x="0" y="180" width="400" height="70" fill="#e2c49a"/><g stroke="#cfae80" stroke-width="2"><path d="M0 200 H400 M0 225 H400"/></g><rect x="8" y="60" width="22" height="120" fill="#c98e5a"/><rect x="10" y="70" width="18" height="24" fill="#f6e7c8"/><rect x="10" y="100" width="18" height="24" fill="#f6e7c8"/>`,
    fg:`<g fill="#d9a877"><rect x="60" y="196" width="70" height="10" rx="2"/><rect x="170" y="196" width="70" height="10" rx="2"/><rect x="280" y="196" width="70" height="10" rx="2"/></g><g fill="#8a8f96"><rect x="66" y="206" width="5" height="30"/><rect x="119" y="206" width="5" height="30"/><rect x="176" y="206" width="5" height="30"/><rect x="229" y="206" width="5" height="30"/><rect x="286" y="206" width="5" height="30"/><rect x="339" y="206" width="5" height="30"/></g>`,split:220},
  classwreck:{bg:`<rect width="400" height="250" fill="#f3e6cc"/><g transform="rotate(-3 145 78)"><rect x="40" y="30" width="210" height="96" rx="4" fill="#2f6b4f" stroke="#a0683e" stroke-width="6"/><text x="145" y="66" font-size="13" fill="#fff" text-anchor="middle" opacity=".9">4年　算数</text></g>
    <rect x="280" y="26" width="104" height="114" fill="#bfe6ff" stroke="#fff" stroke-width="6"/><path d="M290 40 l30 40 l-14 22 M350 30 l-10 50 l24 30" stroke="#fff" stroke-width="2" fill="none"/><path d="M332 26 v114" stroke="#fff" stroke-width="4"/>
    <rect x="0" y="180" width="400" height="70" fill="#dcbf95"/><g stroke="#cfae80" stroke-width="2"><path d="M0 200 H400 M0 225 H400"/></g>
    <g transform="rotate(62 30 180)"><rect x="8" y="60" width="22" height="120" fill="#c98e5a"/></g><g fill="#f6e7c8"><rect x="60" y="214" width="16" height="10" transform="rotate(20 68 219)"/><rect x="88" y="222" width="18" height="8" transform="rotate(-14 97 226)"/></g>`,
    fg:`<g fill="#d9f2ff" stroke="#9fc9df" stroke-width=".8"><path d="M300 232 l8 -6 l4 8z"/><path d="M322 240 l10 -4 l-2 8z"/><path d="M350 228 l6 -8 l5 9z"/><path d="M276 244 l9 -3 l-3 6z"/><path d="M366 242 l8 -6 l2 8z"/></g>
    <g fill="#d9a877"><rect x="150" y="200" width="70" height="10" rx="2" transform="rotate(8 185 205)"/></g>`,split:220},
  /* 校庭 */
  yard:{bg:`${sky('gy','#9fd6ff','#e2f4ff')}<rect width="400" height="250" fill="url(#gy)"/><path d="M0 120 q60 -60 130 -40 q50 -40 110 -10 q60 -30 160 10 V170 H0z" fill="#86bf7c"/><path d="M0 140 q80 -40 170 -10 q90 -30 230 0 V170 H0z" fill="#6fae6b"/>
    <rect x="0" y="152" width="120" height="14" fill="#5fb6e0"/><path d="M0 156 h120" stroke="#fff" stroke-width="1.5" opacity=".7"/>
    <rect x="200" y="66" width="190" height="122" fill="#f2eee6"/><rect x="200" y="62" width="190" height="8" fill="#c9c2b6"/><g fill="#a9d4f0">${[78,110,142].map(y=>[212,248,284,320,356].map(x=>`<rect x="${x}" y="${y}" width="24" height="18"/>`).join('')).join('')}</g>
    <circle cx="295" cy="52" r="9" fill="#fff" stroke="#c9c2b6" stroke-width="3"/><path d="M295 52 v-5 M295 52 h4" stroke="#555" stroke-width="1.5"/><rect x="270" y="168" width="40" height="20" fill="#8a7a66"/>
    <rect x="0" y="170" width="400" height="80" fill="#d9b98a"/><g stroke="#e8d3b0" stroke-width="2" fill="none"><ellipse cx="120" cy="214" rx="90" ry="20"/></g>
    <g stroke="#9aa3ad" stroke-width="1.5"><path d="M0 172 h190"/>${Array.from({length:20},(_,i)=>`<path d="M${i*10} 162 v10"/>`).join('')}<path d="M0 162 h190"/></g>
    <rect x="160" y="150" width="34" height="16" rx="2" fill="#fff" stroke="#ccc"/><text x="177" y="161" font-size="6" text-anchor="middle" fill="#555">下田小学校</text>`},
  /* 下田の町なか：倒れたブロック塀 */
  road:{bg:`${sky('gr2','#a7d3f0','#e6f3fb')}<rect width="400" height="250" fill="url(#gr2)"/><path d="M0 110 q90 -50 200 -30 q110 -30 200 0 V170 H0z" fill="#7fb879"/>
    ${roofs(178,[[6,70,46],[90,60,40],[260,64,44],[338,58,50]])}<rect x="0" y="176" width="400" height="74" fill="#a9a39a"/><path d="M0 176 H400" stroke="#cfc8bd" stroke-width="4"/>
    <g transform="rotate(-7 190 120)"><rect x="186" y="40" width="7" height="140" fill="#8d7b68"/><rect x="170" y="54" width="40" height="4" fill="#6d5d50"/></g><path d="M0 60 Q100 74 192 58 T400 62" stroke="#444" stroke-width="1" fill="none"/>`,
    fg:`<g fill="#bdbab3" stroke="#8f8b84" stroke-width="1"><rect x="150" y="196" width="26" height="12" transform="rotate(-12 163 202)"/><rect x="176" y="204" width="26" height="12" transform="rotate(8 189 210)"/><rect x="204" y="198" width="26" height="12" transform="rotate(-20 217 204)"/><rect x="230" y="206" width="26" height="12"/><rect x="160" y="214" width="26" height="12" transform="rotate(14 173 220)"/><rect x="214" y="216" width="26" height="12" transform="rotate(-6 227 222)"/><rect x="256" y="196" width="26" height="12" transform="rotate(30 269 202)"/></g>
    <rect x="120" y="150" width="30" height="40" fill="#c7c3bb" stroke="#8f8b84"/>`,split:224},
  /* 避難路の坂道 */
  slope:{bg:`${sky('gs2','#a7d3f0','#eaf6fd')}<rect width="400" height="250" fill="url(#gs2)"/><path d="M0 250 L0 170 Q120 150 230 90 T400 20 V250z" fill="#79b36f"/><path d="M0 250 L0 196 Q150 178 260 120 T400 66 V250z" fill="#5d9e5a"/>
    <path d="M0 236 Q150 214 270 150 T400 98" stroke="#d8c7a2" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M0 222 Q150 200 265 138 T400 86" stroke="#8a6d55" stroke-width="2" fill="none"/>
    <g fill="#4f8a4c"><circle cx="40" cy="150" r="22"/><circle cx="330" cy="40" r="26"/><circle cx="370" cy="70" r="20"/></g>
    <rect x="300" y="110" width="4" height="40" fill="#777"/><rect x="270" y="96" width="62" height="20" rx="3" fill="#2e8b57"/><text x="301" y="104" font-size="6" fill="#fff" text-anchor="middle">津波避難場所</text><text x="301" y="112" font-size="6" fill="#fff" text-anchor="middle">有隣公園 →</text>`},
  /* 有隣公園（高台）から海と町を見下ろす。v.flood:0〜3、v.pull:潮が引く、v.surge:白い線 */
  park:{bg:`${sky('gp','#9fd0f2','#e9f6fd')}<rect width="400" height="250" fill="url(#gp)"/><rect x="0" y="96" width="400" height="40" fill="#3f9fd0"/><path d="M0 104 h400 M0 118 h400" stroke="#fff" stroke-width="1" opacity=".5"/>
    <path d="M250 96 q40 -24 90 -18 q40 6 60 18z" fill="#7aa88a"/><path d="M0 136 h400 v14 h-400z" fill="#e6d7ad"/>
    ${roofs(172,[[10,30,16],[46,26,14],[78,34,18],[118,28,15],[152,32,17],[190,26,14],[222,34,16],[262,28,15],[296,30,17],[334,32,14],[370,26,16]])}
    <rect x="0" y="170" width="400" height="12" fill="#8fb27e"/>`,
    dyn:v=>{ let s='';
      if(v.pull) s+=`<rect x="0" y="96" width="400" height="22" fill="#9fd0f2"/><rect x="0" y="112" width="400" height="24" fill="#cdbb8e"/>`;
      if(v.surge) s+=`<g class="surge"><path d="M400 118 q-10 -6 -20 0 t-20 0 t-20 0 t-20 0 t-20 0 v18 h100z" fill="#fff" opacity=".9"/><rect x="400" y="110" width="400" height="28" fill="#2f7fb0"/></g>`;
      if(v.flood) s+=`<rect class="flood" x="0" y="${[0,166,152,138][v.flood]}" width="400" height="${[0,20,34,48][v.flood]}" fill="#4a7f9e" opacity=".92"/><path d="M0 ${[0,166,152,138][v.flood]} h400" stroke="#d8eef8" stroke-width="2"/>`;
      return s; },
    fg:`<rect x="0" y="182" width="400" height="68" fill="#8cbf6e"/><g stroke="#8d6e63" stroke-width="3"><path d="M0 186 h400"/>${Array.from({length:14},(_,i)=>`<path d="M${i*30+10} 186 v14"/>`).join('')}</g>`,split:150},
  /* 旧下田中学校の体育館（避難所・夜） */
  gym:{bg:`<rect width="400" height="250" fill="#3b3430"/><rect x="0" y="0" width="400" height="120" fill="#4a423c"/><g fill="#1c2747">${[30,110,190,270,350].map(x=>`<rect x="${x-24}" y="16" width="48" height="34"/>`).join('')}</g><g stroke="#4a423c" stroke-width="3">${[30,110,190,270,350].map(x=>`<path d="M${x} 16 v34"/>`).join('')}</g>
    <rect x="160" y="60" width="80" height="50" fill="#5a524b"/><rect x="186" y="96" width="28" height="4" fill="#d84343"/><path d="M190 100 l4 14 h12 l4 -14" stroke="#eee" stroke-width="1" fill="none"/>
    <rect x="0" y="120" width="400" height="130" fill="#8a6a48"/><g stroke="#7a5c3d" stroke-width="1">${Array.from({length:10},(_,i)=>`<path d="M0 ${130+i*12} H400"/>`).join('')}</g>
    <circle cx="330" cy="118" r="40" fill="#ffcf7a" opacity=".18"/><rect x="324" y="112" width="12" height="14" rx="2" fill="#ffd98a"/>`,
    fg:`<g opacity=".95"><rect x="10" y="214" width="80" height="22" rx="6" fill="#7e8fb0"/><rect x="100" y="218" width="80" height="22" rx="6" fill="#a27e8e"/><rect x="236" y="216" width="80" height="22" rx="6" fill="#7ea08a"/><rect x="326" y="220" width="70" height="22" rx="6" fill="#9a8f7a"/></g>
    <g fill="#c9c2b6"><rect x="200" y="150" width="34" height="22" rx="2"/><rect x="204" y="142" width="26" height="10" rx="2"/></g><text x="217" y="165" font-size="6" fill="#555" text-anchor="middle">受付</text>`,split:206},
  /* 準備中の物語のサムネイル用 */
  irino:{bg:`${sky('gi','#7cc8ff','#d8f1ff')}<rect width="400" height="250" fill="url(#gi)"/><path d="M0 120 H400 V178 H0z" fill="#2fa6d9"/><g class="wave"><path d="M-20 136 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/></g><path d="M0 176 Q200 166 400 178 V250 H0z" fill="#f2dca0"/><g fill="#3f7a4a"><path d="M300 176 l10 -40 l10 40z"/><path d="M330 176 l12 -52 l12 52z"/><path d="M362 176 l10 -36 l10 36z"/></g>`},
  port:{bg:`${sky('gq','#a7d3f0','#e6f3fb')}<rect width="400" height="250" fill="url(#gq)"/><path d="M0 110 q90 -50 200 -30 q110 -30 200 0 V160 H0z" fill="#7fb879"/><rect x="0" y="150" width="400" height="40" fill="#3f9fd0"/><rect x="40" y="128" width="70" height="26" fill="#ffffff"/><path d="M36 128 h78 l-8 -10 h-62z" fill="#e57373"/><rect x="200" y="96" width="140" height="64" fill="#dfe7ea"/><rect x="200" y="92" width="140" height="6" fill="#9fb0b8"/><text x="270" y="130" font-size="9" fill="#5b6e7a" text-anchor="middle">加工場</text><rect x="0" y="186" width="400" height="64" fill="#a9a39a"/>`},
  mart:{bg:`<rect width="400" height="250" fill="#f6f1e8"/><g fill="#e6eef2">${[40,140,240,340].map(x=>`<rect x="${x-34}" y="70" width="68" height="110" rx="3"/>`).join('')}</g><g fill="#f3c77a">${[40,140,240,340].map(x=>[90,120,150].map(y=>`<rect x="${x-28}" y="${y}" width="56" height="14" rx="2"/>`).join('')).join('')}</g><rect x="0" y="30" width="400" height="22" fill="#e53935"/><rect x="0" y="180" width="400" height="70" fill="#d7d1c6"/>`},
  hosp:{bg:`<rect width="400" height="250" fill="#eef6f7"/><rect x="250" y="30" width="110" height="90" fill="#cbeaff" stroke="#fff" stroke-width="6"/><path d="M305 30 v90" stroke="#fff" stroke-width="4"/><rect x="0" y="190" width="400" height="60" fill="#dbe7ea"/><g fill="#9fc3d6">${[40,90,140].map(x=>`<rect x="${x}" y="160" width="36" height="30" rx="4"/>`).join('')}</g><rect x="20" y="40" width="160" height="26" rx="4" fill="#4c8fe0"/><text x="100" y="58" font-size="11" fill="#fff" text-anchor="middle">内科　受付</text>`}
};
