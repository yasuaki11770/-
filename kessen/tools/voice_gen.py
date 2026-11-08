import json,subprocess,time
from voicevox_core.blocking import Onnxruntime, OpenJtalk, Synthesizer, VoiceModelFile
V='vv/'
ort=Onnxruntime.load_once(filename=V+'voicevox_onnxruntime-linux-x64-1.17.3/lib/libvoicevox_onnxruntime.so.1.17.3')
syn=Synthesizer(ort,OpenJtalk('ojt/lib/python3.13/site-packages/pyopenjtalk/dictionary'))
for f in ['4','9','10','12','14','15','1','2']:
    with VoiceModelFile.open(V+'keep/'+f+'.vvm') as m: syn.load_voice_model(m)
# 声の種類 → (style id, 速さ, 高さ, 抑揚)
VC={'ryusei':(13,1.05,0,1.15),'ryuseiH':(81,1.08,0,1.25),'takehiro':(11,1.08,0,1.15),'takehiroT':(40,1.08,0,1.2),'mesuo':(21,1.02,-.02,1.1),
    'sorin':(53,.95,0,1.05),'jii':(42,1.0,0,1.2),'shuji':(52,1.02,0,1.05),'kotaro':(12,1.08,-.03,1.15),'maron':(67,1.08,-.02,1.15),'fem':(14,1.05,0,1.1),'femS':(16,1.1,0,1.2)}
D=json.load(open('vvjobs.json'))
def gen(text,c,dp=0,ds=1):
    st,sp,pt,it=VC[c];aq=syn.create_audio_query(text,st);aq.speed_scale=sp*ds;aq.pitch_scale=pt+dp;aq.intonation_scale=it;aq.volume_scale=1.0;aq.pre_phoneme_length=.05;aq.post_phoneme_length=.08
    w=syn.synthesis(aq,st)
    r=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i','-','-af','loudnorm=I=-16:TP=-1.5,highpass=f=70','-ar','22050','-ac','1','-c:a','libmp3lame','-b:a','32k','-f','mp3','-'],input=w,capture_output=True)
    return r.stdout
idx={};blob=bytearray();t=time.time()
items=[(j['c']+'|'+j['t'],j['t'],j['c'],0,1) for j in D['jobs']]+[('h:'+s['id'],s['t'],s['c'],s['p'],s['s']) for s in D['sp']]
for k,text,c,dp,ds in items:
    try:m=gen(text,c,dp,ds)
    except Exception as e:print('ERR',k,e);continue
    idx[k]=[len(blob),len(m)];blob+=m
open('voices_vv.mp3','wb').write(blob);json.dump(idx,open('voices_vv.json','w'),ensure_ascii=False)
print(len(idx),len(blob),round(time.time()-t))
