import {useEffect,useRef,useState} from 'react';
import {canvasSize,validateConfig,type WebConfig} from './model';
import {isStaticFont,systemFontFamily} from './font-catalog';
import {loadTextFont} from './font-loader';
import {renderStaticScene} from './static-renderer';

export function StaticPreview({config}:{config:WebConfig}) {
  const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null);
  const [display,setDisplay]=useState({width:640,height:360}),[status,setStatus]=useState('');
  const {width,height}=canvasSize(config.canvas.aspect);
  useEffect(()=>{
    const element=stage.current;if(!element)return;
    const observer=new ResizeObserver(([entry])=>{const size=Math.max(1,Math.min(entry.contentRect.width,entry.contentRect.height*width/height));setDisplay({width:size,height:size*height/width});});
    observer.observe(element);return ()=>observer.disconnect();
  },[width,height]);
  useEffect(()=>{
    let active=true;let snapshot:WebConfig;try{snapshot=validateConfig(config);}catch{return;}
    const people=snapshot.people.slice(0,snapshot.mode==='couple'?2:1),families=new Map<number,string>();
    const paint=()=>{if(active&&canvas.current)renderStaticScene(canvas.current,snapshot,families);};
    setStatus('字体加载中…');
    // Paint a readable first frame on a fresh canvas; subsequent switches retain
    // the last complete frame until all requested fonts are ready.
    if(canvas.current&&!canvas.current.dataset.painted){people.forEach((_,i)=>families.set(i,systemFontFamily));paint();canvas.current.dataset.painted='true';}
    void Promise.all(people.map(async(person,index)=>{
      if(!isStaticFont(person.font.family))return false;
      const result=await loadTextFont(person.font.family,person.name);families.set(index,result.family);return result.failed;
    })).then(failed=>{if(!active)return;paint();setStatus(failed.some(Boolean)?'字体加载失败，已使用系统字体':'');}).catch(()=>{if(!active)return;people.forEach((_,i)=>families.set(i,systemFontFamily));paint();setStatus('字体加载失败，已使用系统字体');});
    return ()=>{active=false;};
  },[config]);
  return <><div className="canvas-stage" ref={stage}><div className="canvas-surface" style={{width:display.width,height:display.height,aspectRatio:width/height}}><canvas ref={canvas} role="img" aria-label="静态签名预览" aria-description={config.people.slice(0,config.mode==='couple'?2:1).map(person=>person.name).join(' / ')}/></div></div>
    <div className="canvas-caption"><span className="canvas-meta">{width} × {height}</span><span className="font-mode">静态字体</span></div>
    <p className="canvas-help font-load-status" role="status" aria-live="polite">{status||'静态预览'}</p></>;
}
