export class Renderer2D {
  constructor(canvas, tiles){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tiles = tiles;
    this.scale = 40;
  }
  drawWorld(world){
    const {ctx, scale} = this;
    ctx.fillStyle = '#0e151f';
    ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.translate(8,8);
    for(let y=0;y<world.height;y++){
      for(let x=0;x<world.width;x++){
        const t = world.tileAt(x,y);
        this.drawTile(t, x*scale, y*scale, scale, scale);
      }
    }
    this.drawRobot(world.x*scale, world.y*scale, world.heading, scale);
    ctx.restore();
  }
  drawTile(ch, x, y, w, h){
    const {ctx} = this;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.strokeRect(x,y,w,h);
    if(ch==='#'){ ctx.fillStyle='#233146'; ctx.fillRect(x,y,w,h); }
    if(ch==='G'){ ctx.fillStyle='#0f9ba8'; ctx.fillRect(x,y,w,h); }
  }
  drawRobot(x,y,heading, s){
    const {ctx}=this;
    ctx.save();
    ctx.translate(x+s/2,y+s/2);
    const rot = {N:-90,E:0,S:90,W:180}[heading] || 0;
    ctx.rotate(rot*Math.PI/180);
    ctx.fillStyle = '#af5978';
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s*0.3, -s*0.3);
    ctx.lineTo(s*0.35, 0);
    ctx.lineTo(-s*0.3, s*0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
