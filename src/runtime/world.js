export class World {
  constructor({width=12,height=8,start={x:0,y:0,heading:'E'}, tilemap=[]}={}){
    this.width=width; this.height=height; this.tilemap=tilemap;
    this.x=start.x; this.y=start.y; this.heading=start.heading||'E';
  }
  turn(dir, angle){
    const dirs=['N','E','S','W'];
    let idx = dirs.indexOf(this.heading);
    const steps = Math.round((angle/90)) % 4;
    idx = (idx + (dir==='LEFT' ? (4-steps) : steps)) % 4;
    this.heading = dirs[idx];
  }
  move(steps){
    for(let i=0;i<steps;i++){
      let nx=this.x, ny=this.y;
      if(this.heading==='N') ny--;
      if(this.heading==='S') ny++;
      if(this.heading==='E') nx++;
      if(this.heading==='W') nx--;
      if(nx<0||ny<0||nx>=this.width||ny>=this.height) break;
      if(this.tileAt(nx,ny)==='#') break;
      this.x=nx; this.y=ny;
    }
  }
  tileAt(x,y){
    const row = this.tilemap[y]||'';
    return row[x]||'.';
  }
}
