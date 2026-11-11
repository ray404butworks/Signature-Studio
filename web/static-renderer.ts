import {canvasSize,type WebConfig} from './model';
import {isStaticFont} from './font-catalog';
import {prepareScene,renderScene} from './renderer';

export type TextLayout={x:number;y:number;size:number;width:number;height:number};
/** Fit actual ink bounds, not character counts; recompute after FontFace loading. */
export function fitStaticText(metrics:Pick<TextMetrics,'width'|'actualBoundingBoxLeft'|'actualBoundingBoxRight'|'actualBoundingBoxAscent'|'actualBoundingBoxDescent'>,preferred:number,slot:{x:number;y:number;width:number;height:number},canvas:{width:number;height:number}):TextLayout {
  const left=metrics.actualBoundingBoxLeft??0,right=metrics.actualBoundingBoxRight??metrics.width;
  const ascent=metrics.actualBoundingBoxAscent||80,descent=metrics.actualBoundingBoxDescent||20;
  const inkWidth=Math.max(1,left+right,metrics.width),inkHeight=Math.max(1,ascent+descent);
  const factor=Math.max(.001,Math.min(preferred/100,(slot.width-24)/inkWidth,(slot.height-24)/inkHeight));
  const width=inkWidth*factor,height=inkHeight*factor;
  const centerX=Math.max(16+width/2,Math.min(canvas.width-16-width/2,slot.x));
  const centerY=Math.max(16+height/2,Math.min(canvas.height-16-height/2,slot.y));
  return {x:centerX+(left-right)*factor/2,y:centerY+(ascent-descent)*factor/2,size:100*factor,width,height};
}

/** Static Canvas rendering stays independent of the timed TYX centerline engine. */
export function renderStaticScene(canvas:HTMLCanvasElement,config:WebConfig,families:Map<number,string>):TextLayout[] {
  const {width,height}=canvasSize(config.canvas.aspect),count=config.mode==='couple'?2:1;
  if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
  const context=canvas.getContext('2d',{alpha:false});if(!context)throw new Error('无法创建预览画布');
  // Preserve authored TYX geometry and ornaments in mixed-font couple designs.
  // Only ordinary fonts are excluded from the legacy engine; no font outline is
  // ever interpreted as a handwriting stroke.
  const legacy=structuredClone(config);legacy.animation.introOutroEnabled=false;
  legacy.people.forEach(person=>{if(isStaticFont(person.font.family)){person.name='M';person.font.family='tyx-brush';}});
  const scene=prepareScene(legacy);
  scene.people=scene.people.filter(group=>!isStaticFont(config.people[group.index].font.family));
  renderScene(canvas,scene,scene.duration,true);
  const layouts:TextLayout[]=[];
  config.people.slice(0,count).forEach((person,index)=>{
    if(!isStaticFont(person.font.family))return;
    const family=families.get(index)??'sans-serif';
    context.save();context.textAlign='left';context.textBaseline='alphabetic';context.font=`100px ${family}`;
    const slot={x:width*(count===2?(index===0?.255:.745):.5)+person.position.x*width,y:height*.53+person.position.y*height,width:width*(count===2?.43:.88),height:height*.76};
    const layout=fitStaticText(context.measureText(person.name),Math.min(height*.30,width*(count===2?.17:.30))*person.position.scale,slot,{width,height});
    context.font=`${layout.size}px ${family}`;context.fillStyle=person.ink.color;context.fillText(person.name,layout.x,layout.y);context.restore();layouts.push(layout);
  });
  return layouts;
}
