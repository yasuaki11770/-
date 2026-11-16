/* =========================================================
   全体の設定：舞台、断り書き、出典、作者メッセージ
   ========================================================= */
const STORIES=[];
const AREAS=[
  {id:'irino',name:'入野の浜（黒潮町）',sub:'津波が一番早く来る'},
  {id:'shimoda',name:'下田（四万十川の河口）',sub:'約18分で津波。言葉と役目'},
  {id:'nakamura',name:'中村・具同・古津賀',sub:'その場は安全。でも家族は低い所に'},
  {id:'epi',name:'エピローグ',sub:'8人の物語を、すべて終えると開く'}
];
const TITLE_LEAD='四万十川が海に出会う、この美しいまちで。<br>その日、大地が三分間ゆれ続けたら。<br>あなたは、生き延びる判断ができるだろうか。';
const DISC_TITLE='この物語に出てくる人物と出来事は架空です。場所は実在しますが、学校・病院・お店・消防団の実際の避難計画や対応とは関係ありません。津波の時間と高さは、高知県・四万十市・黒潮町の公表資料（2025年度の想定など）をもとにしています。想定は目安です。実際の地震では、想定より早く、高い津波が来ることもあります。';
const DISC_MENU='物語はどれからでも始められます。物語どうしは、ところどころで交わっています。ほかの人の物語で選んだことが、別の物語に響くことがあります。四万十市立市民病院の物語は、建物の構造・避難計画・職員の動きが架空で、実際の避難計画とは関係ありません。';
const DISC_DEB='手当ての内容は、一般の人向けに簡単にしています。実際には、119番の指令員や医療者の指示に従ってください。救命講習（消防署など）を一度受けておくことをおすすめします。';
const SRC_NOTE='史実の数字は、確認できたものだけを使っています。資料によって数字が違う場合は、そのことを書いています。';
/* 作者からのメッセージ（あとから自由に書きかえてください） */
const AUTHOR_MSG=`（ここに、作者からのメッセージが入ります）

四万十市のみなさんへ。

この画面の文章は、あとから書きかえられるようにしてあります。`;

const SOURCES=[
  {h:'津波の想定・避難場所',items:[
    ['高知県「令和7年度［高知県版］南海トラフ地震による最大クラスの震度分布・津波浸水予測」','https://www.pref.kochi.lg.jp/doc/2025100100137/'],
    ['四万十市「津波避難マップ」（平野地区・下田地区など）','https://www.city.shimanto.lg.jp/soshiki/2/1435.html'],
    ['四万十市「指定緊急避難場所・指定避難所一覧」（2026年8月20日更新）','https://www.city.shimanto.lg.jp/soshiki/2/27435.html'],
    ['四万十市「防災情報伝達手段」（防災行政無線の聞き返し 0880-34-7800）','https://www.city.shimanto.lg.jp/soshiki/2/1465.html'],
    ['黒潮町「南海トラフ地震・津波防災計画の基本的な考え方」','https://www.town.kuroshio.lg.jp/img/files/pv/sosiki/2023/05/jisintunamibousaikeikaku_kangaekata0.pdf']]},
  {h:'過去の災害の教訓',items:[
    ['石橋克彦「1946年昭和南海地震」（『南海トラフ巨大地震―歴史・科学・社会』岩波書店、2014）','https://plaza.umin.ac.jp/GHDNet/circle/14/y9051.pdf'],
    ['内閣府 平成26年版防災白書「大規模広域災害時の自助・共助の例」','https://www.bousai.go.jp/kaigirep/hakusho/h26/honbun/0b_2s_01_00.html'],
    ['総務省消防庁「大規模災害時における消防団活動のあり方等に関する検討会」報告書（2012年）','https://www.fdma.go.jp/pressrelease/houdou/items/h24/2408/240830_1houdou/01_houkokusyo.pdf'],
    ['地震調査研究推進本部「北海道南西沖の地震活動」','https://jishin.go.jp/regional_seismicity/rs_kaiko/k14_hokkaidonanseioki'],
    ['内閣府「熊本地震の被害の状況」（2019年）','https://www.bousai.go.jp/taisaku/kyuujo/pdf/r01kaigi/siryo8.pdf']]}
];

/* ---------- 複数の物語で使う人物 ---------- */
LOOK.nanami={k:'child',skin:'#fbd9bd',hair:'#5a3a2a',hs:'pony',top:'#7ec8e3',bot:'#f48fb1'};
LOOK.daichi={k:'adult',skin:'#d9a27a',hair:'#3a2a22',hs:'spiky',top:'#26a69a',bot:'#26a69a'};
LOOK.keiko={k:'adult',skin:'#f6d3b5',hair:'#5a3a2a',hs:'bob',top:'#ce93d8',bot:'#58607a'};
LOOK.sumiko={k:'old',skin:'#f3d0b1',hair:'#d8d3cf',hs:'bun',top:'#9fa8da',bot:'#6d6a8a',x:'cardigan'};
LOOK.genichi={k:'old',skin:'#efc8a5',hair:'#d9d6d0',hs:'old',top:'#bcd6e6',bot:'#bcd6e6'};
