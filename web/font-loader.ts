import {getStaticFont,systemFontFamily,textFallbacks,type StaticFont} from './font-catalog';

const requests = new Map<string,Promise<void>>();
const loaded = new Set<string>();
const coverageRequests = new Map<string,Promise<string>>();
const quote=(name:string)=>JSON.stringify(name);
export const fontResource=(path:string)=>`${import.meta.env?.BASE_URL??'/'}${path}`;

/** Large CJK coverage tables travel with the selected font, never in the app bundle. */
function loadCoverage(font:StaticFont):Promise<string> {
  const cached=coverageRequests.get(font.id);if(cached)return cached;
  const task=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch(fontResource(font.coverageResource),{signal:controller.signal});
      if(!response.ok)throw new Error('Font coverage unavailable');
      const characters:unknown=await response.json();
      if(typeof characters!=='string')throw new Error('Invalid font coverage');
      return characters;
    }finally{clearTimeout(timer);}
  })();
  coverageRequests.set(font.id,task);
  void task.catch(()=>{if(coverageRequests.get(font.id)===task)coverageRequests.delete(font.id);});
  return task;
}

/** Share requests across picker, preview and React mounts. Rejected requests can retry. */
export function loadFont(font:StaticFont,sample=false):Promise<void> {
  const key=font.id+(sample?':sample':':full');
  const cached=requests.get(key);if(cached)return cached;
  const task=(async()=>{
    const face=new FontFace(font.family+(sample?' Sample':''),`url(${quote(fontResource(sample?font.sampleResource:font.resource))}) format("woff2")`,{weight:'400',style:'normal',display:'swap'});
    let timer:ReturnType<typeof setTimeout>|undefined;
    try{
      const ready=await Promise.race([face.load(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Font loading timed out')),12000);})]);
      document.fonts.add(ready);loaded.add(key);
    }finally{clearTimeout(timer);}
  })();
  requests.set(key,task);
  void task.catch(()=>{if(requests.get(key)===task)requests.delete(key);});
  return task;
}
export function sampleFamily(font:StaticFont):string {
  return `${quote(font.family+' Sample')}, ${systemFontFamily}`;
}
export function isFontLoaded(id:string):boolean{return loaded.has(id+':full');}
export async function loadTextFont(id:string,text:string):Promise<{family:string;failed:boolean}> {
  const font=getStaticFont(id);if(!font)return {family:systemFontFamily,failed:true};
  try{
    const [,characters]=await Promise.all([loadFont(font),loadCoverage(font)]);
    const fallbacks=textFallbacks(font,text,characters);
    const results=await Promise.allSettled(fallbacks.map(item=>loadFont(item)));
    const families=[font.family,...fallbacks.filter((_,i)=>results[i].status==='fulfilled').map(item=>item.family)];
    return {family:[...families.map(quote),...font.systemFallback.map(name=>name==='sans-serif'?name:quote(name))].join(', '),failed:results.some(item=>item.status==='rejected')};
  }catch{return {family:systemFontFamily,failed:true};}
}
