import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {staticFonts,getStaticFont,supportsText,textFallbacks} from '../web/font-catalog';
import {defaultWebConfig,validateConfig,saveConfig,loadConfig,hasStaticFonts,STORAGE_KEY} from '../web/model';
import {checkExportSupport,exportVideo} from '../web/export';
import {fitStaticText} from '../web/static-renderer';
import {loadFont,loadTextFont} from '../web/font-loader';

test('six licensed local WOFF2 resources match provenance hashes and preserve test-name coverage',()=>{
  assert.equal(staticFonts.length,6);assert.equal(new Set(staticFonts.map(font=>font.id)).size,6);
  for(const font of staticFonts){
    const full=readFileSync(`public/${font.resource}`),sample=readFileSync(`public/${font.sampleResource}`);
    assert.equal(full.toString('ascii',0,4),'wOF2');assert.equal(createHash('sha256').update(full).digest('hex'),font.sha256);
    assert.equal(createHash('sha256').update(sample).digest('hex'),font.sampleSha256);
    assert.match(readFileSync(`public/${font.licenseFile}`,'utf8'),/SIL Open Font License, Version 1.1/);
    assert.match(font.source,/raw.githubusercontent.com\/google\/fonts\/[0-9a-f]{40}\//);
    assert.ok(existsSync(`public/fonts/${font.id}/NOTICE.txt`));
    for(const text of font.language==='zh'?['林雨晴','陈思远','张晓月']:['Ray','Vivian','Alexander'])assert.ok(supportsText(font,text),`${font.name}: ${text}`);
  }
  assert.ok(staticFonts.reduce((sum,font)=>sum+font.sampleBytes,0)<20000);
  assert.deepEqual(textFallbacks(getStaticFont('caveat')!,'林雨晴 Yuqing Lin').map(font=>font.id),['mashanzheng']);
  assert.deepEqual(textFallbacks(getStaticFont('caveat')!,'Vivian'),[]);
});

test('static Chinese and mixed designs survive storage without changing legacy TYX validation',()=>{
  const config=defaultWebConfig();config.mode='single';config.people[0].font.family='mashanzheng';config.people[0].name='林雨晴 Yuqing Lin';
  let saved='';saveConfig({setItem:(_,value)=>{saved=value;}},config);
  const restored=loadConfig({getItem:key=>key===STORAGE_KEY?saved:null}).config;
  assert.equal(restored.people[0].font.family,'mashanzheng');assert.equal(restored.people[0].name,'林雨晴 Yuqing Lin');assert.ok(hasStaticFonts(restored));
  restored.people[0].font.family='tyx-brush';assert.throws(()=>validateConfig(restored),/英文字母/);
  for(const name of ['','  ','林\n雨晴','A\u202eB']){config.people[0].name=name;assert.throws(()=>validateConfig(config));}
  config.people[0].name='林雨晴';config.people[0].font.family='unknown';assert.throws(()=>validateConfig(config),/字体/);
});

test('static exports are rejected before accessing any browser encoder',async()=>{
  const config=defaultWebConfig();config.people[1].font.family='pacifico';
  assert.match((await checkExportSupport(config)).reason!,/静态字体/);
  await assert.rejects(exportVideo(config),/静态字体/);
  config.mode='single';assert.equal(hasStaticFonts(config),false);
});

test('ink bounds and all artboard ratios constrain long text and extreme saved positions',()=>{
  const metrics={width:1800,actualBoundingBoxLeft:30,actualBoundingBoxRight:1790,actualBoundingBoxAscent:110,actualBoundingBoxDescent:35};
  for(const [width,height] of [[1920,1080],[1080,1920],[1080,1080]])for(const x of [-200,960,2300]){
    const layout=fitStaticText(metrics,600,{x,y:height*1.4,width:width*.43,height:height*.76},{width,height});
    assert.ok(layout.width<=width*.43-24+.001);assert.ok(layout.height<=height*.76-24+.001);
    assert.ok(layout.x-metrics.actualBoundingBoxLeft*layout.size/100>=15.9);
    assert.ok(layout.x+metrics.actualBoundingBoxRight*layout.size/100<=width-15.9);
    assert.ok(layout.y+metrics.actualBoundingBoxDescent*layout.size/100<=height-15.9);
  }
});

test('font loads share a request, failures fall back and a later load can retry',async()=>{
  const oldFont=globalThis.FontFace,oldDocument=globalThis.document;
  let attempts=0,adds=0,fail=false;
  class FakeFace {constructor(..._args:unknown[]){} async load(){attempts++;if(fail)throw new Error('404');return this;}}
  Object.defineProperty(globalThis,'FontFace',{value:FakeFace,configurable:true,writable:true});
  Object.defineProperty(globalThis,'document',{value:{fonts:{add:()=>{adds++;}}},configurable:true,writable:true});
  try{
    const font=getStaticFont('longcang')!;await Promise.all([loadFont(font),loadFont(font)]);assert.equal(attempts,1);assert.equal(adds,1);
    fail=true;const result=await loadTextFont('pacifico','Vivian');assert.equal(result.failed,true);assert.match(result.family,/sans-serif/);
    fail=false;assert.equal((await loadTextFont('pacifico','Vivian')).failed,false);assert.equal(attempts,3);
  }finally{Object.defineProperty(globalThis,'FontFace',{value:oldFont,configurable:true,writable:true});Object.defineProperty(globalThis,'document',{value:oldDocument,configurable:true,writable:true});}
});
