export class WritingPad{
  constructor(canvas,guide){
    this.canvas=canvas;
    this.guide=guide;
    this.context=canvas.getContext('2d');
    this.drawing=false;
    this.lastPoint=null;
    this.distance=0;
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(canvas.parentElement||canvas);
    this.bind();
    this.resize();
  }

  bind(){
    this.canvas.addEventListener('pointerdown',event=>{
      this.drawing=true;
      this.lastPoint=this.point(event);
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener('pointermove',event=>{
      if(!this.drawing||!this.lastPoint)return;
      const point=this.point(event);
      const context=this.context;
      context.beginPath();
      context.moveTo(this.lastPoint.x,this.lastPoint.y);
      context.lineTo(point.x,point.y);
      context.stroke();
      this.distance+=Math.hypot(point.x-this.lastPoint.x,point.y-this.lastPoint.y);
      this.lastPoint=point;
    });
    for(const type of['pointerup','pointercancel','lostpointercapture']){
      this.canvas.addEventListener(type,()=>{
        this.drawing=false;
        this.lastPoint=null;
      });
    }
  }

  point(event){
    const rect=this.canvas.getBoundingClientRect();
    return{x:event.clientX-rect.left,y:event.clientY-rect.top};
  }

  resize(){
    const rect=this.canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const ratio=Math.max(1,window.devicePixelRatio||1);
    this.canvas.width=Math.round(rect.width*ratio);
    this.canvas.height=Math.round(rect.height*ratio);
    this.context.setTransform(ratio,0,0,ratio,0,0);
    this.context.strokeStyle='#0f172a';
    this.context.lineWidth=8;
    this.context.lineCap='round';
    this.context.lineJoin='round';
    this.distance=0;
  }

  clear(){
    this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.distance=0;
  }

  setTarget(text,{rtl=false}={}){
    this.guide.textContent=text||'';
    this.guide.dir=rtl?'rtl':'ltr';
    this.clear();
  }

  setGuideVisible(visible){this.guide.hidden=!visible}
  hasPractice(minimumDistance=70){return this.distance>=minimumDistance}
  destroy(){this.resizeObserver.disconnect()}
}
