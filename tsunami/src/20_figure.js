
/* =========================================================
   2Dキャラクター
   look: {k:'old'|'adult'|'teen'|'child', skin, hair, hs:髪型, top, bot, x:小物}
   ========================================================= */
const LOOK = {
  me:{k:'teen',skin:'#f5cfae',hair:'#2b2320',hs:'short',top:'#3d7be0',bot:'#2f3b55'},
  gpa:{k:'old',skin:'#efc8a5',hair:'#d9d6d0',hs:'old',top:'#8d6e63',bot:'#5d5a57',x:'glasses'},
  gma:{k:'old',skin:'#f3d0b1',hair:'#d8d3cf',hs:'bun',top:'#b39ddb',bot:'#6d6a8a'},
  mom:{k:'adult',skin:'#f6d3b5',hair:'#5a3a2a',hs:'bob',top:'#ff9db0',bot:'#58607a',x:'apron'},
  dad:{k:'adult',skin:'#efc6a2',hair:'#2b2320',hs:'short',top:'#6fb3a8',bot:'#3d4660'},
  sis:{k:'teen',skin:'#f8d6b8',hair:'#3a2a22',hs:'pony',top:'#3f51b5',bot:'#2c3570',x:'ribbon'},
  kid:{k:'child',skin:'#fbd9bd',hair:'#3a2a22',hs:'kid',top:'#ffca28',bot:'#4c8fe0'},
  taku:{k:'teen',skin:'#e8b892',hair:'#1b1714',hs:'spiky',top:'#1e88e5',bot:'#1e88e5',x:'num'},
  sakura:{k:'teen',skin:'#f8d6b8',hair:'#4a2c22',hs:'long',top:'#33496e',bot:'#33496e',x:'ribbon'},
  kento:{k:'teen',skin:'#f2cba9',hair:'#2a2420',hs:'short',top:'#9ccc65',bot:'#3d4660',x:'glasses'},
  boy:{k:'child',skin:'#f2c49c',hair:'#2a2420',hs:'kid',top:'#ff7043',bot:'#ff7043'},
  rider:{k:'adult',skin:'#efc6a2',hair:'#222',hs:'short',top:'#37474f',bot:'#263238',x:'helmet'},
  driver:{k:'adult',skin:'#f6d3b5',hair:'#6b4a3a',hs:'bob',top:'#ffb74d',bot:'#5d6475'},
  salary:{k:'adult',skin:'#efc6a2',hair:'#2b2320',hs:'short',top:'#455a64',bot:'#37474f',x:'tie'},
  officew:{k:'adult',skin:'#f6d3b5',hair:'#3a2a22',hs:'long',top:'#90a4ae',bot:'#455a64'},
  oldman:{k:'old',skin:'#efc8a5',hair:'#cfcac4',hs:'bald',top:'#a1887f',bot:'#6d5d55'},
  teacher:{k:'adult',skin:'#efc6a2',hair:'#4a3a30',hs:'short',top:'#f5f5f5',bot:'#5d6475',x:'tie'},
  medic:{k:'adult',skin:'#efc6a2',hair:'#2b2320',hs:'short',top:'#c7d0d8',bot:'#c7d0d8',x:'medic'},
  doctor:{k:'adult',skin:'#f6d3b5',hair:'#3a2a22',hs:'bob',top:'#ffffff',bot:'#7fb7e6',x:'vest'},
  surfer:{k:'adult',skin:'#d9a27a',hair:'#3a2a22',hs:'spiky',top:'#26a69a',bot:'#26a69a'},
  neighbor:{k:'old',skin:'#efc8a5',hair:'#9e9a95',hs:'short',top:'#795548',bot:'#4e4a47',x:'cap'},
  fire:{k:'adult',skin:'#efc6a2',hair:'#2b2320',hs:'short',top:'#2b3a4a',bot:'#2b3a4a',x:'fire'}
};
const DIM = { old:{leg:30,body:38,head:14,arm:30}, adult:{leg:36,body:40,head:14,arm:34}, teen:{leg:36,body:38,head:14.5,arm:33}, child:{leg:18,body:24,head:13,arm:20} };
function fig(L){
  const d=DIM[L.k]; const top=-(d.leg+d.body); const hy=top-d.head+3; const w=L.k==='child'?20:26;
  let s='<g class="bd"><g class="bob">';
  // 影
  s+=`<ellipse cx="0" cy="1" rx="${w*.7}" ry="3" fill="#0002"/>`;
  // 脚
  s+=`<rect x="${-w/2+3}" y="${-d.leg}" width="${w/2-4}" height="${d.leg}" rx="3" fill="${L.bot}"/><rect x="1" y="${-d.leg}" width="${w/2-4}" height="${d.leg}" rx="3" fill="${L.bot}"/>`;
  s+=`<rect x="${-w/2+2}" y="-4" width="${w/2-2}" height="5" rx="2" fill="#4a3f3a"/><rect x="0" y="-4" width="${w/2-2}" height="5" rx="2" fill="#4a3f3a"/>`;
  // 腕（後ろ）
  const armC = (L.x==='medic'||L.x==='fire')?L.top:L.top;
  s+=`<g class="arm l"><rect x="${-w/2-6}" y="${top+3}" width="7" height="${d.arm}" rx="3.5" fill="${armC}"/><circle cx="${-w/2-2.5}" cy="${top+3+d.arm}" r="3.6" fill="${L.skin}"/></g>`;
  s+=`<g class="arm r"><rect x="${w/2-1}" y="${top+3}" width="7" height="${d.arm}" rx="3.5" fill="${armC}"/><circle cx="${w/2+2.5}" cy="${top+3+d.arm}" r="3.6" fill="${L.skin}"/></g>`;
  // 胴体
  s+=`<rect x="${-w/2}" y="${top}" width="${w}" height="${d.body+4}" rx="${w*.35}" fill="${L.top}"/>`;
  if(L.x==='apron') s+=`<rect x="${-w/2+4}" y="${top+10}" width="${w-8}" height="${d.body-4}" rx="4" fill="#fff6e8"/>`;
  if(L.x==='tie') s+=`<path d="M0 ${top+2} l-3 4 l3 16 l3 -16 z" fill="#d84343"/>`;
  if(L.x==='uni') s+=`<text x="0" y="${top+24}" font-size="13" font-weight="800" fill="#1f3a6b" text-anchor="middle">1</text><rect x="${-w/2}" y="${top+d.body-4}" width="${w}" height="4" fill="#1f3a6b"/>`;
  if(L.x==='num') s+=`<text x="0" y="${top+24}" font-size="13" font-weight="800" fill="#fff" text-anchor="middle">7</text>`;
  if(L.x==='medic') s+=`<rect x="${-w/2}" y="${top+16}" width="${w}" height="4" fill="#ff8f00"/><rect x="${-w/2}" y="${top+26}" width="${w}" height="3" fill="#ff8f00"/>`;
  if(L.x==='vest') s+=`<rect x="${-w/2+2}" y="${top+4}" width="${w-4}" height="${d.body-6}" rx="5" fill="#ff7a59" opacity=".85"/><text x="0" y="${top+22}" font-size="7" font-weight="800" fill="#fff" text-anchor="middle">医療</text>`;
  if(L.x==='fire') s+=`<rect x="${-w/2}" y="${top+20}" width="${w}" height="4" fill="#ffd54f"/>`;
  if(L.x==='happi') s+=`<path d="M${-w/2+2} ${top+2} L0 ${top+16} L${w/2-2} ${top+2}" stroke="#fff" stroke-width="3" fill="none"/><rect x="${-w/2}" y="${top+d.body-6}" width="${w}" height="4" fill="#e53935"/><text x="0" y="${top+29}" font-size="7" font-weight="800" fill="#fff" text-anchor="middle">消防</text>`;
  if(L.x==='work') s+=`<rect x="${-w/2+3}" y="${top+6}" width="8" height="6" rx="1" fill="#ffffff55"/><rect x="${-w/2}" y="${top+d.body-4}" width="${w}" height="3" fill="#ffffff44"/>`;
  if(L.x==='cardigan') s+=`<rect x="-3" y="${top+2}" width="6" height="${d.body}" fill="#ffffff66"/>`;
  // 頭
  s+=`<rect x="-4" y="${top-5}" width="8" height="7" fill="${L.skin}"/>`;
  s+=hairBack(L,hy,d.head);
  s+=`<circle cx="0" cy="${hy}" r="${d.head}" fill="${L.skin}"/>`;
  s+=`<circle class="tint" cx="0" cy="${hy}" r="${d.head}"/>`;
  s+=`<ellipse cx="-8" cy="${hy+5}" rx="3" ry="2" fill="#ff9a8a" opacity=".45"/><ellipse cx="8" cy="${hy+5}" rx="3" ry="2" fill="#ff9a8a" opacity=".45"/>`;
  s+=faces(hy);
  s+=hairFront(L,hy,d.head);
  if(L.x==='glasses') s+=`<g fill="none" stroke="#5a4a40" stroke-width="1.3"><circle cx="-5.5" cy="${hy+1}" r="4"/><circle cx="5.5" cy="${hy+1}" r="4"/><path d="M-1.5 ${hy+1} h3"/></g>`;
  if(L.x==='helmet') s+=`<path d="M${-d.head-2} ${hy+2} a${d.head+2} ${d.head+3} 0 0 1 ${2*d.head+4} 0 z" fill="#263238"/><rect x="${-d.head+1}" y="${hy-3}" width="${2*d.head-2}" height="5" rx="2" fill="#90a4ae" opacity=".7"/>`;
  if(L.x==='medic') s+=`<path d="M${-d.head-1} ${hy-2} a${d.head+1} ${d.head+1} 0 0 1 ${2*d.head+2} 0 z" fill="#eceff1"/><rect x="-3" y="${hy-12}" width="6" height="3" fill="#ff8f00"/>`;
  if(L.x==='fire') s+=`<path d="M${-d.head-2} ${hy-1} a${d.head+2} ${d.head+2} 0 0 1 ${2*d.head+4} 0 l3 3 h${-2*d.head-10} z" fill="#c0c7cf"/>`;
  if(L.x==='uni') s+=`<path d="M${-d.head} ${hy-3} a${d.head} ${d.head-1} 0 0 1 ${2*d.head} 0 h7 v2 h${-2*d.head-7} z" fill="#1f3a6b"/><text x="0" y="${hy-6}" font-size="6" font-weight="800" fill="#fff" text-anchor="middle">K</text>`;
  if(L.x==='happi'||L.x==='work') s+=`<path d="M${-d.head} ${hy-3} a${d.head} ${d.head-1} 0 0 1 ${2*d.head} 0 h6 v2 h${-2*d.head-6} z" fill="${L.x==='happi'?'#26364a':'#5b6e63'}"/>`;
  if(L.x==='cap') s+=`<path d="M${-d.head} ${hy-3} a${d.head} ${d.head-1} 0 0 1 ${2*d.head} 0 h6 v2 h${-2*d.head-6} z" fill="#3e6b4f"/>`;
  if(L.x==='ribbon') s+=`<path d="M-4 ${top+1} l4 4 l4 -4 l-1 6 h-6 z" fill="#e53935"/>`;
  s+='</g></g>';
  return s;
}
function hairBack(L,hy,r){
  if(L.hs==='long') return `<path d="M${-r-2} ${hy} q0 ${r*2.2} ${r*.6} ${r*2} h${r*2.8} q${r*.6} 0 ${r*.6} ${-r*2} z" fill="${L.hair}"/>`;
  if(L.hs==='pony') return `<path d="M${r-2} ${hy-4} q${r} 4 ${r*.5} ${r*1.8} q-4 -6 -6 -12z" fill="${L.hair}"/>`;
  if(L.hs==='bun') return `<circle cx="0" cy="${hy-r-2}" r="${r*.45}" fill="${L.hair}"/>`;
  return '';
}
function hairFront(L,hy,r){
  const c=L.hair;
  switch(L.hs){
    case 'short': return `<path d="M${-r} ${hy-1} a${r} ${r} 0 0 1 ${2*r} 0 q-4 -5 -9 -4 q-5 -3 -10 2 q-3 -2 ${-r+19} 2 z" fill="${c}"/>`;
    case 'spiky': return `<path d="M${-r} ${hy} l2 -9 l4 3 l3 -8 l4 6 l4 -7 l3 7 l4 -3 l1 11 q-6 -6 -12 -5 q-7 -1 -13 5z" fill="${c}"/>`;
    case 'old': return `<path d="M${-r} ${hy+2} q-1 -10 6 -13 q0 4 -3 9 z M${r} ${hy+2} q1 -10 -6 -13 q0 4 3 9 z" fill="${c}"/>`;
    case 'bald': return `<path d="M${-r} ${hy+3} q-1 -7 4 -9 q0 4 -2 9z M${r} ${hy+3} q1 -7 -4 -9 q0 4 2 9z" fill="${c}"/>`;
    case 'bun': case 'bob': return `<path d="M${-r-1} ${hy+5} a${r+1} ${r+2} 0 0 1 ${2*r+2} 0 q-3 -10 -12 -9 q-6 -1 -10 4 q-3 2 -2 5z" fill="${c}"/>`;
    case 'long': return `<path d="M${-r-1} ${hy+4} a${r+1} ${r+2} 0 0 1 ${2*r+2} 0 q-4 -9 -13 -8 q-5 0 -8 3z" fill="${c}"/>`;
    case 'pony': return `<path d="M${-r} ${hy+2} a${r} ${r+1} 0 0 1 ${2*r} 0 q-4 -8 -12 -7 q-5 0 -8 4z" fill="${c}"/>`;
    case 'kid': return `<path d="M${-r} ${hy} a${r} ${r} 0 0 1 ${2*r} 0 q-6 -3 -12 -1 q-4 -2 -8 2z" fill="${c}"/>`;
  }
  return '';
}
function faces(y){
  const k='#3a2a22';
  return `<g class="fc normal"><circle cx="-5" cy="${y+1}" r="1.9" fill="${k}"/><circle cx="5" cy="${y+1}" r="1.9" fill="${k}"/><path d="M-3 ${y+7} q3 2 6 0" stroke="${k}" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>
  <g class="fc smile"><path d="M-7 ${y+2} q2 -3 4 0 M3 ${y+2} q2 -3 4 0" stroke="${k}" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M-4 ${y+6} q4 5 8 0 z" fill="#c9504a"/></g>
  <g class="fc pain"><path d="M-7 ${y-1} l4 2 l-4 2 M7 ${y-1} l-4 2 l4 2" stroke="${k}" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M-4 ${y+8} q1 -2 2 0 q1 2 2 0 q1 -2 2 0 q1 2 2 0" stroke="${k}" stroke-width="1.3" fill="none"/><path d="M10 ${y-8} q3 4 0 6 q-3 -2 0 -6z" fill="#7fc4ff"/></g>
  <g class="fc weak"><path d="M-7 ${y+1} h4 M3 ${y+1} h4" stroke="${k}" stroke-width="1.6" stroke-linecap="round"/><path d="M-3 ${y+8} h6" stroke="${k}" stroke-width="1.3" stroke-linecap="round"/></g>
  <g class="fc closed"><path d="M-7 ${y} q2 2 4 0 M3 ${y} q2 2 4 0" stroke="${k}" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M-2 ${y+8} h4" stroke="${k}" stroke-width="1.2" stroke-linecap="round"/></g>
  <g class="fc shock"><circle cx="-5" cy="${y}" r="3" fill="#fff" stroke="${k}" stroke-width="1"/><circle cx="5" cy="${y}" r="3" fill="#fff" stroke="${k}" stroke-width="1"/><circle cx="-5" cy="${y}" r="1.3" fill="${k}"/><circle cx="5" cy="${y}" r="1.3" fill="${k}"/><ellipse cx="0" cy="${y+8}" rx="2.6" ry="3.2" fill="#7a2f2a"/></g>
  <g class="fc droop"><circle cx="-5" cy="${y+1}" r="1.9" fill="${k}"/><path d="M3 ${y+1} h4" stroke="${k}" stroke-width="1.6" stroke-linecap="round"/><path d="M-5 ${y+9} q4 -1 9 -3" stroke="${k}" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>
  <g class="fc cry"><path d="M-7 ${y} q2 2 4 0 M3 ${y} q2 2 4 0" stroke="${k}" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M-5 ${y+2} v6 M5 ${y+2} v6" stroke="#7fc4ff" stroke-width="2" stroke-linecap="round"/><path d="M-3 ${y+9} q3 -3 6 0" stroke="${k}" stroke-width="1.3" fill="none"/></g>`;
}
function emoteSvg(e,y){
  const bub=(c,inner)=>`<g class="emote"><path d="M-11 ${y-24} h22 a5 5 0 0 1 5 5 v10 a5 5 0 0 1 -5 5 h-7 l-4 5 l-4 -5 h-7 a5 5 0 0 1 -5 -5 v-10 a5 5 0 0 1 5 -5z" fill="#fff" stroke="${c}" stroke-width="2"/>${inner}</g>`;
  switch(e){
    case '!': return bub('#ff6b5b',`<text x="0" y="${y-9}" font-size="15" font-weight="800" fill="#ff6b5b" text-anchor="middle">！</text>`);
    case '?': return bub('#4c8fe0',`<text x="0" y="${y-9}" font-size="14" font-weight="800" fill="#4c8fe0" text-anchor="middle">？</text>`);
    case '…': return bub('#8a807a',`<text x="0" y="${y-11}" font-size="12" font-weight="800" fill="#8a807a" text-anchor="middle">…</text>`);
    case 'heart': return bub('#ff7aa0',`<path d="M0 ${y-9} l-5 -5 a3 3 0 0 1 5 -4 a3 3 0 0 1 5 4z" fill="#ff7aa0"/>`);
    case 'note': return bub('#25b0a0',`<text x="0" y="${y-9}" font-size="13" fill="#25b0a0" text-anchor="middle">♪</text>`);
    case 'zz': return bub('#8a807a',`<text x="0" y="${y-9}" font-size="11" font-weight="800" fill="#8a807a" text-anchor="middle">zz</text>`);
    case 'cough': return bub('#ffa94d',`<text x="0" y="${y-10}" font-size="9" font-weight="800" fill="#e0892a" text-anchor="middle">ゴホッ</text>`);
  }
  return '';
}

