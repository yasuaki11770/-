/* ================= 顔グラ（描き直し）：帽子なし・顔と服に個性 =================
   256x288 で描く（表示は今までと同じ 128:144）。主な武将は一人ずつ顔を決め、ほかは名前から決まる組み合わせで描く。 */
const PT2={};
const PSPEC={
 // 蜀
 liub:{fs:'oval',fw:24,age:1,hair:'knot',brow:'soft',eye:'round',mo:'smile',bd:'short',cl:'robe',c1:'#2e7a4a',c2:'#d8b04a',c3:'#1d4a30',x:['ears']},
 guan:{fs:'long',fw:25,sk:'#b8442f',age:2,hair:'knot',band:'#2a7a3a',brow:'thick',eye:'phoenix',mo:'tight',bd:'long',bc:'#120a06',cl:'armor',c1:'#2a7a44',c2:'#d8b04a',c3:'#1f5a34'},
 zhangf:{fs:'square',fw:27,sk:'#a8744c',age:1,hair:'wild',brow:'bushy',eye:'round',nose:'wide',mo:'grin',bd:'tiger',cl:'armor',c1:'#2a2a30',c2:'#9a2a20',c3:'#3a2a44',metal:'#5a5a62'},
 zhaoy:{fs:'oval',fw:23,sk:'#f3d4b4',age:0,hair:'tail',brow:'n',eye:'sharp',nose:'thin',mo:'n',bd:'none',cl:'armor',c1:'#e4e9f0',c2:'#3a6ac0',c3:'#f4f4f4',metal:'#d8dee6'},
 mac:{fs:'sharp',fw:23,sk:'#f2d2b0',age:0,hair:'loose',hc:'#2a1a12',brow:'angry',eye:'sharp',nose:'thin',mo:'tight',bd:'none',cl:'armor',c1:'#c8d0d8',c2:'#c9a227',c3:'#2f5ea8',metal:'#dfe4ea',x:['lion']},
 zhugel:{fs:'long',fw:22,sk:'#f2d6b8',age:1,hair:'knot',band:'#1a1a22',brow:'thin',eye:'narrow',nose:'thin',mo:'smile',bd:'goatee',cl:'robe',c1:'#f2f0e6',c2:'#232c44',c3:'#cfd2c8',x:['fan']},
 pangt:{fs:'round',fw:26,sk:'#c9986a',age:1,hair:'wild',hc:'#2a2014',brow:'bushy',eye:'narrow',nose:'wide',mo:'grin',bd:'mus',cl:'robe',c1:'#6a5a3a',c2:'#3a2e1e',x:['mole']},
 huangz:{fs:'long',fw:23,age:3,hair:'knot',hc:'#e4e2dc',brow:'white',eye:'narrow',mo:'tight',bd:'long',bc:'#ecebe6',cl:'armor',c1:'#a8842a',c2:'#5a3a1a',c3:'#7a2a1a',metal:'#c9a24a'},
 weiy:{fs:'square',fw:25,sk:'#b07a50',age:1,hair:'wild',brow:'angry',eye:'narrow',nose:'hook',mo:'frown',bd:'full',cl:'armor',c1:'#6a2a2a',c2:'#c9a24a',c3:'#3a1414',metal:'#6a5a50',x:['scar']},
 jiangw:{fs:'oval',fw:23,sk:'#f0d0ae',age:0,hair:'knot',brow:'n',eye:'sharp',nose:'thin',mo:'tight',bd:'none',cl:'armor',c1:'#3a6a8a',c2:'#d8c070',c3:'#24485e',metal:'#b0bcc8'},
 guanp:{fs:'oval',fw:23,age:0,hair:'knot',band:'#2a7a3a',brow:'thick',eye:'phoenix',bd:'none',cl:'armor',c1:'#3a8a4a',c2:'#d8b04a',c3:'#24603a'},
 guanxing:{fs:'oval',fw:23,sk:'#c8644a',age:0,hair:'knot',band:'#2a7a3a',brow:'thick',eye:'phoenix',bd:'none',cl:'armor',c1:'#2a7a44',c2:'#d8b04a',c3:'#1f5a34'},
 zhangbao2:{fs:'square',fw:25,sk:'#b07a52',age:0,hair:'wild',brow:'bushy',eye:'round',nose:'wide',mo:'grin',bd:'stub',cl:'armor',c1:'#2a2a30',c2:'#8a2a20',metal:'#5a5a62'},
 zhoucang:{fs:'square',fw:27,sk:'#8a5a36',age:1,hair:'wild',brow:'bushy',eye:'round',nose:'wide',mo:'frown',bd:'full',cl:'light',c1:'#3a3020',c2:'#8a6a3a'},
 madai:{fs:'oval',fw:23,age:1,hair:'tail',brow:'n',eye:'sharp',bd:'mus',cl:'armor',c1:'#b9c2c9',c2:'#2f5ea8',metal:'#d0d6dc'},
 wangping:{fs:'square',fw:24,sk:'#c08a5e',age:1,hair:'knot',brow:'thick',eye:'narrow',bd:'short',cl:'armor',c1:'#2f6a4a',c2:'#c8c0a0'},
 liaohua:{fs:'long',fw:23,age:2,hair:'knot',brow:'n',eye:'narrow',bd:'fork',cl:'armor',c1:'#2f7a50',c2:'#d0c080'},
 huangquan:{fs:'long',fw:22,age:1,hair:'knot',brow:'thin',eye:'narrow',bd:'goatee',cl:'robe',c1:'#4a6a5a',c2:'#d8d0b0'},
 // 魏
 caoc:{fs:'sharp',fw:23,sk:'#ecc39a',age:2,hair:'knot',pin:'#e0b040',brow:'angry',eye:'narrow',nose:'hook',mo:'tight',bd:'mus',cl:'royal',c1:'#22305a',c2:'#d4ac3a',c3:'#141c38'},
 xhd:{fs:'square',fw:25,age:1,hair:'knot',brow:'thick',eye:'sharp',mo:'frown',bd:'short',cl:'armor',c1:'#2a3040',c2:'#8a9ab0',c3:'#1a2030',x:['patch']},
 xhy:{fs:'long',fw:23,age:1,hair:'knot',brow:'angry',eye:'sharp',bd:'fork',cl:'armor',c1:'#3a4a6a',c2:'#c9a24a'},
 xuc:{fs:'round',fw:29,sk:'#c08a5a',age:1,hair:'bald',brow:'thick',eye:'round',nose:'wide',mo:'grin',bd:'stub',cl:'light',c1:'#3a3a5a',c2:'#8a6a3a',x:['fat']},
 dianw:{fs:'square',fw:28,sk:'#946640',age:2,hair:'wild',hc:'#1a1410',brow:'bushy',eye:'round',nose:'wide',mo:'frown',bd:'full',cl:'armor',c1:'#4a3a2a',c2:'#9a2a20',metal:'#5a4a3a'},
 zhangl:{fs:'long',fw:23,age:1,hair:'knot',brow:'angry',eye:'sharp',nose:'hook',mo:'tight',bd:'fork',cl:'armor',c1:'#2a3a6a',c2:'#c0c8d8',c3:'#1a2448'},
 caor:{fs:'square',fw:25,age:1,hair:'knot',brow:'thick',eye:'n',bd:'short',cl:'armor',c1:'#2a3a6a',c2:'#c9a24a'},
 xuh:{fs:'square',fw:25,age:1,hair:'knot',brow:'thick',eye:'narrow',bd:'goatee',cl:'armor',c1:'#4a4a6a',c2:'#c0a050',metal:'#7a7a88'},
 zhangh:{fs:'oval',fw:23,age:1,hair:'tail',brow:'n',eye:'sharp',bd:'mus',cl:'armor',c1:'#3a5a7a',c2:'#d0b060'},
 pangd:{fs:'square',fw:26,sk:'#a87450',age:1,hair:'wild',brow:'bushy',eye:'sharp',nose:'wide',mo:'frown',bd:'full',cl:'armor',c1:'#5a5a66',c2:'#9a8a6a',metal:'#8a8a94'},
 yujin:{fs:'long',fw:23,age:2,hair:'knot',brow:'thin',eye:'narrow',mo:'tight',bd:'short',cl:'armor',c1:'#3a4a78',c2:'#a8a8b0'},
 sima:{fs:'long',fw:22,age:2,hair:'knot',pin:'#8a7acc',brow:'angry',eye:'narrow',nose:'hook',mo:'tight',bd:'goatee',cl:'robe',c1:'#2a2238',c2:'#8a7acc',c3:'#18141f'},
 simashi:{fs:'long',fw:23,age:1,hair:'knot',brow:'angry',eye:'narrow',bd:'mus',cl:'armor',c1:'#2a2a44',c2:'#8a7acc',x:['patch']},
 guohuai:{fs:'oval',fw:23,age:1,hair:'knot',brow:'n',eye:'narrow',bd:'short',cl:'armor',c1:'#2a3a5a',c2:'#b0b8d0'},
 yuej:{fs:'round',fw:24,age:1,hair:'knot',brow:'thick',eye:'round',bd:'short',cl:'armor',c1:'#3a4a78',c2:'#c9a24a'},
 caochun:{fs:'oval',fw:23,age:1,hair:'tail',brow:'n',eye:'sharp',bd:'mus',cl:'armor',c1:'#2b2f5a',c2:'#9aa8d0'},
 lidian:{fs:'oval',fw:23,age:1,hair:'knot',brow:'thin',eye:'n',bd:'goatee',cl:'armor',c1:'#3a4a78',c2:'#c0c8d8'},
 // 呉
 sunj:{fs:'square',fw:25,age:1,hair:'knot',band:'#b02020',brow:'thick',eye:'sharp',mo:'tight',bd:'short',bc:'#5a2a10',cl:'armor',c1:'#a82a2a',c2:'#e0b040',c3:'#6a1414'},
 suns:{fs:'oval',fw:23,sk:'#f2d0ac',age:0,hair:'tail',brow:'angry',eye:'sharp',mo:'grin',bd:'none',cl:'armor',c1:'#c03a30',c2:'#e0b040',c3:'#8a1a14'},
 sunq:{fs:'square',fw:25,age:1,hair:'knot',pin:'#e0b040',brow:'thick',eye:'n',ic:'#3a8a5a',mo:'tight',bd:'full',bc:'#6a2a3a',cl:'royal',c1:'#a83030',c2:'#e0c060',c3:'#5a1414'},
 zhouy:{fs:'oval',fw:22,sk:'#f4dabe',age:0,hair:'loose',brow:'thin',eye:'phoenix',nose:'thin',mo:'smile',bd:'none',cl:'robe',c1:'#b8302a',c2:'#ece0b0',c3:'#7a1a14'},
 luxun:{fs:'oval',fw:22,sk:'#f4dabe',age:0,hair:'loose',brow:'thin',eye:'sharp',nose:'thin',mo:'n',bd:'none',cl:'robe',c1:'#c05050',c2:'#ecdcb8'},
 lumeng:{fs:'square',fw:24,age:1,hair:'knot',brow:'thick',eye:'narrow',bd:'short',cl:'armor',c1:'#a03030',c2:'#d0b060'},
 huanggai:{fs:'square',fw:25,age:3,hair:'knot',hc:'#dcdad4',brow:'white',eye:'narrow',mo:'frown',bd:'full',bc:'#e6e4de',cl:'armor',c1:'#a04a3a',c2:'#d0b060'},
 tsc:{fs:'square',fw:24,age:1,hair:'knot',band:'#a02a2a',brow:'thick',eye:'sharp',mo:'tight',bd:'short',cl:'armor',c1:'#a03a3a',c2:'#e0c060'},
 gann:{fs:'sharp',fw:23,sk:'#c08856',age:1,hair:'wild',hc:'#2a160e',brow:'angry',eye:'sharp',mo:'grin',bd:'stub',cl:'light',c1:'#b05a2a',c2:'#e0b040',x:['bell','tattoo']},
 zhout:{fs:'square',fw:26,sk:'#b07c52',age:1,hair:'knot',brow:'thick',eye:'narrow',mo:'frown',bd:'stub',cl:'armor',c1:'#7a2a24',c2:'#c9a24a',x:['scar','scar2']},
 lingt:{fs:'oval',fw:23,age:0,hair:'tail',brow:'n',eye:'sharp',bd:'none',cl:'light',c1:'#a8322e',c2:'#e0c060'},
 chengpu:{fs:'long',fw:23,age:3,hair:'knot',hc:'#d8d6d0',brow:'white',eye:'narrow',bd:'long',bc:'#e6e4de',cl:'armor',c1:'#8a3a2a',c2:'#d0b060'},
 xusheng:{fs:'oval',fw:23,age:1,hair:'knot',brow:'n',eye:'sharp',bd:'short',cl:'armor',c1:'#a8322e',c2:'#e0c060'},
 jiangqin:{fs:'square',fw:24,sk:'#b88456',age:1,hair:'wild',brow:'thick',eye:'round',bd:'stub',cl:'light',c1:'#a8322e',c2:'#d0b060'},
 // 群雄
 lubu:{fs:'sharp',fw:24,sk:'#f0d0ac',age:1,hair:'loose',hc:'#24140c',band:'#c8302a',brow:'angry',eye:'sharp',nose:'n',mo:'grin',bd:'none',cl:'armor',c1:'#8a1a1a',c2:'#e8b840',c3:'#b02a20',metal:'#c9a24a'},
 dongz:{fs:'round',fw:30,sk:'#c28c62',age:2,hair:'knot',brow:'bushy',eye:'narrow',nose:'wide',mo:'grin',bd:'full',cl:'royal',c1:'#5a2a5a',c2:'#d4ac3a',x:['fat']},
 huax:{fs:'square',fw:26,sk:'#a46e48',age:1,hair:'wild',brow:'bushy',eye:'round',nose:'wide',mo:'grin',bd:'full',cl:'armor',c1:'#5a2a1a',c2:'#b08a3c',metal:'#6a4a3a'},
 yanl:{fs:'square',fw:27,sk:'#a06c46',age:1,hair:'wild',brow:'bushy',eye:'round',nose:'wide',mo:'frown',bd:'full',cl:'armor',c1:'#6a5a2a',c2:'#d0a040',metal:'#8a7a4a'},
 wenc:{fs:'square',fw:26,sk:'#9a6844',age:1,hair:'wild',brow:'angry',eye:'round',nose:'hook',mo:'grin',bd:'tiger',cl:'armor',c1:'#6a5a2a',c2:'#d0a040',metal:'#8a7a4a',x:['scar']},
 yuans:{fs:'oval',fw:24,sk:'#f2d2b0',age:2,hair:'knot',pin:'#e0c060',brow:'soft',eye:'n',mo:'n',bd:'short',cl:'royal',c1:'#c9a227',c2:'#7a1a1a',c3:'#8a6a10'},
 zhangj:{fs:'long',fw:22,age:3,hair:'loose',hc:'#dcdad4',band:'#e0c020',brow:'white',eye:'narrow',mo:'tight',bd:'long',bc:'#e8e6e0',cl:'robe',c1:'#d0b020',c2:'#5a3a10'},
 zhangb:{fs:'oval',fw:23,age:1,hair:'knot',band:'#e0c020',brow:'angry',eye:'narrow',bd:'goatee',cl:'robe',c1:'#c8a020',c2:'#5a3a10'},
 zhangliang:{fs:'square',fw:25,age:1,hair:'wild',band:'#e0c020',brow:'bushy',eye:'round',bd:'full',cl:'light',c1:'#a88a2a',c2:'#5a3a10'},
 gaos:{fs:'square',fw:24,age:1,hair:'knot',brow:'thick',eye:'narrow',mo:'tight',bd:'short',cl:'armor',c1:'#4a4a52',c2:'#a0a0a8',metal:'#707078'},
 chengong:{fs:'long',fw:22,age:2,hair:'knot',brow:'thin',eye:'narrow',mo:'tight',bd:'short',cl:'robe',c1:'#4a4a5a',c2:'#a0a0b0'},
 gongsunz:{fs:'oval',fw:23,age:1,hair:'knot',brow:'n',eye:'sharp',bd:'short',cl:'armor',c1:'#e6e8ec',c2:'#c0c8d8',metal:'#dadfe6'},
 menghuo:{fs:'round',fw:28,sk:'#7a5236',age:1,hair:'braid',hc:'#140c06',brow:'bushy',eye:'round',nose:'wide',mo:'grin',bd:'full',cl:'south',c1:'#a05a2a',c2:'#e0a020',x:['fur','tattoo']},
 zhurong:{fs:'oval',fw:22,sk:'#b07850',age:1,hair:'braid',hc:'#1a0e08',brow:'angry',eye:'sharp',mo:'grin',bd:'none',cl:'south',c1:'#c04a2a',c2:'#e0c050',x:['fem','fur','bell']},
 tadun:{fs:'square',fw:25,sk:'#b88a62',age:1,hair:'braid',brow:'thick',eye:'narrow',bd:'mus',cl:'south',c1:'#5a4a3a',c2:'#a08a5a',x:['fur']},
 huangfu:{fs:'long',fw:23,age:3,hair:'knot',hc:'#d8d6d0',brow:'white',eye:'narrow',bd:'long',bc:'#e8e6e0',cl:'armor',c1:'#8a2a1e',c2:'#e0c050'},
 jil:{fs:'square',fw:25,age:1,hair:'knot',brow:'thick',eye:'round',bd:'full',cl:'armor',c1:'#3a5a3a',c2:'#c0a040'},
 // 物語で加わった武将
 xushu:{fs:'oval',fw:23,age:1,hair:'knot',brow:'n',eye:'narrow',mo:'smile',bd:'short',cl:'robe',c1:'#5a6a90',c2:'#e0dcc8'},
 yanyan:{fs:'long',fw:23,age:3,hair:'knot',hc:'#dedcd6',brow:'white',eye:'narrow',mo:'tight',bd:'long',bc:'#ecebe6',cl:'armor',c1:'#7a6a4a',c2:'#c9a24a'},
 masu:{fs:'oval',fw:22,age:0,hair:'knot',brow:'thin',eye:'n',mo:'smile',bd:'none',cl:'robe',c1:'#8a7aa8',c2:'#ece6d4'},
 sunshangxiang:{fs:'oval',fw:21,sk:'#f6dcc4',age:0,hair:'bun',brow:'thin',eye:'sharp',mo:'smile',bd:'none',cl:'armor',c1:'#c84a5a',c2:'#f0d070',c3:'#8a1a2a',metal:'#e8c070',x:['fem']},
 mifuren:{fs:'oval',fw:21,sk:'#f6dcc4',age:0,hair:'bun',brow:'soft',eye:'round',mo:'n',bd:'none',cl:'lady',c1:'#d8a0b0',c2:'#f4ecd8',x:['fem']},
 diaochan:{fs:'oval',fw:20,sk:'#f8e2cc',age:0,hair:'bun',brow:'soft',eye:'phoenix',nose:'thin',mo:'smile',bd:'none',cl:'lady',c1:'#e07a9a',c2:'#f8e8c8',c3:'#a83a5a',x:['fem','flower']},
 xumu:{fs:'oval',fw:21,age:3,hair:'bun',hc:'#d0ccc4',brow:'soft',eye:'narrow',mo:'n',bd:'none',cl:'lady',c1:'#7a6a5a',c2:'#d8d0c0',x:['fem']},
 wuguotai:{fs:'oval',fw:21,age:3,hair:'bun',hc:'#d6d2ca',brow:'soft',eye:'narrow',mo:'tight',bd:'none',cl:'lady',c1:'#a0303a',c2:'#e8d8a0',x:['fem']},
 liushan:{fs:'round',fw:25,sk:'#f6dcc4',age:0,hair:'knot',pin:'#e0c040',brow:'soft',eye:'round',mo:'smile',bd:'none',cl:'royal',c1:'#c9a227',c2:'#7a1a1a',x:['fat']},
 xiandi:{fs:'oval',fw:22,sk:'#f6dcc4',age:0,hair:'knot',pin:'#e0c040',brow:'soft',eye:'round',mo:'frown',bd:'none',cl:'royal',c1:'#d0aa30',c2:'#7a1a1a'},
 fazheng:{fs:'sharp',fw:22,age:1,hair:'knot',brow:'angry',eye:'narrow',nose:'hook',mo:'tight',bd:'goatee',cl:'robe',c1:'#5a6a8a',c2:'#d8d0b8'},
 maliang:{fs:'oval',fw:22,age:1,hair:'knot',brow:'white',eye:'n',mo:'smile',bd:'short',cl:'robe',c1:'#7a9a8a',c2:'#ece6d0'},
 yangyi:{fs:'long',fw:22,age:1,hair:'knot',brow:'thin',eye:'narrow',mo:'frown',bd:'goatee',cl:'robe',c1:'#7a8a9a',c2:'#e0dcc8'},
 dengai:{fs:'square',fw:24,sk:'#c08a5e',age:2,hair:'knot',brow:'thick',eye:'narrow',mo:'tight',bd:'goatee',cl:'armor',c1:'#5a5a7a',c2:'#c0a860'},
 zhonghui:{fs:'sharp',fw:22,sk:'#f4dabe',age:0,hair:'knot',pin:'#8a7acc',brow:'angry',eye:'narrow',nose:'thin',mo:'tight',bd:'none',cl:'robe',c1:'#4a4a8a',c2:'#d8d0f0'},
 simazhao:{fs:'long',fw:23,age:2,hair:'knot',pin:'#e0c060',brow:'angry',eye:'narrow',nose:'hook',mo:'tight',bd:'goatee',cl:'royal',c1:'#3a3a5a',c2:'#d0b060'},
 simayan:{fs:'oval',fw:23,age:1,hair:'knot',pin:'#e0c060',brow:'n',eye:'n',mo:'n',bd:'short',cl:'royal',c1:'#8a2a2a',c2:'#e0c060'},
 xuyou:{fs:'sharp',fw:21,age:2,hair:'knot',brow:'angry',eye:'narrow',nose:'hook',mo:'grin',bd:'goatee',cl:'robe',c1:'#7a7a5a',c2:'#e0d8b0'},
 caiyang:{fs:'long',fw:23,age:3,hair:'knot',hc:'#d4d2cc',brow:'white',eye:'narrow',mo:'frown',bd:'long',bc:'#dddbd4',cl:'armor',c1:'#5a5a7a',c2:'#c0c0c8'},
 guojia:{fs:'oval',fw:21,sk:'#f6e0cc',age:0,hair:'loose',brow:'thin',eye:'narrow',mo:'smile',bd:'none',cl:'robe',c1:'#5a6aa0',c2:'#e8e4d8'},
 lusu:{fs:'round',fw:25,age:1,hair:'knot',brow:'soft',eye:'round',mo:'smile',bd:'short',cl:'robe',c1:'#a8603a',c2:'#ece0c0'},
 zhangzhao:{fs:'long',fw:23,age:3,hair:'knot',hc:'#d8d6d0',brow:'white',eye:'narrow',mo:'frown',bd:'long',bc:'#e6e4de',cl:'robe',c1:'#8a5a4a',c2:'#e8dcc0'},
 panzhang:{fs:'square',fw:25,sk:'#a87450',age:1,hair:'wild',brow:'angry',eye:'narrow',mo:'grin',bd:'full',cl:'armor',c1:'#8a3a3a',c2:'#c0a050'},
 mazhong:{fs:'long',fw:23,age:1,hair:'knot',brow:'thick',eye:'narrow',bd:'mus',cl:'armor',c1:'#8a4a3a',c2:'#c0a050'},
 sunhao:{fs:'sharp',fw:22,sk:'#f4dabe',age:1,hair:'knot',pin:'#e0c060',brow:'angry',eye:'narrow',mo:'grin',bd:'none',cl:'royal',c1:'#8a2a2a',c2:'#e0c060'},
 wangyun:{fs:'long',fw:22,age:3,hair:'knot',hc:'#dcdad4',brow:'white',eye:'narrow',mo:'tight',bd:'long',bc:'#e8e6e0',cl:'robe',c1:'#5a5a7a',c2:'#e0dcc8'},
 lijue:{fs:'square',fw:25,sk:'#a87450',age:1,hair:'wild',brow:'angry',eye:'round',mo:'grin',bd:'short',cl:'armor',c1:'#6a4a3a',c2:'#a08a5a'},
 guosi:{fs:'round',fw:26,sk:'#a06c48',age:1,hair:'wild',brow:'bushy',eye:'round',mo:'grin',bd:'full',cl:'armor',c1:'#5a4a3a',c2:'#a08a5a'},
 chengyuanzhi:{fs:'square',fw:26,sk:'#a06c48',age:1,hair:'wild',band:'#e0c020',brow:'bushy',eye:'round',nose:'wide',mo:'grin',bd:'full',cl:'light',c1:'#a08a2a',c2:'#5a3a10'},
 duyou:{fs:'sharp',fw:21,sk:'#f2d6b8',age:2,hair:'knot',brow:'thin',eye:'narrow',nose:'hook',mo:'grin',bd:'mus',cl:'robe',c1:'#6a3a7a',c2:'#e0d0a0'},
 luboshe:{fs:'round',fw:23,age:3,hair:'knot',hc:'#d8d6d0',brow:'white',eye:'narrow',mo:'smile',bd:'long',bc:'#e8e6e0',cl:'robe',c1:'#7a6a4a',c2:'#d8d0b8'},
 wutugu:{fs:'square',fw:29,sk:'#6a5a34',age:2,hair:'bald',brow:'bushy',eye:'round',nose:'wide',mo:'grin',bd:'full',cl:'south',c1:'#a08a4a',c2:'#5a4a20',x:['fur','tattoo','fat']},
 liuzhang:{fs:'round',fw:24,age:2,hair:'knot',pin:'#c9b050',brow:'soft',eye:'round',mo:'frown',bd:'short',cl:'royal',c1:'#7a7a3a',c2:'#e0d080'},
 liubiao:{fs:'long',fw:23,age:3,hair:'knot',hc:'#d8d6d0',brow:'white',eye:'narrow',bd:'long',bc:'#e4e2dc',cl:'royal',c1:'#3a6a6a',c2:'#e0d080'},
 zhangren:{fs:'long',fw:23,age:1,hair:'knot',brow:'thick',eye:'sharp',mo:'tight',bd:'short',cl:'armor',c1:'#6a6a3a',c2:'#c0b070'},
 duyu:{fs:'long',fw:22,age:2,hair:'knot',brow:'thin',eye:'narrow',mo:'n',bd:'goatee',cl:'robe',c1:'#8a2a2a',c2:'#e8d8b0'},
 wangjun:{fs:'square',fw:24,age:3,hair:'knot',hc:'#d0cec8',brow:'white',eye:'narrow',bd:'long',bc:'#dedcd6',cl:'armor',c1:'#8a3a2a',c2:'#d0b060'},
 yuanshu:{fs:'round',fw:27,sk:'#f2d2b0',age:2,hair:'knot',pin:'#e0c060',brow:'soft',eye:'narrow',mo:'grin',bd:'goatee',cl:'royal',c1:'#b09020',c2:'#7a1a1a',x:['fat']},
 chunyuqiong:{fs:'round',fw:28,sk:'#b47e56',age:2,hair:'knot',brow:'bushy',eye:'narrow',nose:'wide',mo:'grin',bd:'full',cl:'armor',c1:'#8a7a3a',c2:'#c0a050',x:['fat']},
 xiahouba:{fs:'long',fw:23,age:1,hair:'knot',brow:'angry',eye:'sharp',bd:'short',cl:'armor',c1:'#3a7a4a',c2:'#d0c080'},
 wenyang:{fs:'oval',fw:23,age:0,hair:'tail',brow:'angry',eye:'sharp',mo:'tight',bd:'none',cl:'armor',c1:'#5a6a8a',c2:'#d8dcea'},
 sunqian:{fs:'oval',fw:22,age:1,hair:'knot',brow:'soft',eye:'n',mo:'smile',bd:'short',cl:'robe',c1:'#6a7a5a',c2:'#e0dcc8'},
 jiangwan:{fs:'oval',fw:22,age:1,hair:'knot',brow:'n',eye:'narrow',mo:'n',bd:'short',cl:'robe',c1:'#5a7a6a',c2:'#e0dcc8'},
 chengyu:{fs:'long',fw:22,age:3,hair:'knot',hc:'#d4d2cc',brow:'white',eye:'narrow',nose:'hook',mo:'tight',bd:'long',bc:'#e0ded8',cl:'robe',c1:'#3a4a7a',c2:'#e0dcc8'},
 caomao:{fs:'oval',fw:22,sk:'#f6dcc4',age:0,hair:'knot',pin:'#e0c040',brow:'angry',eye:'sharp',mo:'tight',bd:'none',cl:'royal',c1:'#3a4a8a',c2:'#e0c060'},
 dengzhi:{fs:'oval',fw:22,age:2,hair:'knot',brow:'n',eye:'narrow',mo:'n',bd:'short',cl:'robe',c1:'#4a6a5a',c2:'#e0dcc8'},
 hande:{fs:'square',fw:25,age:2,hair:'knot',brow:'thick',eye:'round',mo:'frown',bd:'full',cl:'armor',c1:'#3a4a78',c2:'#b0b8d0'},
 zhangyi:{fs:'oval',fw:23,age:2,hair:'knot',brow:'thick',eye:'narrow',bd:'short',cl:'armor',c1:'#2f6a4a',c2:'#c8c0a0'},
 kongxiu:{fs:'square',fw:24,age:1,hair:'knot',brow:'thick',eye:'n',bd:'short',cl:'armor',c1:'#5a6a8a',c2:'#b0b8c8'},
 hanfu:{fs:'long',fw:22,age:2,hair:'knot',brow:'thin',eye:'narrow',bd:'goatee',cl:'armor',c1:'#5a6a8a',c2:'#b0b8c8'},
 mengtan:{fs:'square',fw:25,sk:'#a87450',age:1,hair:'wild',brow:'angry',eye:'round',mo:'grin',bd:'short',cl:'armor',c1:'#5a6a8a',c2:'#b0b8c8'},
 bianxi:{fs:'round',fw:26,sk:'#a87450',age:1,hair:'bald',brow:'bushy',eye:'narrow',mo:'grin',bd:'stub',cl:'light',c1:'#5a5a7a',c2:'#a0a0b0'},
 wangzhi:{fs:'sharp',fw:21,age:2,hair:'knot',brow:'angry',eye:'narrow',nose:'hook',mo:'grin',bd:'goatee',cl:'robe',c1:'#5a6a8a',c2:'#d0d0d8'},
 qinqi:{fs:'oval',fw:23,age:0,hair:'tail',brow:'angry',eye:'sharp',mo:'tight',bd:'none',cl:'armor',c1:'#5a6a8a',c2:'#b0b8c8'},
 zhaofan:{fs:'round',fw:24,age:1,hair:'knot',brow:'soft',eye:'round',mo:'smile',bd:'short',cl:'robe',c1:'#7a6a4a',c2:'#e0d8b8'},
 xiahouen:{fs:'oval',fw:22,age:0,hair:'knot',brow:'n',eye:'n',mo:'grin',bd:'none',cl:'armor',c1:'#4a5a7a',c2:'#c0c8d8'},
 xiahoumao:{fs:'oval',fw:22,sk:'#f6e0cc',age:0,hair:'knot',brow:'soft',eye:'narrow',mo:'smile',bd:'none',cl:'armor',c1:'#5a6a9a',c2:'#e0c060'},
 wangjing:{fs:'long',fw:23,age:1,hair:'knot',brow:'n',eye:'narrow',bd:'short',cl:'armor',c1:'#4a5a7a',c2:'#c0c8d8'},
 huli:{fs:'square',fw:24,age:1,hair:'knot',brow:'angry',eye:'narrow',bd:'short',cl:'armor',c1:'#3a4a78',c2:'#a8a8b0'},
 caizhong:{fs:'oval',fw:23,age:1,hair:'knot',brow:'n',eye:'narrow',mo:'grin',bd:'mus',cl:'armor',c1:'#5a6a8a',c2:'#b0b8c8'},
 caihe:{fs:'oval',fw:23,age:0,hair:'knot',brow:'n',eye:'narrow',mo:'grin',bd:'none',cl:'armor',c1:'#5a6a8a',c2:'#b0b8c8'},
 caimao:{fs:'long',fw:23,age:2,hair:'knot',brow:'angry',eye:'narrow',bd:'short',cl:'armor',c1:'#3a5a7a',c2:'#c0c8d8'},
 caoshuang:{fs:'round',fw:24,sk:'#f4dabe',age:1,hair:'knot',pin:'#c9b050',brow:'soft',eye:'round',mo:'smile',bd:'none',cl:'royal',c1:'#4a5a8a',c2:'#e0c060'},
 caozhen:{fs:'square',fw:25,age:2,hair:'knot',brow:'thick',eye:'n',bd:'short',cl:'armor',c1:'#3a4a7a',c2:'#c9a24a'},
 guanqiujian:{fs:'long',fw:23,age:2,hair:'knot',brow:'thick',eye:'narrow',bd:'short',cl:'armor',c1:'#5a5a5a',c2:'#c0b080'},
 fanjiang:{fs:'square',fw:24,sk:'#a07048',age:1,hair:'wild',brow:'angry',eye:'narrow',mo:'frown',bd:'short',cl:'light',c1:'#555',c2:'#888'},
 zhangda:{fs:'long',fw:23,sk:'#a07048',age:1,hair:'knot',brow:'angry',eye:'narrow',mo:'tight',bd:'mus',cl:'light',c1:'#555',c2:'#888'},
 hanxuan:{fs:'sharp',fw:22,age:2,hair:'knot',brow:'angry',eye:'narrow',nose:'hook',mo:'grin',bd:'goatee',cl:'robe',c1:'#7a6a4a',c2:'#e0d8b8'},
 xugongke:{fs:'sharp',fw:22,sk:'#a87450',age:0,hair:'wild',band:'#222',brow:'angry',eye:'sharp',mo:'tight',bd:'stub',cl:'light',c1:'#333',c2:'#6a6a6a'},
 jianyong:{fs:'round',fw:24,age:1,hair:'knot',brow:'soft',eye:'narrow',mo:'grin',bd:'short',cl:'robe',c1:'#8a8a6a',c2:'#e0dcc8'},
 mizhu:{fs:'round',fw:24,age:1,hair:'knot',brow:'soft',eye:'round',mo:'smile',bd:'short',cl:'robe',c1:'#8a7a5a',c2:'#e8dcc0'},
 sima_:{}
};
const FEMALE={diaochan:1,mifuren:1,sunshangxiang:1,xumu:1,wuguotai:1,zhurong:1};
function phash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function hexOf(n){return typeof n==='string'?n:'#'+('000000'+((n|0)>>>0).toString(16)).slice(-6);}
function rgbOf(hex){hex=hexOf(hex);const m=/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(hex);if(m)return [+m[1],+m[2],+m[3]];let h=hex.slice(1);if(h.length===3)h=h.replace(/./g,function(c){return c+c;});const n=parseInt(h,16);return [n>>16,n>>8&255,n&255];}
function shadeC(hex,k){const q=rgbOf(hex);let r=q[0],g=q[1],b=q[2];
  if(k<0){r*=1+k;g*=1+k;b*=1+k;}else{r+=(255-r)*k;g+=(255-g)*k;b+=(255-b)*k;}return 'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';}
