# Original score + foley + voice mix for 《窗》. Deterministic, numpy/scipy only.
import os, json, math
import numpy as np
from scipy import signal
import soundfile as sf

SR = 48000
DUR = 360.0
N = int(round(DUR * SR))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE = os.path.join(ROOT, 'voice')
OUT = os.path.join(ROOT, 'out')
os.makedirs(OUT, exist_ok=True)

rng = np.random.default_rng(20261031)

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)

def idx(t):
    return int(round(t * SR))

def add(buf, sig, t, gain=1.0, pan=0.0):
    if sig is None or len(sig) == 0: return
    i = idx(t)
    if i >= N: return
    if i < 0:
        sig = sig[-i:]; i = 0
    n = min(len(sig), N - i)
    if n <= 0: return
    l = gain * math.sqrt((1 - pan) / 2)
    r = gain * math.sqrt((1 + pan) / 2)
    buf[i:i+n, 0] += sig[:n] * l
    buf[i:i+n, 1] += sig[:n] * r

def env(n, a=0.01, d=0.1, s=0.7, r=0.4, sus=None):
    a = max(1, int(a * SR)); d = max(1, int(d * SR)); r = max(1, int(r * SR))
    a = min(a, n); d = min(d, n - a); r = min(r, n - a - d)
    e = np.ones(n) * s
    e[:a] = np.linspace(0, 1, a)
    if d > 0: e[a:a+d] = np.linspace(1, s, d)
    if r > 0: e[n-r:] = np.linspace(s, 0, r)
    return e

def fft_filter(x, kind, cutoff, order=2):
    if len(x) < 32: return x
    if kind in ('bandpass', 'bandstop'):
        if isinstance(cutoff, (tuple, list)): lo, hi = cutoff
        else: lo, hi = cutoff * .55, min(cutoff * 1.8, SR * .45)
        wn = [lo / (SR / 2), hi / (SR / 2)]
    else:
        wn = cutoff / (SR / 2)
    sos = signal.butter(order, wn, btype=kind, output='sos')
    return signal.sosfilt(sos, x)

def ks_pluck(freq, dur=1.4, bright=0.5, damp=0.996):
    n = int(dur * SR)
    p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p)
    buf = fft_filter(buf, 'lowpass', 800 + 7000 * bright, 2)
    out = np.zeros(n)
    for i in range(n):
        v = buf[i % p]
        out[i] = v
        buf[i % p] = damp * 0.5 * (v + buf[(i + 1) % p])
    out *= env(n, .002, .2, .35, .8, 1)
    return out

