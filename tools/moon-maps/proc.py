import numpy as np, os, sys
from PIL import Image, ImageFilter
S='stel'; N='nasa'; O='out'
def _g1(sigma):
    r=int(max(1,round(sigma*3))); x=np.arange(-r,r+1,dtype=np.float32); k=np.exp(-x*x/(2*sigma*sigma)); return k/k.sum(), r
def wrapblur(a, sigma):
    """separable gaussian blur of float HxW or HxWxC array; wraps horizontally, clamps vertically"""
    k,r=_g1(sigma); a=a.astype(np.float32); sq=a.ndim==2
    if sq: a=a[...,None]
    h,w,c=a.shape
    t=np.concatenate([a[:,-r:],a,a[:,:r]],axis=1)                      # wrap pad x
    t=sum(k[i]*t[:,i:i+w] for i in range(2*r+1))
    t=np.concatenate([np.repeat(t[:1],r,0),t,np.repeat(t[-1:],r,0)],0) # clamp pad y
    t=sum(k[i]*t[i:i+h] for i in range(2*r+1))
    return t[...,0] if sq else t
def load_rgb(p):
    im=Image.open(p)
    if im.mode=='RGBA':
        a=np.asarray(im.split()[3]); print(' alpha min/max',a.min(),a.max()); im=im.convert('RGB')
    return im.convert('RGB')
def up(im,w,h): return np.asarray(im.resize((w,h),Image.BICUBIC),dtype=np.float32)/255
def lum(a): return a[...,0]*0.299+a[...,1]*0.587+a[...,2]*0.114
def save(a,name,q=84,sub=2):
    im=Image.fromarray((np.clip(a,0,1)*255+0.5).astype(np.uint8)); p=f'{O}/{name}.jpg'; im.save(p,quality=q,optimize=True,progressive=True,subsampling=sub); print(name,im.size,os.path.getsize(p)//1024,'KB')
def transplant(base_path,nasa_dir,name,k,sigma=3.0,W=1024,H=512,fill_hi=0.95):
    s=up(load_rgb(base_path),W,H)
    n=np.asarray(Image.open(f'{N}/{nasa_dir}/{nasa_dir}.jpg').convert('L').resize((W,H),Image.BOX if False else Image.LANCZOS),dtype=np.float32)/255
    # valid-data mask: broad bright fill regions = no data
    fill=wrapblur((n>fill_hi).astype(np.float32),6.0); valid=1-np.clip((fill-0.25)/0.35,0,1)
    delta=n-wrapblur(n,sigma)
    ls=lum(s)
    out=s+(k*delta*valid)[...,None]*(0.55+0.45*ls[...,None])
    return out,valid
if __name__=='__main__':
    pass
