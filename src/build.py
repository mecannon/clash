import os
d=os.path.dirname(os.path.abspath(__file__))
r=lambda f:open(os.path.join(d,f)).read()
s=r('shell.html')
s=s.replace('/*THREE*/',r('vendor/three.min.js').replace('</script>','<\\/script>'))
s=s.replace('/*SPR*/',r('spr.js')).replace('/*GAME*/',r('game.js')+'\n'+r('mons2.js')).replace('/*STORY*/',r('story.js')+'\n'+(r('net.js') if os.path.exists(os.path.join(d,'net.js')) else '')).replace('/*R3D*/',r('r3d.js') if os.path.exists(os.path.join(d,'r3d.js')) else '')
os.makedirs(os.path.join(d,'dist'),exist_ok=True)
open(os.path.join(d,'dist/typeclash.html'),'w').write(s)
page='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>'+s+'</body></html>'
open(os.path.join(d,'dist/page.html'),'w').write(page)
# the repo root copy is what the server (and Render) serves
root=os.path.join(os.path.dirname(d),'typeclash.html')
if os.path.exists(os.path.join(os.path.dirname(d),'server.js')):open(root,'w').write(page)
print('built',len(s))
