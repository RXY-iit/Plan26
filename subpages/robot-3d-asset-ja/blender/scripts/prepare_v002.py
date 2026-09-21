"""Evidence-backed metadata updates; v001 remains archived."""
import json,copy
from pathlib import Path
R=Path(__file__).resolve().parents[2];d=json.loads((R/'data/archive/components-v001.json').read_text()); cs={c['id']:c for c in d['components']}
F='references-v2/feedback-v1.md';P='references-v2/photos/';S='references-v2/products/sources.md'
for c in cs.values():
 c['source_refs'] += [F]
 c['geometry_note']='依据照片与尺寸重建的展示外形；未确认孔位和局部尺寸不用于制造。'
 c['installation_status']='照片估算；已确认的相对关系见规格'
def update(cid,**kw):cs[cid].update(kw);return cs[cid]
def add(cid,name,group,parent,model=None,known=None,geometry='procedural-estimate',refs=None,missing=None):
 c=dict(id=cid,parent_id=parent,display_name_zh=name,category=group,quantity=1,model=model,evidence_status='operator-confirmed',geometry_status=geometry,interaction_group=group,design_note_status='recorded',source_refs=[F]+(refs or []),known=known or {},missing=missing or ['精确安装坐标与固定孔位尚待测量'],geometry_note='依据照片与产品资料重建外形；安装坐标为展示估算。',installation_status='操作员确认相对位置 / 照片估算局部坐标');cs[cid]=c;return c
cs['base.frame']['known']['platform_use']={'0.300':'底盘与 Lift 驱动器','0.515':'左急停 / 右 PC','1.330':'LiDAR holder 安装顶梁'}
cs['base.frame']['missing']=['逐根型材切割长度、安装孔位、620 mm 平台完整定义及 XY 基准复测']
for typ in ['drive','steer']:
 c=cs[f'mobility.{typ}_motor'];c['quantity']=3;c['category']='assembly';c['geometry_status']='assembly';c['missing']=['各轮组安装轴心与支架孔位的独立复测'];c['source_refs']+=[S]
for tag,zh,idx in [('rear','后',1),('front_left','左前',2),('front_right','右前',3)]:
 for typ in ['drive','steer']:
  orig=cs[f'mobility.{typ}_motor'];cid=f'mobility.{typ}_motor.{tag}';mid=idx if typ=='drive' else idx+10
  c=add(cid,zh+('驱动电机' if typ=='drive' else '转向电机')+f' · ID {mid}','mobility',orig['id'],orig['model'],{'drive_modbus_id' if typ=='drive' else 'steer_id':mid,'mount_material':'metal'},'manufacturer-cad' if typ=='steer' else 'drawing-reconstruction',orig['source_refs'][:-1]+[S])
  if typ=='steer':c['source_refs']+=['references-v2/cad/xh540.stp'];c['geometry_note']='ROBOTIS 官方 XM/H/D-540 共用 STEP 外形；机身毫米转换为米。安装方向按照片估算。'
  else:c['source_refs']+=['references-v2/products/drive-dimensions.jpg'];c['geometry_note']='依据 Oriental Motor 官方 90 × 180 mm 扁平中空减速头尺寸图重建；未取得官方 STEP。'
  c['evidence_status']='runtime'
