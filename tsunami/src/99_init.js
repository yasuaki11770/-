/* ---------- 起動 ---------- */
const ORD={nanami:1,surfer:2,teacher:3,luis:4,fire:5,keiko:6,sumiko:7,genichi:8};
STORIES.sort((a,b)=>(ORD[a.id]||99)-(ORD[b.id]||99));
$('titleLead').innerHTML=fmt(TITLE_LEAD.replace(/<br>/g,'\n')).replace(/\n/g,'<br>');
$('titleDisc').innerHTML=fmt(DISC_TITLE);
applySet(); renderSettings(); setSound(SOUND); renderMenu();
