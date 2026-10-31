# Original score + foley + voice mix for 《窗》. Deterministic, numpy/scipy only.
import os, json, math
import numpy as np
from scipy import signal
import soundfile as sf

SR = 48000
DUR = 112.0
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
voice = np.zeros((N,2))

# ---------- harmony ----------
sections = [
    # a, b, root midi, chord intervals, cutoff, pad gain
    (0,   8,  38, [0,7,12,15], 900,  .55),  # D minor
    (8,  22,  38, [0,7,12,15,19], 1300, .5), # D minor add A
    (22, 37,  38, [0,7,12,14,19], 1800, .65),# D dorian organ
    (37, 50,  41, [0,7,12,16,19], 1400, .45),# F major
    (50, 64,  43, [0,7,12,15,19], 900,  .6), # G minor industrial
    (64, 77,  36, [0,7,12,16,19], 2600, .4), # C major
    (77, 89,  39, [0,7,12,16,19], 2200, .45),# Eb major
    (89, 103, 34, [0,7,12,14,19], 700,  .6), # Bb
    (103,112, 38, [0,7,12,16,19], 1600, .55),# D major
]
for a,b,root,ints,cut,g in sections:
    freqs = [midi(root+i) for i in ints]
    p = pad(freqs, b-a, cut, 1.0)
    add(music, p, a, g, 0)

# soft organ in the glass section
add(music, organ([midi(50), midi(57), midi(62), midi(65)], 15, .8), 22.0, .38)
# coda organ
add(music, organ([midi(50), midi(57), midi(62), midi(66)], 9, .8), 103.0, .35)

# ---------- motif ----------
M = [62, 69, 74, 76, 77, 76, 74]  # D A D E F E D
def motif(t0, trans=0, inst='pluck', gain=.5, step=.55, pan=0):
    for i,n in enumerate(M):
        f = midi(n + trans)
        if inst == 'pluck': s = ks_pluck(f, 1.6, .55)
        elif inst == 'bell': s = bell(f, 2.6, .8)
        elif inst == 'marimba': s = marimba(f, .8, .9)
        else: s = bell(f, 1.6, .5)
        add(music, s, t0 + i*step, gain, pan)

motif(9.6, 0, 'pluck', .35, .62, -.1)
motif(14.2, 0, 'pluck', .28, .62, .1)
motif(23.8, 0, 'bell', .30, .72, .15)
motif(30.0, 0, 'bell', .22, .72, -.1)
motif(38.6, 3, 'pluck', .35, .48, -.15)
motif(44.0, 3, 'pluck', .3, .48, .15)
motif(51.4, 5, 'marimba', .28, .42, -.1)
motif(58.0, 5, 'marimba', .22, .42, .12)
motif(65.6, -2, 'marimba', .38, .38, 0)
motif(70.4, -2, 'marimba', .3, .38, 0)
motif(78.4, 1, 'pluck', .4, .34, .12)
motif(82.2, 1, 'pluck', .32, .34, -.12)
motif(90.4, -4, 'bell', .25, .8, 0)
motif(104.6, 0, 'bell', .28, .7, 0)

# ---------- pulses / arpeggios ----------
# stone frame drum
t = 8.4
while t < 20.5:
    frame_drum(music if False else foley, t, .22, -.1 if int(t)%2 else .1)
    t += 2.0
# glass: one chime per lit pane
for i in range(16):
    add(foley, bell(midi(74 + [0,3,5,7,10,12][i % 6]), 1.8, .5), 23.6 + i*.45, .12, -.2 + .03*i)
# line: harpsichord arpeggio
for i in range(16):
    tt = 38.4 + i*.55
    root = 53 if i % 4 < 2 else 48
    add(music, ks_pluck(midi(root + [0,4,7,12][i % 4]), .9, .75), tt, .16, -.2 if i%2 else .2)
# iron: anvil pulse
for i in range(14):
    anvil(foley, 50.8 + i*.9, .16, -.15 if i%2 else .15)
    if i % 2 == 0: sub_pulse(music, 51.0 + i*.9, 41, .28)
# stamp
thump(foley, 58.45, 64, .7); click(foley, 58.45, .5, .2)
# grid: clicks + kick
for i in range(24):
    click(foley, 65.0 + i*.5, .12, 0)
    if i % 2 == 0: sub_pulse(music, 65.0 + i*.5, 48, .18)
# grid snap accents
for i in range(10):
    click(foley, 68.0 + i*.45, .22, -.2)
# knife cut
whoosh(foley, 74.0, .25, .25); click(foley, 74.45, .5)
# play: pops
for i, tt in enumerate([78.1,79.2,80.3,81.4,82.5,83.6]):
    pop(foley, tt, [660,740,550,820,620,900][i], .22, -.2 if i%2 else .2)
    frame_drum(foley, tt, .12)
# wink slide
whoosh(foley, 84.2, .4, .18)
# data scan
whoosh(foley, 92.8, 4.4, .32)
for i in range(10):
    add(foley, bell(midi(86 + i % 5), 1.4, .35), 93.2 + i*.4, .07, -.3 + i*.06)
