import catalog from '../public/fonts/catalog.json';

export const staticFonts = catalog;
export type StaticFont = typeof staticFonts[number];
export const fontGroups = [{id:'zh',name:'中文'},{id:'en',name:'英文'}] as const;
const byId = new Map(staticFonts.map(font=>[font.id,font]));
const coverage = new WeakMap<StaticFont,Set<string>>();
export const getStaticFont = (id:string) => byId.get(id);
export const isStaticFont = (id:string) => byId.has(id);
export const systemFontFamily = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';
export function supportsText(font:StaticFont,text:string,characterCoverage:string):boolean {
  let characters=coverage.get(font);
  if(!characters){characters=new Set(characterCoverage);coverage.set(font,characters);}
  return [...text].every(char=>/\s/u.test(char)||characters.has(char));
}
export function textFallbacks(font:StaticFont,text:string,characterCoverage:string):StaticFont[] {
  if(supportsText(font,text,characterCoverage))return [];
  return font.fallback.map(getStaticFont).filter((item):item is StaticFont=>!!item);
}
