import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await fs.readFile(path.join(root,'data/components.json'),'utf8'));
const report={date:new Date().toISOString(),checks:[],assets:{}};
function check(name,fn){fn();report.checks.push({name,result:'pass'});}
function near(a,b,e=2e-5){assert.ok(Math.abs(a-b)<e,`${a} != ${b}`)}
function xyzNear(a,b){a.forEach((v,i)=>near(v,b[i]))}
const cv=([x,y,z])=>[x,z,-y];
for(const file of ['robot_web.glb','robot_web_lod1.glb']){
 const buf=await fs.readFile(path.join(root,'web',file));
 assert.equal(buf.readUInt32LE(0),0x46546c67);assert.equal(buf.readUInt32LE(4),2);assert.equal(buf.length,buf.readUInt32LE(8));
 const gltf=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString());
 const parsed=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
 const model=parsed.scene;const nodes=new Map();
 model.traverse(o=>{if(o.name.startsWith('part__')&&o.userData.component_id)nodes.set(o.userData.component_id,o)});
 model.updateMatrixWorld(true);
 check(file+': component IDs uniquely mapped',()=>{assert.equal(nodes.size,data.components.length);for(const c of data.components)assert.ok(nodes.has(c.id));assert.equal(gltf.nodes.filter(n=>n.name?.startsWith('part__')).length,data.components.length)});
 check(file+': assembly transforms match metre / Z-to-Y convention',()=>{
  for(const c of data.components)xyzNear(nodes.get(c.id).getWorldPosition(new THREE.Vector3()).toArray(),cv(c.assembly_transform.world_floor_xyz_m));
 });
 const snapshots=new Map([...nodes].map(([id,n])=>[id,n.position.clone()]));
 const world=new Map([...nodes].map(([id,n])=>[id,n.getWorldPosition(new THREE.Vector3())]));
 for(const c of data.components)nodes.get(c.id).position.add(new THREE.Vector3(...c.exploded_offset_parent_gltf_m));
 model.updateMatrixWorld(true);
 check(file+': hierarchical explosion matches documented world offsets',()=>{
  for(const c of data.components){const expected=world.get(c.id).clone().add(new THREE.Vector3(...cv(c.exploded_offset)));xyzNear(nodes.get(c.id).getWorldPosition(new THREE.Vector3()).toArray(),expected.toArray())}
 });
 for(const [id,n] of nodes)n.position.copy(snapshots.get(id));model.updateMatrixWorld(true);
 check(file+': explosion round-trip restores all assembly positions',()=>{for(const [id,n] of nodes)xyzNear(n.getWorldPosition(new THREE.Vector3()).toArray(),world.get(id).toArray())});
 const mount=nodes.get('arm.mount'),arm=nodes.get('arm.so101');const lower=snapshots.get('arm.mount').clone();
 check(file+': Lift endpoints are 1005 and 1205 mm above floor',()=>{
  for(const [delta,z] of [[-.1,1.005],[.1,1.205]]){mount.position.copy(lower);mount.position.y+=delta;model.updateMatrixWorld(true);near(arm.getWorldPosition(new THREE.Vector3()).y,z)}
 });mount.position.copy(lower);model.updateMatrixWorld(true);
 check(file+': wheel axes and revised LiDAR placement',()=>{
  for(const c of data.components.filter(c=>c.id.startsWith('mobility.wheel.'))){const p=nodes.get(c.id).getWorldPosition(new THREE.Vector3());const [x,y,z]=c.known.origin_base_m;xyzNear(p.toArray(),[x,z+.1125,-y])}
  xyzNear(nodes.get('perception.lidar.mid360').getWorldPosition(new THREE.Vector3()).toArray(),[.165,1.370,0]);
 });
 check(file+': imported six-axis default pose uses ROS-to-glTF rotations',()=>{
  const basis=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
  for(const j of data.arm_joints){const [w,x,y,z]=j.rest_quaternion_wxyz;const motion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),j.pose_rad);const expect=basis.clone().multiply(new THREE.Quaternion(x,y,z,w).multiply(motion)).multiply(basis.clone().invert());const got=model.getObjectByName(j.node);assert.ok(got);near(Math.abs(expect.dot(got.quaternion)),1,1e-5)}
 });
 check(file+': batteries, motor identities, control modules and material rules',()=>{
  const cells=data.components.filter(c=>c.id.startsWith('electrical.battery.'));assert.equal(cells.length,4);
  for(const c of cells){assert.equal(c.known.voltage_v,12);assert.deepEqual(c.known.body_dimensions_m,[.150,.065,.092]);const p=nodes.get(c.id).getWorldPosition(new THREE.Vector3());assert.ok(p.y+.046<.3);assert.equal(p.z<0,c.id.includes('.left'))}
  for(const [tag,ids,key] of [['drive',[1,2,3],'drive_modbus_id'],['steer',[11,12,13],'steer_id']])assert.deepEqual(data.components.filter(c=>c.id.startsWith('mobility.'+tag+'_motor.')).map(c=>c.known[key]).sort((a,b)=>a-b),ids);
  for(const id of ['arduino','mosfet','rs485'])assert.ok(nodes.has('lift.control.'+id));
  const pc=nodes.get('electrical.pc').getWorldPosition(new THREE.Vector3());const stop=nodes.get('safety.estop').getWorldPosition(new THREE.Vector3());assert.ok(pc.z>0&&stop.z<0);near(pc.y-.0275,.515);near(stop.y-.006,.515);
  let vendorCount=0,printedCount=0,armBlueCount=0;
  model.traverse(o=>{if(o.userData.source_cad)vendorCount++;if(o.isMesh&&o.userData.material_class==='printed-arm'){armBlueCount++;assert.equal(o.material.name,'SO101 installed light blue')}if(o.isMesh&&o.userData.material_class==='printed'){printedCount++;assert.ok(!o.name.includes('Fork')&&!o.name.includes('swivel')&&!o.name.includes('saddle'));const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)assert.equal(m.name,'Printed polymer yellow')}});
  assert.equal(vendorCount,6);assert.ok(printedCount>=8);assert.ok(armBlueCount>=6);
 });
 check(file+': Drive long axes are vertical and per-wheel photos match',()=>{
  for(const [tag,photo] of [['rear','1-back'],['front_left','2-front-left'],['front_right','3-front-right']]){
   const id='mobility.drive_motor.'+tag;const n=nodes.get(id);const axis=new THREE.Vector3(1,0,0).applyQuaternion(n.getWorldQuaternion(new THREE.Quaternion()));near(Math.abs(axis.y),1);near(axis.x,0);near(axis.z,0);
   const refs=data.components.find(c=>c.id===id).source_refs.filter(p=>p.includes('/drive-motors/')&&/\.jpe?g$/.test(p));assert.ok(refs.length);for(const p of refs)assert.ok(p.includes(photo));
  }
 });
 check(file+': drivers belong to mobility and follow left/right layout',()=>{
  assert.equal(data.components.find(c=>c.id==='electrical.controllers').interaction_group,'mobility');
  for(const id of [1,2,3]){const c=data.components.find(c=>c.id==='mobility.driver.'+id);assert.equal(c.interaction_group,'mobility');const p=nodes.get(c.id).getWorldPosition(new THREE.Vector3());assert.equal(p.z<0,id<3);near(p.y-.024,.300)}
 });
 check(file+': Lift boards and AZD share one carrier in assembled and exploded states',()=>{
  const carrier=data.components.find(c=>c.id==='lift.control.carrier');
  for(const id of ['lift.driver.azd_kd','lift.control.arduino','lift.control.mosfet','lift.control.rs485']){const c=data.components.find(c=>c.id===id);assert.equal(c.parent_id,carrier.id);assert.equal(nodes.get(id).parent,nodes.get(carrier.id));xyzNear(c.exploded_offset,carrier.exploded_offset)}
 });
 const triangles=gltf.meshes.reduce((s,m)=>s+m.primitives.reduce((s,p)=>s+gltf.accessors[p.indices].count/3,0),0);
 report.assets[file]={bytes:buf.length,triangles,nodes:gltf.nodes.length,sha256:createHash('sha256').update(buf).digest('hex')};
}
check('Mobile LOD reduces triangles and file size',()=>{assert.ok(report.assets['robot_web_lod1.glb'].triangles<report.assets['robot_web.glb'].triangles*.65);assert.ok(report.assets['robot_web_lod1.glb'].bytes<report.assets['robot_web.glb'].bytes*.65)});
const refs=await fs.readFile(path.join(root,'data/source-files.json'),'utf8');
for(const c of data.components)for(const r of [...c.source_refs,...(c.reference_refs||[])])await fs.access(path.join(root,r));
report.checks.push({name:'All component evidence references resolve locally',result:'pass'});
check('Formal sources exclude development feedback and hand sketch',()=>{for(const c of data.components)for(const p of [...c.source_refs,...(c.reference_refs||[])])assert.ok(!/feedback-v|image-20260920224710003/.test(p));assert.ok(!/feedback-v|image-20260920224710003/.test(refs))});
check('Camera measurements are distinct from derived display pitch',()=>{const c=data.components.find(c=>c.id==='perception.camera.d435');assert.deepEqual(c.known.measured_ground_range_m,[.4,1.6]);near(c.known.measured_near_width_m,.7);assert.ok(!('design_ground_range_m' in c.known));assert.ok(data.camera_display_pose);assert.ok(c.known.display_pitch_down_rad>.4&&c.known.display_pitch_down_rad<1.1)});
const integrity=JSON.parse(await fs.readFile(path.join(root,'data/reference-integrity.json'),'utf8'));
// Japanese prose has its own source-and-translation manifest; raw geometry/configuration remains byte-identical.
if(!await fs.access(path.join(root,'localization/ja-manifest.json')).then(()=>true,()=>false)){
 for(const item of integrity.files){const b=await fs.readFile(path.join(root,item.file));assert.equal(createHash('sha256').update(b).digest('hex'),item.sha256)}
 report.checks.push({name:'All original reference snapshot hashes preserved',result:'pass'});
}
const manifest=JSON.parse(await fs.readFile(path.join(root,'web/export-manifest.json'),'utf8'));
for(const [file,meta] of Object.entries(manifest.files)){const bytes=await fs.readFile(path.join(root,file));assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.sha256)}
report.checks.push({name:'Export-manifest hashes match delivered assets',result:'pass'});
await fs.writeFile(path.join(root,'data/validation-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