def bell(freq, dur=3.0, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    parts = [(1, 1, 3.2), (2.32, .5, 2.2), (4.25, .28, 1.6), (6.63, .16, 1.2), (9.38, .09, .9)]
    out = np.zeros(n)
    for m, a, d in parts:
        out += a * np.sin(2 * np.pi * freq * m * t + rng.uniform(0, 6)) * np.exp(-t / (dur * .18 * d))
    out *= env(n, .002, .05, .8, dur * .2)
    return out * amp

def organ(freqs, dur=8.0, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        vib = 1 + 0.003 * np.sin(2 * np.pi * 4.6 * t + rng.uniform(0, 6))
        out += np.sin(2 * np.pi * f * vib * t)
        out += .35 * np.sin(2 * np.pi * f * 2 * t)
        out += .18 * np.sin(2 * np.pi * f * 3 * t)
    out *= env(n, .8, .3, .8, 1.2)
    return out / max(1, len(freqs)) * amp

def pad(freqs, dur=8.0, cutoff=1200, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        for det in (-.006, 0, .007):
            ph = rng.uniform(0, 6)
            saw = 2 * ((f * (1 + det) * t + ph) % 1) - 1
            out += saw
    out = fft_filter(out, 'lowpass', cutoff, 3)
    out *= env(n, min(2.0, dur * .3), .4, .7, min(2.0, dur * .3))
    return out / (len(freqs) * 3) * amp

def marimba(freq, dur=0.7, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.sin(2*np.pi*freq*t) * np.exp(-t*7) + .35*np.sin(2*np.pi*freq*4*t) * np.exp(-t*14)
    return out * env(n, .002, .02, .6, .2) * amp

def click(t0buf, t, gain=.4, pan=0):
    n = int(.05*SR); x = rng.normal(0, 1, n) * np.exp(-np.arange(n)/(SR*.004))
    x = fft_filter(x, 'bandpass', (1800, 6000), 1)
    add(t0buf, x, t, gain, pan)

def thump(t0buf, t, f=70, gain=.6, pan=0):
    n = int(.5*SR); tt = np.arange(n)/SR
    x = np.sin(2*np.pi*(f*np.exp(-tt*8)+38)*tt) * np.exp(-tt*9)
    add(t0buf, x, t, gain, pan)

def frame_drum(t0buf, t, gain=.5, pan=0):
    n = int(.35*SR); tt = np.arange(n)/SR
    x = rng.normal(0,1,n) * np.exp(-tt*28)
    x = fft_filter(x, 'bandpass', (80, 420), 1)
    x += .6*np.sin(2*np.pi*95*tt)*np.exp(-tt*20)
    add(t0buf, x, t, gain, pan)

def anvil(t0buf, t, gain=.5, pan=0):
    n = int(1.2*SR); tt = np.arange(n)/SR
    x = np.zeros(n)
    for m, a, d in [(1,1,2.5),(2.71,.6,3.2),(5.13,.35,4.5),(8.2,.2,6)]:
        x += a*np.sin(2*np.pi*m*523*tt + rng.uniform(0,6))*np.exp(-tt*d)
    x += .5*fft_filter(rng.normal(0,1,n),'highpass',2000,1)*np.exp(-tt*45)
    add(t0buf, x, t, gain, pan)

def whoosh(t0buf, t, dur=1.0, gain=.5, pan=0):
    n = int(dur*SR); x = rng.normal(0,1,n)
    # moving bandpass approximated by crossfaded filters
    a = fft_filter(x, 'bandpass', (180, 700), 1); b = fft_filter(x, 'bandpass', (1200, 7000), 1)
    w = np.linspace(0,1,n)**1.7
    y = a*(1-w)+b*w
    y *= np.sin(np.linspace(0,np.pi,n))**1.2
    add(t0buf, y, t, gain, pan)

def pop(t0buf, t, f=660, gain=.35, pan=0):
    n=int(.18*SR); tt=np.arange(n)/SR
    x = np.sin(2*np.pi*f*tt*(1+1.5*np.exp(-tt*30))) * np.exp(-tt*22)
    add(t0buf, x, t, gain, pan)

def paper(t0buf, t, dur=.5, gain=.3, pan=0):
    n=int(dur*SR); x=rng.normal(0,1,n)
    x=fft_filter(x,'bandpass',(1500,6000),1)
    e=np.exp(-np.arange(n)/(SR*.08))
    add(t0buf, x*e, t, gain, pan)

def scratch(t0buf, t, dur=.4, gain=.18, pan=0):
    n=int(dur*SR); x=rng.normal(0,1,n)*np.sin(np.linspace(0,np.pi,n))
    x=fft_filter(x,'bandpass',(2200,8000),1)
    add(t0buf, x, t, gain, pan)

def sub_pulse(t0buf, t, f=44, gain=.5):
    n=int(1.4*SR); tt=np.arange(n)/SR
    x=np.sin(2*np.pi*f*tt)*np.exp(-tt*2.2)
    add(t0buf, x, t, gain, 0)

# ---------- buses ----------
music = np.zeros((N,2))
foley = np.zeros((N,2))

# era sections: (start, end, root midi, chord intervals, pad cutoff, pad gain)
SECTIONS = [
    (0,   8,   38, [0,7,12,15],        900,  .50),
    (8,   44,  38, [0,7,12,15,19],     1300, .48),
    (44,  80,  38, [0,7,12,14,19],     1800, .60),
    (80,  116, 41, [0,7,12,16,19],     1500, .45),
    (116, 156.5, 43, [0,7,12,15,19],   950,  .58),
    (156.5,224, 36, [0,7,12,16,19],    2400, .42),
    (224, 269, 39, [0,7,12,16,19],     2100, .45),
    (269, 332, 34, [0,7,12,14,19],     750,  .58),
    (332, 360, 38, [0,7,12,16,19],     1700, .55),
]
for a,b,root,ints,cut,g in SECTIONS:
    freqs=[midi(root+i) for i in ints]
    add(music, pad(freqs, b-a, cut, 1.0), a, g, 0)

add(music, organ([midi(50),midi(57),midi(62),midi(65)], 36, .9), 44.0, .34)
add(music, organ([midi(50),midi(57),midi(62),midi(66)], 28, .9), 332.0, .38)

# ---------- a motif for the whole timeline ----------
M=[62,69,74,76,77,76,74]
def motif(t0, trans=0, inst='pluck', gain=.4, step=.45, pan=0):
    for i,n in enumerate(M):
        f=midi(n+trans)
        if inst=='pluck': s=ks_pluck(f,1.4,.55)
        elif inst=='bell': s=bell(f,2.2,.8)
        elif inst=='marimba': s=marimba(f,.7,.9)
        else: s=bell(f,1.4,.5)
        add(music,s,t0+i*step,gain,pan)

# ---------- per-entry rhythm, 9 beats each at 120 BPM ----------
B_START=8.0; STEP=4.5
def era_of(i):
    counts=[8,8,8,9,15,10,14]; acc=0
    for e,c in enumerate(counts):
        if i < acc+c: return e
        acc+=c
    return 6
for i in range(72):
    t=B_START+i*STEP; e=era_of(i)
    root=[38,38,41,43,36,39,34][e]
    # downbeat: kick + entry tick
    n=int(.5*SR); tt=np.arange(n)/SR
    kick=np.sin(2*np.pi*(f:= (55+20*np.exp(-tt*20)))*tt)*np.exp(-tt*9)
    add(music,kick,t,.38,0)
    click(foley,t,.22,-.2 if i%2 else .2)
    # bass on 1 and 3
    for dt in (0.0,1.0,2.0,3.0):
        add(music, ks_pluck(midi(root-12), .9, .25), t+dt, .16, 0)
    # snare / clap on 2 and 4 (beats 2 and 4 at .5s)
    for dt in (0.5,1.5):
        n=int(.18*SR); tt=np.arange(n)/SR
        sn=rng.normal(0,1,n)*np.exp(-tt*30); sn=fft_filter(sn,'bandpass',(1200,6000),1)
        add(foley,sn,t+dt,.08,0)
    # hats / ticks on 8ths
    for k in range(9):
        if k%2==0: click(foley,t+k*.25,.06,-.25 if k%4 else .25)
    # era colour
    if e==1:
        add(foley,bell(midi(74+[0,3,5,7][i%4]),1.4,.4),t+.2,.10,-.2)
    elif e==2:
        add(music,ks_pluck(midi(65+[0,4,7,12][i%4]),.7,.7),t+.25,.12,.2)
    elif e==3:
        anvil(foley,t+1.0,.10,-.15 if i%2 else .15)
        sub_pulse(music,t+.5,45,.18)
    elif e==4:
        add(music,marimba(midi(72+[0,2,4,7][i%4]),.5,.9),t+.3,.12,0)
    elif e==5:
        pop(foley,t+.4,[620,740,550,820][i%4],.12,0)
    elif e==6:
        add(foley,bell(midi(86+i%5),1.2,.3),t+.3,.05,-.2)
    # a longer motif every 2 entries
    if i%2==0:
        inst=['pluck','bell','pluck','marimba','marimba','pluck','bell'][e]
        trans=[0,0,3,5,-2,1,-4][e]
        motif(t+.35,trans,inst,.18,.42,0)

# ---------- era transitions ----------
for t in [8,44,80,116,156.5,224,269,332]:
    whoosh(foley,t-.35,.9,.30,0)
    for k in range(6):
        add(foley,bell(midi(69+k*2),1.2,.3),t+.02+k*.05,.05,-.3+k*.12)

# ---------- ambience beds ----------
def bed(kind,a,b,gain):
    n=int((b-a)*SR); x=rng.normal(0,1,n)
    if kind=='room': x=fft_filter(x,'lowpass',220,2)
    elif kind=='hall': x=fft_filter(x,'bandpass',(250,1400),1); x=fft_filter(x,'lowpass',2600,1)
    elif kind=='factory': x=fft_filter(x,'lowpass',700,2); x+=.3*np.sin(2*np.pi*50*np.arange(n)/SR)
    elif kind=='office': x=fft_filter(x,'lowpass',400,2)
    elif kind=='air': x=fft_filter(x,'bandpass',(250,2500),1)
    x*=env(n,min(2,(b-a)*.2),.5,.6,min(2,(b-a)*.2))
    add(foley,x,a,gain,0)
for (a,b),k,g in [((0,8),'room',.04),((8,44),'room',.05),((44,80),'hall',.06),((80,116),'room',.04),((116,156.5),'factory',.055),((156.5,224),'office',.03),((224,269),'room',.035),((269,332),'air',.05),((332,360),'room',.04)]:
    bed(k,a,b,g)

# ---------- foley for the plates ----------
for i in range(72):
    t=8+i*4.5; e=era_of(i)
    if e<=1: scratch(foley,t+.4,.25,.06,-.2+.4*rng.random())
    elif e==2: paper(foley,t+.4,.35,.08,0)
    elif e==3: scratch(foley,t+.4,.2,.05,0)
    elif e==4: click(foley,t+.45,.12,0)
    elif e==5: pop(foley,t+.45,700,.10,0)
    else: whoosh(foley,t+.35,.35,.06,0)

# ---------- finale ----------
add(music, organ([midi(50),midi(57),midi(62),midi(66),midi(69)], 26, .9), 332.0, .42)
motif(334.0,0,'bell',.28,.6,0)
motif(338.0,0,'pluck',.22,.6,0)
for k in range(8):
    add(music, bell(midi(62+k*2), 2.5, .4), 340+k*.9, .10, -.3+k*.09)

# ---------- reverb / master ----------
def reverb(x, wet=.25, dur=1.8, decay=4.0):
    n=int(dur*SR); t=np.arange(n)/SR
    imp=rng.normal(0,1,(n,2))*np.exp(-t*decay)[:,None]
    imp=np.stack([fft_filter(imp[:,0],'lowpass',5000,1),fft_filter(imp[:,1],'lowpass',5000,1)],1)
    imp/=np.max(np.abs(imp))+1e-9
    y=np.stack([signal.fftconvolve(x[:,0],imp[:,0])[:N],signal.fftconvolve(x[:,1],imp[:,1])[:N]],1)
    return x*(1-wet)+y*wet
music=reverb(music,.22,1.8,3.5)
foley=reverb(foley,.08,1.0,6.0)
mix=music*.62+foley*.9
mix=np.tanh(mix*1.15*.9)
peak=np.max(np.abs(mix))
if peak>0: mix=mix/peak*10**(-1.5/20)
os.makedirs(OUT,exist_ok=True)
sf.write(os.path.join(OUT,'mix.wav'),mix.astype(np.float32),SR,subtype='PCM_24')
sf.write(os.path.join(OUT,'music.wav'),(music/np.max(np.abs(music))*0.8).astype(np.float32),SR,subtype='PCM_24')
print('wrote',os.path.join(OUT,'mix.wav'),'peak',round(float(np.max(np.abs(mix))),3))
