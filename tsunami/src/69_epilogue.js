/* =========================================================
   エピローグ「その夜」：8人の物語をすべて終えると開く
   それぞれの物語の最新の結果（XREC）で、誰が生き延びたかが変わる
   ========================================================= */
const ALL_IDS=['nanami','surfer','luis','luis2','teacher','fire','keiko','sumiko','genichi'];
const alive=id=>X(id,'alive')===1;
const everyone=()=>ALL_IDS.every(alive)&&X('surfer','girl')&&X('surfer','dad')&&(X('fire','school')||X('teacher','allSchool'))&&X('fire','grandma')&&X('luis','grandma')&&X('keiko','neighbor')&&X('sumiko','helped')&&X('genichi','accept')&&X('teacher','allSchool');
STORIES.push({
  id:'epi', area:'epi', ready:false, readyFn:()=>ALL_IDS.every(id=>X(id,'done')), who:'エピローグ', me:'', title:'その夜', place:'四万十・幡多', stars:0, scene:'hill', bgm:'night',
  blurb:'8人の物語を、すべて終えると開きます。あなたが選んだことで、その夜の姿が変わります。', xs:[],
  cast:{
    nanami:{name:'七海',look:'nanami',x:120,thumb:true,tx:120},daichi:{name:'大地',look:'daichi',x:200,thumb:true,tx:180},
    luis:{name:'ルイス',look:'luis',x:300,thumb:true,tx:240},okamura:{name:'岡村先生',look:'okamura',x:220,show:false},hamada:{name:'浜田さん',look:'hamada',x:120,show:false},
    keiko:{name:'恵子',look:'keiko',x:150,show:false},shota:{name:'翔太',look:'shota',x:200,show:false},sumiko:{name:'すみ子',look:'sumiko',x:260,show:false},masao:{name:'正男',look:'masao',x:310,show:false},
    genichi:{name:'源一',look:'genichi',x:320,show:false,thumb:true,tx:300},hina:{name:'陽菜',look:'hina',x:300,show:false},kid1:{name:'子ども',look:'kid1',x:340,show:false}
  },
  start:'irino',
  nodes:{
    irino:{lines:S=>[
      {bg:'hill'},{d:'その夜'},{t:'20:00'},{mode:'night'},{bgm:'night'},{a:'luis',show:false},{a:'genichi',show:false},{a:'nanami',show:alive('nanami'),x:150,p:'sit'},{a:'daichi',show:alive('surfer'),x:230,p:'sit'},
      'その夜。','入野の高台の避難所。地区の人たちが、炊き出しのおにぎりを配っている。',
      alive('nanami')&&alive('surfer')?(X('surfer','girl')?'nanami|「お兄ちゃん、おにぎり、半分こしよ」':'七海と大地は、同じ避難所にいた。まだ、お互いのことを知らない。'):'',
      alive('nanami')?'':'七海の姿は、そこにはなかった。',
      alive('surfer')?'':'大地の姿は、そこにはなかった。',
      X('surfer','dad')&&alive('surfer')?'daichi|「……あんたのお父さん、海を撮りよったがで。腕、引っぱったがよ」':''],
      go:'shimoda'},
    shimoda:{lines:S=>[
      {bg:'gym'},{a:'nanami',show:false},{a:'daichi',show:false},{a:'okamura',show:alive('teacher'),x:200,p:'stand'},{a:'luis',show:alive('luis')&&alive('luis2'),x:300,p:'sit'},{a:'hamada',show:alive('fire'),x:110,p:'sit'},{a:'hina',show:alive('teacher'),x:250,p:'sit'},
      '下田。旧下田中学校の体育館。',
      alive('teacher')?(X('teacher','allSchool')?'下田小学校の子どもたちは、全員、ここにいる。':'下田小学校の子どもたちも、ここにいる。'):'岡村先生の姿は、そこにはなかった。',
      alive('fire')?(X('fire','school')?'hamada|「先生。あの時、校庭の子らが動いてくれて、よかった」':'浜田さんは、体育館のすみで、無線を握りしめている。'):'浜田さんの姿は、そこにはなかった。',
      alive('luis')?(X('fire','grandma')&&X('luis','grandma')?'hamada|「にいちゃん。坂で、ばあちゃんを背負うてくれて、ありがとうな」':''):'ルイスの姿は、そこにはなかった。',
      alive('luis')&&alive('luis2')?(X('luis2','fever')?'ルイスの隣で、熱の下がった子どもが、すうすう眠っている。':'ルイスは、アナと並んで、毛布にくるまっている。'):'',
      alive('luis')&&X('teacher','talk')==='easy'?'okamura|「ルイスさん。また、明日」':''],
      go:'nakamura'},
    nakamura:{lines:S=>[
      {bg:'ward'},{v:{dark:true}},{a:'okamura',show:false},{a:'luis',show:false},{a:'hamada',show:false},{a:'hina',show:false},
      {a:'genichi',show:alive('genichi'),x:110,y:200,p:'sit'},{a:'sumiko',show:alive('sumiko'),x:250},
      '中村。市民病院の、上の階の廊下。',
      alive('genichi')?(X('genichi','accept')?'genichi|「あの時、手を貸してくれたおばあさんは、どうしよるろうか」':'源一は、廊下のマットの上で、窓の外を見ている。'):'源一の姿は、そこにはなかった。',
      {bg:'gym'},{a:'genichi',show:false},{a:'sumiko',show:alive('sumiko'),x:250,p:'sit'},{a:'masao',show:alive('sumiko')&&X('keiko','neighbor')===1,x:300,p:'sit'},{a:'keiko',show:alive('keiko'),x:150,p:'sit'},{a:'shota',show:alive('keiko')&&X('keiko','neighbor')===1,x:200,p:'sit'},
      '古津賀の人たちが集まる避難所。',
      X('keiko','neighbor')===1?'shota|「正男さん、足、痛うない？」':'',
      X('keiko','neighbor')===1&&alive('sumiko')?'すみ子と正男は、恵子と翔太の隣に、毛布を並べていた。':'',
      !alive('keiko')?'恵子の姿は、そこにはなかった。':'',
      !alive('sumiko')?'すみ子の姿は、そこにはなかった。':''],
      go:S=>everyone()?'all':'end'},
    all:{lines:[
      {bg:'hill'},{fx:'calm'},{mode:'night'},{bgm:'hope'},
      {a:'nanami',show:true,x:60,p:'stand'},{a:'daichi',show:true,x:105},{a:'okamura',show:true,x:150},{a:'luis',show:true,x:195},{a:'hamada',show:true,x:240},{a:'keiko',show:true,x:285},{a:'sumiko',show:true,x:325},{a:'genichi',show:true,x:365,y:215,p:'sit'},
      'その夜、8人は、別々の場所にいた。','でも、8人とも、生きていた。',
      '一人ひとりが、自分の命を守るために走った。','そして、走りながら、誰かに声をかけた。誰かの手を引いた。誰かの助けを受け入れた。',
      'その一つひとつが、別の誰かの物語に、つながっていた。',
      'この美しいまちに住む、あなたへ。','あの{日|ひ}の8人のように。'],go:'ask'},
    end:{lines:[
      {bg:'hill'},{fx:'calm'},{mode:'night'},
      'その夜、この町の、どこかで。','帰らなかった人がいる。','一人ひとりの選択が、別の誰かの物語に、つながっていた。',
      {sys:'8人全員が生き延び、物語どうしが手を取り合う結末があります。それぞれの物語を、もう一度遊んでみてください。'}],go:'ask'},
    ask:{lines:[{mode:''},'この美しいまちに住む、あなたへ。'],
      q:'明日から、あなたは何をしますか？',fixed:true,
      choices:[
        {t:'家族と「地震の時、どこで会うか」を決める',g:'best',sc:1,res:['家族と、話してみよう。'],next:'END',why:'家族で集合場所を決めておくことが、てんでんこの第一歩です。'},
        {t:'家や職場から、一番近い高台まで、実際に歩いてみる',g:'best',sc:1,res:['今度の休みに、歩いてみよう。'],next:'END',why:'避難路は、実際に歩いてみると、坂の急さや、ふさがりそうな場所が分かります。'},
        {t:'近所のお年寄りや、一人で逃げられない人に、「その時は声をかけるね」と言っておく',g:'best',sc:1,res:['明日、声をかけてみよう。'],next:'END',why:'大きな災害の直後、救助隊はすぐには来られません。近所の人の一声が、命を救います。'},
        {t:'お薬手帳や薬の袋を、スマートフォンで撮っておく',g:'best',sc:1,res:['今夜、撮っておこう。'],next:'END',why:'避難所で、持病の薬を出してもらう時の大きな手がかりになります。'}
      ]}
  },
  outcome(S){
    const ok=everyone();
    return {title:ok?'あの{日|ひ}の8人のように':'その夜',mood:ok?'good':'mid',sum:ok?'8人全員が生き延び、物語どうしが手を取り合った。':'帰らなかった人がいる。もう一度、それぞれの物語を遊んでみてください。',lines:[]};
  },
  lessons:[
    {h:'8人の物語に込めた教訓',ul:['揺れたら、すぐに高い所へ（北海道南西沖地震・東日本大震災）','逃げながら、周りに知らせる（安政南海地震「稲むらの火」）','家族とは、前もって会う場所を決めておく（津波てんでんこ）','車で逃げない。物を取りに戻らない。第一波の後も戻らない（東日本大震災）','想定にとらわれない（東日本大震災）','役目のある人も、退避の時刻を守る（東日本大震災の消防団員の犠牲）','近所で助け合う。挟まれていた時間を伝える。ブレーカーを落とす（阪神・淡路大震災）','大きな揺れの後に、さらに大きな揺れ。車中泊と関連死に注意（熊本地震）','避難所のトイレ、孤立、高齢化（能登半島地震）','中村の町は、揺れと火事でつぶれた（昭和南海地震）','避難所では、誰もが安心できる配慮を（女性・性的少数者・外国から来た人）']}
  ],
  debrief:[
    {h:'8人の物語',p:'この物語に出てくる人物と出来事は架空です。でも、一つひとつの選択は、過去の災害で、実際に誰かが迫られたものです。'}
  ],
  talk:['8人の中で、あなたに一番近いのは誰でしたか。','あなたの家族や地域では、明日から何ができるでしょう。']
});
