/* ---------- 起動 ---------- */
const ORD={nanami:1,surfer:2,teacher:3,luis:4,luis2:5,fire:6,keiko:7,sumiko:8,genichi:9,epi:10};
STORIES.sort((a,b)=>(ORD[a.id]||99)-(ORD[b.id]||99));
$('titleLead').innerHTML=fmt(TITLE_LEAD.replace(/<br>/g,'\n')).replace(/\n/g,'<br>');
$('titleDisc').innerHTML=fmt(DISC_TITLE);
applySet(); renderSettings(); setSound(SOUND); renderMenu();