function lumOf(hex){const q=rgbOf(hex);return (q[0]*.3+q[1]*.59+q[2]*.11)/255;}
// 決まっていない武将は、元の顔設定と名前から組み合わせを決める
// 一人ずつの顔の違い：目鼻口の位置と大きさ、輪郭、ほくろ・しわなど（名前から決まる）
function varOf(h,fem){let sd=phash(h.id+'#v'+h.n)||9;const R=function(a,b){sd=(sd*16807)%2147483647;return a+(sd/2147483647)*(b-a);};const k=fem?.45:1;
  return {eyo:R(-2.6,2.6)*k,es:1+R(-.12,.14)*k,ez:1+R(-.16,.22)*k,tl:R(-1.4,1.8)*k,nl:1+R(-.16,.22)*k,nw:1+R(-.2,.34)*k,mw:1+R(-.18,.26)*k,ch:R(-3,4)*k,fw:R(-1.6,2.2)*k,br:R(-1.6,1.6)*k,
    sk:(fem?R(-.06,.1):R(-.16,.03)),kn:1+R(-.25,.35),mole:R(0,1)<.18,mx:R(-1,1),my:R(0,1),bags:R(0,1)<.3,lines:R(0,1)<.35,cheek:R(0,1)<.4,lip:R(0,1),hl:Math.floor(R(0,4)),kp:Math.floor(R(0,5)),strays:R(0,1)<.12,grey:R(0,1)<.6,hood:R(0,1),bt:R(0,1)};}
