import {useEffect,useState} from 'react';
import {fontGroups,getStaticFont,staticFonts,type StaticFont} from './font-catalog';
import {loadFont,sampleFamily} from './font-loader';

function FontOption({font,selected,onSelect}:{font:StaticFont;selected:boolean;onSelect:()=>void}) {
  const [ready,setReady]=useState(false);
  useEffect(()=>{let active=true;void loadFont(font,true).then(()=>{if(active)setReady(true);}).catch(()=>{});return ()=>{active=false;};},[font]);
  return <button className="font-option" type="button" aria-label={font.name} aria-pressed={selected} onClick={onSelect}>
    <span><strong>{font.name}</strong><small>{font.styleLabel}</small></span>
    <span className="font-option-sample" aria-hidden="true" style={{fontFamily:ready?sampleFamily(font):undefined,visibility:ready?'visible':'hidden'}}>{font.sampleText}</span>
  </button>;
}
export function FontPicker({value,onChange}:{value:string;onChange:(id:string)=>void}) {
  const [open,setOpen]=useState(false),font=getStaticFont(value);
  return <div className="font-picker">
    <span className="field-label">字体</span>
    <button className="font-picker-trigger" type="button" aria-label="选择字体" aria-expanded={open} onClick={()=>setOpen(!open)}>{font?font.name:'TYX Brush'}<span className="font-mode">{font?'静态字体':'动态笔迹'}</span><span aria-hidden="true">{open?'−':'＋'}</span></button>
    {open&&<div className="font-options" role="group" aria-label="字体选项" onKeyDown={event=>{if(event.key==='Escape')setOpen(false);}}>
      <button type="button" className="font-option" aria-label="TYX Brush" aria-pressed={!font} onClick={()=>{onChange('tyx-brush');setOpen(false);}}><span><strong>TYX Brush</strong><small>原有动态笔迹</small></span></button>
      {fontGroups.map(group=><div className="font-option-group" key={group.id}><span className="font-group-label">{group.name} · 静态字体</span>{staticFonts.filter(item=>item.language===group.id).map(item=><FontOption key={item.id} font={item} selected={item.id===value} onSelect={()=>{onChange(item.id);setOpen(false);}}/>)}</div>)}
    </div>}
  </div>;
}
