import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const localFile=location.protocol==='file:';
function loadClassicScript(path){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=path;script.onload=()=>{script.remove();resolve()};script.onerror=()=>{script.remove();reject(new Error('ファイルを読み込めません：'+path))};document.head.append(script)})}
async function readJSON(path){if(localFile){const value=window.robotAtlasPortable.json[path];if(value===undefined)throw new Error('同梱データがありません：'+path);return value}const response=await fetch('../'+path);if(!response.ok)throw new Error(path+' '+response.status);return response.json()}
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const groups={all:"すべて",base:"構造",mobility:"車輪",lift:"昇降",arm:"アーム",perception:"認識",electrical:"電装",cables:"配線"};
const statusLabels={'operator-confirmed':"操作者が確認",measured:"実測記録",manufacturer:"メーカー資料",runtime:"運用パラメータ",'model-derived':"元のメッシュ",'photo-estimated':"写真による推定",conflict:"資料間の不一致",unknown:"未確認"};
const statusColors={'operator-confirmed':0x658b60,measured:0x5a9273,manufacturer:0x5a9273,runtime:0x6c91ba,'model-derived':0x3b9d9b,'photo-estimated':0xc39857,conflict:0xc5785d,unknown:0xc39857};
const summaries={
'robot.root':"構造、動作の関係、根拠資料を一つの画面で確認できます。部品をクリックすると、機器の概要、取付方法、未確認事項を表示します。",
'base.frame':"実測した 700 × 600 mm の外形範囲を基準に、4040 と 2020 のフレーム材で主要構造を再構成しています。各部材の長さと各段の範囲は写真からの推定です。",
'arm.so101':"元の STL 一式を使用し、URDF に基づいて六軸の階層を再構成しています。初期姿勢は記録済みの see_front です。「取付」タブで観察姿勢を切り替えられます。",
'perception.camera.d435':"D435 の元のメッシュを使用しています。カメラの link、optical frame、表示メッシュの原点を区別して保持しています。",
'perception.lidar.mid360':"Livox の公式 CAD を使用しています。高さ 1330 mm の上梁にある黄色のプリント製ブラケットに取り付け、支柱中心よりやや後方に配置しています。正確な原点と傾斜角は再測定が必要です。",
'lift.stage.eas':"機械ストロークは 200 mm で、アームを昇降させます。下のスライダーでストローク内の形状変化を確認できます。",
'arm.mount':"昇降スライダーと SO101 をつなぐアダプター構造です。Lift スライダーに合わせてモデルが平行移動します。ブラケット形状は後から置き換える仮モデルです。",
'safety.estop':"操作者が確認した配置：ロボット左側（+Y）、地上高 515 mm の棚に取り付けています。記録されている作用は、駆動モーターの励磁解除です。"};
const design={
 "lift.stage.eas": {
  "fact": "EASM2XF020AZAK：機械ストローク 200 mm、ねじリード 3 mm。公式外形図を取得済みです。ガイド幅 40 mm、レール本体長 316.7 mm、全長 405 mm。取付基準は既存資料から再構成しています。",
  "reason": "操作者による選定理由：アーム自重と Lift の追加部品を合わせた総負荷、および必要な昇降能力に基づいて選定しました。アーム + Lift は、地上高約 0.9–1.7 m のボタン、エレベーターパネル、卓上物、人との対話対象を想定して配置しています。",
  "open": "公式 STEP は未取得です。負荷、重心、モーメントの数値とタスクごとの到達性は未検証です。0.9–1.7 m は対象物の高さであり、検証済みの作業範囲ではありません。"
 },
 "perception.camera.d435": {
  "fact": "測定図の記録：ロボット前方の手前側 0.4 m、奥側 1.6 m、手前側の幅 0.7 m。取付角度の数値と奥側の幅は図に記載されていません。",
  "reason": "カメラは近距離の地面・障害物の認識と Local Planner に情報を提供します。表示用の俯角は、参考取付高さと0.4–1.6 mの両端から推定しています。元の運用TFは変更していません。",
  "open": "この角度は表示用の推定値で、図から直接得たキャリブレーション値ではありません。奥側の幅も概念上の延長であり、測定値ではありません。全体の認識範囲を検証するには、現在のカメラ内部パラメータと正確な距離の起点が必要です。"
 },
 "perception.camera.pan_tilt": {
  "fact": "2 × ROBOTIS XC330-M288-T。公式の XL/XC-330 共通 STEP を使用しています。2台のモーターをつなぐ部品とカメラ台は黄色のプリント部品です。",
  "reason": "実機写真に基づいて2台のモーターとプリント製接続部品を再構成しています。実際の Tilt 回転支点を基準に表示姿勢を調整し、カメラを測定図の0.4–1.6 mの範囲に向けています。既存URDFは Reference に保存しています。",
  "open": "プリント部品の厚さと穴位置は写真からの推定です。図中の60°/120°は構造理解のための注記であり、関節指令値や新たなカメラキャリブレーション値ではありません。"
 },
 "perception.lidar.mid360": {
  "fact": "Livox の公式 STEP。本体寸法は 65 × 65 × 60 mm（突出したコネクターを除く）。FOV はセンサーのローカル中心平面を基準に、水平360°、下方7°、上方52°です。",
  "reason": "取付設計：高さ1330 mmの上梁にあるプリント製holder上で、支柱中心よりやや後方に配置しています。操作者による設計理由：LiDAR は自己位置推定に用い、高い位置から周囲の環境を取得します。MID-360 の視野を踏まえて前傾させ、前方約 1.5 m より遠い環境の認識を狙います。近距離の障害物認識と Local Planner 向けの認識は Depth Camera が担当します。",
  "open": "30°は過去の運用記録の値です。実際の傾斜角と取付原点は再測定が必要です。現在の点群の取得範囲は、この幾何学的な図だけでは確認できません。旧運用 TF は比較用に保存し、元の URDF は変更していません。"
 },
 "perception.lidar.holder": {
  "fact": "操作者が確認した黄色の 3D プリント製ブラケットです。開放されたくさび形の輪郭は IMG_0366 と Mid3601 を参考にしています。",
  "reason": "上梁を取付面とし、くさび形の上部台座で LiDAR を前傾させ、やや後方に配置しています。",
  "open": "肉厚、傾斜角、締結穴の位置を示す製作図は未入手です。現在のモデルは構造説明用です。"
 },
 "arm.so101": {
  "fact": "SO101 の元の六関節メッシュ、STS3215 サーボ、記録済み姿勢を使用しています。アーム本体は淡い青、サーボは黒です。",
  "reason": "参考組立座標：Lift下端時のベース地上高は1005 mm、上端時は1205 mmです。これらはモデルの取付基準です。操作者による設計理由：アームの取付高さは、地上高約 0.9–1.7 m のボタン、エレベーターパネル、卓上物、人との対話対象を想定しています。Lift はアームと追加部品の実負荷に基づいて選定しました。",
  "open": "対象物の高さが設計範囲内でも、すべての姿勢で到達できるとは限りません。具体的な目標位置・姿勢、負荷、干渉、動作計画はタスクごとの検証が必要です。"
 },
 "mobility.drive_motor": {
  "fact": "3 × BLMR5100K-GFV-B + GFS5G30FR に BLVD-KRD を組み合わせています。後輪 ID1、左前 ID2、右前 ID3。3台の XH540-W270 は操舵 ID11/12/13 に対応します。3台の Drive の長軸は鉛直方向に配置しています。各車輪には、その車輪に対応する銘板写真のみを紐付けています。",
  "reason": "独立した3組の Drive / Steer で車体を移動させます。金属接続部には淡い青の金属材質を用い、市販モーターは製品本来の外観を維持しています。ドライバーは車輪ユニットに分類し、ID1/2を左側、ID3を右側に配置しています。",
  "open": "駆動部品は公式寸法図から再構成し、操舵サーボには公式共通 CAD を使用しています。車軸、取付穴の位置、取付方向は再測定が必要です。"
 },
 "base.frame": {
  "fact": "外形範囲 700 × 600 mm、各面の高さ 300 / 515 / 620 / 1330 mm。主フレーム材は 4040、前部支柱は 2020 です。",
  "reason": "高さ300 mmの棚には車輪ドライバーとLift制御ユニットを配置しています。高さ515 mmの棚は左に停止ボタン、右にPCを配置しています。高さ300 mmの棚の下には、左右に2個ずつバッテリーを配置しています。左右の配置は取付設計の説明であり、各項目への外部Evidenceの紐付けを必須とはしていません。",
  "open": "各部材の切断長一覧、穴位置、一部の支持構造は、現時点では写真からの推定です。"
 },
 "lift.control.carrier": {
  "fact": "実機写真 IMG_0372 では、AZD-KD、Arduino、インターフェース基板を近接して組み合わせた構成を確認できます。",
  "reason": "AZD-KD、Arduino、MOSFET 5 V→24 V、RS-485 を同じ黄色のプリント製トレーに組み付け、高さ300 mmの棚の同一区域に配置しています。詳細な位置とトレー形状は取付設計として示しています。",
  "open": "Arduino のバージョン、MOSFET / RS-485 の完全な SKU、トレーの穴位置、配線構成は未確認です。"
 }
};
const readable={body_dimensions_m:"本体外形寸法",robot_side:"ロボット上の左右位置",mounting_platform_floor_m:"取付面の地上高",mounting_below_floor_m:"配置する棚の下面",voltage_v:"公称電圧 · V",motor_model:"モーター型番",motor_count:"モーター数",target_object_height_floor_m:"対象物の高さ（設計）",measured_ground_range_m:"測定図の前方範囲",measured_near_width_m:"測定図の手前側の幅",display_pitch_down_rad:"表示用の俯角（推定）",coverage_reference:"測定基準の説明",installation_direction:"取付方向",driver_layout:"ドライバーの配置",included_modules:"構成部品",fov_reference:"視野の基準",photo_annotated_range_m:"写真に記載された地面範囲",design_far_environment_from_m:"遠方認識の設計上の境界",placement_note:"取付説明",selection_basis:"選定根拠",frame_ground_footprint_m:"フレームの平面寸法",measured_ground_footprint_m:"実測した平面寸法",measured_top_plane_heights_m:"構造上面の高さ",main_extrusion_profile_m:"主フレーム材の断面",front_vertical_support_profile_m:"前部支柱の断面",origin_base_m:"車軸座標 · base_link",wheel_radius_m:"車輪半径",wheel_width_m:"車輪幅（運用モデルの仮値）",drive_modbus_id:"駆動 Modbus ID",steer_id:"操舵 ID",mechanical_stroke_m:"機械ストローク",normal_motion_range_m:"通常のソフトウェア動作範囲",ball_screw_lead_m:"ねじリード",body_diameter_m:"本体直径",body_height_m:"本体高さ",mass_kg:"質量",horizontal_fov_deg:"水平視野",vertical_fov_deg:"垂直視野",runtime_mount_bottom_base_link_xyz_m:"運用時の取付原点 · base_link",runtime_pitch_rad:"運用時の取付傾斜角",servo_model:"関節サーボ",actuated_joints:"駆動関節",host_environment:"ホストコンピューター",resolution:"解像度",calibration_rms_px:"キャリブレーション RMS",arm_base_height_floor_at_lower_m:"下端時のベース地上高",arm_base_height_floor_at_upper_m:"上端時のベース地上高",mount_x_m:"取付 X",mount_y_m:"取付 Y",mount_z_range_m:"base_link Z 範囲",mount_yaw_rad:"取付 yaw",interface:"インターフェース",power:"電源",feedback:"位置フィードバック",runtime_namespace:"運用名前空間",driver_model:"ドライバー",gearhead_model_verified_from_nameplate:"銘板記載のギヤヘッド",neutral_raw_deg:"neutral 元の角度",pan_axis_base_link_xyz_m:"Pan 軸 · base_link",tilt_axis_neutral_base_link_xyz_m:"Tilt 軸 · base_link",holder_neutral_base_link_xyz_m:'Holder · base_link',drive_effect:"記録された作用"};
let data,components,byId,model,filter='all',selected='robot.root',tab='spec',hovered=null,explode=0,targetExplode=0,playing=false,playDir=1,liftMm=100,armPose='see_front';
let renderer,scene,camera,orbit,dimensionGroup,fovGroup,coverageGroup,axesGroup,connectionGroup,meshes=[],partNodes=new Map(),basePositions=new Map(),ready=false;
const canvas=$('#canvas'),wrap=$('#canvas-wrap');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function row(k,v){return `<div class="data-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`}
function pretty(k,v){if(Array.isArray(v)&&v.every(n=>typeof n==='number'))return v.map(n=>k.endsWith('_m')?Math.round(n*100000)/100:n).join(/range|fov/.test(k)?' – ':' × ')+(k.endsWith('_m')?' mm':k.endsWith('_deg')?' °':'');if(typeof v==='number')return k.endsWith('_m')?`${Math.round(v*1e6)/1000} mm`:k.endsWith('_rad')?`${(v*180/Math.PI).toFixed(2)}°`:String(v);if(typeof v==='boolean')return v?"是":"否";if(typeof v==='object')return JSON.stringify(v);return v}
function setFilter(g){filter=g;$('#search').value='';renderList();applyVisibility();if(g!=='all')focusGroup(g);else resetCamera()}
function renderList(){
 $('#filters').innerHTML=Object.entries(groups).map(([id,name])=>`<button class="${filter===id?'active':''}" data-filter="${id}">${name}</button>`).join('');
 $$('#filters button').forEach(b=>b.onclick=()=>setFilter(b.dataset.filter));
 const q=$('#search').value.toLowerCase();const list=components.filter(c=>(filter==='all'||c.interaction_group===filter)&&(c.display_name_zh+' '+c.id+' '+(c.model||'')).toLowerCase().includes(q));
 $('#parts').innerHTML=list.length?list.map(c=>`<button data-id="${c.id}" class="${selected===c.id?'selected':''}"><span class="part-number">${String(components.indexOf(c)+1).padStart(2,'0')}</span><span class="part-label">${esc(c.display_name_zh)}<small>${esc(c.model||c.id)}</small></span><i class="part-status" style="background:#${statusColors[c.evidence_status].toString(16)}"></i></button>`).join(''):"<div class=\"empty\">一致する部品はありません</div>";
 $$('#parts button').forEach(b=>b.onclick=()=>select(b.dataset.id));
}
function belongsTo(id,ancestor){while(id){if(id===ancestor)return true;id=byId[id]?.parent_id}return false}
function select(id){selected=id;renderList();renderDetails();applyColors()}
function renderDetails(){
 const c=byId[selected],warning=c.evidence_status==='conflict';
 $('#component-heading').innerHTML=`<div class="component-id">${esc(c.id)}</div><h2>${esc(c.display_name_zh)}</h2><span class="badge ${warning?'danger':c.evidence_status==='photo-estimated'?'warn':''}">${statusLabels[c.evidence_status]}</span> <span class="badge warn">${({'source-mesh':"元の機器メッシュ",'manufacturer-cad':"メーカー CAD",'mixed-cad-photo':"メーカー CAD + 推定ブラケット",'drawing-reconstruction':"寸法図から再構成",'assembly':"アセンブリ"})[c.geometry_status]||"写真から推定した外形"}</span><p>${esc(summaries[c.id]||c.model||"既存資料から構成した部品です。取付と外形には未確認事項が残っています。")}</p>`;
 $$('.tabs button').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',b.dataset.tab===tab)});
 if(tab==='spec'){
  $('#detail').innerHTML="<h3>機器仕様</h3>"+row("型番",c.model||"未確認 / 自作構造")+row("数量",c.quantity??"BOM の確認待ち")+Object.entries(c.known).filter(([k,v])=>readable[k]&&typeof v!=='object'||readable[k]&&Array.isArray(v)&&v.every(n=>typeof n==='number')).map(([k,v])=>row(readable[k],pretty(k,v))).join('')+`<div class="callout ${warning?'warning':''}">${esc(c.geometry_note)}</div>`+(warning?"<div class=\"callout warning\">運用設定の高さと実測高さは異なります。現在は base_link Z=1380 mm で表示し、構造上面の地上高は 1330 mm としています。</div>":'');
 }else if(tab==='installation'){
  const xyz=c.assembly_transform.world_floor_xyz_m;
  $('#detail').innerHTML="<h3>組立と座標</h3>"+row("親アセンブリ",byId[c.parent_id]?.display_name_zh||"地面基準")+row("関節形式",c.pivot_type)+row("組立基準 · 地面 XYZ",xyz.map(n=>(n*1000).toFixed(1)).join(' / ')+' mm')+row("取付情報の根拠",c.installation_status)+`<div class="callout">${c.id==='arm.mount'||c.id==='arm.so101'?"記録された組立姿勢は Lift 100 mm に対応します。スライダーで 0–200 mm のストロークを確認できます。":"取付情報と外形形状は分けて記録しています。動作軸は参考 URDF に基づき、未確認のブラケットは交換可能な仮モデルです。"} 分解表示の移動量は表示専用です。</div>`;
  if(c.interaction_group==='arm')$('#detail').innerHTML+="<h3>アームの観察姿勢</h3><select class=\"preset-select\" id=\"arm-preset\" aria-label=\"アームの姿勢\"><option value=\"see_front\">前方観察 · see_front</option><option value=\"home\">格納 · home</option><option value=\"see_ground\">地面観察 · see_ground</option><option value=\"see_left\">左側観察 · see_left</option><option value=\"see_right\">右側観察 · see_right</option></select><p>参考設定に保存された操作者の記録姿勢を使用します。変更されるのはローカルモデルだけです。</p>";
  if($('#arm-preset'))$('#arm-preset').value=armPose;
  $('#arm-preset')?.addEventListener('change',e=>setArmPose(e.target.value));
 }else if(tab==='design'){
  const d=design[c.id]||(c.id==='lift.driver.azd_kd'?design['lift.control.carrier']:null)||(c.id.startsWith('lift.control.')?design['lift.control.carrier']:null)||(c.interaction_group==='mobility'?design['mobility.drive_motor']:null);
  $('#detail').innerHTML=d?`<h3>確認済みのハードウェア事実</h3><p>${d.fact}</p><h3>設計上の判断</h3><p>${d.reason}</p><div class="callout warning"><b>要検証</b><br>${d.open}</div>`:"<h3>設計記録は未整備です</h3><p>既存の根拠資料から機器の種類と一部の取付関係は確認できますが、当時の案の比較や判断の記録はありません。</p><div class=\"callout\">不明な事項は不明のまま記録し、後からの推測を実際の設計理由として扱いません。</div>";
  $('#detail').innerHTML+="<button class=\"source\" id=\"design-template\">設計記録テンプレートを開く ↗</button>";
  $('#design-template').onclick=()=>showSource('DESIGN-NOTE-TEMPLATE.md');
 }else{
  const local=(refs)=>refs.map((p,i)=>`<button class="source" data-source="${esc(p)}">${String(i+1).padStart(2,'0')}　${esc(p.split('/').filter(Boolean).at(-1))}<small>${esc(p)}</small></button>`).join('');
  const official=(c.external_evidence||[]).map(e=>`<a class="source" href="${esc(e.url)}" target="_blank" rel="noreferrer">${esc(e.label)} ↗<small>${esc(e.url)}</small></a>`).join('');
  $('#detail').innerHTML="<h3>確認済みの事実 · エビデンス</h3><p>確認可能な製品資料、ハードウェア文書、実機写真を掲載しています。取付設計の各項目に外部の根拠資料が必要とは限りません。</p>"+official+local(c.source_refs)+(c.source_refs.length||official?'':"<p>現在、この項目に対応する正式なエビデンスはありません。</p>")+"<h3>参考・概念情報</h3>"+local(c.reference_refs||[])+"<p>運用設定と推定モデルは構造理解のための参考です。実機の取付寸法を直接裏付けるものではありません。</p>"+"<h3>不足している資料</h3>"+c.missing.map(m=>`<p style="color:#967851">○ ${esc(m)}</p>`).join('');
  $$('#detail [data-source]').forEach(b=>b.onclick=()=>showSource(b.dataset.source));
 }
}
async function showSource(path){
 $('#dialog-title').textContent=path;$('#dialog-content').replaceChildren();$('#evidence-dialog').showModal();
 const content=$('#dialog-content');const url=new URL('../'+path,location.href);
 if(/\.(png|jpe?g|webp|gif)$/i.test(path)){const im=new Image();im.src=url.href;im.alt="元の参考写真";content.append(im)}
 else if(/\.pdf$/i.test(path)){const frame=document.createElement('iframe');frame.src=url.href;frame.title="参考マニュアル";content.append(frame)}
 else if(path.endsWith('/')){const files=await readJSON('data/source-files.json');files.filter(f=>f.startsWith(path)).forEach(f=>{const a=document.createElement('a');a.href='../'+f;a.textContent=f.split('/').at(-1);a.className='source';a.target='_blank';content.append(a)})}
 else if(/\.(stl|stp|step|dae|glb)$/i.test(path)){const a=document.createElement('a');a.href=url.href;a.textContent="元のメッシュをダウンロード";a.download='';content.append(a)}
 else{try{let text;if(localFile){text=window.robotAtlasPortable.text[path];if(text===undefined)throw new Error('同梱資料がありません：'+path)}else{const res=await fetch(url);if(!res.ok)throw new Error(res.status);text=await res.text()}const pre=document.createElement('pre');pre.textContent=text;content.append(pre)}catch(e){content.textContent="資料を読み込めません："+e.message}}
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
function setExplode(v,manual=true){targetExplode=Math.max(0,Math.min(1,v));if(manual){playing=false;$('#play').textContent="▷ 再生"}$('#explode').value=targetExplode*100;$('#explode-value').textContent=Math.round(targetExplode*100)+'%';$('#assembled').classList.toggle('active',targetExplode<.5);$('#exploded').classList.toggle('active',targetExplode>=.5)}
function updateModel(){
 explode+= (targetExplode-explode)*.13;if(Math.abs(explode-targetExplode)<.00001)explode=targetExplode;
 for(const c of components){const node=partNodes.get(c.id);if(!node)continue;node.position.copy(basePositions.get(c.id)).addScaledVector(new THREE.Vector3(...c.exploded_offset_parent_gltf_m),explode);if(c.id==='arm.mount')node.position.y+=(liftMm-100)/1000}
 applyVisibility();model.updateMatrixWorld(true);
}
function lines(points,color=0x568a78){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));return new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.8}))}
function sprite(text){const cv=document.createElement('canvas');cv.width=512;cv.height=80;const ctx=cv.getContext('2d');ctx.fillStyle='rgba(248,250,244,.92)';ctx.fillRect(0,0,512,80);ctx.font='30px sans-serif';ctx.fillStyle='#183330';ctx.textAlign='center';ctx.fillText(text,256,52);const o=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),depthTest:false,toneMapped:false}));o.scale.set(.38,.06,1);return o}
function makeHelpers(){
 dimensionGroup=new THREE.Group();scene.add(dimensionGroup);dimensionGroup.visible=false;
 for(const [h,label] of [[.3,'300 mm'],[.515,'515 mm'],[.62,'620 mm'],[1.33,'1330 mm']]){dimensionGroup.add(lines([[-.44,h,.3],[.26,h,.3],[.26,h,-.3],[-.44,h,-.3],[-.44,h,.3]],0x77957d));const s=sprite(label+" · 実測");s.position.set(-.55,h,0);dimensionGroup.add(s)}
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
 const cmLabel=sprite("Depth 0.4–1.6 m · 手前側の幅 0.7 m");cmLabel.scale.set(.85,.07,1);cmLabel.position.set(1.25,.10,0);cam.add(cmLabel);
 coverageGroup=new THREE.Group();scene.add(coverageGroup);coverageGroup.visible=false;
 // Design areas are separate from optical FOV: distances shown from the front frame edge, not a calibrated range test.
 const front=.26;
 const near=.4,far=1.6;
 const region=lines([[front+near,.009,-.35],[front+far,.009,-.8],[front+far,.009,.8],[front+near,.009,.35],[front+near,.009,-.35]],0x41809a);coverageGroup.add(region);
 const camLabel=sprite("Depth 測定範囲 0.4–1.6 m");camLabel.scale.x=.66;camLabel.position.set(front+1.05,.08,0);coverageGroup.add(camLabel);
 const farLine=lines([[front+1.5,.012,-1],[front+1.5,.012,1]],0xaf853b);coverageGroup.add(farLine);
 const lidarLabel=sprite("LiDAR 環境認識の目標 ≥1.5 m");lidarLabel.scale.x=.66;lidarLabel.position.set(front+1.9,.08,0);coverageGroup.add(lidarLabel);
 const height=lines([[.7,.9,-.55],[.7,1.7,-.55]],0x826091);coverageGroup.add(height);
 const armLabel=sprite("対象物の高さ 0.9–1.7 m");armLabel.scale.x=.6;armLabel.position.set(.7,1.73,-.55);coverageGroup.add(armLabel);
 axesGroup=new THREE.Group();scene.add(axesGroup);axesGroup.visible=false;
 for(const [id,node] of partNodes)if(id.startsWith('mobility.wheel.')){const group=new THREE.Group();group.userData.attach=id;group.add(new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),.24,0x8c737b,.028,.012));axesGroup.add(group)}
 for(const j of data.arm_joints){const node=model.getObjectByName(j.node);if(node){const g=new THREE.Group();g.userData.object=node;g.add(new THREE.AxesHelper(.045));axesGroup.add(g)}}
 connectionGroup=new THREE.Group();scene.add(connectionGroup);connectionGroup.visible=false;
 const pairs=[['lift.driver.azd_kd','lift.stage.eas',"モーター / ABZO"],['lift.control.arduino','lift.driver.azd_kd',"制御 / フィードバック"],['electrical.pc','perception.camera.d435','USB 3.0'],['electrical.pc','arm.camera.wrist','USB 2.0']];
 for(const [a,b,label] of pairs){const l=lines([[0,0,0],[0,0,0]],0x8c9c70);l.userData.ends=[a,b];connectionGroup.add(l)}
}
function updateHelpers(){for(const parent of [fovGroup,axesGroup])for(const g of parent.children){const n=g.userData.object||partNodes.get(g.userData.attach);if(n){n.getWorldPosition(g.position);n.getWorldQuaternion(g.quaternion)}if(g.userData.groundFootprint)g.visible=explode<.03}for(const l of connectionGroup.children){const [a,b]=l.userData.ends.map(id=>partNodes.get(id));if(a&&b){const va=a.getWorldPosition(new THREE.Vector3()),vb=b.getWorldPosition(new THREE.Vector3());l.geometry.setFromPoints([va,vb])}}}
function setArmPose(name){
 const poses={see_front:[-.014,-.704,1.285,-.665,-1.109,.222],home:[-.036,-1.583,1.367,.783,-.124,.222],see_ground:[-.181,-.202,.893,.241,-1.109,.223],see_left:[-1.05,-.706,1.287,-.665,-1.109,.222],see_right:[.933,-.706,1.285,-.665,-1.109,.222]};
 const vals=poses[name];if(!vals)return;armPose=name;const basis=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
 data.arm_joints.forEach((j,i)=>{const node=model.getObjectByName(j.node);if(!node)return;const [w,x,y,z]=j.rest_quaternion_wxyz;const rest=new THREE.Quaternion(x,y,z,w);const motion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),vals[i]);node.quaternion.copy(basis).multiply(rest.multiply(motion)).multiply(basis.clone().invert())});
}
function helperCaption(){const parts=[];if(liftMm<15||liftMm>185)parts.push("Lift は端部の予備領域内です");if($('#coverage').checked)parts.push("Depth：測定図0.4–1.6 m、手前側の幅0.7 m。角度と奥側の幅は推定です");if($('#fov').checked)parts.push("MID360 はローカル中心平面から下7°/上52°、水平360°。取付姿勢に追従します。Depth の地面境界は組立状態でのみ表示し、奥側の幅は概念上の延長です");if($('#connections').checked)parts.push("線は論理的な接続を示します");$('#helper-caption').textContent=parts.join(' · ')||"操作は表示のみ · Lift の通常ソフトウェア範囲 15–185 mm"}
function bind(){
 $('#search').oninput=renderList;$('#clear-filter').onclick=()=>setFilter('all');$('#deselect').onclick=()=>select('robot.root');
 $$('.tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;renderDetails()});$('#close-dialog').onclick=()=>$('#evidence-dialog').close();
 $('#help-button').onclick=()=>{ $('#dialog-title').textContent="使い方";$('#dialog-content').innerHTML="<p>ドラッグで回転、ホイールで拡大・縮小、右ドラッグで平行移動します。モデルまたは左の一覧から部品を選び、「フォーカス」で拡大できます。</p><p>組立・分解スライダーで部品間の表示間隔を調整します。「再生」で連続して往復します。Lift スライダーは昇降スライダーとアームの高さを変更します。アームの「取付」タブでは、参考資料に記録された観察姿勢を選択できます。</p><p>「寸法基準」は実測高さと平面寸法を表示します。「センサー視野」は MID360 の記録された FOV と、D435 の測定図の範囲・概念上の境界線を表示します。「関節軸」はアームと車輪ユニットの軸を示します。「接続関係」は記録された論理接続の一部を示し、実際の配線経路は表していません。</p><p>プリント製ブラケットは黄色、SO101 本体は淡い青、金属構造は淡い青の金属外観で表示します。形状の精度は右側のラベルで確認できます。「根拠別の配色」は各部品の主な出典区分による配色です。形状精度は右側の説明を確認してください。MID360 の旧運用 TF は、過去との比較用に Reference に保存しています。</p><p>すべての操作はローカルモデルの表示だけに反映されます。「画像保存」で現在の3D表示を保存できます。</p>";$('#evidence-dialog').showModal()};
 $('#reset').onclick=()=>{filter='all';$('#search').value='';renderList();applyVisibility();resetCamera()};$('#focus').onclick=()=>focusBounds(bounds(m=>selected==='robot.root'||belongsTo(m.userData.ownerId,selected)));
 $('#rotate').onclick=()=>{orbit.autoRotate=!orbit.autoRotate;$('#rotate').setAttribute('aria-pressed',orbit.autoRotate)};
 $('#capture').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='robot-atlas-view.png';a.href=canvas.toDataURL('image/png');a.click()};
 $('#explode').oninput=e=>setExplode(+e.target.value/100);$('#assembled').onclick=()=>{setExplode(0);resetCamera()};$('#exploded').onclick=()=>{setExplode(1);resetCamera()};
 $('#play').onclick=()=>{playing=!playing;$('#play').textContent=playing?"Ⅱ 一時停止":"▷ 再生";if(playing){camera.zoom=.77;camera.updateProjectionMatrix();orbit.target.y=.96}};
 $('#lift').oninput=e=>{liftMm=+e.target.value;$('#lift-value').textContent=liftMm+' mm';helperCaption()};
 for(const [id,obj] of [['dimensions',dimensionGroup],['fov',fovGroup],['axes',axesGroup],['connections',connectionGroup]])$('#'+id).onchange=e=>{obj.visible=e.target.checked;helperCaption()};
 $('#coverage').onchange=e=>{coverageGroup.visible=e.target.checked;if(e.target.checked){camera.zoom=.68;orbit.target.set(.65,.80,0);camera.updateProjectionMatrix()}else resetCamera();helperCaption()};
 $('#evidence-color').onchange=()=>{applyColors();$('#model-note').textContent=$('#evidence-color').checked?"根拠の種類による配色 · オフにすると材質色に戻ります":"黄 = プリント製ブラケット · 淡青 = アーム / 金属構造"};
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down;
 function hit(e){const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);return ray.intersectObjects(meshes.filter(m=>m.visible),false)[0]?.object.userData.ownerId}
 canvas.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);canvas.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<5){const id=hit(e);if(id)select(id)}down=null});
 canvas.addEventListener('pointermove',e=>{const id=hit(e);if(id!==hovered){hovered=id;applyColors()}const t=$('#tooltip');t.style.display=id?'block':'none';if(id){t.textContent=byId[id].display_name_zh;t.style.left=e.clientX+13+'px';t.style.top=e.clientY+15+'px'}canvas.style.cursor=id?'pointer':'grab'});
 canvas.addEventListener('pointerleave',()=>{hovered=null;applyColors();$('#tooltip').style.display='none'});
 window.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();$('#search').focus()}});
}
async function start(){
 try{
  if(localFile)await loadClassicScript('portable/data.js');data=await readJSON('data/components.json');components=data.components;byId=Object.fromEntries(components.map(c=>[c.id,c]));$('#count').textContent=components.length+" コンポーネント";renderList();renderDetails();setupScene();
  const mobile=matchMedia('(max-width:800px)').matches;const loader=new GLTFLoader();let gltf;
  if(localFile){
   $('#loading').textContent='同梱モデルを読み込み中…';
   await loadClassicScript(mobile?'portable/model-lod1.js':'portable/model.js');
   const bytes=Uint8Array.from(atob(window.robotAtlasModelBase64),c=>c.charCodeAt(0));delete window.robotAtlasModelBase64;
   gltf=await loader.parseAsync(bytes.buffer,'');
  }else{gltf=await loader.loadAsync(mobile?'robot_web_lod1.glb?v=v003':'robot_web.glb?v=v003',p=>{if(p.total)$('#loading').textContent="モデルを読み込み中 "+Math.round(p.loaded/p.total*100)+'%'})}
  model=gltf.scene;scene.add(model);
  model.traverse(o=>{if(o.name.startsWith('part__')&&o.userData.component_id){partNodes.set(o.userData.component_id,o);basePositions.set(o.userData.component_id,o.position.clone())}if(o.isMesh){let p=o;while(p&&!p.userData.component_id)p=p.parent;const id=p?.userData.component_id;if(!id)return;o.userData.ownerId=id;o.castShadow=true;o.receiveShadow=true;o.material=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const copy=m.clone();copy.userData.originalColor=m.color.clone();return copy});if(o.material.length===1)o.material=o.material[0];meshes.push(o)}});
  if(partNodes.size!==components.length)throw new Error("部品の対応が不完全です："+partNodes.size+'/'+components.length);
  ready=true;makeHelpers();bind();const requested=new URLSearchParams(location.search).get('part');if(byId[requested])select(requested);applyColors();$('#loading').hidden=true;window.robotAtlasBootComplete?.();
  let last=performance.now();function animate(now){requestAnimationFrame(animate);const dt=Math.min(.05,(now-last)/1000);last=now;if(playing){let next=targetExplode+playDir*dt*.18;if(next>=1){next=1;playDir=-1}if(next<=0){next=0;playDir=1}setExplode(next,false)}updateModel();updateHelpers();orbit.update();renderer.render(scene,camera)}requestAnimationFrame(animate);
  // Read-only QA surface for local verification.
  window.robotAtlas={getState:()=>({ready,componentCount:partNodes.size,meshCount:meshes.length,selected,filter,explode,liftMm,cameraPosition:camera.position.toArray(),autoRotate:orbit.autoRotate,playing,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,visibleMeshes:meshes.filter(m=>m.visible).length,positions:Object.fromEntries([...partNodes].map(([id,n])=>[id,n.getWorldPosition(new THREE.Vector3()).toArray()]))}),select,setFilter,setExplode,setArmPose};
 }catch(e){console.error(e);window.robotAtlasBootError(e)}
}
start();
