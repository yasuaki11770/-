/* 三国決戦伝（一騎打ち）から流用: 武将のセリフ・掛け合い・方言 */
const LN={
 open:{lubu:['Among men, Lu Bu. Among horses, Red Hare.','人中に呂布あり、馬中に赤兎あり','mei'],guan:['I am Guan Yu. Let us begin.','我は関羽。いざ、参ろう。'],zhangf:['Come on! I will crush you!','来い! 叩き潰してやる!'],zhaoy:['Zhao Yun of Changshan. Ready!','常山の趙子龍、参る!'],mac:['My spear is faster than thunder.','我が槍は雷より速い。'],dianw:['Not one step further!','一歩も通さん!'],xuc:['Hah! I will break you in half!','ははっ! 真っ二つにしてやる!'],tsc:['You will not escape my blade.','我が刃からは逃れられぬ。'],suns:['I am Sun Ce. Fight me!','我は孫伯符。勝負だ!'],zhangl:['Run away, or fight me now!','逃げるか、今ここで戦うか!'],xhd:['I never fear any enemy!','敵など恐れぬ!'],gann:['Hear the bell? Your end is near.','鈴が聞こえるか? 最期が近いぞ。'],huangz:['I may be old, but I never miss.','年寄りだが、外しはせん。'],weiy:['I follow no one. Watch me!','誰にも従わん。見ていろ!'],jiangw:['I will carry on his dream.','あの方の夢を継ぐ。'],liub:['I do not want to fight. But I will.','戦いたくはない。だが、やる。'],caoc:['Heaven is on my side.','天は我に味方する。'],zhouy:['Fire and music... I like both.','炎と音楽、どちらも好きだ。'],zhugel:['I read your moves a week ago.','君の動きは一週間前に読んだ。']},
 atk:[['Here I come!','行くぞ!'],['Take this!','これを食らえ!'],['Too slow!','遅い!'],['Watch out!','気をつけろ!'],['Hah!','ハッ!'],['Do not move!','動くな!'],['I will win!','私が勝つ!']],
 hurt:[['Ugh!','ぐっ!'],['Not bad.','やるな。'],['It hurts!','痛いぞ!'],['Again!','もう一度!']],
 big:[['Impossible!','馬鹿な!'],['Aaargh!','ぐああっ!'],['I... am not done!','まだ…終わらん!'],['What power!','なんという力!']],
 parry:[['I see it!','見えている!'],['Too easy!','甘い!'],['Is that all?','それだけか?'],['Nice try.','惜しかったな。']],
 dodge:[['Missed me!','外れだ!'],['Too slow!','遅いぞ!'],['I read you.','読んでいた。'],['Behind you!','後ろだ!']],
 sp:[['This is my power!','これが我が力だ!'],['Feel my spirit!','我が魂を受けろ!'],['The end!','終わりだ!'],['Now, I show you!','見せてやろう!']],
 rev:[['Now it is my turn!','今度はこちらの番だ!'],['I am not finished!','まだ終わらん!'],['Turn the tide!','流れを変える!']],
 low:[['I cannot lose here...','ここで負けられぬ…'],['Just a little more...','あと少し…']],
 win:[['I won!','勝ったぞ!'],['A good fight.','良い勝負だった。'],['Victory is mine!','勝利は我にあり!']],
 lose:[['I lost...','負けたか…'],['You are strong.','強いな。'],['Next time...','次こそは…']]
};
Object.assign(LN.open,{
 xuh:['My axe has never missed a target.','我が斧は的を外さぬ。'],zhangh:['Flexible tactics, sharp claws.','巧みに変じ、爪で裂く。'],pangd:['I brought my coffin. Come!','棺は持参した。来い!'],
 caor:['Not a step back. This is my wall.','一歩も退かぬ。ここが我が城壁。'],xhy:['Three days, five hundred miles. Fast!','三日五百里、速いぞ!'],sima:['Your plan was already in my notes.','君の策は私の覚書にある。'],
 yuej:['I always lead the charge.','先陣は常に私だ。'],guanp:['My father watches. I cannot lose.','父が見ている。負けられぬ。'],pangt:['A little fire will do.','小さな火で十分だ。'],
 sunj:['The Tiger of Jiangdong roars!','江東の虎、吠える!'],zhout:['Scars are my armor.','傷こそ我が鎧。'],lingt:['Watch my staff dance!','我が棍の舞を見よ!'],
 luxun:['Patience wins the war.','忍耐が戦を制す。'],lumeng:['I am not the man you remember.','昔の私とは違う。'],huanggai:['I will bear any pain.','どんな痛みも耐えてみせる。'],
 sunq:['The south is mine to protect.','江南は私が守る。'],gongsunz:['The White Horse Company, charge!','白馬義従、突撃!'],zhangx:['My spear pierces the north.','我が槍、北を貫く。'],
 matengg:['The west bows to no one.','西涼は誰にも屈せぬ。'],dongz:['Bow before the Chancellor!','相国に跪け!'],yanl:['Yan Liang of Hebei. Remember it.','河北の顔良。覚えておけ。']});
