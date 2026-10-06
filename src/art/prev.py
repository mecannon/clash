import sys,importlib,hum
from PIL import Image
importlib.reload(hum)
def hx(c):return tuple(int(c[i:i+2],16) for i in (1,3,5))
def mix(a,b,k):a,b=hx(a),hx(b);return '#%02x%02x%02x'%tuple(round(a[i]*(1-k)+b[i]*k) for i in range(3))
LOOKS={
 'player':dict(head='cap',cap='#d83838',hair='#3a2a20',shirt='#3888c8',pants='#304060',shoes='#c83030',pack='#f0b830',band='#38c8a8',collar=1),
 'playerG':dict(head='cap',cap='#f4f4f4',visor='#e04848',hair='#8a4a2a',shirt='#e04848',pants='#3a4a78',shoes='#f4f4f4',pack='#f8d048',long=1,skirt=1),
 'rival':dict(head='spiky',hair='#c8782c',shirt='#8058b0',pants='#384050'),
 'prof':dict(head='short',hair='#c8c8d8',shirt='#f0f0f0',pants='#506048',coat=1,glasses=1),
 'mom':dict(head='long',hair='#904828',shirt='#e87898',pants='#c05878'),
 'oldman':dict(head='bald',hair='#d0d0d0',shirt='#58a058',pants='#605040'),
 'corvan':dict(head='short',hair='#3a3a48',shirt='#8a2a2a',pants='#2a2a38',coat=1,scarf='#f8c838'),
 'girl':dict(head='short',hair='#c05028',shirt='#f0c838',pants='#4878c8',bow=1),
 'nurse':dict(head='long',hair='#f0a0b8',shirt='#f8f8f8',pants='#e86888',skirt=1,collar=1),
}
def pal(Lk):
    sh=Lk['shirt'];pa=Lk['pants'];hr=Lk['hair'];cp=Lk.get('cap','#d83838');so=Lk.get('shoes',mix(pa,'#101018',.5));vi=Lk.get('visor',mix(cp,'#201028',.3))
    D=lambda c,k=.38:mix(c,'#1c1030',k);Lt=lambda c,k=.4:mix(c,'#fff4dc',k)
    return {'o':'#201820','S':'#f8d0a8','s':'#d4946c','T':'#fff0e0','E':'#201820','e':mix(hr,'#203060',.6),'W':'#ffffff',
     'L':'#f8f8f8' if Lk.get('collar') else Lt(sh,.15),'X':Lt(sh),'C':sh,'c':D(sh),'P':pa,'p':D(pa),'B':so,'b':D(so),'H':hr,'h':D(hr),'j':Lt(hr),'K':cp,'k':Lt(cp),'q':D(cp),'V':vi,'v':D(vi),'A':Lk.get('coatc',mix(sh,'#1c1030',.06) if Lk.get('coat')==1 else sh),'a':D(Lk.get('coatc',sh)),'G':Lk.get('pack','#f0b830'),'g':D(Lk.get('pack','#f0b830')),'F':Lk.get('scarf','#f8c838'),'f':D(Lk.get('scarf','#f8c838')),'Y':'#2a2a36','R':'#f05a8a','r':'#b02a5a'}
def frame(Lk,d,fr):
    import hum as Hm;D=getattr(Hm,d.upper());P=pal(Lk);g=[[None]*Hm.W for _ in range(Hm.H)]
    def put(layer):
        y0,rows=layer
        for j,r in enumerate(rows):
            for i,ch in enumerate(r):
                if ch!='.' and 0<=y0+j<Hm.H:g[y0+j][i]=P.get(ch,'#ff00ff')
    O=Hm.OVER
    if Lk.get('pack') and d=='up': pass
    legs=D['legs'][fr]
    if Lk.get('skirt'): legs=(legs[0],[r.replace('P','S').replace('p','s') for r in legs[1]])
    if Lk.get('pack') and d=='left':put(O['pack']['left'])
    put(legs);put(D['torso'][fr])
    if Lk.get('skirt'):put(O['skirt'][d])
    if Lk.get('coat'):put(O['coat'][d])
    if Lk.get('pack') and d!='left':put(O['pack'][d])
    put(D['head']);hk=Lk['head']
    if Lk.get('long') and hk!='cap':hk='long'
    put(D['hair'][hk])
    if Lk.get('scarf'):put(O['scarf'][d])
    if Lk.get('glasses'):put(O['glasses'][d])
    if Lk.get('bow'):put(O['bow'][d])
    return g
def render(names,dirs=('down',),out='hp.png',sc=5):
    cols=[(d,f) for d in dirs for f in (0,1,0,2)]
    im=Image.new('RGB',(len(cols)*(hum.W+2)*sc,len(names)*(hum.H+2)*sc),(120,160,110))
    for r,n in enumerate(names):
        for c,(d,f) in enumerate(cols):
            g=frame(LOOKS[n],d,f)
            for y in range(hum.H):
                for x in range(hum.W):
                    if g[y][x]:
                        for yy in range(sc):
                            for xx in range(sc):im.putpixel(((c*(hum.W+2)+1+x)*sc+xx,(r*(hum.H+2)+1+y)*sc+yy),hx(g[y][x]))
    im.save(out)
if __name__=='__main__':render(sys.argv[1].split(','),tuple(sys.argv[2].split(',')) if len(sys.argv)>2 else ('down',))
