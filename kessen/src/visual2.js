/* ================= 3Dの画質を上げる：写真の芝・階調補正・光のにじみ・輪郭のなめらかさ ================= */
const VQ={on:(function(){try{return localStorage.getItem('kessenden-hq')!=='0';}catch(e){return true;}})()};
R3.upgrade=function(){
  if(!R3.ok||R3._up)return;R3._up=1;
  const T=THREE,ren=R3.renderer;
  // 階調：映画のようなトーンマッピング
  if(R3.sun){R3.sun.intensity=.95;R3.sun.color.set(0xfff0d4);}
  // 写真の芝：地面の模様（地形の色は残し、明暗だけ写真から）と外側の草地
  const im=new Image();
  im.onload=function(){
    const mk=function(tex,gray,size){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');x.drawImage(im,0,0,size,size);
      const d=x.getImageData(0,0,size,size),a=d.data;let sum=0;for(let i=0;i<a.length;i+=4)sum+=a[i]*.3+a[i+1]*.59+a[i+2]*.11;const mean=sum/(a.length/4);
      for(let i=0;i<a.length;i+=4){const l=a[i]*.3+a[i+1]*.59+a[i+2]*.11;if(gray){const v=Math.max(0,Math.min(255,(.9+(l-mean)/mean*.55)*235));a[i]=a[i+1]=a[i+2]=v;}else{a[i]*=.82;a[i+1]*=.9;a[i+2]*=.72;}}
      x.putImageData(d,0,0);tex.image=c;tex.anisotropy=8;tex.needsUpdate=true;};
    try{mk(R3.TX.detail,true,512);mk(R3.TX.grass,false,512);}catch(e){}
  };
  im.src=GRASS_IMG;
  if(VQ.on)R3.setPost(true);
};
R3.setPost=function(on){
  const T=THREE,ren=R3.renderer;
  if(!on){R3.comp=null;return;}
  if(!T.EffectComposer||!T.UnrealBloomPass){R3.comp=null;return;}
  try{
    const sz=new T.Vector2();ren.getDrawingBufferSize(sz);
    const comp=new T.EffectComposer(ren);comp.setPixelRatio(1);comp.setSize(sz.x,sz.y);
    comp.addPass(new T.RenderPass(R3.scene,R3.camera));
    const bloom=new T.UnrealBloomPass(new T.Vector2(sz.x/2,sz.y/2),.22,.45,.9);comp.addPass(bloom);
    const vig=new T.ShaderPass(T.VignetteShader);vig.uniforms.offset.value=1.05;vig.uniforms.darkness.value=1.05;comp.addPass(vig);
    const fx=new T.ShaderPass(T.FXAAShader);fx.uniforms.resolution.value.set(1/sz.x,1/sz.y);comp.addPass(fx);
    // ブルームなどは別の描画先を通るので、最後に階調補正と色空間をかけ直す
    const fin=new T.ShaderPass({uniforms:{tDiffuse:{value:null}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);vec3 x=c.rgb;float l=dot(x,vec3(.299,.587,.114));x=mix(vec3(l),x,1.16);x=(x-.5)*1.1+.5;x*=vec3(1.03,1.0,.95);gl_FragColor=vec4(clamp(x,0.,1.),c.a);}'});
    comp.addPass(fin);
    R3.comp=comp;R3.compFx=fx;R3.comp._sz=sz.clone();
    ren.toneMapping=T.NoToneMapping;
  }catch(e){R3.comp=null;}
};
R3.postResize=function(){if(!R3.comp)return;const sz=new THREE.Vector2();R3.renderer.getDrawingBufferSize(sz);if(R3.comp._sz&&R3.comp._sz.equals(sz))return;R3.comp.setSize(sz.x,sz.y);R3.compFx.uniforms.resolution.value.set(1/sz.x,1/sz.y);R3.comp._sz=sz.clone();};
// 記録（メニュー）に「画質」切り替えを足す
const _menuSheet=menuSheet;menuSheet=function(){_menuSheet();const b=document.getElementById('mBgm');if(!b)return;
  const q=document.createElement('button');q.className='btn';q.id='mHq';q.type='button';q.textContent='画質 '+(VQ.on?'高':'標準');
  q.onclick=function(){VQ.on=!VQ.on;try{localStorage.setItem('kessenden-hq',VQ.on?'1':'0');}catch(e){}R3.setPost(VQ.on);menuSheet();};
  b.parentNode.insertBefore(q,b.nextSibling);};