# data collapse reverse swell
whoosh(foley, 100.2, 2.8, .22)
# coda stone hit
thump(foley, 103.1, 58, .55); click(foley, 103.1, .4)
paper(foley, 104.0, .4, .12)
# final chord
add(music, organ([midi(50), midi(57), midi(62), midi(66), midi(69)], 6.0, .9), 108.0, .4)

# ---------- atonal beds ----------
def bed(kind, a, b, gain):
    n = int((b-a)*SR); x = rng.normal(0,1,n)
    if kind == 'room':
        x = fft_filter(x, 'lowpass', 220, 2)
    elif kind == 'hall':
        x = fft_filter(x, 'bandpass', (220, 1400), 1); x = fft_filter(x, 'lowpass', 2500, 1)
    elif kind == 'factory':
        x = fft_filter(x, 'lowpass', 700, 2); x += .3*np.sin(2*np.pi*50*np.arange(n)/SR)
    elif kind == 'office':
        x = fft_filter(x, 'lowpass', 400, 2)
    elif kind == 'air':
        x = fft_filter(x, 'bandpass', (250, 2500), 1)
    x *= env(n, min(2, (b-a)*.2), .5, .6, min(2, (b-a)*.2))
    add(foley, x, a, gain, 0)

bed('room', 0, 8, .05); bed('room', 8, 22, .06); bed('hall', 22, 37, .07)
bed('room', 37, 50, .04); bed('factory', 50, 64, .06); bed('office', 64, 77, .035)
bed('room', 77, 89, .04); bed('air', 89, 103, .05); bed('room', 103, 112, .045)

# ---------- foley for picture events ----------
for tt in [1.2, 8.0, 19.2, 21.4, 103.0, 106.0]:
    thump(foley, tt, 64, .35)
# chisel / engraving ticks
for i in range(60):
    scratch(foley, 8.2 + i*.075, .06, .05, -.2 + .4*rng.random())
# wash / paper
paper(foley, 12.4, .8, .18); paper(foley, 49.5, .5, .28)
# pen
for i in range(45):
    scratch(foley, 37.8 + i*.16, .08, .045, -.3 + .6*rng.random())
# glass crack / drain
add(foley, bell(440, 2.5, .5), 36.4, .12); add(foley, bell(220, 3.2, .5), 36.4, .10)
# blueprint draw ticks
for i in range(50):
    scratch(foley, 51.0 + i*.1, .05, .035, -.2 + .4*rng.random())

# ---------- voice ----------
TIMES = {'l1':1.6,'l2':9.2,'l3':23.0,'l4':38.2,'l5':51.0,'l6':65.2,'l7':78.2,'l8':90.2,'l9':104.2}
voice_env = np.zeros(N)
for lid, t0 in TIMES.items():
    path = os.path.join(VOICE, lid + '.wav')
    if not os.path.exists(path): continue
    x, sr = sf.read(path, dtype='float32')
    if sr != SR:
        x = signal.resample_poly(x, SR, sr).astype(np.float32)
    x = x - np.mean(x)
    x /= max(1e-6, np.max(np.abs(x)))
    x = np.tanh(x * 1.15) * .92
    add(voice, x, t0, .95, 0)
    i = idx(t0); n = min(len(x), N-i)
    voice_env[i:i+n] = np.maximum(voice_env[i:i+n], np.abs(x[:n]))

# duck music under voice
smooth = signal.fftconvolve(voice_env, np.ones(int(.2*SR))/int(.2*SR), mode='same')
duck = 1 - .55 * np.clip(smooth * 5, 0, 1)
music *= duck[:, None]
foley *= (1 - .18 * np.clip(smooth * 5, 0, 1))[:, None]

# ---------- reverb ----------
def reverb(x, wet=.25, dur=1.8, decay=4.0):
    n = int(dur*SR); t = np.arange(n)/SR
    imp = rng.normal(0,1,(n,2)) * np.exp(-t*decay)[:,None]
    imp = np.stack([fft_filter(imp[:,0],'lowpass',5000,1), fft_filter(imp[:,1],'lowpass',5000,1)],1)
    imp /= np.max(np.abs(imp)) + 1e-9
    y = np.stack([signal.fftconvolve(x[:,0], imp[:,0])[:N], signal.fftconvolve(x[:,1], imp[:,1])[:N]],1)
    return x*(1-wet) + y*wet

music = reverb(music, .28, 2.2, 3.2)
foley = reverb(foley, .10, 1.0, 6.0)

mix = music * .55 + foley * .85 + voice * 1.0
# gentle bus compression
mix = np.tanh(mix * 1.15 * .9)
# normalize to -1.5 dBFS
peak = np.max(np.abs(mix))
if peak > 0: mix = mix / peak * 10 ** (-1.5/20)

sf.write(os.path.join(OUT, 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
sf.write(os.path.join(OUT, 'music.wav'), (music/np.max(np.abs(music))*0.8).astype(np.float32), SR, subtype='PCM_24')
sf.write(os.path.join(OUT, 'voice.wav'), (voice/np.max(np.abs(voice))*0.9).astype(np.float32), SR, subtype='PCM_24')
print('wrote', os.path.join(OUT,'mix.wav'), 'peak', round(float(np.max(np.abs(mix))),3))
print('voice times', TIMES)