const PAIR={
 'guan|lubu':{guan:['I will not forget Hulao Gate.','虎牢関の借り、返させてもらう。'],lubu:['That beard... I will cut it off!','その髭、斬り落としてくれる!']},
 'lubu|zhangf':{zhangf:['Round two, you traitor!','裏切り者め、勝負だ!'],lubu:['Noisy dog! Come!','うるさい犬め、来い!']},
 'suns|tsc':{suns:['Did you keep my halberd?','俺の戟は返してもらうぞ!'],tsc:['Shenting again... I will win!','神亭の続きだ、今度は勝つ!']},
 'mac|xuc':{mac:['I remember that day!','あの日を覚えているぞ!'],xuc:['I fought you half-naked once!','裸で戦ったあの日の続きだ!']},
 'liub|caoc':{liub:['Your ambition ends here.','貴様の野望もここまでだ。'],caoc:['Heroes are you and me. Only two.','天下の英雄は君と私だけ。']},
 'caoc|guan':{caoc:['Stay with me, Guan Yu.','関羽よ、我が下へ来い。'],guan:['My heart is with my brother.','我が心は義兄と共にある。']},
 'zhouy|zhugel':{zhouy:['One mountain, two tigers? No.','一山に二虎は居られぬ。'],zhugel:['You are angry. That is your weakness.','怒りは君の弱みだ。']}
};
LN.sp=LN.sp.concat([['I give all I have!','全てを賭けて、斬る!'],['No more holding back!','もう手加減はせぬ!'],['Witness this!','刮目せよ!'],['This blade decides it!','この一太刀で決める!']]);
LN.win=LN.win.concat([['Remember this day.','この日を、忘れるな。'],['A worthy opponent.','良き好敵手だった。']]);
LN.lose=LN.lose.concat([['I am not done... someday.','いつか…必ず。'],['Well fought...','見事…だ…']]);
LN.fury=[['I am not finished!','まだ終わらぬ!'],['Come, I am ready.','さあ来い、覚悟は出来ている!'],['Burn, my spirit!','燃えろ、我が闘志!'],['This is my true strength!','ここからが、本当の戦だ!'],['I will not fall!','倒れるものか!']];
LN.taunt=[['Is that all you have?','その程度か?'],['Show me your resolve.','覚悟を見せてみろ。'],['Do not hesitate.','迷えば、斬られるぞ。'],['The ground is yours. Come.','間合いは譲ろう。来い。'],['I can wait all day.','いくらでも待とう。'],['Breathe. Then strike.','息を整えろ。それから来い。']];
const HL={
 lubu:{sp:[['Behold the strongest warrior!','天下無双、その目に焼き付けろ!']],fury:[['I am Lu Bu. I do not fall!','この呂布、膝など折らぬ!']],win:[['Heaven has no rival.','天に我が敵なし。']],lose:[['Impossible... for me...','この俺が…敗れるだと…!']],taunt:[['Is anyone worthy?','俺に挑む者は、まだいるか。']]},
 guan:{sp:[['Green Dragon, rise!','青龍よ、天を裂け!']],fury:[['My oath will not break.','義に誓った身、倒れはせぬ。']],win:[['Justice stands.','義は、ここにあり。']],lose:[['My brothers... forgive me.','兄者…すまぬ…']],taunt:[['Your blade is restless.','刃が迷っているぞ。']]},
 zhangf:{sp:[['Roar, Serpent Spear!','燕人張飛ここにあり!']],fury:[['Come on, I am not done!','まだだ! 終わらんぞ!']],win:[['Haha! Who is next?','はっはっは! 次は誰だ!']],lose:[['Brother... I tried.','兄者…俺は…']],taunt:[['Fight me like a man!','男なら正面から来い!']]},
 zhaoy:{sp:[['Seven in, seven out.','七たび突き、七たび抜ける。']],fury:[['I will protect them all.','この命、守るためにある。']],win:[['The dragon never falls.','龍は、墜ちぬ。']],lose:[['Forgive me, my lord...','殿…申し訳…']],taunt:[['Step closer if you dare.','踏み込めるものなら、来い。']]},
 mac:{sp:[['Thunder of the west!','西涼の雷、受けてみよ!']],fury:[['For the pride of Xiliang!','西涼の誇りにかけて!']],win:[['Brocade Ma Chao!','錦馬超の名、刻め!']],lose:[['I was too proud...','驕りか…無念…']],taunt:[['Faster than thunder.','雷より先に斬る。']]},
 dianw:{sp:[['Twin halberds, crush!','双戟よ、砕け散れ!']],fury:[['I will hold this gate!','この門、死んでも通さぬ!']],win:[['None passed.','誰一人、通さん。']],lose:[['My lord... run...','殿…お逃げ…を…']],taunt:[['Come, try the gate.','来い。この壁を越えてみろ。']]},
 xuc:{sp:[['Tiger fool smash!','虎痴の怒り、思い知れ!']],fury:[['I will not budge!','一歩も退かんぞ!']],win:[['Hahaha, easy.','ふはは、他愛もない。']],lose:[['I am out of strength...','力が…尽きたか…']],taunt:[['Call me a fool. I am strong.','愚直で結構。それが強さだ。']]},
 tsc:{sp:[['One arrow, one soul.','一矢、魂を射抜く!']],fury:[['A promise to keep.','約束は、果たす!']],win:[['I keep my word.','信義、果たした。']],lose:[['Shenting... again...','神亭の…続き…か…']],taunt:[['Do not blink.','瞬きするな。']]},
 suns:{sp:[['The Little Conqueror!','小覇王、ここに参る!']],fury:[['Sun Ce does not kneel!','孫策は膝をつかぬ!']],win:[['Jiangdong is mine.','江東は、俺のものだ。']],lose:[['Take care of them...','後を…頼む…']],taunt:[['Let us make history.','歴史を動かそうぜ。']]},
 zhangl:{sp:[['Eight hundred, charge!','八百の兵を以て、貴様を砕く!']],fury:[['Zhang Liao is here!','張遼ここにあり!']],win:[['Even children fear me.','泣く子も黙る張文遠!']],lose:[['My lord... forgive me.','殿…お許しを…']],taunt:[['Dare to come closer?','近づく勇気はあるか?']]},
 xhd:{sp:[['I will not waste this eye!','この目、無駄にはせぬ!']],fury:[['A gift from my parents!','親にもらった体、無駄にはせぬ!']],win:[['Heaven watched.','天も見ていたろう。']],lose:[['One eye... not enough...','隻眼では…及ばぬか…']],taunt:[['I fear nothing.','恐れなど、この目に宿らぬ。']]},
 gann:{sp:[['Hear the bells ring!','鈴の音が、貴様の最期だ!']],fury:[['Night raid spirit!','夜襲の気迫、見せてやる!']],win:[['The pirates win!','錦帆賊の名にかけて!']],lose:[['A good ride...','いい…旅路だった…']],taunt:[['The sea teaches fear.','海を知れば、恐れも知る。']]},
 huangz:{sp:[['One arrow, sure kill!','老いてなお、必中!']],fury:[['Old, but not done!','老骨に鞭打ち、まだ戦う!']],win:[['Call it experience.','老いではない、経験だ。']],lose:[['A fine end.','悪くない…最期だ…']],taunt:[['Do not mock my age.','年寄りと侮るな。']]},
 weiy:{sp:[['Rebel bones!','反骨の刃、受けよ!']],fury:[['No one rules me!','誰にも、俺は縛れん!']],win:[['See? This is me.','見たか、これが俺だ。']],lose:[['Even so... I rebel.','それでも…俺は…']],taunt:[['Order me. I dare you.','俺に命じてみろ。']]},
 jiangw:{sp:[['Kirin spear!','麒麟の槍、貫け!']],fury:[['His will lives in me!','丞相の志、我が身にあり!']],win:[['One more step forward.','また一歩、前へ。']],lose:[['Forgive me, Prime Minister...','丞相…申し訳…']],taunt:[['I have no road back.','退く道は、とうに捨てた。']]},
 liub:{sp:[['Benevolence, my blade!','仁の刃、受けよ!']],fury:[['For the people!','民のため、倒れられぬ!']],win:[['This is not victory. It is hope.','これは勝利ではない。希望だ。']],lose:[['My brothers...','関羽…張飛…']],taunt:[['I seek no fight. But...','争いは望まぬ。だが。']]},
 caoc:{sp:[['I rule this age!','乱世を統べる、この曹操!']],fury:[['I am not done with the world.','天下を取るまで、死ねぬ!']],win:[['Heaven is in my palm.','天下は我が掌中。']],lose:[['Fate mocks me.','運命め…笑うか…']],taunt:[['Impress me.','私を楽しませてみせろ。']]},
 zhouy:{sp:[['Flames and music!','炎よ、奏でよ!']],fury:[['The tune is not over.','曲は、まだ終わらぬ。']],win:[['A perfect melody.','見事な旋律だった。']],lose:[['Heaven... why Zhuge...','天よ…なぜ…']],taunt:[['You are out of tune.','音が乱れているな。']]},
 zhugel:{sp:[['The east wind is mine.','東風よ、我が意に従え。']],fury:[['All as expected.','すべて、計算のうちだ。']],win:[['As I read.','読み通りだ。']],lose:[['It is... the will of heaven...','天命…か…']],taunt:[['I have seen this move.','その手は、既に見た。']]},
 sima:{sp:[['The wolf turns its gaze.','狼顧の相、見せてやろう。']],fury:[['Patience ends here.','耐える時は、終わった。']],win:[['Time sided with me.','時は、私に味方した。']],lose:[['I waited too long...','待ちすぎたか…']],taunt:[['You will tire first.','先に疲れるのは、君だ。']]},
 pangd:{sp:[['Coffin or victory!','棺を背負う覚悟、見よ!']],fury:[['No retreat!','退くな。進め!']],win:[['Duty done.','忠義、果たした。']],lose:[['Loyal to the end.','忠を…貫けたか…']],taunt:[['My coffin is ready.','棺は、もう用意してある。']]},
 xuh:{sp:[['Axe of heaven!','断岳の斧、受けよ!']],fury:[['I protect my lord!','殿を守る、それだけだ!']],win:[['Order restored.','軍律は、保たれた。']],lose:[['Too slow...','遅れを取ったか…']],taunt:[['A ragged blade will not reach me.','乱れた刃では、届かぬ。']]},
 sunj:{sp:[['Tiger of Jiangdong!','江東の虎、咆哮せよ!']],fury:[['A tiger never kneels!','虎は、膝を屈せぬ!']],win:[['Jiangdong stands firm.','江東は、揺るがぬ。']],lose:[['My sons...','息子たちよ…']],taunt:[['Fear the tiger.','虎を恐れよ。']]},
 luxun:{sp:[['Fire on the camps!','陣を焼く炎、ここに!']],fury:[['Patience wins at last.','忍耐の果てに、勝機あり。']],win:[['As planned.','筋書き通りだ。']],lose:[['I misjudged...','読み違えたか…']],taunt:[['Pride becomes the gap.','驕りが、隙になる。']]},
 zhangh:{sp:[['Claws of the cunning!','巧変の爪、裂け!']],fury:[['Adapt, always!','状況は、変えるもの!']],win:[['Flexibility wins.','変幻自在、これぞ巧変。']],lose:[['I misread...','読み違えたか…']],taunt:[['I shape the field.','戦場は、私が作る。']]}
};
Object.assign(HL,{zhangj:{"sp":[["蒼天已に死す、黄天当に立つべし!","蒼天已に死す、黄天当に立つべし!"]],"win":[["黄天の世は近い。","黄天の世は近い。"]],"lose":[["天は…我を見放したか…","天は…我を見放したか…"]]},zhangb:{"sp":[["妖術、受けてみよ!","妖術、受けてみよ!"]],"win":[["黄巾の力を見たか。","黄巾の力を見たか。"]],"lose":[["兄者…","兄者…"]]},zhangliang:{"sp":[["人公将軍の刃!","人公将軍の刃!"]],"win":[["他愛もない。","他愛もない。"]],"lose":[["無念…","無念…"]]},huax:{"sp":[["この華雄の首、取れる者はおらぬ!","この華雄の首、取れる者はおらぬ!"]],"win":[["次は誰だ!","次は誰だ!"]],"lose":[["酒が…冷めぬうちに…","酒が…冷めぬうちに…"]]},gaos:{"sp":[["陥陣営、突撃!","陥陣営、突撃!"]],"win":[["陣は、破れぬ。","陣は、破れぬ。"]],"lose":[["殿…","殿…"]]},wenc:{"sp":[["河北の豪傑、文醜ここにあり!","河北の豪傑、文醜ここにあり!"]],"win":[["がはは! 弱い弱い!","がはは! 弱い弱い!"]],"lose":[["顔良…今行く…","顔良…今行く…"]]},yuans:{"sp":[["四世三公の威光、ひれ伏せ!","四世三公の威光、ひれ伏せ!"]],"win":[["名門の格の違いよ。","名門の格の違いよ。"]],"lose":[["わしが…負けるなど…","わしが…負けるなど…"]]},jil:{"sp":[["三尖刀の冴え、見よ!","三尖刀の冴え、見よ!"]],"win":[["袁家の武を知れ。","袁家の武を知れ。"]],"lose":[["これまでか…","これまでか…"]]},menghuo:{"sp":[["南蛮王の力、思い知れ!","南蛮王の力、思い知れ!"]],"win":[["わははは!","わははは!"]],"lose":[["まだだ…まだ心は服さぬ…","まだだ…まだ心は服さぬ…"]]},zhurong:{"sp":[["火神の末裔、舐めるでないよ!","火神の末裔、舐めるでないよ!"]],"win":[["あっけないねぇ。","あっけないねぇ。"]],"lose":[["あんた…ごめんよ…","あんた…ごめんよ…"]]},tadun:{"sp":[["草原の風、駆け抜けろ!","草原の風、駆け抜けろ!"]],"win":[["弓と馬こそ全て。","弓と馬こそ全て。"]],"lose":[["草原へ…還る…","草原へ…還る…"]]},huangfu:{"sp":[["官軍の威、示してくれよう!","官軍の威、示してくれよう!"]],"win":[["賊は退いた。","賊は退いた。"]],"lose":[["無念…","無念…"]]},chengpu:{"sp":[["江東の宿将、程普なり!","江東の宿将、程普なり!"]],"win":[["まだまだ若い者には負けん。","まだまだ若い者には負けん。"]],"lose":[["老いたか…","老いたか…"]]},quyi:{"sp":[["先登死士、放て!","先登死士、放て!"]],"win":[["白馬など恐るるに足らず。","白馬など恐るるに足らず。"]],"lose":[["ぬかった…","ぬかった…"]]},chengong:{"sp":[["策は我にあり!","策は我にあり!"]],"win":[["読み通りよ。","読み通りよ。"]],"lose":[["殿が…策を用いてくだされば…","殿が…策を用いてくだされば…"]]},gaolan:{"sp":[["河北の槍、受けよ!","河北の槍、受けよ!"]],"win":[["容易いものよ。","容易いものよ。"]],"lose":[["ここまでか…","ここまでか…"]]},caochun:{"sp":[["虎豹騎、蹴散らせ!","虎豹騎、蹴散らせ!"]],"win":[["虎豹騎に敵なし。","虎豹騎に敵なし。"]],"lose":[["兄上…","兄上…"]]},jiangqin:{"sp":[["江賊上がりの腕、見せてやる!","江賊上がりの腕、見せてやる!"]],"win":[["へっ、どうだ。","へっ、どうだ。"]],"lose":[["ここまでか…","ここまでか…"]]},lidian:{"sp":[["私情は捨てた。合肥を守る!","私情は捨てた。合肥を守る!"]],"win":[["張遼殿、やりましたな。","張遼殿、やりましたな。"]],"lose":[["無念…","無念…"]]},wangping:{"sp":[["守りなら任せてもらおう。","守りなら任せてもらおう。"]],"win":[["陣は崩れぬ。","陣は崩れぬ。"]],"lose":[["すまぬ…","すまぬ…"]]},zhoucang:{"sp":[["関将軍の刀持ち、周倉なり!","関将軍の刀持ち、周倉なり!"]],"win":[["関将軍、見てくだされ!","関将軍、見てくだされ!"]],"lose":[["関将軍…","関将軍…"]]},liaohua:{"sp":[["蜀に廖化あり!","蜀に廖化あり!"]],"win":[["まだまだ戦える。","まだまだ戦える。"]],"lose":[["くっ…","くっ…"]]},yujin:{"sp":[["軍律こそ我が刃!","軍律こそ我が刃!"]],"win":[["規律の勝利だ。","規律の勝利だ。"]],"lose":[["水が…来る…","水が…来る…"]]},guanxing:{"sp":[["父の刀、受けてみよ!","父の刀、受けてみよ!"]],"win":[["父上、見ておられますか。","父上、見ておられますか。"]],"lose":[["父上…","父上…"]]},zhangbao2:{"sp":[["親父譲りの蛇矛だ!","親父譲りの蛇矛だ!"]],"win":[["どうだ! 親父にも負けねえ!","どうだ! 親父にも負けねえ!"]],"lose":[["親父…","親父…"]]},huangquan:{"sp":[["策をもって陛下をお守りする!","策をもって陛下をお守りする!"]],"win":[["策は成った。","策は成った。"]],"lose":[["陛下…","陛下…"]]},madai:{"sp":[["ここにいるぞ!","ここにいるぞ!"]],"win":[["西涼の馬岱、健在なり!","西涼の馬岱、健在なり!"]],"lose":[["兄上…","兄上…"]]},guohuai:{"sp":[["蜀の北伐、ここで止める!","蜀の北伐、ここで止める!"]],"win":[["雍州は渡さぬ。","雍州は渡さぬ。"]],"lose":[["ぬかった…","ぬかった…"]]},simashi:{"sp":[["父上の策に狂いはない。","父上の策に狂いはない。"]],"win":[["当然の結果だ。","当然の結果だ。"]],"lose":[["父上…","父上…"]]},xusheng:{"sp":[["呉の守りは鉄壁なり!","呉の守りは鉄壁なり!"]],"win":[["蜀軍、恐るるに足らず。","蜀軍、恐るるに足らず。"]],"lose":[["くっ…","くっ…"]]}});
const E_='(?=[。!！?？…、」]|$)';
const DR=function(a,b){return [new RegExp(a.replace(/\$E/g,E_),'g'),b];};
const DIALR={
 osaka:[['俺','ワシ'],['お前|おまえ|貴様|貴公|おぬし','われ'],['ではない','とちゃう'],['じゃない','ちゃう'],['だろう','やろ'],['だろ','やろ'],['だぞ','やぞ'],['だな','やな'],['だね','やな'],['である','や'],['だ$E','や'],['ている','とる'],['ていた','とった'],['([らかさたなばまわ])ない$E','$1へん'],['ぬ$E','へん'],['するな','すなや'],['しろ$E','せえや'],['来い$E','こんかい'],['待て$E','待たんかい'],['ぞ$E','ぞォ'],['よ$E','で'],['とても|非常に','めっちゃ'],['本当に','ほんまに'],['ありがとう','おおきに']],
 kyoto:[['お前|おまえ|貴様|貴公|おぬし','あんたはん'],['ではない','やおへん'],['です$E','どす'],['ます$E','おす'],['ください','おくれやす'],['だろう','どっしゃろ'],['である','どす'],['だ$E','どす'],['ている','てはる'],['([らかさたなばまわ])ない$E','$1へんえ'],['しろ$E','しなはれ'],['来い$E','おいでやす'],['待て$E','待っとくれやす'],['ぞ$E','えな'],['よ$E','え'],['ありがとう','おおきに'],['本当に','ほんまに']],
 hiro:[['俺|私','わし'],['お前|おまえ|貴様|貴公','おどれ'],['だろう','じゃろう'],['である','じゃ'],['だぞ','じゃけぇ'],['だ$E','じゃ'],['ている','ちょる'],['から$E','けぇ'],['([らかさたなばまわ])ない$E','$1んけぇ'],['よ$E','ど'],['ぞ$E','ぞ、のう']],
 hakata:[['お前|おまえ|貴様|貴公','あんた'],['だろう','ちゃろ'],['だぞ','ばい'],['だ$E','ばい'],['ている','とる'],['から','けん'],['([らかさたなばまわ])ない$E','$1ん'],['よ$E','と'],['ぞ$E','ばい'],['とても|非常に','ばり']],
 tosa:[['俺|私|おれ','わし'],['お前|おまえ|貴様|貴公','おまん'],['だろう','じゃろう'],['である','ぜよ'],['だ$E','ぜよ'],['ぞ$E','ぜよ'],['ている','ちゅう']],
 edo:[['俺','オイラ'],['お前|おまえ|貴様|貴公','てめえ'],['ではない','じゃねえ'],['だ$E','でぇ'],['ない$E','ねえ'],['ぞ$E','ぜ'],['しろ$E','しやがれ'],['とても|非常に','べらぼうに'],['ている','てる']],
 old:[['俺|私','わし'],['だろう','じゃろう'],['である','じゃ'],['だ$E','じゃ'],['ぞ$E','ぞい'],['ている','おる'],['ない$E','ぬ']]
};
Object.keys(DIALR).forEach(function(k){DIALR[k]=DIALR[k].map(function(r){return DR(r[0],r[1]);});});
const DIALH={zhangf:'osaka',xuc:'osaka',liub:'kyoto',dianw:'hiro',dongz:'hiro',huanggai:'hiro',yanl:'hiro',gann:'hakata',lumeng:'hakata',zhout:'hakata',sunj:'tosa',suns:'edo',lingt:'edo',huangz:'old',matengg:'old'};
function dial(ja,id){
  const k=DIALH[id];if(!k||!ja)return ja;
  let t=ja;DIALR[k].forEach(function(r){t=t.replace(r[0],r[1]);});return t;
}
const PAIRCONV={
 'lubu|zhangf':[[['zhangf','Three-surnamed slave! Come and fight!','三姓家奴め! かかってこい!'],['lubu','Quiet, you noisy fool!','黙れ、騒がしい奴め!']]],
 'guan|lubu':[[['lubu','Guan Yu... your wine will go cold.','関羽か…酒が冷めるぞ。'],['guan','Then I will return before it does.','冷める前に、戻ってみせよう。']]],
 'caoc|guan':[[['caoc','Stay with me, Lord Guan. I will give you everything.','関羽殿、我が元に来てくれ。何でも与えよう。'],['guan','My heart belongs to my lord. I only repay your kindness.','我が心は主君のもの。ご恩は必ず返す。']]],
 'caoc|liub':[[['caoc','Only you and I are true heroes in this land.','天下の英雄は、君と私だけだ。','mei'],['liub','You flatter me, Lord Cao.','ご冗談を、曹公。']]],
 'zhouy|zhugel':[[['zhouy','Heaven made Yu... why did it make Liang?','天は瑜を生みながら、なぜ亮を生んだ!','mei'],['zhugel','Your fire needs the east wind. I know.','貴殿の火には、東風が要る。存じている。']]],
 'sima|zhugel':[[['sima','An empty city? I do not believe it.','空城だと? 信じられぬ。'],['zhugel','Then come in. The gate is open.','ならば入られよ。門は開いている。']]],
 'suns|tsc':[[['tsc','Give me back my halberd!','俺の戟を返せ!'],['suns','Then give me back my helmet!','なら、俺の兜も返せ!']]],
 'mac|xuc':[[['xuc','I will fight you bare-chested!','裸になって相手をしてやる!'],['mac','Ha! Then I will not hold back.','ははっ、ならば手加減は無用だな。']]],
 'caoc|mac':[[['mac','Cao Cao! Give me back my father!','曹操! 父を返せ!'],['caoc','I must run... cut my beard if I must.','逃げねば…髭を切ってでもな。']]],
 'sunq|zhangl':[[['zhangl','Sun Quan! Where do you run?','孫権! どこへ逃げる!'],['sunq','Zhang Liao... only eight hundred men!','張遼…たった八百の兵で!']]],
 'guan|huangz':[[['guan','Change your horse. I do not strike a fallen man.','馬を替えてこい。倒れた者は討たぬ。'],['huangz','You honor me. Next time, I will not miss.','恩に着る。次は外さぬ。']]],
 'gann|lingt':[[['lingt','You killed my father, Gan Ning!','父の仇だ、甘寧!'],['gann','It was war. Now we serve the same lord.','戦だった。今は同じ主君に仕える身だ。']]],
 'sunq|zhout':[[['zhout','Lord, stand behind me.','殿、お下がりを。'],['sunq','Your scars are my pride.','その傷は、私の誇りだ。']]],
 'guan|luxun':[[['luxun','General Guan, you underestimate Wu.','関羽殿、呉を侮られたな。'],['guan','A scholar? Ha! Come.','書生だと? はっ、来い!']]],
 'weiy|zhugel':[[['weiy','Let me take the Ziwu road!','子午の道を行かせてくれ!'],['zhugel','Too risky. We take the safe road.','危険すぎる。安全な道を行く。']]],
 'guan|pangd':[[['pangd','Guan Yu! Today, one of us dies!','関羽! 今日、どちらかが死ぬ!'],['guan','Pang De, you are brave. Come!','龐徳、見事な胆だ。来い!']]],
 'guan|xuh':[[['xuh','Yunchang, today is duty, not friendship.','雲長、今日は友情ではなく、公務だ。'],['guan','I understand, Gongming.','分かっている、公明。']]],
 'dongz|lubu':[[['dongz','Fengxian, my son!','奉先、我が子よ!'],['lubu','I am not your son!','貴様の子になった覚えはない!']]],
 'mac|zhangf':[[['zhangf','Brocade Ma Chao! Bring the torches!','錦馬超! 松明を灯せ!'],['mac','Zhang Fei! Even at night, I win!','張飛! 夜でも勝つのは俺だ!']]],
 'dianw|zhangx':[[['zhangx','You are a living wall.','まるで動く壁だな。'],['dianw','Then break me, if you can.','なら、壊してみろ。']]],
 'suns|zhouy':[[['suns','Gongjin, race you to the gate!','公瑾、門まで競争だ!'],['zhouy','Bold as ever, Bofu.','相変わらず豪胆だな、伯符。']]],
 'liub|zhaoy':[[['zhaoy','My lord, I will carry your son.','殿、御子は、必ず私が。'],['liub','Zilong... do not die for a child.','子龍…子のために死ぬな。']]],
 'jiangw|zhugel':[[['jiangw','Master, I will not fail you.','師よ、必ず期待に応えます。'],['zhugel','I leave the north to you.','北伐は、君に託す。']]],
 'jiangw|sima':[[['sima','Your loyalty is admirable.','その忠義、見事だ。'],['jiangw','Wei will fall for Shu.','魏を倒し、蜀を興す。']]],
 'huanggai|zhouy':[[['huanggai','Whip me harder, my lord!','都督、もっと強く打て!'],['zhouy','Your pain will win this war.','その痛みが戦に勝つ。']]],
 'xhd|xhy':[[['xhy','Brother, are you ready?','兄者、準備はいいか?'],['xhd','Always, Miaocai.','いつでも、妙才。']]]
};
