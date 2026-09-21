import json,copy
from pathlib import Path
R=Path(__file__).resolve().parents[2];d=json.loads((R/'data/archive/v002/components.json').read_text());C={c['id']:c for c in d['components']}
for c in C.values():
 c['source_refs']=list(dict.fromkeys(p for p in c['source_refs'] if 'feedback' not in p.lower() and 'image-20260920224710003' not in p and not p.endswith('products/sources.md')))
 c['external_evidence']=[]
 c['reference_refs']=[]
 # Runtime files describe runtime state, not independent physical evidence.
 for p in c['source_refs'][:]:
  if any(x in p for x in ['/urdf/','/runtime-config/','/concept/']) or p.endswith('physical-measurements.json'):
   c['source_refs'].remove(p);c['reference_refs'].append(p)
 c['information_kind']='hardware_fact' if c['evidence_status'] in ['measured','manufacturer','runtime','model-derived'] else 'design_decision'
urls={'lidar':'https://www.livoxtech.com/mid-360','lidarcad':'https://www.livoxtech.com/mid-360/downloads','xc330':'https://emanual.robotis.com/docs/en/dxl/x/xc330-m288/','xh540':'https://emanual.robotis.com/docs/en/dxl/x/xh540-w270/','eas':'https://www.orientalmotor.co.jp/ja/products/detail?hinmei=EASM2XF020AZAK&refFlg=1','drive':'https://catalog.orientalmotor.com/item/op-online-components-brushless-dc-motor-components/-12-hp-200-w-1-4-hp-blm-r-type-brushless-dc-motors/blmr5100k-30fr-b','battery':'https://store.shopping.yahoo.co.jp/motostyle/4950545351104.html'}
for c in C.values():
 cid=c['id']; key='drive' if cid.startswith('mobility.drive_motor') else 'xh540' if cid.startswith('mobility.steer_motor') else 'lidar' if cid=='perception.lidar.mid360' else 'xc330' if cid=='perception.camera.pan_tilt' else 'eas' if cid=='lift.stage.eas' else 'battery' if cid.startswith('electrical.battery.') else None
 if key:c['external_evidence']=[{'url':urls[key],'label':c['model'] or cid,'kind':'product'}]
 if key=='lidar':c['external_evidence'].append({'url':urls['lidarcad'],'label':'Livox 官方 CAD / FOV','kind':'cad'})
for tag,stem in [('rear','1-back'),('front_left','2-front-left'),('front_right','3-front-right')]:
 c=C['mobility.drive_motor.'+tag];c['source_refs']=[p for p in c['source_refs'] if '/drive-motors/' not in p]+[f'references/photos/drive-motors/{stem}.jpg',f'references/photos/drive-motors/{stem}.jpeg'];c['known']['installation_direction']='纵向竖直布置；输出轴与轮轴对齐，电机位于轮轴上方';c['missing']=['安装孔位、轮轴接口及离地间隙的独立复测']
C['electrical.controllers']['interaction_group']='mobility';C['electrical.controllers']['parent_id']='base.frame';C['electrical.controllers']['category']='assembly';C['electrical.controllers']['known']['driver_layout']='ID 1 / ID 2 左侧（+Y）；ID 3 右侧（−Y）';C['electrical.controllers']['quantity']=3
for idx,stem,side in [(1,'1-back','left'),(2,'2-front-left','left'),(3,'3-front-right','right')]:
 c=copy.deepcopy(C['electrical.controllers']);c.update(id=f'mobility.driver.{idx}',parent_id='electrical.controllers',display_name_zh=f'轮组驱动器 · ID {idx}',model='BLVD-KRD',quantity=1,category='driver',evidence_status='manufacturer',known={'drive_modbus_id':idx,'robot_side':side,'mounting_platform_floor_m':.3},source_refs=['references/hardware-docs/blv_r_drive_motors.md',f'references/photos/drive-motors/{stem}.jpeg'],external_evidence=[{'url':urls['drive'],'label':'Oriental Motor BLV-R','kind':'product'}]);C[c['id']]=c
C['lift.driver.azd_kd']['parent_id']='lift.control.carrier';C['lift.control.carrier']['display_name_zh']='Lift 控制一体安装组件';C['lift.control.carrier']['known']['included_modules']='AZD-KD / Arduino / MOSFET / RS-485';C['lift.control.carrier']['category']='assembly'
C['arm.so101']['geometry_note']='复用 SO101 原始网格；臂体按实机采用浅蓝色，STS3215 舵机保留黑色。其他打印支架为黄色。'
cam=C['perception.camera.d435'];cam['known'].pop('design_ground_range_m',None);cam['known'].update(measured_ground_range_m=[.4,1.6],measured_near_width_m=.7,coverage_reference='测量图中 robot 前方标记为距离起点；模型以车架前缘作显示基准。图中无数值安装角。');cam['missing']=['测量图未提供安装角与远端宽度；相机俯角按已有高度与图示范围推算，仅用于展示','当前内参、遮挡与测量起点精确复测'];cam['geometry_note']='源网格不变；前向展示姿态由0.4–1.6 m地面区域推算，非新增标定。原始URDF保存为运行参考。'
C['perception.camera.pan_tilt']['geometry_note']='官方 XC330 共用 CAD + 黄色连接件；显示姿态匹配测量区间，运行标定链仍作为参考保留。'
C['perception.lidar.mid360']['known']['fov_reference']='LiDAR 局部中心平面：下7° / 上52°，水平360°；随安装倾角整体旋转。'
C['electrical.pc']['source_refs']=['references/photos/real-robot/IMG_0179.jpg'];C['electrical.pc']['information_kind']='design_decision'
for c in C.values():
 if c['id'].startswith('electrical.battery.'):c['geometry_note']='按指定产品尺寸重建；左右各两块的位置属于设计安装说明，商品链接只验证产品身份和尺寸。'
 # Direct photographs of annotated mounting sketches belong to concept references.
 for p in c['source_refs'][:]:
  if p.endswith('new-camera-holder.png'):c['source_refs'].remove(p);c['reference_refs'].append(p)
d['components']=list(C.values());d['material_policy']['metal']='light blue aluminium structure; stock hardware retains product colors';d['material_policy']['printed']='yellow; SO101 arm shell light blue as installed'
d['design_coverage']['depth']={'purpose':'近距障碍 / Local Planner','measured_front_m':[.4,1.6],'near_width_m':.7,'installation_pitch_status':'derived for display; image does not measure angle'}
d['evidence_policy']={'hardware_fact':'官方资料、硬件文档、实机照片可直接确认','design_decision':'任务需求与操作经验形成的选择','reference_concept':'运行参数、推算几何和概念说明；不自动作为物理证据','excluded':['feedback files','image-20260920224710003.png']}
# Historical installation prose is a Reference, not independent hardware Evidence.
c=C['perception.lidar.mid360'];p='references/hardware-docs/livox_mid360.md'
if p in c['source_refs']:
 c['source_refs'].remove(p)
 if p not in c['reference_refs']:c['reference_refs'].append(p)
(R/'data/components.json').write_text(json.dumps(d,ensure_ascii=False,indent=2));print(len(C))
