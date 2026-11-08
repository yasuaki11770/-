import json,subprocess,os,sys,hashlib,numpy as np
import pyopenjtalk
from pyopenjtalk.htsengine import HTSEngine
D=json.load(open('vjobs.json'))
FEM='tohoku/tohoku-f01-neutral.htsvoice'
CLS={'low':(-3,1.0),'mid':(0,1.05),'high':(3,1.08),'old':(-2,.9),'fem':(0,1.05)}
eng_f=HTSEngine(FEM.encode())
def synth(text,ht,sp,fem):
    labels=pyopenjtalk.extract_fullcontext(text)
    if fem:
        e=eng_f;e.set_speed(sp);e.add_half_tone(ht);x=e.synthesize(labels);e.add_half_tone(-ht);sr=e.get_sampling_frequency()
    else:
        x,sr=pyopenjtalk.tts(text,speed=sp,half_tone=ht)
    x=np.asarray(x,dtype=np.float64);pk=np.abs(x).max() or 1;x=x/pk*26000
    return np.clip(x,-32768,32767).astype(np.int16),sr
def enc(pcm,sr):
    r=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-f','s16le','-ar',str(sr),'-ac','1','-i','-','-ar','22050','-ac','1','-c:a','libmp3lame','-b:a','32k','-f','mp3','-'],input=pcm.tobytes(),capture_output=True)
    return r.stdout
out={};blob=bytearray();idx={}
items=[(j['c']+'|'+j['t'],j['t'],CLS[j['c']][0],CLS[j['c']][1],j['c']=='fem') for j in D['jobs']]
items+=[('h:'+s['id'],s['t'],s['ht'] if s['c']!='fem' else 1,s['s'] if s['c']!='old' else .9,s['c']=='fem') for s in D['sp']]
for n,(k,t,ht,sp,fem) in enumerate(items):
    try:
        pcm,sr=synth(t,ht,sp,fem);m=enc(pcm,sr)
    except Exception as e:
        print('ERR',k,e);continue
    idx[k]=[len(blob),len(m)];blob+=m
open('voices.bin','wb').write(blob);json.dump(idx,open('voices.json','w'),ensure_ascii=False)
print(len(idx),len(blob))