l=cs['perception.lidar.mid360'];l['evidence_status']='operator-confirmed';l['geometry_status']='manufacturer-cad';l['parent_id']='perception.lidar.holder';l['known'].pop('body_diameter_m',None);l['known']['body_height_m']=.06;l['known']['body_dimensions_m']=[.065,.065,.06];l['known']['design_far_environment_from_m']=1.5
l['known']['placement_note']='安装在 1330 mm 顶梁的打印支架上，略靠柱中心后方；展示取 X=165 mm、底面 Z=1370 mm，30°沿用运行记录，精确位姿待测。'
l['missing']=['支架精确尺寸、实测倾角、LiDAR 安装原点复测','点云遮挡与目标区域覆盖验证'];l['source_refs'] += [P+'IMG_0366.jpg',P+'Mid3601.jpg',P+'LIVOX-Mid-360-LiDAR-Sensor-FIG-3.webp',S,'references-v2/cad/mid360.stp'];l['geometry_note']='Livox 官方 MID-360 STEP；支架与整机安装位置按照片估算。旧运行 TF 单独保留，不再决定本版实物示意位置。'
add('perception.lidar.holder','LiDAR 打印支架','perception','base.frame',known={'material':'3D printed polymer','mounting_platform_floor_m':1.33},refs=[P+'IMG_0366.jpg',P+'Mid3601.jpg'])
p=cs['perception.camera.pan_tilt'];p['model']='2 × ROBOTIS XC330-M288-T';p['evidence_status']='operator-confirmed';p['geometry_status']='mixed-cad-photo';p['known']['motor_count']=2;p['known']['motor_model']='XC330-M288-T';p['missing']=['打印连接件精确 CAD 与孔位','机械限位及标定链与当前支架版本的一致性'];p['source_refs'] += [P+'new-camera-holder.png',P+'new-camera-holder2.png','references-v2/cad/xc330.stp',S];p['geometry_note']='两个舵机使用 ROBOTIS 官方 XL/XC-330 STEP；黄色连接件按实物照片重建，轴间变换保留标定 URDF。'
cs['perception.camera.d435']['known'].update(design_ground_range_m=[.4,1.7],photo_annotated_range_m=[.4,1.6]);cs['perception.camera.d435']['missing']=['当前设备内参和场景遮挡验证','打印支架精确 CAD'];cs['perception.camera.d435']['source_refs'] += [P+'camera-visiable-range.png',P+'new-camera-holder2.png']
cs['lift.stage.eas']['missing']=['官方 STEP 尚未取得；按官方尺寸图重建','准确安装基准、安装孔位','总负载、重心、力矩和选型计算数值'];cs['lift.stage.eas']['source_refs'] += [S,'references-v2/products/lift-dimensions.gif'];cs['lift.stage.eas']['geometry_status']='drawing-reconstruction'
cs['arm.so101']['known']['target_object_height_floor_m']=[.9,1.7];cs['arm.so101']['missing']=['总负载与具体任务可达性验证','安装接口复测'];cs['arm.so101']['geometry_note']='复用 SO101 原始网格；打印件统一黄色，STS3215 舵机保留黑色。'
cs['lift.stage.eas']['known']['selection_basis']='按机械臂自重、附加部件总负载及所需升降能力选型（操作员确认，尚无数值表）'
cs['arm.mount']['geometry_note']='金属滑块 + 黄色打印转接件；外形估算，运动坐标沿用参考记录。'
cs['safety.estop']['evidence_status']='operator-confirmed';cs['safety.estop']['known'].update(robot_side='left / +Y',mounting_platform_floor_m=.515)
cs['electrical.controllers']['display_name_zh']='底盘控制与驱动器';cs['electrical.controllers']['known']={'driver_model':'3 × BLVD-KRD','mounting_platform_floor_m':.3};cs['electrical.controllers']['source_refs'] += [P+'IMG_0372.jpg',P+'image-20260920224710003.png'];cs['electrical.controllers']['missing']=['底盘辅助模块完整 BOM、安装孔位与布线图']
cs['lift.driver.azd_kd']['known']['mounting_platform_floor_m']=.3;cs['lift.driver.azd_kd']['source_refs'] += [P+'IMG_0372.jpg'];cs['lift.driver.azd_kd']['evidence_status']='operator-confirmed'
add('electrical.pc','右侧计算主机','electrical','base.frame','NUC13ANH-B',{'robot_side':'right / −Y','mounting_platform_floor_m':.515},refs=[P+'image-20260920224710003.png'])
add('lift.control.carrier','Lift 控制打印托架','lift','base.frame',known={'material':'3D printed polymer','mounting_platform_floor_m':.3},refs=[P+'IMG_0372.jpg'])
for tag,name,model,size in [('arduino','Arduino 控制板','Arduino UNO（照片识别）',[.0686,.0534,.015]),('mosfet','5 V → 24 V 接口板','MOSFET 接口模块',[.048,.030,.014]),('rs485','RS-485 接口','RS-485 模块（SKU 待确认）',[.044,.022,.012])]:
 add('lift.control.'+tag,name,'lift','lift.control.carrier',model,{'body_dimensions_m':size},refs=[P+'IMG_0372.jpg'],missing=['板卡版本、孔位与完整 SKU 复核；外形包络为展示估算'])
for side,zh in [('left','左'),('right','右')]:
 for idx in [1,2]:
  add(f'electrical.battery.{side}{idx}',f'{zh}侧电池 {idx}','electrical','base.frame','AZ IT12B-FP',{'body_dimensions_m':[.150,.065,.092],'voltage_v':12,'robot_side':side,'mounting_below_floor_m':.3,'mass_kg':.9},refs=[S,P+'image-20260920224710003.png'],missing=['串并联与配电拓扑','电池支撑细节与安装坐标复测'])
d['components']=list(cs.values());d['material_policy']={'metal':'metallic silver or anodized black','printed':'yellow / amber polymer','electronics':'device body / PCB colors','evidence':'text badges and optional overlay, independent of base material'}
d['design_coverage']={'lidar':{'purpose':'定位 / 周围环境','target_beyond_front_m':1.5},'depth':{'purpose':'近距障碍 / Local Planner','goal_front_m':[.4,1.7],'photo_annotation_m':[.4,1.6]},'arm':{'target_height_floor_m':[.9,1.7],'status':'design goal, not reachability certification'}}
(R/'data/components.json').write_text(json.dumps(d,ensure_ascii=False,indent=2));print(len(cs),'v002 components')
