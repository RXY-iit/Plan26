import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const groups={all:'全部',base:'结构',mobility:'轮组',lift:'升降',arm:'机械臂',perception:'感知',electrical:'电气',cables:'线束'};
const statusLabels={'operator-confirmed':'操作员确认',measured:'实测记录',manufacturer:'厂家资料',runtime:'运行参数','model-derived':'原始网格','photo-estimated':'照片估算',conflict:'证据冲突',unknown:'待确认'};
const statusColors={'operator-confirmed':0x658b60,measured:0x5a9273,manufacturer:0x5a9273,runtime:0x6c91ba,'model-derived':0x3b9d9b,'photo-estimated':0xc39857,conflict:0xc5785d,unknown:0xc39857};
const summaries={
'robot.root':'把结构、运动关系和证据放在同一个视图中。点击任一零件，查看它是什么、如何安装，以及哪些信息仍待确认。',
'base.frame':'以 700 × 600 mm 实测包络为基础，用 4040 与 2020 型材重建主要结构。逐根长度和层级覆盖范围仍为照片估算。',
'arm.so101':'复用完整原始 STL，按 URDF 重建六轴层级。初始姿态为记录中的 see_front；安装页可切换观察姿态。',
'perception.camera.d435':'直接复用 D435 网格，保留相机 link、optical frame 与视觉网格原点的区别。',
'perception.lidar.mid360':'官方 Livox CAD；安装在 1330 mm 顶梁的黄色打印支架上，位于支柱中心稍后方。精确原点和倾角仍待复测。',
'lift.stage.eas':'200 mm 机械行程，承载机械臂升降。下方滑杆可查看行程内的几何变化。',
'arm.mount':'升降滑块与 SO101 之间的转接结构。模型随 Lift 滑杆平移，支架外形为待替换占位。',
'safety.estop':'操作员确认：机器人左侧（+Y），安装在离地 515 mm 平台。其已记录作用是使驱动电机撤去励磁。'};
const design={
 "lift.stage.eas": {
  "fact": "EASM2XF020AZAK：机械行程 200 mm，丝杠导程 3 mm。已下载官方外形图：40 mm 宽导轨、316.7 mm 轨体及 405 mm 总长；安装基准按已有资料重建。",
  "reason": "操作员确认：按机械臂自身重量、Lift 附加部件的总负载和所需升降能力选型。机械臂 + Lift 的布置面向离地约 0.9–1.7 m 的按钮、电梯面板、桌面和人机交互目标。",
  "open": "尚未取得官方 STEP。负载、重心、力矩数值与任务可达性验证仍待补充；0.9–1.7 m 是目标物高度，不是已验证工作包络。"
 },
 "perception.camera.d435": {
  "fact": "测量图记录：机器人前方近端 0.4 m、远端 1.6 m，近端宽 0.7 m。图中没有给出数值安装角或远端宽度。",
  "reason": "相机为近距离地面、障碍物识别和 Local Planner 提供信息。显示俯角结合参考安装高度和0.4–1.6 m端点推算；原始运行TF保持不变。",
  "open": "该角度是展示推算，不是图中直接测得的标定值。远端宽度仅为概念延伸，不能视作测量。需要当前内参与精确距离起点才能验证完整覆盖。"
 },
 "perception.camera.pan_tilt": {
  "fact": "2 × ROBOTIS XC330-M288-T，使用官方 XL/XC-330 共用 STEP。两电机间的连接件与相机座均为黄色打印件。",
  "reason": "依据实机照片重建双电机与打印连接件。以真实 Tilt 枢轴调整展示姿态，使相机朝向测量图0.4–1.6 m区域；既有URDF保留在 Reference 中。",
  "open": "打印件厚度、孔位按照片估算；图中60°/120°用于结构理解，不能等同于关节命令或新增相机标定。"
 },
 "perception.lidar.mid360": {
  "fact": "Livox 官方 STEP，机身 65 × 65 × 60 mm（不含突出连接器）；FOV 相对局部中心平面水平360°、向下7°、向上52°。",
  "reason": "安装设计：位于1330 mm顶梁打印holder上，稍靠柱中心后方。操作员确认：LiDAR 用于定位，高位获取周围环境；根据 MID-360 的视场向前倾斜，目标感知前方约 1.5 m 以外环境。更近的障碍物与 Local Planner 感知交给 Depth Camera。",
  "open": "30°沿用旧运行记录，实际倾角和安装原点仍待复测；当前点云覆盖不是几何示意可以证明的。旧运行 TF 保留为历史对照，未修改原始 URDF。"
 },
 "perception.lidar.holder": {
  "fact": "操作员确认的 3D 打印支架，黄色；开放楔形轮廓参考 IMG_0366 与 Mid3601。",
  "reason": "顶梁提供安装面，楔形上座使 LiDAR 前倾并稍靠后。",
  "open": "壁厚、斜角和紧固孔位尚无加工图，当前仅用于结构说明。"
 },
 "arm.so101": {
  "fact": "SO101 原始六关节网格、STS3215 舵机与记录姿态；臂体浅蓝色，舵机黑色。",
  "reason": "参考装配坐标：Lift下端底座离地1005 mm，上端1205 mm；这些是模型中的安装基准。操作员确认：机械臂安装高度围绕离地约 0.9–1.7 m 的物体设计，用于按钮、电梯面板、桌面物体与人机交互。Lift 依据臂体和附加部件实际负载选型。",
  "open": "目标物高度不等同于所有姿态均可达。具体目标位姿、负载、碰撞与运动规划仍需任务级验证。"
 },
 "mobility.drive_motor": {
  "fact": "3 × BLMR5100K-GFV-B + GFS5G30FR，搭配 BLVD-KRD。后轮 ID1、左前 ID2、右前 ID3；三个 XH540-W270 对应转向 ID11/12/13。 三台 Drive 的纵向长轴竖直布置；每轮仅引用该轮对应铭牌照片。",
  "reason": "三组独立 Drive / Steer 实现底盘运动。金属连接结构使用浅蓝色金属材质，标准电机保持产品外观。驱动器归入轮组：ID1/2位于左侧，ID3位于右侧。",
  "open": "驱动部件依据官方尺寸图重建；转向舵机使用官方共用 CAD。轮轴、安装孔位和安装方向仍需复测。"
 },
 "base.frame": {
  "fact": "700 × 600 mm 包络，300 / 515 / 620 / 1330 mm 平面，主 4040、前柱 2020。",
  "reason": "300 mm平台承载轮组驱动器与Lift控制组件；515 mm平台左侧急停、右侧PC；300 mm平台下方左右各两块电池。左右布局属于安装说明，不要求为每一项强配Evidence。",
  "open": "逐根切割表、孔位及部分支撑结构仍为照片估算。"
 },
 "lift.control.carrier": {
  "fact": "实机照片 IMG_0372 可观察到 AZD-KD、Arduino 与接口小板的集中组合关系。",
  "reason": "AZD-KD、Arduino、MOSFET 5 V→24 V、RS-485 通过同一黄色打印托架组合安装，位于300 mm平台同一区域。详细位置、托架外形为安装设计说明。",
  "open": "Arduino 版本、MOSFET / RS-485 完整 SKU、托架孔位与接线拓扑未确认。"
 }
};
const readable={body_dimensions_m:'机身包络',robot_side:'机器人侧别',mounting_platform_floor_m:'安装平台离地',mounting_below_floor_m:'位于平台下方',voltage_v:'标称电压 · V',motor_model:'电机型号',motor_count:'电机数量',target_object_height_floor_m:'目标物高度（设计）',measured_ground_range_m:'测量图前方范围',measured_near_width_m:'测量图近端宽度',display_pitch_down_rad:'展示俯角（推算）',coverage_reference:'测量基准说明',installation_direction:'安装方向',driver_layout:'驱动器布局',included_modules:'组合部件',fov_reference:'视场基准',photo_annotated_range_m:'照片标注地面范围',design_far_environment_from_m:'远距环境设计分界',placement_note:'安装说明',selection_basis:'选型依据',frame_ground_footprint_m:'框架平面尺寸',measured_ground_footprint_m:'实测平面尺寸',measured_top_plane_heights_m:'结构上平面高度',main_extrusion_profile_m:'主型材截面',front_vertical_support_profile_m:'前支架截面',origin_base_m:'轮轴坐标 · base_link',wheel_radius_m:'轮半径',wheel_width_m:'轮宽（运行占位）',drive_modbus_id:'驱动 Modbus ID',steer_id:'转向 ID',mechanical_stroke_m:'机械行程',normal_motion_range_m:'日常软件区间',ball_screw_lead_m:'丝杠导程',body_diameter_m:'机身直径',body_height_m:'机身高度',mass_kg:'质量',horizontal_fov_deg:'水平视场',vertical_fov_deg:'垂直视场',runtime_mount_bottom_base_link_xyz_m:'运行安装原点 · base_link',runtime_pitch_rad:'运行安装倾角',servo_model:'关节舵机',actuated_joints:'主动关节',host_environment:'计算主机',resolution:'分辨率',calibration_rms_px:'标定 RMS',arm_base_height_floor_at_lower_m:'下端底座离地',arm_base_height_floor_at_upper_m:'上端底座离地',mount_x_m:'安装 X',mount_y_m:'安装 Y',mount_z_range_m:'base_link Z 范围',mount_yaw_rad:'安装 yaw',interface:'接口',power:'供电',feedback:'位置反馈',runtime_namespace:'运行命名空间',driver_model:'驱动器',gearhead_model_verified_from_nameplate:'铭牌减速头',neutral_raw_deg:'neutral 原始角',pan_axis_base_link_xyz_m:'Pan 轴 · base_link',tilt_axis_neutral_base_link_xyz_m:'Tilt 轴 · base_link',holder_neutral_base_link_xyz_m:'Holder · base_link',drive_effect:'已记录作用'};
let data,components,byId,model,filter='all',selected='robot.root',tab='spec',hovered=null,explode=0,targetExplode=0,playing=false,playDir=1,liftMm=100,armPose='see_front';
let renderer,scene,camera,orbit,dimensionGroup,fovGroup,coverageGroup,axesGroup,connectionGroup,meshes=[],partNodes=new Map(),basePositions=new Map(),ready=false;
const canvas=$('#canvas'),wrap=$('#canvas-wrap');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function row(k,v){return `<div class="data-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`}
function pretty(k,v){if(Array.isArray(v)&&v.every(n=>typeof n==='number'))return v.map(n=>k.endsWith('_m')?Math.round(n*100000)/100:n).join(/range|fov/.test(k)?' – ':' × ')+(k.endsWith('_m')?' mm':k.endsWith('_deg')?' °':'');if(typeof v==='number')return k.endsWith('_m')?`${Math.round(v*1e6)/1000} mm`:k.endsWith('_rad')?`${(v*180/Math.PI).toFixed(2)}°`:String(v);if(typeof v==='boolean')return v?'是':'否';if(typeof v==='object')return JSON.stringify(v);return v}
function setFilter(g){filter=g;$('#search').value='';renderList();applyVisibility();if(g!=='all')focusGroup(g);else resetCamera()}
function renderList(){
 $('#filters').innerHTML=Object.entries(groups).map(([id,name])=>`<button class="${filter===id?'active':''}" data-filter="${id}">${name}</button>`).join('');
 $$('#filters button').forEach(b=>b.onclick=()=>setFilter(b.dataset.filter));
 const q=$('#search').value.toLowerCase();const list=components.filter(c=>(filter==='all'||c.interaction_group===filter)&&(c.display_name_zh+' '+c.id+' '+(c.model||'')).toLowerCase().includes(q));
 $('#parts').innerHTML=list.length?list.map(c=>`<button data-id="${c.id}" class="${selected===c.id?'selected':''}"><span class="part-number">${String(components.indexOf(c)+1).padStart(2,'0')}</span><span class="part-label">${esc(c.display_name_zh)}<small>${esc(c.model||c.id)}</small></span><i class="part-status" style="background:#${statusColors[c.evidence_status].toString(16)}"></i></button>`).join(''):'<div class="empty">没有匹配的部件</div>';
 $$('#parts button').forEach(b=>b.onclick=()=>select(b.dataset.id));
}
function belongsTo(id,ancestor){while(id){if(id===ancestor)return true;id=byId[id]?.parent_id}return false}
function select(id){selected=id;renderList();renderDetails();applyColors()}
function renderDetails(){
 const c=byId[selected],warning=c.evidence_status==='conflict';
 $('#component-heading').innerHTML=`<div class="component-id">${esc(c.id)}</div><h2>${esc(c.display_name_zh)}</h2><span class="badge ${warning?'danger':c.evidence_status==='photo-estimated'?'warn':''}">${statusLabels[c.evidence_status]}</span> <span class="badge warn">${({'source-mesh':'原始设备网格','manufacturer-cad':'厂家 CAD','mixed-cad-photo':'厂家 CAD + 支架估算','drawing-reconstruction':'尺寸图重建','assembly':'组件集合'})[c.geometry_status]||'照片估算外形'}</span><p>${esc(summaries[c.id]||c.model||'基于现有资料建立的组件。安装和外形仍有待补信息。')}</p>`;
 $$('.tabs button').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',b.dataset.tab===tab)});
 if(tab==='spec'){
  $('#detail').innerHTML='<h3>设备规格</h3>'+row('型号',c.model||'未确认 / 自制结构')+row('数量',c.quantity??'待完整 BOM 确认')+Object.entries(c.known).filter(([k,v])=>readable[k]&&typeof v!=='object'||readable[k]&&Array.isArray(v)&&v.every(n=>typeof n==='number')).map(([k,v])=>row(readable[k],pretty(k,v))).join('')+`<div class="callout ${warning?'warning':''}">${esc(c.geometry_note)}</div>`+(warning?'<div class="callout warning">运行高度不等于实测高度。当前按 base_link Z=1380 mm 展示，结构顶面为离地 1330 mm。</div>':'');
 }else if(tab==='installation'){
  const xyz=c.assembly_transform.world_floor_xyz_m;
  $('#detail').innerHTML='<h3>装配与坐标</h3>'+row('机械父级',byId[c.parent_id]?.display_name_zh||'地面基准')+row('枢轴类型',c.pivot_type)+row('装配基准 · 地面 XYZ',xyz.map(n=>(n*1000).toFixed(1)).join(' / ')+' mm')+row('安装证据',c.installation_status)+`<div class="callout">${c.id==='arm.mount'||c.id==='arm.so101'?'记录的装配位姿对应 Lift 100 mm。拖动滑杆可查看 0–200 mm 行程。':'安装字段与几何外形分别记录。运动轴按参考 URDF；未确认支架为可替换占位。'} 爆炸偏移仅用于展示。</div>`;
  if(c.interaction_group==='arm')$('#detail').innerHTML+='<h3>机械臂观察姿态</h3><select class="preset-select" id="arm-preset" aria-label="机械臂姿态"><option value="see_front">前方观察 · see_front</option><option value="home">收纳 · home</option><option value="see_ground">地面观察 · see_ground</option><option value="see_left">左侧观察 · see_left</option><option value="see_right">右侧观察 · see_right</option></select><p>使用参考配置中记录的操作员采集姿态，仅改变本地模型。</p>';
  if($('#arm-preset'))$('#arm-preset').value=armPose;
  $('#arm-preset')?.addEventListener('change',e=>setArmPose(e.target.value));
 }else if(tab==='design'){
  const d=design[c.id]||(c.id==='lift.driver.azd_kd'?design['lift.control.carrier']:null)||(c.id.startsWith('lift.control.')?design['lift.control.carrier']:null)||(c.interaction_group==='mobility'?design['mobility.drive_motor']:null);
  $('#detail').innerHTML=d?`<h3>Verified Hardware Fact · 可核查事实</h3><p>${d.fact}</p><h3>Design Decision · 设计选择</h3><p>${d.reason}</p><div class="callout warning"><b>仍待验证</b><br>${d.open}</div>`:'<h3>设计记录尚待补充</h3><p>现有证据能够描述部件身份和部分安装关系，未提供当时的方案比较与决策记录。</p><div class="callout">保留未知项，避免把事后推测写成真实设计理由。</div>';
  $('#detail').innerHTML+='<button class="source" id="design-template">查看设计记录模板 ↗</button>';
  $('#design-template').onclick=()=>showSource('DESIGN-NOTE-TEMPLATE.md');
 }else{
  const local=(refs)=>refs.map((p,i)=>`<button class="source" data-source="${esc(p)}">${String(i+1).padStart(2,'0')}　${esc(p.split('/').filter(Boolean).at(-1))}<small>${esc(p)}</small></button>`).join('');
  const official=(c.external_evidence||[]).map(e=>`<a class="source" href="${esc(e.url)}" target="_blank" rel="noreferrer">${esc(e.label)} ↗<small>${esc(e.url)}</small></a>`).join('');
  $('#detail').innerHTML='<h3>Verified Hardware Fact · Evidence</h3><p>仅引用可核查的产品资料、硬件文档与实机照片。安装设计不要求逐项配置外部证据。</p>'+official+local(c.source_refs)+(c.source_refs.length||official?'':'<p>当前没有适用的正式 Evidence。</p>')+'<h3>Reference / Concept · 参考信息</h3>'+local(c.reference_refs||[])+'<p>运行配置与推算模型用于理解结构，不自动证明实机安装尺寸。</p>'+'<h3>待补资料</h3>'+c.missing.map(m=>`<p style="color:#967851">○ ${esc(m)}</p>`).join('');
  $$('#detail [data-source]').forEach(b=>b.onclick=()=>showSource(b.dataset.source));
 }
}
async function showSource(path){
 $('#dialog-title').textContent=path;$('#dialog-content').replaceChildren();$('#evidence-dialog').showModal();
 const content=$('#dialog-content');const url=new URL('../'+path,location.href);
 if(/\.(png|jpe?g|webp|gif)$/i.test(path)){const im=new Image();im.src=url.href;im.alt='原始参考照片';content.append(im)}
 else if(/\.pdf$/i.test(path)){const frame=document.createElement('iframe');frame.src=url.href;frame.title='参考手册';content.append(frame)}
 else if(path.endsWith('/')){const res=await fetch('../data/source-files.json');const files=await res.json();files.filter(f=>f.startsWith(path)).forEach(f=>{const a=document.createElement('a');a.href='../'+f;a.textContent=f.split('/').at(-1);a.className='source';a.target='_blank';content.append(a)})}
 else if(/\.(stl|stp|step|dae|glb)$/i.test(path)){const a=document.createElement('a');a.href=url.href;a.textContent='下载原始网格';a.download='';content.append(a)}
 else{try{const res=await fetch(url);if(!res.ok)throw new Error(res.status);const pre=document.createElement('pre');pre.textContent=await res.text();content.append(pre)}catch(e){content.textContent='无法读取该资料：'+e.message}}
}
function setupScene(){
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xeef1eb);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 scene=new THREE.Scene();scene.background=new THREE.Color(0xeef1eb);
 camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,100);camera.position.set(3,2.9,4);
 orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.dampingFactor=.08;orbit.target.set(0,.84,0);orbit.maxPolarAngle=Math.PI*.49;orbit.minZoom=.35;orbit.maxZoom=6;
 scene.add(new THREE.HemisphereLight(0xffffff,0xb5c5b0,2.5));
 const key=new THREE.DirectionalLight(0xfff6e7,3.1);key.position.set(3,6,3);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=3;key.shadow.camera.bottom=-2;key.shadow.bias=-.0001;key.shadow.normalBias=.008;scene.add(key);
 const fill=new THREE.DirectionalLight(0xe4f2ff,2);fill.position.set(-3,2,-3);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0xeef1eb,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.004;floor.receiveShadow=true;scene.add(floor);
 const grid=new THREE.GridHelper(4,40,0xcdd7c9,0xe0e7dc);grid.position.y=-.002;grid.material.transparent=true;grid.material.opacity=.55;scene.add(grid);
 new ResizeObserver(resize).observe(wrap);resize();
}
function resize(){if(!renderer)return;const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setSize(w,h,false);const span=2.30;camera.left=-span*w/h/2;camera.right=span*w/h/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix()}
function resetCamera(){camera.position.set(3,2.9,4);camera.zoom=targetExplode>.5?.77:1;camera.updateProjectionMatrix();orbit.target.set(0,targetExplode>.5?.96:.84,0);orbit.update()}
function bounds(predicate){let box=new THREE.Box3();model.updateMatrixWorld(true);for(const m of meshes)if(predicate(m))box.union(new THREE.Box3().setFromObject(m));return box}
function focusBounds(box){if(box.isEmpty())return;const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());orbit.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(3,2.2,4));const w=wrap.clientWidth/hypotSafe(wrap.clientHeight);camera.zoom=Math.min(4.8,2.30/(Math.max(size.y,Math.max(size.x,size.z)/w)*1.6+.14));camera.updateProjectionMatrix();orbit.update()}
function hypotSafe(v){return Math.max(v,1)}
function focusGroup(g){if(!ready)return;focusBounds(bounds(m=>byId[m.userData.ownerId]?.interaction_group===g))}
function applyVisibility(){if(!ready)return;for(const m of meshes)m.visible=(filter==='all'||byId[m.userData.ownerId]?.interaction_group===filter)&&!(m.userData.ownerId==='cables.main'&&explode>.03)}
function applyColors(){if(!ready)return;const evidence=$('#evidence-color').checked;for(const m of meshes){const id=m.userData.ownerId,c=byId[id];for(const material of (Array.isArray(m.material)?m.material:[m.material])){material.color.copy(material.userData.originalColor);if(evidence&&c)material.color.setHex(statusColors[c.evidence_status]);if(material.emissive){material.emissive.setHex(id===hovered?0x226b58:belongsTo(id,selected)&&selected!=='robot.root'?0x154738:0);material.emissiveIntensity=id===hovered?.5:.24}}}}
function setExplode(v,manual=true){targetExplode=Math.max(0,Math.min(1,v));if(manual){playing=false;$('#play').textContent='▷ 演示'}$('#explode').value=targetExplode*100;$('#explode-value').textContent=Math.round(targetExplode*100)+'%';$('#assembled').classList.toggle('active',targetExplode<.5);$('#exploded').classList.toggle('active',targetExplode>=.5)}
function updateModel(){
 explode+= (targetExplode-explode)*.13;if(Math.abs(explode-targetExplode)<.00001)explode=targetExplode;
 for(const c of components){const node=partNodes.get(c.id);if(!node)continue;node.position.copy(basePositions.get(c.id)).addScaledVector(new THREE.Vector3(...c.exploded_offset_parent_gltf_m),explode);if(c.id==='arm.mount')node.position.y+=(liftMm-100)/1000}
 applyVisibility();model.updateMatrixWorld(true);
}
function lines(points,color=0x568a78){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));return new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.8}))}
function sprite(text){const cv=document.createElement('canvas');cv.width=512;cv.height=80;const ctx=cv.getContext('2d');ctx.fillStyle='rgba(248,250,244,.92)';ctx.fillRect(0,0,512,80);ctx.font='30px sans-serif';ctx.fillStyle='#183330';ctx.textAlign='center';ctx.fillText(text,256,52);const o=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),depthTest:false,toneMapped:false}));o.scale.set(.38,.06,1);return o}
function makeHelpers(){
 dimensionGroup=new THREE.Group();scene.add(dimensionGroup);dimensionGroup.visible=false;
 for(const [h,label] of [[.3,'300 mm'],[.515,'515 mm'],[.62,'620 mm'],[1.33,'1330 mm']]){dimensionGroup.add(lines([[-.44,h,.3],[.26,h,.3],[.26,h,-.3],[-.44,h,-.3],[-.44,h,.3]],0x77957d));const s=sprite(label+' · measured');s.position.set(-.55,h,0);dimensionGroup.add(s)}
 dimensionGroup.add(lines([[-.44,.015,.38],[.26,.015,.38]],0x77957d));const sx=sprite('700 × 600 mm');sx.position.set(-.09,.04,.43);dimensionGroup.add(sx);
 const rail=lines([[.4,1.005,-.13],[.4,1.205,-.13]],0xc09354);dimensionGroup.add(rail);dimensionGroup.add(lines([[.41,1.020,-.13],[.41,1.190,-.13]],0x398569));
 const sl=sprite('Lift 0–200 mm');sl.position.set(.56,1.22,-.13);dimensionGroup.add(sl);
 fovGroup=new THREE.Group();scene.add(fovGroup);fovGroup.visible=false;
 const lidar=new THREE.Group();lidar.userData.attach='perception.lidar.mid360';fovGroup.add(lidar);
 // MID-360 angular limits share one local optical origin. Equal radial length emphasizes asymmetry.
 const sensorOrigin=[0,.035,0],radius=.65;
 for(const deg of [-7,0,52]){let ring=[];const e=THREE.MathUtils.degToRad(deg);for(let i=0;i<=96;i++){const a=i*Math.PI/48;ring.push([radius*Math.cos(e)*Math.cos(a),.035+radius*Math.sin(e),radius*Math.cos(e)*Math.sin(a)])}lidar.add(lines(ring,deg===0?0x7e9690:0xb58e4e))}
 for(let i=0;i<16;i++){const a=i*Math.PI/8;for(const deg of [-7,52]){const e=THREE.MathUtils.degToRad(deg);lidar.add(lines([sensorOrigin,[radius*Math.cos(e)*Math.cos(a),.035+radius*Math.sin(e),radius*Math.cos(e)*Math.sin(a)]],0xb58e4e))}}
 const fvLabel=sprite('MID-360 360° / −7°…+52°');fvLabel.scale.set(.7,.07,1);fvLabel.position.set(0,.64,0);lidar.add(fvLabel);
 const cam=new THREE.Group();cam.userData.groundFootprint=true;fovGroup.add(cam);
 const nearX=.26+.4,farX=.26+1.6;
 // Only the near width is measured. Far width extrapolation is explicitly a concept line.
 const cameraNode=partNodes.get('perception.camera.d435'),cp=cameraNode.getWorldPosition(new THREE.Vector3());
 const nearHalf=.35,farHalf=nearHalf*(farX-cp.x)/(nearX-cp.x);
 const corners=[[nearX,.01,-nearHalf],[farX,.01,-farHalf],[farX,.01,farHalf],[nearX,.01,nearHalf]];
 for(const p of corners)cam.add(lines([cp.toArray(),p],0x548da0));cam.add(lines([...corners,corners[0]],0x548da0));
 const cmLabel=sprite('Depth 0.4–1.6 m · 近端宽 0.7 m');cmLabel.scale.set(.85,.07,1);cmLabel.position.set(1.25,.10,0);cam.add(cmLabel);
 coverageGroup=new THREE.Group();scene.add(coverageGroup);coverageGroup.visible=false;
 // Design areas are separate from optical FOV: distances shown from the front frame edge, not a calibrated range test.
 const front=.26;
 const near=.4,far=1.6;
 const region=lines([[front+near,.009,-.35],[front+far,.009,-.8],[front+far,.009,.8],[front+near,.009,.35],[front+near,.009,-.35]],0x41809a);coverageGroup.add(region);
 const camLabel=sprite('Depth 测量范围 0.4–1.6 m');camLabel.scale.x=.66;camLabel.position.set(front+1.05,.08,0);coverageGroup.add(camLabel);
 const farLine=lines([[front+1.5,.012,-1],[front+1.5,.012,1]],0xaf853b);coverageGroup.add(farLine);
 const lidarLabel=sprite('LiDAR 环境目标 ≥1.5 m');lidarLabel.scale.x=.66;lidarLabel.position.set(front+1.9,.08,0);coverageGroup.add(lidarLabel);
 const height=lines([[.7,.9,-.55],[.7,1.7,-.55]],0x826091);coverageGroup.add(height);
 const armLabel=sprite('目标物高度 0.9–1.7 m');armLabel.scale.x=.6;armLabel.position.set(.7,1.73,-.55);coverageGroup.add(armLabel);
 axesGroup=new THREE.Group();scene.add(axesGroup);axesGroup.visible=false;
 for(const [id,node] of partNodes)if(id.startsWith('mobility.wheel.')){const group=new THREE.Group();group.userData.attach=id;group.add(new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),.24,0x8c737b,.028,.012));axesGroup.add(group)}
 for(const j of data.arm_joints){const node=model.getObjectByName(j.node);if(node){const g=new THREE.Group();g.userData.object=node;g.add(new THREE.AxesHelper(.045));axesGroup.add(g)}}
 connectionGroup=new THREE.Group();scene.add(connectionGroup);connectionGroup.visible=false;
 const pairs=[['lift.driver.azd_kd','lift.stage.eas','电机 / ABZO'],['lift.control.arduino','lift.driver.azd_kd','控制 / 反馈'],['electrical.pc','perception.camera.d435','USB 3.0'],['electrical.pc','arm.camera.wrist','USB 2.0']];
 for(const [a,b,label] of pairs){const l=lines([[0,0,0],[0,0,0]],0x8c9c70);l.userData.ends=[a,b];connectionGroup.add(l)}
}
function updateHelpers(){for(const parent of [fovGroup,axesGroup])for(const g of parent.children){const n=g.userData.object||partNodes.get(g.userData.attach);if(n){n.getWorldPosition(g.position);n.getWorldQuaternion(g.quaternion)}if(g.userData.groundFootprint)g.visible=explode<.03}for(const l of connectionGroup.children){const [a,b]=l.userData.ends.map(id=>partNodes.get(id));if(a&&b){const va=a.getWorldPosition(new THREE.Vector3()),vb=b.getWorldPosition(new THREE.Vector3());l.geometry.setFromPoints([va,vb])}}}
function setArmPose(name){
 const poses={see_front:[-.014,-.704,1.285,-.665,-1.109,.222],home:[-.036,-1.583,1.367,.783,-.124,.222],see_ground:[-.181,-.202,.893,.241,-1.109,.223],see_left:[-1.05,-.706,1.287,-.665,-1.109,.222],see_right:[.933,-.706,1.285,-.665,-1.109,.222]};
 const vals=poses[name];if(!vals)return;armPose=name;const basis=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
 data.arm_joints.forEach((j,i)=>{const node=model.getObjectByName(j.node);if(!node)return;const [w,x,y,z]=j.rest_quaternion_wxyz;const rest=new THREE.Quaternion(x,y,z,w);const motion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),vals[i]);node.quaternion.copy(basis).multiply(rest.multiply(motion)).multiply(basis.clone().invert())});
}
function helperCaption(){const parts=[];if(liftMm<15||liftMm>185)parts.push('Lift 位于端部保留区');if($('#coverage').checked)parts.push('Depth：测量图0.4–1.6 m、近端宽0.7 m；角度/远端宽为推算');if($('#fov').checked)parts.push('MID360 局部中心平面下7°/上52°、360°；随安装姿态旋转。Depth 地面边界仅在装配状态显示，远端宽度为概念延伸');if($('#connections').checked)parts.push('连线表示逻辑接口');$('#helper-caption').textContent=parts.join(' · ')||'展示操作不连接实机 · Lift 日常软件区间 15–185 mm'}
function bind(){
 $('#search').oninput=renderList;$('#clear-filter').onclick=()=>setFilter('all');$('#deselect').onclick=()=>select('robot.root');
 $$('.tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;renderDetails()});$('#close-dialog').onclick=()=>$('#evidence-dialog').close();
 $('#help-button').onclick=()=>{ $('#dialog-title').textContent='使用说明';$('#dialog-content').innerHTML='<p>拖动旋转，滚轮缩放，右键拖动平移。点击模型或左侧目录选择部件；“聚焦”可放大选中部件。</p><p>装配／爆炸滑杆控制系统间距，“演示”连续往返。Lift 滑杆改变滑块及机械臂高度。机械臂的安装页可切换参考资料中记录的观察姿态。</p><p>“尺寸基准”显示实测高度和平面尺寸；“传感器视场”显示 MID360 记录 FOV 和 D435 测量图范围与概念边线；“关节轴”显示机械臂与轮组轴；“连接关系”显示已记录的几条逻辑连接，线条不表示实物布线路径。</p><p>黄色表示打印支架，SO101 臂体为浅蓝色；结构金属为浅蓝色金属外观。几何精度通过右侧标签表示。“证据着色”按部件主证据来源着色，几何是否精确仍以右侧说明为准。MID360 旧运行 TF 保留在 Reference 中作历史对照。</p><p>所有交互仅在本地模型中运行。截图按钮保存当前三维视图。</p>';$('#evidence-dialog').showModal()};
 $('#reset').onclick=()=>{filter='all';$('#search').value='';renderList();applyVisibility();resetCamera()};$('#focus').onclick=()=>focusBounds(bounds(m=>selected==='robot.root'||belongsTo(m.userData.ownerId,selected)));
 $('#rotate').onclick=()=>{orbit.autoRotate=!orbit.autoRotate;$('#rotate').setAttribute('aria-pressed',orbit.autoRotate)};
 $('#capture').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='robot-atlas-view.png';a.href=canvas.toDataURL('image/png');a.click()};
 $('#explode').oninput=e=>setExplode(+e.target.value/100);$('#assembled').onclick=()=>{setExplode(0);resetCamera()};$('#exploded').onclick=()=>{setExplode(1);resetCamera()};
 $('#play').onclick=()=>{playing=!playing;$('#play').textContent=playing?'Ⅱ 暂停':'▷ 演示';if(playing){camera.zoom=.77;camera.updateProjectionMatrix();orbit.target.y=.96}};
 $('#lift').oninput=e=>{liftMm=+e.target.value;$('#lift-value').textContent=liftMm+' mm';helperCaption()};
 for(const [id,obj] of [['dimensions',dimensionGroup],['fov',fovGroup],['axes',axesGroup],['connections',connectionGroup]])$('#'+id).onchange=e=>{obj.visible=e.target.checked;helperCaption()};
 $('#coverage').onchange=e=>{coverageGroup.visible=e.target.checked;if(e.target.checked){camera.zoom=.68;orbit.target.set(.65,.80,0);camera.updateProjectionMatrix()}else resetCamera();helperCaption()};
 $('#evidence-color').onchange=()=>{applyColors();$('#model-note').textContent=$('#evidence-color').checked?'正在按证据来源着色 · 关闭后恢复材料色':'黄色 = 打印支架 · 浅蓝 = 臂体 / 金属结构'};
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down;
 function hit(e){const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);return ray.intersectObjects(meshes.filter(m=>m.visible),false)[0]?.object.userData.ownerId}
 canvas.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);canvas.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<5){const id=hit(e);if(id)select(id)}down=null});
 canvas.addEventListener('pointermove',e=>{const id=hit(e);if(id!==hovered){hovered=id;applyColors()}const t=$('#tooltip');t.style.display=id?'block':'none';if(id){t.textContent=byId[id].display_name_zh;t.style.left=e.clientX+13+'px';t.style.top=e.clientY+15+'px'}canvas.style.cursor=id?'pointer':'grab'});
 canvas.addEventListener('pointerleave',()=>{hovered=null;applyColors();$('#tooltip').style.display='none'});
 window.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();$('#search').focus()}});
}
async function start(){
 try{
  const r=await fetch('../data/components.json?v=v003');if(!r.ok)throw new Error('components.json '+r.status);data=await r.json();components=data.components;byId=Object.fromEntries(components.map(c=>[c.id,c]));$('#count').textContent=components.length+' 个组件';renderList();renderDetails();setupScene();
  const mobile=matchMedia('(max-width:800px)').matches;const gltf=await new GLTFLoader().loadAsync(mobile?'robot_web_lod1.glb?v=v003':'robot_web.glb?v=v003',p=>{if(p.total)$('#loading').textContent='载入模型 '+Math.round(p.loaded/p.total*100)+'%'});model=gltf.scene;scene.add(model);
  model.traverse(o=>{if(o.name.startsWith('part__')&&o.userData.component_id){partNodes.set(o.userData.component_id,o);basePositions.set(o.userData.component_id,o.position.clone())}if(o.isMesh){let p=o;while(p&&!p.userData.component_id)p=p.parent;const id=p?.userData.component_id;if(!id)return;o.userData.ownerId=id;o.castShadow=true;o.receiveShadow=true;o.material=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const copy=m.clone();copy.userData.originalColor=m.color.clone();return copy});if(o.material.length===1)o.material=o.material[0];meshes.push(o)}});
  if(partNodes.size!==components.length)throw new Error('组件映射不完整：'+partNodes.size+'/'+components.length);
  ready=true;makeHelpers();bind();const requested=new URLSearchParams(location.search).get('part');if(byId[requested])select(requested);applyColors();$('#loading').hidden=true;
  let last=performance.now();function animate(now){requestAnimationFrame(animate);const dt=Math.min(.05,(now-last)/1000);last=now;if(playing){let next=targetExplode+playDir*dt*.18;if(next>=1){next=1;playDir=-1}if(next<=0){next=0;playDir=1}setExplode(next,false)}updateModel();updateHelpers();orbit.update();renderer.render(scene,camera)}requestAnimationFrame(animate);
  // Read-only QA surface for local verification.
  window.robotAtlas={getState:()=>({ready,componentCount:partNodes.size,meshCount:meshes.length,selected,filter,explode,liftMm,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,visibleMeshes:meshes.filter(m=>m.visible).length,positions:Object.fromEntries([...partNodes].map(([id,n])=>[id,n.getWorldPosition(new THREE.Vector3()).toArray()]))}),select,setFilter,setExplode,setArmPose};
 }catch(e){console.error(e);$('#loading').hidden=false;$('#loading').textContent='模型未能载入：'+e.message+'。请通过启动预览.command 打开。'}
}
start();
