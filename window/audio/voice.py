import os, json, subprocess
from gtts import gTTS

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'voice')
os.makedirs(OUT, exist_ok=True)

LINES = [
    ('l1', '建筑史，也许只是墙上的一道缝，慢慢张开。'),
    ('l2', '公元前五世纪，石柱之间，光和风第一次被允许进来。'),
    ('l3', '中世纪，人们把光砌进墙里；哥特式窗户，向上帝借来颜色。'),
    ('l4', '文艺复兴，阿尔伯蒂说：画，是一扇敞开的窗。'),
    ('l5', '一八五一年，铁与玻璃把墙变成一层薄膜。'),
    ('l6', '现代主义者说：墙就是窗；网格统治一切。'),
    ('l7', '后现代来了，窗开始开玩笑。'),
    ('l8', '今天，窗学会了计算；建筑变成一层会呼吸的皮肤。'),
    ('l9', '而最初的那道缝，至今仍在。'),
]

durs = {}
for lid, text in LINES:
    mp3 = os.path.join(OUT, lid + '.mp3')
    raw = os.path.join(OUT, lid + '_raw.wav')
    wav = os.path.join(OUT, lid + '.wav')
    if not os.path.exists(mp3) or os.path.getsize(mp3) < 1000:
        gTTS(text=text, lang='zh-CN', slow=False).save(mp3)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',mp3,'-ar','48000','-ac','1',raw], check=True)
    import soundfile as sf, numpy as np
    x, sr = sf.read(raw, dtype='float32')
    a = np.abs(x)
    thr = max(0.008, a.max() * 0.012)
    idx = np.where(a > thr)[0]
    if len(idx):
        i0 = max(0, idx[0] - int(sr * 0.05)); i1 = min(len(x), idx[-1] + int(sr * 0.12))
        x = x[i0:i1]
    sf.write(wav, x, sr, subtype='PCM_16')
    d = len(x) / sr
    durs[lid] = round(d, 3)
    print(lid, durs[lid], 's', text)

json.dump(durs, open(os.path.join(OUT,'dur.json'),'w'), ensure_ascii=False, indent=1)
print('total', round(sum(durs.values()),2))