function specOf(h){
  const base=PSPEC[h.id];const r=phash(h.id+h.n);const pk=function(a,k){return a[(r>>>k)%a.length];};
  const L=h.lk||{};const fem=FEMALE[h.id];
  const s={fs:pk(['oval','square','long','round','sharp'],1),fw:21+((r>>>4)%6),age:(L.b===2&&lumOf(L.bc||0)>.7)?3:pk([0,1,1,2],7),hair:fem?'bun':pk(['knot','knot','knot','tail','wild','knot','loose','knot'],9),
    brow:pk(['n','thick','angry','soft','thin','bushy'],11),eye:pk(['n','narrow','sharp','round'],13),nose:pk(['n','n','wide','thin','hook'],15),mo:pk(['n','tight','smile','frown','grin'],17),
    bd:fem?'none':L.b===2?pk(['full','long','full'],19):L.b===1?pk(['short','mus','goatee','fork','short'],19):pk(['none','none','stub'],19),
    cl:fem?'lady':h.f==='南蛮'?'south':(h.i>=80&&h.p<78)?'robe':L.h==='crown'?'royal':'armor',
    c1:hexOf(L.c!==undefined?L.c:0x556070),c2:hexOf(L.t!==undefined?L.t:0xc9a23c),c3:L.cape?hexOf(L.cape):null,sk:hexOf(L.sk||0xe0b090),bc:hexOf(L.bc||0x1a1410),hc:'#1a1410',x:[]};
  if(L.patch)s.x.push('patch');if(fem)s.x.push('fem');
  if(base)Object.assign(s,base);
  if(!s.sk)s.sk=hexOf(L.sk||0xe0b090);
  if(base&&!base.sk&&L.sk)s.sk=hexOf(L.sk);
  if(s.age>=3&&!base){s.hc='#d8d6d0';s.bc='#e2e0da';s.brow='white';}
  s.x=s.x||[];
  return s;
}
function portrait2(h){
  if(!h)return '';
  if(PT2[h.id])return PT2[h.id];
  const S=specOf(h);const fem=S.x.indexOf('fem')>=0;const fat=S.x.indexOf('fat')>=0;
  const cv=document.createElement('canvas');cv.width=256;cv.height=288;const g=cv.getContext('2d');g.scale(2,2);
  let seed=phash(h.id)||7;const R=function(){seed=(seed*16807)%2147483647;return seed/2147483647;};
  const bgc={'魏':['#36508a','#0d1428'],'蜀':['#2f6e48','#0b1a10'],'呉':['#8a3430','#220a08'],'群':['#6e5a32','#1a140a'],'南蛮':['#6e4a22','#1a0e06'],'漢':['#7a6430','#1c1608'],'晋':['#6a2a3a','#1a0a10'],'烏桓':['#50505e','#121218']}[h.f]||['#555','#111'];
  // ---- 背景：古い絹に墨の山水、勢力の色は縁取りに
  let gr=g.createRadialGradient(64,56,10,64,72,110);gr.addColorStop(0,'#d9c69a');gr.addColorStop(.6,'#b49a68');gr.addColorStop(1,'#6e5634');g.fillStyle=gr;g.fillRect(0,0,128,144);
  g.fillStyle=bgc[0];g.globalAlpha=.22;g.fillRect(0,0,128,144);g.globalAlpha=1;
  for(let k=0;k<3;k++){g.globalAlpha=.10+k*.05;g.fillStyle='#2a1c10';g.beginPath();g.moveTo(0,144);let y0=70+k*16;for(let x=0;x<=128;x+=6)g.lineTo(x,y0-Math.abs(Math.sin(x*.045+k*1.7+R()*.4))*(22-k*6));g.lineTo(128,144);g.fill();}
  g.globalAlpha=.16;g.strokeStyle='#2a1c10';g.lineWidth=.6;for(let i=0;i<5;i++){const x=8+R()*112,y=10+R()*30;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+6,y-3,x+12,y);g.stroke();}g.globalAlpha=1;
  const V=varOf(h,fem);if(V.sk)S.sk=shadeC(S.sk,V.sk);
  if(!PSPEC[h.id]&&!fem&&S.age===2&&V.grey){S.hc='#6a6660';if(lumOf(S.bc)<.3)S.bc='#7a7670';}
  const war=!fem&&S.cl!=='robe'&&S.cl!=='royal';
  const BTY={zhugel:'lean',zhouy:'lean',zhaoy:'lean',mac:'lean',luxun:'lean',guojia:'lean',sima:'lean',simashi:'lean',zhonghui:'lean',jiangw:'lean',lubu:'n',sunc:'n',suns:'n',lingt:'lean',madai:'lean',xushu:'lean',pangt:'plump',yuanshu:'plump',liushan:'plump',dongz:'plump',xuc:'plump',mizhu:'plump',lusu:'plump',caoshuang:'plump',liuzhang:'plump',liub:'n',caoc:'lean'};
  const bt=fem?'n':BTY[h.id]?BTY[h.id]:fat||S.fs==='round'?'plump':S.fs==='sharp'?'lean':S.fs==='square'?(V.bt<.25?'plump':'n'):(V.bt<(war?.3:.45)?'lean':V.bt>.85?'plump':'n');
  const BT2={lean:{fw:-2.5,jw:.38,ja:.86,jy:12,hol:.34},n:{fw:0,jw:.46,ja:.92,jy:13,hol:.2},plump:{fw:2.2,jw:.56,ja:1,jy:16,hol:0}}[bt];
  const cx=64,top=33,fw=(fem?S.fw+V.fw:Math.max(21.5,S.fw+V.fw+(war?1:.3)+BT2.fw))*(fat?1.08:1),chin=(fem?86:S.fs==='long'?93:S.fs==='round'?88:91)+(fem?V.ch:Math.max(-1,V.ch)),ey=61+V.eyo;
  const sk=S.sk,skD=shadeC(sk,-.22),skDD=shadeC(sk,-.4),skL=shadeC(sk,.18);
  const hc=S.hc||'#1a1410',hcL=shadeC(hc,.25),hcD=shadeC(hc,-.35);
  const c1=S.c1,c2=S.c2||'#c9a23c',c3=S.c3||shadeC(c1,-.35);
  const stroke=function(col,w){g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';};
  g.save();g.translate(64,40);g.scale(1.13,1.13);g.translate(-64,-40); // 胸像を大きめに
  // ---- 後ろ髪
  if(S.hair==='loose'||S.hair==='braid'||(fem&&S.hair==='bun')){g.fillStyle=hcD;g.beginPath();g.moveTo(cx-fw-6,50);g.quadraticCurveTo(cx-fw-12,100,cx-fw-6,128);g.lineTo(cx+fw+6,128);g.quadraticCurveTo(cx+fw+12,100,cx+fw+6,50);g.closePath();if(S.hair!=='bun'||!fem)g.fill();}
  if(S.hair==='tail'){g.fillStyle=hc;g.beginPath();g.moveTo(cx+6,26);g.quadraticCurveTo(cx+30,30,cx+fw+8,70);g.quadraticCurveTo(cx+fw+14,96,cx+fw+4,112);g.quadraticCurveTo(cx+fw+2,86,cx+fw-6,64);g.closePath();g.fill();}
  // ---- マント
  if(S.cl==='armor'&&S.c3){g.fillStyle=shadeC(c3,-.15);g.beginPath();g.moveTo(4,144);g.lineTo(14,98);g.quadraticCurveTo(64,84,114,98);g.lineTo(124,144);g.fill();}
  // ---- 首
  const nk=fem?10:war?15:13;g.fillStyle=skD;g.beginPath();g.moveTo(cx-nk,80);g.lineTo(cx-nk-2,104);g.quadraticCurveTo(cx,110,cx+nk+2,104);g.lineTo(cx+nk,80);g.fill();
  if(!fem){g.strokeStyle='rgba(50,20,10,.25)';g.lineWidth=1;[-1,1].forEach(function(sd){g.beginPath();g.moveTo(cx+sd*(nk-2),86);g.quadraticCurveTo(cx+sd*(nk*.45),96,cx+sd*3,104);g.stroke();});}
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.moveTo(cx-10,86);g.quadraticCurveTo(cx,96,cx+10,86);g.lineTo(cx+10,82);g.lineTo(cx-10,82);g.fill();
  // ---- 服
  const shW=fem?40:S.cl==='armor'?52:fat?54:47;
  const body=function(fill){g.fillStyle=fill;g.beginPath();g.moveTo(cx-shW-14,144);g.quadraticCurveTo(cx-shW-8,108,cx-shW+6,102);g.quadraticCurveTo(cx-20,94,cx-11,98);g.lineTo(cx+11,98);g.quadraticCurveTo(cx+20,94,cx+shW-6,102);g.quadraticCurveTo(cx+shW+8,108,cx+shW+14,144);g.closePath();g.fill();};
  const lg=function(a,b,y0,y1){const q=g.createLinearGradient(0,y0,0,y1);q.addColorStop(0,a);q.addColorStop(1,b);return q;};
  if(S.cl==='armor'){
    const metal=S.metal||(lumOf(c1)>.6?'#cfd5dc':shadeC(c1,.15));
    body(lg(shadeC(c1,.1),shadeC(c1,-.35),98,144));
    // 小札（鎧の板）
    for(let y=108,row=0;y<146;y+=5,row++){for(let x=cx-36+(row%2)*3.5;x<cx+36;x+=7){g.fillStyle=row%2?shadeC(metal,-.1):metal;g.beginPath();g.moveTo(x-3,y);g.lineTo(x+3,y);g.lineTo(x+3,y+4);g.quadraticCurveTo(x,y+6,x-3,y+4);g.fill();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=.5;g.stroke();}
      g.strokeStyle=shadeC(c2,-.1);g.lineWidth=.6;g.beginPath();g.moveTo(cx-38,y+2);g.lineTo(cx+38,y+2);g.stroke();}
    // 護心鏡
    const mr=g.createRadialGradient(cx-2,124,1,cx,126,9);mr.addColorStop(0,'#fff');mr.addColorStop(.35,shadeC(metal,.2));mr.addColorStop(1,shadeC(metal,-.35));g.fillStyle=mr;g.beginPath();g.arc(cx,126,8,0,7);g.fill();stroke(c2,1.6);g.stroke();
    // 肩当て
    [-1,1].forEach(function(sd){const x0=cx+sd*(shW-6);g.fillStyle=lg(shadeC(metal,.15),shadeC(metal,-.4),98,130);g.beginPath();g.moveTo(x0-sd*16,100);g.quadraticCurveTo(x0+sd*14,94,x0+sd*18,116);g.quadraticCurveTo(x0+sd*8,124,x0-sd*12,118);g.closePath();g.fill();stroke(c2,1.4);g.stroke();
      for(let k=1;k<4;k++){g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=.6;g.beginPath();g.moveTo(x0-sd*(14-k),101+k*5);g.quadraticCurveTo(x0+sd*8,97+k*5,x0+sd*(16-k),112+k*2);g.stroke();}
      if(S.x.indexOf('lion')>=0){g.fillStyle=c2;g.beginPath();g.arc(x0+sd*2,107,5,0,7);g.fill();g.fillStyle='#3a2a10';g.fillRect(x0+sd*2-2,106,1.4,1.4);g.fillRect(x0+sd*2+.8,106,1.4,1.4);}});
    // 襟巻き
    g.fillStyle=c3;g.beginPath();g.moveTo(cx-17,96);g.quadraticCurveTo(cx,108,cx+17,96);g.lineTo(cx+13,92);g.quadraticCurveTo(cx,100,cx-13,92);g.fill();
  }else if(S.cl==='robe'||S.cl==='royal'||S.cl==='lady'){
    body(lg(shadeC(c1,.12),shadeC(c1,-.3),98,144));
    // 衣のしわ
    g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;for(let i=0;i<5;i++){g.beginPath();const x=cx-40+i*20+R()*6;g.moveTo(x,110);g.quadraticCurveTo(x+4,128,x-2,144);g.stroke();}
    // 中の白い衣と交差した襟（右前）
    g.fillStyle=fem?'#fbf4ea':'#f1ece0';g.beginPath();g.moveTo(cx-12,97);g.lineTo(cx,124);g.lineTo(cx+12,97);g.fill();
    const band=S.cl==='royal'?8:6;
    g.fillStyle=c2;g.beginPath();g.moveTo(cx+14,96);g.lineTo(cx+14+band*.6,99);g.lineTo(cx-6+band*.3,144);g.lineTo(cx-6-band,144);g.closePath();g.fill();
    g.beginPath();g.moveTo(cx-14,96);g.lineTo(cx-14-band*.6,99);g.lineTo(cx-2,126);g.lineTo(cx+2,120);g.closePath();g.fill();
    if(fem){g.fillStyle=shadeC(c2,-.2);g.beginPath();g.moveTo(cx+10,97);g.lineTo(cx+12,99);g.lineTo(cx-2,130);g.lineTo(cx-4,128);g.fill();}
    if(S.cl==='royal'){ // 雲と龍の刺繍
      g.strokeStyle=c2;g.lineWidth=1.1;[[cx-34,116],[cx+30,112],[cx-24,134],[cx+36,134]].forEach(function(p){g.beginPath();g.arc(p[0],p[1],4,Math.PI*.2,Math.PI*1.8);g.stroke();g.beginPath();g.arc(p[0]+6,p[1]+1,3,Math.PI*1.1,Math.PI*2.6);g.stroke();});
      g.fillStyle=c2;g.beginPath();g.arc(cx,134,3,0,7);g.fill();}
    if(S.cl==='lady'){ // 披帛（薄い肩掛け）
      g.globalAlpha=.45;g.fillStyle=shadeC(c2,.2);g.beginPath();g.moveTo(cx-shW-10,124);g.quadraticCurveTo(cx-20,104,cx,108);g.quadraticCurveTo(cx+20,104,cx+shW+10,124);g.lineTo(cx+shW+10,132);g.quadraticCurveTo(cx,114,cx-shW-10,132);g.fill();g.globalAlpha=1;
      g.fillStyle='#e8c040';for(let i=-3;i<=3;i++){g.beginPath();g.arc(cx+i*3.2,103+Math.abs(i)*-.6+3,1.1,0,7);g.fill();}}
  }else if(S.cl==='south'){
    body(lg(skL,skDD,98,144));
    if(S.x.indexOf('tattoo')>=0){g.strokeStyle='rgba(20,40,60,.55)';g.lineWidth=1.4;[-1,1].forEach(function(sd){for(let k=0;k<3;k++){g.beginPath();g.moveTo(cx+sd*(30+k*4),112+k*6);g.lineTo(cx+sd*(40+k*4),118+k*6);g.lineTo(cx+sd*(32+k*4),124+k*6);g.stroke();}});}
    if(fem){g.fillStyle=c1;g.beginPath();g.moveTo(cx-26,118);g.quadraticCurveTo(cx,112,cx+26,118);g.lineTo(cx+24,144);g.lineTo(cx-24,144);g.fill();stroke(c2,1.2);g.stroke();}
    // 毛皮
    g.fillStyle=S.x.indexOf('fur')>=0?'#6a5034':c1;g.beginPath();g.moveTo(cx-shW-4,108);for(let i=0;i<=16;i++){const x=cx-shW-4+i*(shW*2+8)/16;g.lineTo(x,102+(i%2?10:4)+(i>5&&i<11?6:0));}g.lineTo(cx+shW+4,98);g.quadraticCurveTo(cx,88,cx-shW-4,98);g.fill();
    g.strokeStyle='rgba(255,240,200,.25)';g.lineWidth=.6;for(let i=0;i<30;i++){const x=cx-shW+R()*shW*2;g.beginPath();g.moveTo(x,98+R()*6);g.lineTo(x+R()*2-1,104+R()*6);g.stroke();}
    // 骨と玉の首飾り
    for(let i=-5;i<=5;i++){g.fillStyle=i%2?'#f0e8d0':c2;g.beginPath();g.ellipse(cx+i*3.6,104+Math.abs(i)*-.5+4+(5-Math.abs(i))*.8,1.4,i%2?2.4:1.6,0,0,7);g.fill();}
  }else{ // light：布の服に革帯
    body(lg(shadeC(c1,.1),shadeC(c1,-.35),98,144));
    g.fillStyle='#4a3020';g.beginPath();g.moveTo(cx-34,104);g.lineTo(cx-28,102);g.lineTo(cx+30,144);g.lineTo(cx+22,144);g.fill();
    for(let i=0;i<5;i++){g.fillStyle=c2;g.beginPath();g.arc(cx-26+i*12,110+i*8.2,1.4,0,7);g.fill();}
    g.fillStyle=shadeC(c2,-.2);g.beginPath();g.moveTo(cx-15,96);g.quadraticCurveTo(cx,106,cx+15,96);g.lineTo(cx+12,93);g.quadraticCurveTo(cx,100,cx-12,93);g.fill();
  }
  // ---- 耳
  const earY=ey+3,big=S.x.indexOf('ears')>=0;
  [-1,1].forEach(function(sd){g.fillStyle=skD;g.beginPath();g.ellipse(cx+sd*(fw-1),earY+(big?3:0),4.2,big?11:8,sd*.1,0,7);g.fill();g.fillStyle=skDD;g.beginPath();g.ellipse(cx+sd*(fw-.5),earY+(big?3:0),2,big?7:5,0,0,7);g.fill();
    if(S.x.indexOf('bell')>=0||fem){g.fillStyle='#e8c040';g.beginPath();g.arc(cx+sd*(fw-1),earY+(big?13:8),1.6,0,7);g.fill();}});
  // ---- 顔
  const jaw={square:.84,round:.8,oval:.66,long:.58,sharp:.5}[S.fs]||.66;
  const jw=BT2.jw+(S.fs==='square'?.08:0)+(war?.03:0)-(S.age<1&&!fat?.04:0),ja=BT2.ja,jy=BT2.jy;
  const facePathM=fem?null:function(){g.beginPath();g.moveTo(cx,top);g.bezierCurveTo(cx+fw*.78,top,cx+fw*1.02,top+8,cx+fw*1.02,top+22);
    [1,-1].forEach(function(sd,i){if(i){g.lineTo(cx,chin+1);}
      const P=function(x,y){return [cx+sd*x,y];};
      if(sd>0){g.bezierCurveTo(cx+fw*1.02,top+34,cx+fw*(ja+.06),chin-24,cx+fw*ja,chin-jy);g.quadraticCurveTo(cx+fw*(ja-.08),chin-3,cx+fw*jw,chin-.5);g.quadraticCurveTo(cx+fw*.28,chin+1.5,cx,chin+1.5);}
      else{g.quadraticCurveTo(cx-fw*.28,chin+1.5,cx-fw*jw,chin-.5);g.quadraticCurveTo(cx-fw*(ja-.08),chin-3,cx-fw*ja,chin-jy);g.bezierCurveTo(cx-fw*(ja+.06),chin-24,cx-fw*1.02,top+34,cx-fw*1.02,top+22);g.bezierCurveTo(cx-fw*1.02,top+8,cx-fw*.78,top,cx,top);}});g.closePath();};
  const facePathF=function(){g.beginPath();g.moveTo(cx,top);g.bezierCurveTo(cx+fw*.75,top,cx+fw,top+8,cx+fw,top+22);g.bezierCurveTo(cx+fw,top+34,cx+fw*.98,chin-20,cx+fw*jaw,chin-8);
    g.quadraticCurveTo(cx+fw*.3,chin+(S.fs==='square'?0:1),cx,chin);g.quadraticCurveTo(cx-fw*.3,chin+(S.fs==='square'?0:1),cx-fw*jaw,chin-8);g.bezierCurveTo(cx-fw*.98,chin-20,cx-fw,top+34,cx-fw,top+22);g.bezierCurveTo(cx-fw,top+8,cx-fw*.75,top,cx,top);g.closePath();};
  const facePath=facePathM||facePathF;
  facePath();const fg=g.createRadialGradient(cx-6,ey-6,4,cx,ey+4,fw*1.6);fg.addColorStop(0,skL);fg.addColorStop(.55,sk);fg.addColorStop(1,skD);g.fillStyle=fg;g.fill();
  g.save();facePath();g.clip();
  // 頬と顎の影
  g.fillStyle='rgba(0,0,0,.12)';g.beginPath();g.ellipse(cx+fw*.9,ey+12,8,18,0,0,7);g.fill();
  if(!fem){
    const sh=function(x,y,rx,ry,rot,a){const gg=g.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));gg.addColorStop(0,'rgba(60,25,10,'+a+')');gg.addColorStop(1,'rgba(60,25,10,0)');g.fillStyle=gg;g.save();g.translate(x,y);g.rotate(rot);g.scale(rx/Math.max(rx,ry),ry/Math.max(rx,ry));g.translate(-x,-y);g.beginPath();g.arc(x,y,Math.max(rx,ry),0,7);g.fill();g.restore();};
    [-1,1].forEach(function(sd){sh(cx+sd*fw*.46,ey-1,9,5,0,.32); // 眼窩
      if(BT2.hol)sh(cx+sd*fw*.74,ey+15,4.5,10,sd*.35,BT2.hol); // 頬骨の下のくぼみ
      if(bt==='plump'){g.fillStyle='rgba(255,200,170,.10)';g.beginPath();g.ellipse(cx+sd*fw*.6,ey+15,7,6,0,0,7);g.fill();}
      sh(cx+sd*fw*.85,chin-8,6,7,0,.3);}); // 顎の角
    sh(cx,chin+1,fw*.45,3.5,0,.22); // あご下
    g.fillStyle='rgba(255,235,210,.08)';[-1,1].forEach(function(sd){g.beginPath();g.ellipse(cx+sd*fw*.6,ey+6,5,2.4,sd*-.3,0,7);g.fill();}); // 頬骨のつや
    g.fillStyle='rgba(255,235,210,.13)';g.beginPath();g.ellipse(cx,top+14,fw*.5,5,0,0,7);g.fill(); // 額のつや
    g.fillStyle='rgba(255,235,210,.12)';g.beginPath();g.ellipse(cx,chin-4,fw*.22,2.6,0,0,7);g.fill();}
  g.fillStyle=fem?'rgba(255,110,120,.22)':'rgba(200,80,60,.05)';[-1,1].forEach(function(sd){g.beginPath();g.ellipse(cx+sd*fw*.55,ey+10,6,4,0,0,7);g.fill();});
  if(S.age>=2){g.strokeStyle='rgba(60,30,20,.28)';g.lineWidth=.7;g.beginPath();g.moveTo(cx-9,top+8);g.quadraticCurveTo(cx,top+6,cx+9,top+8);g.stroke();if(S.age>=3){g.beginPath();g.moveTo(cx-11,top+12);g.quadraticCurveTo(cx,top+10,cx+11,top+12);g.stroke();
    [-1,1].forEach(function(sd){g.beginPath();g.moveTo(cx+sd*15,ey+3);g.lineTo(cx+sd*19,ey+1);g.moveTo(cx+sd*15,ey+5);g.lineTo(cx+sd*19,ey+5);g.stroke();g.beginPath();g.ellipse(cx+sd*11,ey+5,4,1.5,0,0,Math.PI);g.stroke();});}
    [-1,1].forEach(function(sd){g.beginPath();g.moveTo(cx+sd*6,ey+12);g.quadraticCurveTo(cx+sd*10,ey+18,cx+sd*9,ey+24);g.stroke();});}
  if(S.bd==='stub'||S.bd==='short'||S.bd==='full'||S.bd==='tiger'){g.fillStyle='rgba(40,30,30,'+(S.bd==='stub'?.25:.18)+')';g.beginPath();g.moveTo(cx-fw,ey+8);g.quadraticCurveTo(cx-fw*.9,chin,cx,chin+1);g.quadraticCurveTo(cx+fw*.9,chin,cx+fw,ey+8);g.lineTo(cx+fw*.6,ey+12);g.quadraticCurveTo(cx,chin-6,cx-fw*.6,ey+12);g.fill();}
  g.restore();
  // 輪郭の線
  facePath();g.strokeStyle='rgba(40,20,10,.55)';g.lineWidth=1;g.stroke();
  // ---- 女性の顔：柳眉・切れ長の大きな目・小さな鼻・紅をさした唇・花鈿
  let ny=ey+13*V.nl,my=ny+7.5,mw=(fem?4.6:S.mo==='grin'?7:5.8)*V.mw;
  if(fem){const young=S.age<2,ex2=fw*.47,ic2=S.ic||'#3a2414';
    [-1,1].forEach(function(sd){g.fillStyle=shadeC(hc,.15);g.beginPath();g.moveTo(cx+sd*4,ey-7);g.quadraticCurveTo(cx+sd*(ex2+1),ey-12.5,cx+sd*(ex2+9.5),ey-8);g.quadraticCurveTo(cx+sd*(ex2+1),ey-10.8,cx+sd*4,ey-5.8);g.fill();});
    [-1,1].forEach(function(sd){const exx=cx+sd*ex2,ew=S.eye==='phoenix'?7.6:7,eh=young?3.1:2.4,lift=S.eye==='phoenix'?2.6:1.5;
      if(young){const sh=g.createRadialGradient(exx+sd*2,ey-4,0,exx+sd*2,ey-4,9);sh.addColorStop(0,'rgba(200,70,80,.32)');sh.addColorStop(1,'rgba(200,70,80,0)');g.fillStyle=sh;g.beginPath();g.ellipse(exx+sd*2,ey-3.5,10,5,sd*.2,0,7);g.fill();}
      const eyeP=function(){g.beginPath();g.moveTo(exx-sd*ew,ey+.8);g.bezierCurveTo(exx-sd*ew*.5,ey-eh*1.3,exx+sd*ew*.55,ey-eh*1.25-lift,exx+sd*ew,ey-lift);g.bezierCurveTo(exx+sd*ew*.5,ey+eh*.9,exx-sd*ew*.4,ey+eh*1.05,exx-sd*ew,ey+.8);g.closePath();};
      eyeP();g.fillStyle='#fbf8f2';g.fill();g.save();eyeP();g.clip();
      const ir=eh*1.05+.5;const igr=g.createRadialGradient(exx,ey-1,.2,exx,ey-.6,ir);igr.addColorStop(0,shadeC(ic2,.45));igr.addColorStop(.6,ic2);igr.addColorStop(1,'#0a0503');g.fillStyle=igr;g.beginPath();g.arc(exx,ey-.6,ir,0,7);g.fill();
      g.fillStyle='#050302';g.beginPath();g.arc(exx,ey-.6,ir*.42,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(exx-sd*1.1,ey-1.9,1,0,7);g.fill();g.globalAlpha=.7;g.beginPath();g.arc(exx+sd*1.2,ey+.6,.5,0,7);g.fill();g.globalAlpha=1;
      g.fillStyle='rgba(80,40,30,.2)';g.fillRect(exx-ew,ey-eh*1.6,ew*2,1.8);g.restore();
      stroke('#140806',1.7);g.beginPath();g.moveTo(exx-sd*ew,ey+.8);g.bezierCurveTo(exx-sd*ew*.5,ey-eh*1.3,exx+sd*ew*.55,ey-eh*1.25-lift,exx+sd*(ew+1.8),ey-lift-1.4);g.stroke();
      g.lineWidth=.6;for(let k=0;k<3;k++){const t=.62+k*.16;const lx=exx-sd*ew+sd*ew*2*t;g.beginPath();g.moveTo(lx,ey-eh*1.05-lift*t*.9);g.quadraticCurveTo(lx+sd*1,ey-eh*1.5-lift*t,lx+sd*2.2,ey-eh*1.8-lift*t-.6);g.stroke();}
      g.strokeStyle='rgba(90,40,30,.55)';g.lineWidth=.6;g.beginPath();g.moveTo(exx-sd*ew*.6,ey-eh*1.3-.9);g.quadraticCurveTo(exx,ey-eh*1.8-lift*.4,exx+sd*ew*.9,ey-eh*1.1-lift-.6);g.stroke();
      g.strokeStyle='rgba(90,40,30,.4)';g.beginPath();g.moveTo(exx-sd*ew*.7,ey+eh*.95);g.quadraticCurveTo(exx,ey+eh*1.35,exx+sd*ew*.8,ey+eh*.5-lift*.4);g.stroke();});
    const ny2=ey+12.5;g.strokeStyle='rgba(120,60,40,.3)';g.lineWidth=.8;g.beginPath();g.moveTo(cx+1.4,ey+4);g.quadraticCurveTo(cx+2.2,ny2-3,cx+1.4,ny2);g.stroke();
    g.fillStyle='rgba(120,50,40,.3)';g.beginPath();g.ellipse(cx-1.6,ny2+.6,.9,.6,0,0,7);g.ellipse(cx+1.6,ny2+.6,.9,.6,0,0,7);g.fill();g.fillStyle='rgba(255,255,255,.4)';g.beginPath();g.ellipse(cx+.3,ny2-2,.8,2,0,0,7);g.fill();
    const my2=ny2+7,lw=4.4,lc=young?'#c22838':'#a8444a';
    g.fillStyle=shadeC(lc,-.15);g.beginPath();g.moveTo(cx-lw,my2);g.quadraticCurveTo(cx-2,my2-2.4,cx,my2-1.3);g.quadraticCurveTo(cx+2,my2-2.4,cx+lw,my2);g.quadraticCurveTo(cx,my2+.5,cx-lw,my2);g.fill();
    g.fillStyle=lc;g.beginPath();g.moveTo(cx-lw+.6,my2+.2);g.quadraticCurveTo(cx,my2+3.6,cx+lw-.6,my2+.2);g.quadraticCurveTo(cx,my2+.9,cx-lw+.6,my2+.2);g.fill();
    g.fillStyle='rgba(255,255,255,.45)';g.beginPath();g.ellipse(cx-.6,my2+1.6,1.3,.5,0,0,7);g.fill();
    g.fillStyle='rgba(255,255,255,.18)';[-1,1].forEach(function(sd){g.beginPath();g.ellipse(cx+sd*fw*.55,ey+6,4,2.2,sd*.3,0,7);g.fill();});
    if(young){g.fillStyle='#d0203a';const fy=top+9;for(let k=0;k<3;k++){g.beginPath();g.ellipse(cx+(k-1)*1.5,fy+(k===1?-1:0),.9,2,(k-1)*.5,0,7);g.fill();}g.fillStyle='#f0c040';g.beginPath();g.arc(cx,fy+1.6,.6,0,7);g.fill();}
  }else{
  // ---- 眉
  const by=ey-8+V.br,ex=fw*.46*V.es;
  [-1,1].forEach(function(sd){const x0=cx+sd*4,x1=cx+sd*(ex+8);
    const bcol=S.brow==='white'?'#e8e6e0':(S.bd!=='none'&&S.bc&&S.age<3?S.bc:hc);g.fillStyle=bcol;g.strokeStyle=bcol;
    if(fem&&S.brow!=='angry'){g.lineWidth=fem?1.1:1.4;g.beginPath();g.moveTo(x0,by+(S.brow==='soft'?1:0));g.quadraticCurveTo(cx+sd*(ex+1),by-3,x1,by+1);g.stroke();}
    else if(S.brow==='angry'){g.beginPath();g.moveTo(x0,by+2);g.lineTo(x1,by-3);g.lineTo(x1-sd*1,by-.5);g.lineTo(x0,by+3.6);g.fill();}
    else if(S.brow==='bushy'){g.beginPath();g.moveTo(x0,by+2.5);g.quadraticCurveTo(cx+sd*(ex),by-6,x1+sd*2,by-1);g.quadraticCurveTo(cx+sd*(ex+1),by-1,x0,by+4.6);g.fill();g.globalAlpha=.5;g.lineWidth=.6;for(let k=0;k<12;k++){const t=k/11;const xx=x0+(x1-x0)*t,yy=by+1-Math.sin(t*2.6)*2.6;g.beginPath();g.moveTo(xx,yy+1.5);g.quadraticCurveTo(xx+sd*1.5,yy-1,xx+sd*3,yy-2.4);g.stroke();}g.globalAlpha=1;}
    else if(S.brow==='thick'||S.brow==='white'){g.beginPath();g.moveTo(x0,by+1);g.quadraticCurveTo(cx+sd*(ex+1),by-4.5,x1+sd*1,by+.5);g.quadraticCurveTo(cx+sd*(ex+1),by-1,x0,by+3.4);g.fill();}
    else{const up=S.brow==='soft'?-1:S.brow==='thin'?1.4:0;g.beginPath();g.moveTo(x0,by+1.8);g.quadraticCurveTo(cx+sd*(ex),by-4-up,x1+sd*1.5,by-1.2-up);g.quadraticCurveTo(cx+sd*(ex),by-.6-up*.5,x0,by+3.8);g.fill();}
    if(!fem){g.globalAlpha=.45;g.lineWidth=.55;for(let k=0;k<9;k++){const t=k/8;const xx=x0+(x1-x0)*t,yy=by+2-t*3;g.beginPath();g.moveTo(xx,yy+1);g.lineTo(xx+sd*2.6,yy-1.4);g.stroke();}g.globalAlpha=1;}});
  // ---- 目
  const ic=S.ic||'#2a1a10';
  [-1,1].forEach(function(sd){if(sd<0&&S.x.indexOf('patch')>=0)return;
    const exx=cx+sd*ex,ew=(S.eye==='phoenix'?7.4:S.eye==='round'?5.6:6.3)*V.ez,eh=(S.eye==='round'?3.6:S.eye==='narrow'?1.9:S.eye==='sharp'?2.3:2.8)*V.ez,lift=(S.eye==='phoenix'?2.6:S.eye==='sharp'?1.4:0)+V.tl;
    const eyeP=function(){g.beginPath();g.moveTo(exx-sd*ew*.95,ey+.5);g.quadraticCurveTo(exx,ey-eh*1.25-lift*.3,exx+sd*ew,ey-lift);g.quadraticCurveTo(exx,ey+eh*.95,exx-sd*ew*.95,ey+.5);g.closePath();};
    eyeP();g.fillStyle='#f6f2ea';g.fill();g.save();eyeP();g.clip();
    const ir=Math.min(3.4,eh*1.2+.9);const igr=g.createRadialGradient(exx,ey-.6,.3,exx,ey-.3,ir);igr.addColorStop(0,shadeC(ic,.25));igr.addColorStop(.7,ic);igr.addColorStop(1,'#000');g.fillStyle=igr;g.beginPath();g.arc(exx,ey-.4,ir,0,7);g.fill();
    g.fillStyle='#050302';g.beginPath();g.arc(exx,ey-.4,ir*.45,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(exx-sd*.9,ey-1.4,.75,0,7);g.fill();
    g.fillStyle='rgba(0,0,0,.18)';g.fillRect(exx-ew,ey-eh*1.4,ew*2,1.6);g.restore();
    stroke('#140a06',fem?1.6:2.1);g.beginPath();g.moveTo(exx-sd*ew*.95,ey+.5);g.quadraticCurveTo(exx,ey-eh*1.25-lift*.3,exx+sd*ew*1.08,ey-lift-.4);g.stroke();
    if(!fem){g.lineWidth=.9;g.beginPath();g.moveTo(exx+sd*ew*.4,ey+eh*.85);g.quadraticCurveTo(exx+sd*ew*.85,ey+eh*.5,exx+sd*ew*1.08,ey-lift-.2);g.stroke();}
    if(fem){g.lineWidth=.8;for(let k=0;k<3;k++){g.beginPath();g.moveTo(exx+sd*(ew*.5+k*1.2),ey-eh-lift*.6+k*.4);g.lineTo(exx+sd*(ew*.7+k*1.6),ey-eh-lift*.6-1.6+k*.4);g.stroke();}}
    g.strokeStyle='rgba(60,30,20,.35)';g.lineWidth=.6;g.beginPath();g.moveTo(exx-sd*ew*.7,ey-eh-2.2);g.quadraticCurveTo(exx,ey-eh-3.4-lift*.3,exx+sd*ew*.8,ey-eh-1.6-lift);g.stroke();
    g.beginPath();g.moveTo(exx-sd*ew*.6,ey+eh*.95);g.quadraticCurveTo(exx,ey+eh*1.25,exx+sd*ew*.7,ey+eh*.6-lift*.5);g.stroke();});
  if(S.x.indexOf('patch')>=0){g.fillStyle='#14100c';g.beginPath();g.ellipse(cx-ex,ey,8,6.5,0,0,7);g.fill();stroke('#14100c',1.2);g.beginPath();g.moveTo(cx-fw-2,ey-10);g.lineTo(cx+fw+2,ey-1);g.stroke();}
  // ---- 鼻
  ny=ey+13*V.nl;g.strokeStyle='rgba(70,30,20,.5)';g.lineWidth=1;g.beginPath();
  if(S.nose==='hook'){g.moveTo(cx+1,ey+1);g.quadraticCurveTo(cx+4,ny-5,cx+2,ny);}else{g.moveTo(cx+1.5,ey+2);g.lineTo(cx+2,ny-2);}g.stroke();
  const nwid=(S.nose==='wide'?5.2:S.nose==='thin'?2.6:3.6)*V.nw;g.fillStyle='rgba(70,30,20,.35)';g.beginPath();g.ellipse(cx-nwid*.6,ny,1.3,.9,0,0,7);g.ellipse(cx+nwid*.6,ny,1.3,.9,0,0,7);g.fill();
  g.strokeStyle='rgba(70,30,20,.45)';g.beginPath();g.moveTo(cx-nwid,ny-1.5);g.quadraticCurveTo(cx-nwid-.8,ny+1,cx-nwid*.4,ny+1.2);g.moveTo(cx+nwid,ny-1.5);g.quadraticCurveTo(cx+nwid+.8,ny+1,cx+nwid*.4,ny+1.2);g.stroke();
  g.fillStyle='rgba(255,255,255,.25)';g.beginPath();g.ellipse(cx+.5,ny-5,1,3,0,0,7);g.fill();
  if(!fem){const ng=g.createLinearGradient(cx-5,0,cx-1,0);ng.addColorStop(0,'rgba(60,25,10,0)');ng.addColorStop(1,'rgba(60,25,10,.28)');g.fillStyle=ng;g.beginPath();g.moveTo(cx-3.5,ey-1);g.lineTo(cx-1,ey-1);g.lineTo(cx-1.6,ny-2);g.lineTo(cx-nwid-1,ny-1);g.closePath();g.fill();
    g.strokeStyle='rgba(60,25,10,.55)';g.lineWidth=1.1;g.beginPath();g.moveTo(cx-nwid-.6,ny-2.6);g.quadraticCurveTo(cx-nwid-2.2,ny+.6,cx-nwid*.3,ny+1.6);g.moveTo(cx+nwid+.6,ny-2.6);g.quadraticCurveTo(cx+nwid+2.2,ny+.6,cx+nwid*.3,ny+1.6);g.stroke();}
  // ---- 口
  my=ny+7.5;mw=(fem?4.6:S.mo==='grin'?7:5.8)*V.mw;
  if(fem){g.fillStyle='#c03a48';g.beginPath();g.moveTo(cx-mw,my);g.quadraticCurveTo(cx-1.5,my-2.2,cx,my-1.2);g.quadraticCurveTo(cx+1.5,my-2.2,cx+mw,my);g.quadraticCurveTo(cx,my+3.4,cx-mw,my);g.fill();}
  else{g.strokeStyle='#5a2418';g.lineWidth=1.3;g.beginPath();const cv2=S.mo==='smile'?2:S.mo==='frown'?-1.8:S.mo==='grin'?2.6:S.mo==='tight'?-.5:.6;
    g.moveTo(cx-mw,my-cv2*.5);g.quadraticCurveTo(cx,my+cv2,cx+mw,my-cv2*.5);g.stroke();
    if(S.mo==='grin'){g.fillStyle='#f4efe2';g.beginPath();g.moveTo(cx-mw+1.5,my-cv2*.3);g.quadraticCurveTo(cx,my+cv2*.9,cx+mw-1.5,my-cv2*.3);g.quadraticCurveTo(cx,my+.3,cx-mw+1.5,my-cv2*.3);g.fill();}
    g.fillStyle='rgba(150,60,50,.35)';g.beginPath();g.ellipse(cx,my+2.4,mw*.6,1.2,0,0,7);g.fill();
    g.fillStyle='rgba(60,25,10,.22)';g.beginPath();g.ellipse(cx,my+5.2,mw*.55,1.3,0,0,7);g.fill();g.strokeStyle='rgba(60,25,10,.25)';g.lineWidth=.7;g.beginPath();g.moveTo(cx-1.2,ny+2.5);g.lineTo(cx-1.2,my-1.6);g.moveTo(cx+1.2,ny+2.5);g.lineTo(cx+1.2,my-1.6);g.stroke();}
  }
  // ---- その人らしさ：頬骨・目の下・ほうれい線・ほくろ
  {const ex=fw*.46*V.es,nwid=(S.nose==='wide'?5.2:S.nose==='thin'?2.6:3.6)*V.nw;
  if(V.cheek&&!fem){g.fillStyle='rgba(60,25,10,.14)';[-1,1].forEach(function(sd){g.beginPath();g.ellipse(cx+sd*fw*.62,ey+9,3.4,6.5,sd*-.35,0,7);g.fill();});}
  if(V.bags&&S.age>=1){g.strokeStyle='rgba(70,30,20,.3)';g.lineWidth=.6;[-1,1].forEach(function(sd){g.beginPath();g.ellipse(cx+sd*ex,ey+4,5,1.8,0,.15,Math.PI-.15);g.stroke();});}
  if(V.lines&&!fem&&S.age>=1){g.strokeStyle='rgba(70,30,20,.28)';g.lineWidth=.7;[-1,1].forEach(function(sd){g.beginPath();g.moveTo(cx+sd*(nwid+1.5),ny-1);g.quadraticCurveTo(cx+sd*(nwid+4.5),ny+5,cx+sd*(mw+2.2),my+2.5);g.stroke();});}
  if(V.mole){g.fillStyle='rgba(50,22,12,.85)';g.beginPath();g.arc(cx+V.mx*fw*.55,ey+6+V.my*14,.9,0,7);g.fill();}
  }
  // ---- 傷・ほくろ
  if(S.x.indexOf('scar')>=0){stroke('rgba(120,30,30,.75)',1.1);g.beginPath();g.moveTo(cx+fw*.45,ey-12);g.lineTo(cx+fw*.75,ey+10);g.stroke();for(let k=0;k<4;k++){g.beginPath();g.moveTo(cx+fw*.48+k*1.6,ey-8+k*5);g.lineTo(cx+fw*.62+k*1.6,ey-9+k*5);g.stroke();}}
  if(S.x.indexOf('scar2')>=0){stroke('rgba(120,30,30,.7)',1);g.beginPath();g.moveTo(cx-fw*.7,ey+6);g.lineTo(cx-fw*.2,ey+16);g.stroke();}
  if(S.x.indexOf('mole')>=0){g.fillStyle='#3a2014';g.beginPath();g.arc(cx+8,my+3,1,0,7);g.fill();}
  // ---- 髭（毛並みを描く）
  const bc=S.bc||hc,bcL=shadeC(bc,.3),bcD=shadeC(bc,-.3);
  const strands=function(n,x0,x1,y0,y1,len,col,curve){g.strokeStyle=col;g.lineWidth=.55;for(let i=0;i<n;i++){const x=x0+R()*(x1-x0),y=y0+R()*(y1-y0);g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+(x-cx)*.08+(R()-.5)*1.5,y+len*.5,x+(x-cx)*(curve||.12),y+len*(.7+R()*.5));g.stroke();}};
  const mus=function(w,droop){g.fillStyle=bc;[-1,1].forEach(function(sd){g.beginPath();g.moveTo(cx+sd*.5,my-4);g.quadraticCurveTo(cx+sd*w*.7,my-5.5,cx+sd*w,my-1+droop);g.quadraticCurveTo(cx+sd*w*.6,my-2.4,cx+sd*.5,my-2.2);g.fill();});};
  if(S.bd==='mus'||S.bd==='goatee'||S.bd==='fork')mus(fem?0:8,S.bd==='fork'?3:1);
  if(S.bd==='goatee'){g.fillStyle=bc;g.beginPath();g.moveTo(cx-3.5,chin-5);g.quadraticCurveTo(cx,chin+12,cx+.5,chin+16);g.quadraticCurveTo(cx+3,chin+6,cx+3.5,chin-5);g.fill();strands(12,cx-3,cx+3,chin-4,chin,12,bcL,.05);}
  if(S.bd==='fork'){g.fillStyle=bc;[-1,1].forEach(function(sd){g.beginPath();g.moveTo(cx+sd*4,chin-6);g.quadraticCurveTo(cx+sd*6,chin+8,cx+sd*4.5,chin+18);g.quadraticCurveTo(cx+sd*1,chin+6,cx,chin-4);g.fill();});strands(16,cx-5,cx+5,chin-4,chin+2,14,bcL,.06);}
  if(S.bd==='short'){mus(9,1.5);g.fillStyle=bc;g.beginPath();g.moveTo(cx-fw*.62,ey+14);g.quadraticCurveTo(cx-fw*.6,chin+2,cx,chin+6);g.quadraticCurveTo(cx+fw*.6,chin+2,cx+fw*.62,ey+14);g.quadraticCurveTo(cx+fw*.4,chin-2,cx+mw,my+2);g.quadraticCurveTo(cx,my+5,cx-mw,my+2);g.quadraticCurveTo(cx-fw*.4,chin-2,cx-fw*.62,ey+14);g.fill();strands(26,cx-fw*.55,cx+fw*.55,my+3,chin,6,bcL,.1);}
  if(S.bd==='full'||S.bd==='long'||S.bd==='tiger'){
    const L2=S.bd==='long'?56:S.bd==='tiger'?16:20;
    mus(S.bd==='tiger'?11:10,2.4);
    g.fillStyle=bc;g.beginPath();g.moveTo(cx-fw+1,ey+9);g.quadraticCurveTo(cx-fw-1,chin,cx-fw*.5,chin+L2*.45);
    if(S.bd==='long'){g.quadraticCurveTo(cx-6,chin+L2*.8,cx,chin+L2);g.quadraticCurveTo(cx+6,chin+L2*.8,cx+fw*.5,chin+L2*.45);}else if(S.bd==='tiger'){for(let i=0;i<4;i++){const x0=cx-fw*.5+fw*i/4,x1=cx-fw*.5+fw*(i+1)/4;g.quadraticCurveTo((x0+x1)/2,chin+L2*(1.35+(i%2)*.15),x1,chin+L2*.75);}}else{g.quadraticCurveTo(cx,chin+L2*1.05,cx+fw*.5,chin+L2*.45);}
    g.quadraticCurveTo(cx+fw+1,chin,cx+fw-1,ey+9);g.lineTo(cx+fw-3,ey+13);g.quadraticCurveTo(cx+fw*.6,chin-6,cx+mw+1,my+1.5);g.quadraticCurveTo(cx,my+5.5,cx-mw-1,my+1.5);g.quadraticCurveTo(cx-fw*.6,chin-6,cx-fw+3,ey+13);g.closePath();g.fill();
    if(S.bd==='tiger'){g.strokeStyle=bc;g.lineCap='round';[-1,1].forEach(function(sd){for(let k=0;k<3;k++){g.lineWidth=2.2-k*.3;g.beginPath();const y0=ey+14+k*4;g.moveTo(cx+sd*(fw-5),y0);g.quadraticCurveTo(cx+sd*(fw+3),y0-1.5,cx+sd*(fw+8+R()*2),y0-4+k*1.2);g.stroke();}});}
    strands(S.bd==='long'?90:50,cx-fw*.85,cx+fw*.85,my+2,chin+L2*.5,S.bd==='long'?26:10,bcL,.12);strands(30,cx-fw*.7,cx+fw*.7,chin-4,chin+L2*.6,S.bd==='long'?30:8,bcD,.1);}
  // ---- 前髪・髷
  const bald=S.hair==='bald';
  const hairCap=function(){g.beginPath();g.moveTo(cx-fw-2,top+24);g.bezierCurveTo(cx-fw-4,top-4,cx-fw*.5,top-11,cx,top-11);g.bezierCurveTo(cx+fw*.5,top-11,cx+fw+4,top-4,cx+fw+2,top+24);
    if(S.hair==='wild'){g.quadraticCurveTo(cx+fw*.8,top+11,cx+fw*.45,top+7);g.quadraticCurveTo(cx+fw*.2,top+12,cx,top+6);g.quadraticCurveTo(cx-fw*.2,top+12,cx-fw*.45,top+7);g.quadraticCurveTo(cx-fw*.8,top+11,cx-fw-2,top+24);}
    else if(V.hl===1&&!fem){g.quadraticCurveTo(cx+fw*.85,top+6,cx+fw*.45,top+4);g.quadraticCurveTo(cx+3,top+4,cx,top+11);g.quadraticCurveTo(cx-3,top+4,cx-fw*.45,top+4);g.quadraticCurveTo(cx-fw*.85,top+6,cx-fw-2,top+24);} // 富士額
    else if(V.hl===2&&!fem){g.quadraticCurveTo(cx+fw*.95,top+2,cx+fw*.6,top-3);g.quadraticCurveTo(cx+fw*.3,top+3,cx,top+2);g.quadraticCurveTo(cx-fw*.3,top+3,cx-fw*.6,top-3);g.quadraticCurveTo(cx-fw*.95,top+2,cx-fw-2,top+24);} // 額が広い
    else if(V.hl===3&&!fem){g.quadraticCurveTo(cx+fw*.9,top+12,cx+fw*.55,top+10);g.quadraticCurveTo(cx+fw*.2,top+7,cx-fw*.1,top+11);g.quadraticCurveTo(cx-fw*.4,top+6,cx-fw*.7,top+10);g.quadraticCurveTo(cx-fw*.95,top+12,cx-fw-2,top+24);} // 横分け
    else{g.quadraticCurveTo(cx+fw*.85,top+8,cx+fw*.5,top+7);g.quadraticCurveTo(cx+4,top+5,cx,top+9);g.quadraticCurveTo(cx-4,top+5,cx-fw*.5,top+7);g.quadraticCurveTo(cx-fw*.85,top+8,cx-fw-2,top+24);}g.closePath();};
  if(!bald){
    hairCap();const hgr=g.createLinearGradient(0,top-12,0,top+20);hgr.addColorStop(0,hcL);hgr.addColorStop(.5,hc);hgr.addColorStop(1,hcD);g.fillStyle=hgr;g.fill();
    g.save();hairCap();g.clip();g.strokeStyle=shadeC(hc,.35);g.globalAlpha=.5;g.lineWidth=.5;for(let i=0;i<40;i++){const x=cx-fw+R()*fw*2;g.beginPath();g.moveTo(x,top+10);g.quadraticCurveTo(cx+(x-cx)*.6,top-6,cx+(x-cx)*.2,top-12);g.stroke();}g.globalAlpha=1;g.restore();
    if(V.strays&&!fem&&S.hair!=='wild'){g.strokeStyle=hc;g.lineCap='round';const n=2+(V.kp%2);for(let k=0;k<n;k++){const x0=cx+(k-n/2+.5)*7+(V.hl===3?-4:3);g.lineWidth=1.1-k*.15;g.beginPath();g.moveTo(x0,top+6);g.quadraticCurveTo(x0+4+k,top+13,x0+1-k*2,top+19+k*2);g.stroke();}}
    // 鬢（もみあげ）
    g.fillStyle=hc;[-1,1].forEach(function(sd){g.beginPath();g.moveTo(cx+sd*(fw+1),top+14);g.quadraticCurveTo(cx+sd*(fw+2),top+30,cx+sd*(fw-1),top+36);g.lineTo(cx+sd*(fw-3),top+20);g.fill();});
    if(S.hair==='wild'){for(let k=0;k<13;k++){const a=-Math.PI*1.02+k*Math.PI*1.04/12;const rr=5.5+R()*2.5;const bx=cx+Math.cos(a)*(fw+1.5),by2=top+12+Math.sin(a)*(19+R()*2);const cg=g.createRadialGradient(bx-1.5,by2-1.5,.5,bx,by2,rr);cg.addColorStop(0,hcL);cg.addColorStop(.6,hc);cg.addColorStop(1,hcD);g.fillStyle=cg;g.beginPath();g.ellipse(bx,by2,rr,rr*.82,a,0,7);g.fill();}g.strokeStyle=hcL;g.globalAlpha=.35;g.lineWidth=.5;for(let k=0;k<20;k++){const a=-Math.PI*.98+R()*Math.PI*.96;const bx=cx+Math.cos(a)*(fw+1),by2=top+12+Math.sin(a)*19;g.beginPath();g.arc(bx,by2,2+R()*2,a-1,a+1);g.stroke();}g.globalAlpha=1;}
    if(S.hair==='loose'||S.hair==='braid'){g.fillStyle=hc;[-1,1].forEach(function(sd){g.beginPath();g.moveTo(cx+sd*(fw-2),top+6);g.quadraticCurveTo(cx+sd*(fw+8),top+40,cx+sd*(fw+4),top+80);g.lineTo(cx+sd*(fw+10),top+78);g.quadraticCurveTo(cx+sd*(fw+14),top+30,cx+sd*(fw+2),top);g.fill();});}
    if(S.hair==='braid'){[-1,1].forEach(function(sd){for(let k=0;k<6;k++){g.fillStyle=k%2?hc:hcL;g.beginPath();g.ellipse(cx+sd*(fw+7),top+46+k*7,3,4,0,0,7);g.fill();}g.fillStyle=c2;g.beginPath();g.arc(cx+sd*(fw+7),top+90,2.4,0,7);g.fill();});}
    if(S.hair==='knot'||S.hair==='tail'){ // 髷と髪留め
      const kp=PSPEC[h.id]?0:V.kp;const pin=S.band||S.pin||c2;
      if(kp===1){ // 高く結い上げた髷
        g.fillStyle=hc;g.beginPath();g.moveTo(cx-5,top-10);g.quadraticCurveTo(cx-7,top-26,cx,top-28);g.quadraticCurveTo(cx+7,top-26,cx+5,top-10);g.fill();g.fillStyle=hcL;g.beginPath();g.ellipse(cx-2,top-22,1.6,4,0,0,7);g.fill();
        g.fillStyle=pin;g.fillRect(cx-6,top-13,12,3);g.fillRect(cx-5.5,top-20,11,2);}
      else if(kp===2){ // 布で包んだ髷（幘）と垂れ紐
        const cl2=shadeC(c1,-.1);g.fillStyle=cl2;g.beginPath();g.ellipse(cx,top-14,9,7.5,0,0,7);g.fill();g.strokeStyle=shadeC(c1,-.45);g.lineWidth=.6;for(let k=-2;k<=2;k++){g.beginPath();g.moveTo(cx+k*3,top-21);g.quadraticCurveTo(cx+k*3.6,top-14,cx+k*3,top-8);g.stroke();}
        g.fillStyle=cl2;g.beginPath();g.moveTo(cx+6,top-11);g.quadraticCurveTo(cx+20,top-6,cx+26,top+8);g.lineTo(cx+23,top+9);g.quadraticCurveTo(cx+17,top-2,cx+5,top-8);g.fill();
        g.beginPath();g.moveTo(cx+6,top-10);g.quadraticCurveTo(cx+14,top+2,cx+18,top+14);g.lineTo(cx+15.5,top+14);g.quadraticCurveTo(cx+11,top+3,cx+4,top-8);g.fill();}
      else if(kp===3){ // 小さめの髷に長い簪
        g.fillStyle=hc;g.beginPath();g.ellipse(cx,top-12,5.5,5,0,0,7);g.fill();g.fillStyle=hcL;g.beginPath();g.ellipse(cx-1.5,top-14,2,1.4,0,0,7);g.fill();
        stroke(c2,1.3);g.beginPath();g.moveTo(cx-17,top-9);g.lineTo(cx+17,top-16);g.stroke();g.fillStyle=c2;g.beginPath();g.arc(cx-17,top-9,1.8,0,7);g.fill();g.fillStyle=pin;g.fillRect(cx-6,top-9.5,12,2.6);}
      else if(kp===4){ // 二つ山の髷と組紐
        g.fillStyle=hc;g.beginPath();g.ellipse(cx-4.5,top-14,5.5,5.5,0,0,7);g.ellipse(cx+4.5,top-14,5.5,5.5,0,0,7);g.fill();g.fillStyle=hcL;g.beginPath();g.ellipse(cx-5,top-16.5,2,1.3,0,0,7);g.ellipse(cx+4,top-16.5,2,1.3,0,0,7);g.fill();
        stroke(pin,1.2);g.beginPath();g.moveTo(cx-9,top-10);g.quadraticCurveTo(cx,top-7,cx+9,top-10);g.stroke();g.beginPath();g.moveTo(cx-9,top-10);g.quadraticCurveTo(cx-13,top,cx-11,top+8);g.stroke();}
      else{
      g.fillStyle=hc;g.beginPath();g.ellipse(cx,top-15+(1-V.kn)*4,7.5*V.kn,6.5*V.kn,0,0,7);g.fill();g.fillStyle=hcL;g.beginPath();g.ellipse(cx-2,top-17,3,2,0,0,7);g.fill();
      g.fillStyle=pin;g.fillRect(cx-8,top-12,16,3.4);stroke(shadeC(pin,-.3),.6);g.strokeRect(cx-8,top-12,16,3.4);}
      if(S.pin){stroke(S.pin,1.4);g.beginPath();g.moveTo(cx-14,top-17);g.lineTo(cx+14,top-13);g.stroke();g.fillStyle=S.pin;g.beginPath();g.arc(cx+14,top-13,1.6,0,7);g.fill();}}
    if(S.hair==='bun'){ // 女性の結い髪と簪
      g.fillStyle=hc;g.beginPath();g.ellipse(cx,top-12,15,9,0,0,7);g.fill();g.beginPath();g.ellipse(cx-12,top-6,7,7,0,0,7);g.ellipse(cx+12,top-6,7,7,0,0,7);g.fill();
      g.fillStyle=hcL;g.beginPath();g.ellipse(cx-3,top-15,6,2,0,0,7);g.fill();
      g.fillStyle=hc;[-1,1].forEach(function(sd){g.beginPath();g.moveTo(cx+sd*(fw-3),top+10);g.quadraticCurveTo(cx+sd*(fw+2),top+34,cx+sd*(fw-1),top+52);g.quadraticCurveTo(cx+sd*(fw-3),top+34,cx+sd*(fw-6),top+12);g.fill();});
      stroke('#e8c040',.6);g.beginPath();g.moveTo(cx+22,top-24);g.lineTo(cx+24,top-10);g.stroke();[0,1,2].forEach(function(k){g.fillStyle=k%2?'#d04060':'#f0d070';g.beginPath();g.arc(cx+24,top-14+k*3,1.1,0,7);g.fill();});
      stroke('#e8c040',1.4);g.beginPath();g.moveTo(cx+6,top-18);g.lineTo(cx+22,top-24);g.stroke();g.fillStyle='#e8c040';g.beginPath();g.arc(cx+22,top-24,2,0,7);g.fill();
      for(let k=0;k<3;k++){g.fillStyle='#e8c040';g.beginPath();g.arc(cx+20+k*1.2,top-20+k*3.4,1,0,7);g.fill();}
      if(S.x.indexOf('flower')>=0){[[cx-14,top-12,'#ff9ec0'],[cx-18,top-6,'#ffd0e0']].forEach(function(f){g.fillStyle=f[2];for(let k=0;k<5;k++){g.beginPath();g.arc(f[0]+Math.cos(k*1.26)*2.6,f[1]+Math.sin(k*1.26)*2.6,1.8,0,7);g.fill();}g.fillStyle='#e8c040';g.beginPath();g.arc(f[0],f[1],1.2,0,7);g.fill();});}
      else{g.fillStyle='#d04060';g.beginPath();g.arc(cx-14,top-10,2,0,7);g.fill();}}
    if(S.band&&S.hair!=='knot'&&S.hair!=='tail'){g.fillStyle=S.band;g.beginPath();g.moveTo(cx-fw-1,top+12);g.quadraticCurveTo(cx,top+2,cx+fw+1,top+12);g.lineTo(cx+fw+1,top+16);g.quadraticCurveTo(cx,top+6,cx-fw-1,top+16);g.fill();g.beginPath();g.moveTo(cx+fw,top+13);g.lineTo(cx+fw+12,top+24);g.lineTo(cx+fw+8,top+28);g.lineTo(cx+fw-1,top+16);g.fill();}
  }else{ // 禿頭のつや
    g.fillStyle='rgba(255,255,255,.22)';g.beginPath();g.ellipse(cx-6,top+4,9,4,-.3,0,7);g.fill();
    g.fillStyle=hcD;[-1,1].forEach(function(sd){g.globalAlpha=.5;g.beginPath();g.ellipse(cx+sd*(fw-2),top+26,3,8,0,0,7);g.fill();g.globalAlpha=1;});}
  // ---- 羽扇
  if(S.x.indexOf('fan')>=0){g.save();g.translate(104,136);g.rotate(-.35);g.fillStyle='#8a6a3a';g.fillRect(-1.5,0,3,14);
    const fgr=g.createLinearGradient(0,-38,0,0);fgr.addColorStop(0,'#ffffff');fgr.addColorStop(1,'#d8d8d0');g.fillStyle=fgr;g.beginPath();g.moveTo(0,2);g.quadraticCurveTo(-24,-14,-16,-40);g.quadraticCurveTo(0,-48,16,-40);g.quadraticCurveTo(24,-14,0,2);g.fill();
    g.strokeStyle='rgba(120,120,110,.55)';g.lineWidth=.5;for(let k=-6;k<=6;k++){g.beginPath();g.moveTo(0,0);g.lineTo(k*2.6,-42+Math.abs(k)*.8);g.stroke();}g.restore();}
  g.restore();
  // ---- 古い絵の色合い：彩度を落として茶に寄せ、絹の粒をのせる
  try{const d=g.getImageData(0,0,256,288),a=d.data;let sd=phash(h.n)||3;for(let i=0;i<a.length;i+=4){const r=a[i],gg=a[i+1],b=a[i+2];const l=r*.3+gg*.59+b*.11;
    a[i]=r+(l*1.08+16-r)*.26;a[i+1]=gg+(l*.96+10-gg)*.26;a[i+2]=b+(l*.76+2-b)*.26;sd=(sd*16807)%2147483647;const n=(sd/2147483647-.5)*14;a[i]+=n;a[i+1]+=n;a[i+2]+=n*.8;}g.putImageData(d,0,0);}catch(e){}
  g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=.5;g.strokeStyle='rgba(60,40,20,.25)';g.lineWidth=1;for(let y=0;y<288;y+=3){g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();}g.restore();
  const vg=g.createRadialGradient(64,66,36,64,72,104);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(40,20,5,.6)');g.fillStyle=vg;g.fillRect(0,0,128,144);
  // 勢力の印（朱の落款）
  const fk=h.f||'群';g.fillStyle='rgba(168,40,28,.88)';g.fillRect(104,6,18,18);g.strokeStyle='rgba(255,230,200,.6)';g.lineWidth=.8;g.strokeRect(105.5,7.5,15,15);
  g.fillStyle='#f6e2c0';g.font='bold '+(fk.length>1?8:12)+'px "Yuji Syuku","Hiragino Mincho ProN",serif';g.textAlign='center';g.textBaseline='middle';g.fillText(fk.slice(0,2),113,15.5);
  g.strokeStyle='#2a160a';g.lineWidth=2.4;g.strokeRect(1.2,1.2,125.6,141.6);g.strokeStyle='rgba(216,172,76,.75)';g.lineWidth=.8;g.strokeRect(3.4,3.4,121.2,137.2);
  const u=cv.toDataURL('image/png');PT2[h.id]=u;return u;
}
portrait=portrait2;
