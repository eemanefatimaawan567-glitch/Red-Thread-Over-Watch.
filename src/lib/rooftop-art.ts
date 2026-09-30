import * as THREE from 'three';

/** Decorative details stay outside walking routes or flush with existing surfaces. */
export function addRooftopIdentity(scene: THREE.Scene) {
  const coral = new THREE.MeshBasicMaterial({ color: '#ff7f91' });
  const cream = new THREE.MeshStandardMaterial({ color: '#ffe3c1', roughness: .9, side: THREE.DoubleSide });
  const mint = new THREE.MeshBasicMaterial({ color: '#95e7d1' });
  const dark = new THREE.MeshBasicMaterial({ color: '#303049' });
  const thread = (points: number[][], material = coral, radius = .025) => {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [number,number,number])));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 5, false), material);
    scene.add(mesh);
  };
  // One continuous memorial thread: the central visual motif, never a false route marker.
  thread([[-14,1.55,-10.9],[-8,1.2,-10.9],[-2,1.5,-10.9],[4,1.2,-10.9],[11,1.55,-10.9]]);
  const cranes: THREE.Group[] = [];
  for (let i = 0; i < 7; i++) {
    const x = -11 + i * 3;
    thread([[x,1.4,-10.9],[x,.95,-10.9]], coral, .012);
    const bird = new THREE.Group();
    const wing = new THREE.BufferGeometry();
    wing.setAttribute('position', new THREE.Float32BufferAttribute([-.38,.2,0, 0,0,.18, 0,.07,-.12, .38,.2,0, 0,.07,-.12, 0,0,.18], 3));
    wing.computeVertexNormals();
    bird.add(new THREE.Mesh(wing, cream));
    const beak = new THREE.Mesh(new THREE.ConeGeometry(.065,.25,4), cream);
    beak.rotation.x = Math.PI / 2; beak.position.set(0,.05,.19); bird.add(beak);
    bird.position.set(x,.85,-10.9); scene.add(bird); cranes.push(bird);
  }
  const sign = (title: string, subtitle: string, x:number,y:number,z:number,w:number,h:number,color:string) => {
    const canvas = document.createElement('canvas'); canvas.width=768; canvas.height=256;
    const ctx=canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle='#20283d'; ctx.fillRect(0,0,768,256);
    ctx.strokeStyle=color; ctx.lineWidth=6; ctx.strokeRect(12,12,744,232);
    ctx.fillStyle=color; ctx.textAlign='center'; ctx.font='bold 62px sans-serif'; ctx.fillText(title,384,112);
    ctx.fillStyle='#ffe9d4'; ctx.font='25px monospace'; ctx.fillText(subtitle,384,187);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace=THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map}));
    mesh.position.set(x,y,z); scene.add(mesh);
  };
  sign('PIP’S NIGHT SHIFT','WARM TEA · LOST & FOUND',-10.7,1.88,5.69,2.25,.74,'#ffb39d');
  sign('THE MISSING HAVE NAMES','LEAVE A CRANE. KEEP A LIGHT.',-12.2,1.2,-8.13,4.6,1.25,'#ff93a6');
  sign('07 / SIGNAL GARDEN','LUMA ROOFTOP SERVICE',12.4,1.5,-8.33,4.2,1.3,'#95e7d1');
  // A small mascot sits on the kiosk, echoing Pip's friendly city origins.
  const mascot = new THREE.Mesh(new THREE.SphereGeometry(.39,12,9),cream); mascot.position.set(-10.7,2.93,4.8); scene.add(mascot);
  [-1,1].forEach(side=>{
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),dark); eye.position.set(-10.7+side*.13,2.96,5.16); scene.add(eye);
    const fin=new THREE.Mesh(new THREE.ConeGeometry(.13,.35,4),mint); fin.rotation.z=side*1.1; fin.position.set(-10.7+side*.4,2.88,4.8); scene.add(fin);
  });
  // Lanterns and the distant moon establish a warm city beyond the cold relay.
  thread([[-15,5,-12],[-8,4.35,-12],[0,4.8,-12],[8,4.35,-12],[15,5,-12]],dark,.018);
  for(let i=0;i<9;i++){
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),i%2?mint:coral);
    lamp.position.set(-14+i*3.5,4.6,-12); lamp.scale.y=1.35; scene.add(lamp);
  }
  const moon=new THREE.Mesh(new THREE.SphereGeometry(1.4,24,16),new THREE.MeshBasicMaterial({color:'#e4c6cb',fog:false}));
  moon.position.set(-11,12,-26); scene.add(moon);
  // Flat painted service arrows make the architecture readable without adding obstacles.
  for(const x of [-6,-2,2,6]){
    const shape=new THREE.Shape();shape.moveTo(-.3,-.12);shape.lineTo(.08,-.12);shape.lineTo(.08,-.3);shape.lineTo(.45,0);shape.lineTo(.08,.3);shape.lineTo(.08,.12);shape.lineTo(-.3,.12);shape.closePath();
    const arrow=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:'#adb6c8',transparent:true,opacity:.35,side:THREE.DoubleSide}));
    arrow.rotation.x=-Math.PI/2;arrow.position.set(x,.035,7);scene.add(arrow);
  }
  return (elapsed:number) => cranes.forEach((bird,i)=>{bird.rotation.z=Math.sin(elapsed*1.25+i)*.12;});
}
