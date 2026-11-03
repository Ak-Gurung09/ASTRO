"""Builds the moon maps used by ASTRO LAB from two public sources.
 STELLARIUM = github.com/Stellarium/stellarium @ 1b75fca9 (textures/*.png, moon_4k.jpg)  -- full-coverage colour maps
 NASA3D     = github.com/nasa/NASA-3D-Resources @ 11ebb4ee (Images and Textures/*)       -- 1440x720 JPL maps (public domain)
Recipe per body is in RECIPES below."""
import sys, os
sys.path.insert(0,'.')
from proc import *
O='final'
def desat(a,keep):
    l=lum(a)[...,None]; return l+(a-l)*keep
def gain(a,g): return a*g
R={}
# 1) NASA detail added to the Stellarium colour map where the two maps are registered
for name,nd,k,ds in [('europa','Jupiter - Europa',0.7,1.0),('ganymede','Jupiter - Ganymede',0.55,1.0),('callisto','Jupiter - Callisto',0.5,0.45)]:
    out,_=transplant(f'{S}/{name}.png',nd,name,k)
    if ds!=1.0: out=desat(out,ds)
    R[name]=(out,84)
# 1b) Phobos: NASA/JPL map only (public domain), 1440x720 -> 1024x512, with a mild warm-grey tint
ph=np.asarray(Image.open(f'{N}/Mars - Phobos/Mars - Phobos.jpg').convert('L').resize((1024,512),Image.LANCZOS),dtype=np.float32)/255
R['phobos']=(np.stack([ph*1.04,ph*0.97,ph*0.90],axis=2),84)
# 2) Stellarium maps as they are
for name in ['io','charon','enceladus','triton','titan']:
    R[name]=(np.asarray(load_rgb(f'{S}/{name}.png'),dtype=np.float32)/255,90)
# 3) Moon: LROC-based 4k map, reduced to 2048 and dimmed to sit with the other bodies
m=np.asarray(Image.open(f'{S}/moon_4k.jpg').convert('RGB').resize((2048,1024),Image.LANCZOS),dtype=np.float32)/255
R['moon']=(gain(m,0.8),80)
import proc; proc.O=O
for k,(a,q) in R.items(): proc.save(a,k,q=q)
