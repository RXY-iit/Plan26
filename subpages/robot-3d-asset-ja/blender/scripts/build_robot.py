"""Reproducible Blender asset build. Run with Blender --background --python this_file.
All source geometry stays unchanged. Coordinates are ROS metres, Z up.
"""
import bpy, math, json, hashlib, sys, xml.etree.ElementTree as ET
from pathlib import Path
from mathutils import Matrix, Vector, Euler

ROOT = Path(__file__).resolve().parents[2]
DATA = json.loads((ROOT/'data/components.json').read_text())
PARTS = {c['id']: c for c in DATA['components']}
OUT = ROOT/'renders'
OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
    if c.name != 'Collection': bpy.data.collections.remove(c)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1.0
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=1400
scene.render.resolution_y=1400
scene.render.resolution_percentage=100
scene.world.color=(0.45,0.45,0.45)
scene.view_settings.view_transform='AgX'
collections={}
for name in ['00_REFERENCE','10_BASE','20_MOBILITY','30_LIFT','40_ARM','50_PERCEPTION','60_ELECTRICAL','70_CABLES','80_HELPERS','90_EXPLODED','STUDIO']:
    c=bpy.data.collections.new(name);scene.collection.children.link(c);collections[name]=c
GROUP={'robot':'00_REFERENCE','base':'10_BASE','mobility':'20_MOBILITY','lift':'30_LIFT','arm':'40_ARM','perception':'50_PERCEPTION','electrical':'60_ELECTRICAL','cables':'70_CABLES'}

def mat(name,color,metal=0,rough=.4):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    return m
AL=mat('Light blue structural metal',(.42,.60,.70),.72,.3)
STOCK_METAL=mat('Product aluminium',(.50,.55,.59),.75,.3)
DARK=mat('Black anodized',(.034,.044,.052),.55,.32)
RUBBER=mat('Rubber',(.019,.024,.027),0,.8)
TEAL=mat('SO101 installed light blue',(.20,.54,.69),0,.4)
PCB=mat('PCB green',(.015,.20,.13),.15,.5)
AMBER=mat('Printed polymer yellow',(.95,.53,.035),0,.4)
LABEL=mat('Equipment label',(.80,.82,.79),0,.55)
RED=mat('Stop button',(.67,.018,.028),.1,.25)
GLASS=mat('Optical glass',(.014,.045,.068),.6,.12)
BLUE=mat('Helper cyan',(.02,.43,.6),.1,.4)
WHITE=mat('Studio',(.84,.86,.86),0,.7)

def relink(o,col):
    for c in list(o.users_collection):c.objects.unlink(o)
    collections[col].objects.link(o)
def empty(name,col,parent=None,xyz=(0,0,0),rpy=(0,0,0)):
    o=bpy.data.objects.new(name,None);collections[col].objects.link(o);o.empty_display_size=.025;o.empty_display_type='PLAIN_AXES';o.parent=parent;o.location=xyz;o.rotation_euler=rpy;return o
def finish(o,name,parent,material,col=None):
    o.name=name;o.parent=parent
    relink(o,col or (parent.users_collection[0].name if parent else 'STUDIO'))
    o.data.materials.clear();o.data.materials.append(material)
    return o
def box(name,xyz,size,parent,material=AL,bevel=.001):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz);o=bpy.context.object;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    finish(o,name,parent,material)
    if bevel:
        m=o.modifiers.new('Manufacturing edge','BEVEL');m.width=bevel;m.segments=2
    return o
def cyl(name,xyz,radius,depth,parent,material=AL,rpy=(0,0,0),vertices=40):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=xyz,rotation=rpy)
    o=finish(bpy.context.object,name,parent,material)
    for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
    m=o.modifiers.new('Rim softening','BEVEL');m.width=.0007;m.segments=2
    return o
def line(name,points,parent,material=DARK,radius=.002):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=radius;cu.bevel_resolution=2
    sp=cu.splines.new('POLY');sp.points.add(len(points)-1)
    for p,v in zip(sp.points,points):p.co=(*v,1)
    o=bpy.data.objects.new(name,cu);(parent.users_collection[0] if parent else collections['STUDIO']).objects.link(o);o.parent=parent;cu.materials.append(material);return o
def beam(name,a,b,profile,parent,material=AL):
    a,b=Vector(a),Vector(b);d=b-a
    o=box(name,(a+b)/2,(profile,profile,d.length),parent,material,.0006)
    o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    # Inset dark channels are a visual approximation, not a manufacturing profile.
    for axis in (0,1):
        for sign in (-1,1):
            loc=Vector((0,0,0));loc[axis]=sign*(profile/2+.0001)
            sz=[profile*.13,profile*.13,d.length-.004];sz[axis]=.0003
            groove=box(name+'_slot',loc,sz,o,DARK,0)
    return o
def transform(el):
    if el is None:return Matrix.Identity(4)
    xyz=[float(x) for x in el.get('xyz','0 0 0').split()];rpy=[float(x) for x in el.get('rpy','0 0 0').split()]
    return Matrix.Translation(xyz)@Euler(rpy,'XYZ').to_matrix().to_4x4()
N={}
def part(cid,world=(0,0,0),rpy=(0,0,0),parent=None):
    c=PARTS[cid];p=parent or N.get(c['parent_id'])
    o=empty('part__'+cid,GROUP[c['interaction_group']],p)
    bpy.context.view_layer.update()
    mw=Matrix.Translation(world)@Euler(rpy,'XYZ').to_matrix().to_4x4()
    o.matrix_world=mw
    o['component_id']=cid;o['evidence_status']=c['evidence_status'];o['geometry_status']=c['geometry_status']
    N[cid]=o;return o
FLOOR=.1125
root=part('robot.root',(0,0,FLOOR))
frame=part('base.frame',(0,0,FLOOR))

# Horizontal extents measured; member layout inferred from the oblique photograph.
for z,xend in [(.300,.24),(.515,-.20),(.620,.24)]:
    zz=z-FLOOR-.020
    # Upper 620 mm tier covers the forward equipment deck; 515 mm rear deck.
    xmin=-.42 if z!=.620 else -.18
    for y in [-.28,.28]:beam('4040_horizontal',(xmin,y,zz),(xend,y,zz),.04,frame)
    for x in [xmin,xend]:beam('4040_cross',(x,-.26,zz),(x,.26,zz),.04,frame)
for x,zmax in [(-.42,.475),(.24,.580)]:
    for y in [-.28,.28]:beam('4040_upright',(x,y,.300-FLOOR),(x,y,zmax-FLOOR),.04,frame)
for y in [-.13,.13]:
    beam('2020_front_support',(.205,y,.620-FLOOR),(.205,y,1.310-FLOOR),.02,frame,AL)
beam('2020_top_bridge',(.205,-.14,1.320-FLOOR),(.205,.14,1.320-FLOOR),.02,frame)
box('Forward equipment deck',(.015,0,.617-FLOOR),(.37,.53,.006),frame,AL)
box('Rear electrical deck',(-.32,0,.512-FLOOR),(.20,.53,.006),frame,AL)
box('Base tray',(-.09,0,.297-FLOOR),(.61,.51,.006),frame,AL)
for x in [-.40,.22]:
    for y in [-.26,.26]:
        box('Corner bracket',(x,y,.315-FLOOR),(.055,.055,.004),frame,DARK)
        for dy in [-.017,.017]:cyl('M6 representative', (x,y+dy,.320-FLOOR),.004,.004,frame,DARK,vertices=12)

# Imported vendor CAD meshes use mm. Preserve the shape, normalize around its bounds.
def vendor_mesh(tag,parent,xyz=(0,0,0),rpy=(0,0,0),material=STOCK_METAL):
    bpy.ops.wm.stl_import(filepath=str(ROOT/'blender/derived'/f'{tag}.stl'))
    o=bpy.context.object;finish(o,'CAD__'+tag,parent,material)
    lo=Vector([min(v.co[i] for v in o.data.vertices) for i in range(3)])
    hi=Vector([max(v.co[i] for v in o.data.vertices) for i in range(3)])
    centre=(lo+hi)/2
    for v in o.data.vertices:v.co=(v.co-centre)*.001
    o.location=xyz;o.rotation_euler=rpy
    o['source_cad']='references-v2/cad/'+tag+'.stp';o['unit_conversion_mm_to_m']=.001
    for f in o.data.polygons:f.use_smooth=True
    if len(o.data.polygons)>15000:
        dec=o.modifiers.new('Vendor CAD web reduction','DECIMATE');dec.ratio=.42
    return o

def label(text,xyz,parent,size=.008,rpy=(0,0,0)):
    cu=bpy.data.curves.new(text,'FONT');cu.body=text;cu.size=size;cu.align_x='CENTER';cu.align_y='CENTER'
    o=bpy.data.objects.new('Label '+text,cu);parent.users_collection[0].objects.link(o);o.parent=parent;o.location=xyz;o.rotation_euler=rpy;cu.materials.append(LABEL)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o

wheelpos=[('front_left',.2064,.2489),('front_right',.2064,-.2489),('rear',-.385,0)]
drive=part('mobility.drive_motor',(0,0,FLOOR))
steer=part('mobility.steer_motor',(0,0,FLOOR))
for tag,x,y in wheelpos:
    w=part('mobility.wheel.'+tag,(x,y,FLOOR));w['pivot_type']='continuous'
    cyl('Tire',(0,0,0),.1125,.060,w,RUBBER,(math.pi/2,0,0),64)
    for side in [-1,1]:
        cyl('Alloy wheel rim',(0,side*.0305,0),.077,.004,w,AL,(math.pi/2,0,0),48)
        cyl('Wheel hub',(0,side*.034,0),.026,.011,w,DARK,(math.pi/2,0,0))
        for i in range(8):
            a=2*math.pi*i/8
            cyl('Rim recess',(.05*math.sin(a),side*.033,.05*math.cos(a)),.012,.001,w,DARK,(math.pi/2,0,0),16)
    box('Wheel swivel plate',(0,0,.128),(.125,.13,.012),w,AL)
    for s in [-1,1]:box('Fork bracket',(0,s*.045,.060),(.036,.012,.120),w,AL)
    cyl('Steering bearing',(0,0,.148),.041,.024,w,AL)
    inward=-1 if y>0 else 1
    d=part('mobility.drive_motor.'+tag,(x,y+inward*.076,FLOOR))
    # Gearhead long axis is vertical, output remains coaxial with the wheel.
    direction=1 if tag=='rear' else -1
    d.rotation_euler.y=-direction*math.pi/2
    d['installation_long_axis']='vertical Z'
    box('GFS5G30FR metal housing',(direction*.045,0,0),(.180,.0652,.090),d,DARK,.006)
    cyl('Hollow output boss',(0,-inward*.034,0),.025,.004,d,AL,(math.pi/2,0,0))
    cyl('20mm output bore',(0,-inward*.0365,0),.010,.001,d,DARK,(math.pi/2,0,0))
    box('BLMR5100K motor',(direction*.090,inward*.049,0),(.090,.0504,.090),d,DARK,.004)
    for dx in [-.034,.034]:
        for dz in [-.034,.034]:cyl('Gearbox fastener',(dx,-inward*.034,dz),.004,.003,d,DARK,(math.pi/2,0,0),12)
    label('BLMR5100K',(direction*.09,0,.046),d,.006)
    st=part('mobility.steer_motor.'+tag,(x,y,.32715))
    vendor_mesh('xh540',st,rpy=(math.pi,0,0))
    box('Metal steer saddle',(0,0,-.043),(.065,.066,.006),st,AL)
    for sy in [-1,1]:box('Metal saddle upright',(0,sy*.031,-.010),(.060,.004,.066),st,AL)

lift=part('lift.stage.eas',(.230,0,.8513))
# EASM2 straight AZ DC: total stroke+205 =405; rail stroke+116.7 =316.7; 40mm wide.
box('EAS aluminium rail',(0,0,.24665),(.028,.040,.3167),lift,AL)
box('EAS guide channel',(.015,0,.24665),(.002,.014,.290),lift,DARK)
for yy in [-.016,.016]:box('Linear guide',(.016,yy,.24665),(.004,.005,.285),lift,AL)
box('AZ motor metal body',(0,0,.055),(.028,.028,.069),lift,DARK,.002)
box('ABZO encoder',(0,0,.01025),(.028,.028,.0205),lift,DARK,.002)
box('AZ motor coupler',(0,0,.100),(.028,.040,.022),lift,AL)
box('EAS far end',(0,0,.399),(.028,.040,.012),lift,AL)
for zz in [.105,.370]:
    box('Metal lift cross support',(-.025,0,zz),(.012,.280,.024),lift,AL)
    box('Metal lift rail clamp',(-.012,0,zz),(.016,.052,.020),lift,AL)
box('EAS sensor rail',(.010,.0235,.24665),(.006,.003,.3167),lift,AL)
label('EASM2XF020AZAK',(.015,-.020,.25),lift,.006,(math.pi/2,0,math.pi/2))
mount=part('arm.mount',(.32084,.01262,1.105),(0,0,-.01532))
mount['pivot_type']='prismatic';mount['lift_default_m']=.100;mount['lift_stroke_m']=.200
box('EAS metal carriage',(-.067,-.01262,-.035),(.018,.047,.045),mount,AL)
box('Printed arm adapter',(-.022,-.006,-.008),(.108,.100,.016),mount,AMBER)
box('Printed adapter vertical',(-.057,-.006,-.032),(.008,.065,.048),mount,AMBER)
arm=part('arm.so101',(.32084,.01262,1.105),(0,0,-.01532))

# Import full supplied arm link meshes with URDF FK, preserving six joint pivots.
arm_urdf=ROOT/'references/urdf/expanded/so_arm101.urdf'
tree=ET.parse(arm_urdf).getroot()
pose={'shoulder_pan_joint':-.014,'shoulder_lift_joint':-.704,'elbow_flex_joint':1.285,'wrist_flex_joint':-.665,'wrist_roll_joint':-1.109,'gripper_joint':.222}
links={'arm/world':arm};joints=[]
pending=list(tree.findall('joint'))
while pending:
    progress=False
    for j in pending[:]:
        pn=j.find('parent').get('link');cn=j.find('child').get('link')
        if pn not in links:continue
        o=empty('joint__'+j.get('name').replace('/','_'),'40_ARM',links[pn])
        m=transform(j.find('origin'));o.matrix_basis=m@Matrix.Rotation(pose.get(j.get('name'),0),4,'Z')
        o['joint_type']=j.get('type');o['urdf_link']=cn
        if j.get('name') in pose:
            o['joint_name']=j.get('name');o['pose_rad']=pose[j.get('name')];o['rest_quaternion_wxyz']=list(m.to_quaternion());joints.append(o)
            limit=j.find('limit')
            if limit is not None:
                for key in ['lower','upper','effort','velocity']:
                    if key in limit.attrib:o['urdf_limit_'+key]=float(limit.get(key))
        links[cn]=o;pending.remove(j);progress=True
    if not progress:raise RuntimeError('Broken URDF tree')
for l in tree.findall('link'):
    for i,v in enumerate(l.findall('visual')):
        mesh=v.find('geometry/mesh')
        if mesh is None:continue
        file=(arm_urdf.parent/mesh.get('filename')).resolve()
        bpy.ops.wm.stl_import(filepath=str(file));o=bpy.context.object
        finish(o,'mesh__'+l.get('name').replace('/','_')+'_'+str(i),links[l.get('name')],DARK if 'sts3215' in file.name else TEAL)
        o.matrix_basis=transform(v.find('origin'))
        o['source_mesh']=str(file.relative_to(ROOT));o['source_unit']='metre';o['component_id']='arm.so101'
        # Keep original mesh in .blend; exported review mesh is decimated by modifier.
        if len(o.data.polygons)>7000:
            dec=o.modifiers.new('Web mesh reduction','DECIMATE');dec.ratio=.42
        for p in o.data.polygons:p.use_smooth=True
wrist=part('arm.camera.wrist',parent=links['arm/arm_camera_body_link'])
wrist.matrix_basis=Matrix.Identity(4)
box('Wrist camera placeholder',(0,0,-.004),(.032,.032,.008),wrist,PCB)
cyl('Wrist lens',(0,0,.003),.008,.008,wrist,GLASS)
bpy.context.view_layer.update()
camera_bracket_origin=wrist.matrix_world.inverted() @ links['arm/arm_camera_mount_link'].matrix_world.translation
line('Estimated wrist camera support',[list(camera_bracket_origin),(0,0,-.009)],wrist,AMBER,.003)

runtime=ET.parse(ROOT/'references/urdf/expanded/robot_runtime_simplified.urdf').getroot()
pan=part('perception.camera.pan_tilt',(0,0,FLOOR))
camlinks={'camera_pan_mount_base':pan}
pending=[j for j in runtime.findall('joint') if j.find('child').get('link').startswith(('camera_','realsense_')) and j.find('child').get('link')!='camera_pan_mount_base']
while pending:
    progress=False
    for j in pending[:]:
        pn=j.find('parent').get('link');cn=j.find('child').get('link')
        if pn not in camlinks:continue
        o=empty('tf__'+cn,'50_PERCEPTION',camlinks[pn]);o.matrix_basis=transform(j.find('origin'));o['joint_type']=j.get('type');camlinks[cn]=o;pending.remove(j);progress=True
    if not progress:raise RuntimeError('Camera TF incomplete')
# The measurement image provides ground distances, not a measured installation angle.
# Solve a display-only tilt that bisects rays to 0.4/1.6m ahead of the front frame edge.
# Runtime URDF files are never changed.
tilt_joint=camlinks['camera_tilt_link'];rest_tilt=tilt_joint.matrix_basis.copy()
best=None
for n in range(-900,901):
    angle=math.radians(n/10)
    tilt_joint.matrix_basis=rest_tilt@Matrix.Rotation(angle,4,'Z')
    bpy.context.view_layer.update()
    cm=camlinks['camera_link'].matrix_world;pos=cm.translation
    forward=cm.to_3x3()@Vector((1,0,0))
    target_pitch=(math.atan2(pos.z,.26+.4-pos.x)+math.atan2(pos.z,.26+1.6-pos.x))/2
    pitch=math.atan2(-forward.z,math.hypot(forward.x,forward.y))
    score=abs(pitch-target_pitch)+(0 if forward.x>0 else 10)
    if best is None or score<best[0]:best=(score,angle,target_pitch)
tilt_joint.matrix_basis=rest_tilt@Matrix.Rotation(best[1],4,'Z')
bpy.context.view_layer.update()
DATA['camera_display_pose']={'tilt_joint_offset_rad':best[1],'optical_pitch_down_rad':best[2],'near_m':.4,'far_m':1.6,'near_width_m':.7,'distance_origin':'frame front X=0.26m display assumption','status':'derived display pose, not measured angle or deployed TF'}
PARTS['perception.camera.d435']['known']['display_pitch_down_rad']=best[2]
# Official XL/XC-330 external CAD; calibrated URDF joint axes remain the pivots.
vendor_mesh('xc330',camlinks['camera_pan_yaw_link'],xyz=(0,0,-.0145),rpy=(0,0,0))
box('Printed pan base',(0,0,-.036),(.040,.045,.006),camlinks['camera_pan_yaw_link'],AMBER)
box('Printed pan crosspiece',(0,0,.004),(.037,.044,.005),camlinks['camera_pan_yaw_link'],AMBER)
for sy in [-1,1]:box('Printed pan tilt cheek',(0,sy*.020,.019),(.032,.005,.035),camlinks['camera_pan_yaw_link'],AMBER)
vendor_mesh('xc330',camlinks['camera_tilt_link'],xyz=(0,0,-.014),rpy=(0,0,0))
box('Printed camera support',(0,0,.005),(.055,.030,.005),camlinks['realsense_holder_link'],AMBER)
camera=part('perception.camera.d435',parent=camlinks['camera_link']);camera.matrix_basis=Matrix.Identity(4)
v=runtime.find("link[@name='camera_link']/visual")
visual=empty('D435_mesh_origin','50_PERCEPTION',camera);visual.matrix_basis=transform(v.find('origin'))
# Blender 5 removed COLLADA; parse its triangle positions without external dependencies.
dae=ET.parse(ROOT/'references/meshes/realsense/d435.dae').getroot();ns={'c':'http://www.collada.org/2005/11/COLLADASchema'}
for gi,g in enumerate(dae.findall('.//c:geometry',ns)):
    me=g.find('c:mesh',ns);sources={s.get('id'):[float(x) for x in s.find('c:float_array',ns).text.split()] for s in me.findall('c:source',ns)}
    vertexmap={v.get('id'):v.find("c:input[@semantic='POSITION']",ns).get('source')[1:] for v in me.findall('c:vertices',ns)}
    for tri in me.findall('c:triangles',ns):
        inputs=tri.findall('c:input',ns);stride=max(int(x.get('offset','0')) for x in inputs)+1
        vi=next(x for x in inputs if x.get('semantic')=='VERTEX');data=sources[vertexmap[vi.get('source')[1:]]]
        verts=[data[i:i+3] for i in range(0,len(data),3)]
        ix=[int(x) for x in tri.find('c:p',ns).text.split()][int(vi.get('offset','0'))::stride]
        faces=[ix[i:i+3] for i in range(0,len(ix),3)]
        m=bpy.data.meshes.new('D435 source triangles');m.from_pydata(verts,[],faces);m.update()
        o=bpy.data.objects.new('D435_original_'+str(gi),m);collections['50_PERCEPTION'].objects.link(o);o.parent=visual;m.materials.append(AL)
        o['source_mesh']='references/meshes/realsense/d435.dae'
        for p in m.polygons:p.use_smooth=True
        if len(m.polygons)>5000:
            dec=o.modifiers.new('D435 web reduction','DECIMATE');dec.ratio=.3

holder=part('perception.lidar.holder',(.205,0,1.330))
box('Printed LiDAR base',(-.025,0,.003),(.110,.085,.006),holder,AMBER)
# Open wedge cheeks reproduce the photographed holder without inventing manufacturing holes.
for sy in [-1,1]:
    line('Printed wedge cheek',[(-.081,sy*.035,.008),(.002,sy*.035,.008),(.002,sy*.035,.012),(-.081,sy*.035,.060),(-.081,sy*.035,.008)],holder,AMBER,.004)
plate=box('Printed sloping LiDAR seat',(-.040,0,.037),(.086,.082,.006),holder,AMBER)
plate.rotation_euler.y=math.radians(30)
lidar=part('perception.lidar.mid360',(.165,0,1.370),(0,math.radians(30),0))
lidar['physical_transform']='Operator relative placement; photo-estimated xyz; 30deg from runtime, not surveyed'
lv=vendor_mesh('mid360',lidar,xyz=(0,0,.030),rpy=(math.pi/2,0,0))
lv.data.materials.append(GLASS)
for poly in lv.data.polygons:
    if sum(lv.data.vertices[i].co.y for i in poly.vertices)/len(poly.vertices)>.005:poly.material_index=1

carrier=part('lift.control.carrier',(.025,0,.300))
box('Printed common Lift base',(0,0,.004),(.180,.120,.008),carrier,AMBER)
for xx in [-.087,.087]:box('Printed common Lift side',(xx,0,.058),(.006,.120,.112),carrier,AMBER)
box('Printed electronics upper shelf',(0,0,.114),(.180,.120,.006),carrier,AMBER)
driver=part('lift.driver.azd_kd',(.065,0,.358))
box('AZD-KD enclosure',(0,0,0),(.035,.090,.100),driver,DARK)
box('AZD-KD metal rear',(0,-.047,0),(.038,.004,.112),driver,AL)
for z in [-.032,.025]:box('AZD terminal',(.020,0,z),(.008,.062,.022),driver,PCB)
label('AZD-KD',(0,-.0475,0),driver,.008,(math.pi/2,0,0))
elec=part('electrical.controllers',(0,0,FLOOR))
# BLVD units lie flat on the 300mm plate, as in IMG_0372.
for i,x,y in [(1,-.290,.160),(2,-.150,.160),(3,-.230,-.160)]:
    control=part('mobility.driver.'+str(i),(x,y,.324))
    box('BLVD-KRD enclosure '+str(i),(0,0,0),(.115,.073,.048),control,DARK)
    box('BLVD aluminium base',(0,0,-.021),(.126,.082,.006),control,STOCK_METAL)
    box('BLVD terminal',(0,-.041,-.002),(.073,.012,.020),control,PCB)
    label('BLVD-KRD ID '+str(i),(0,0,.025),control,.008)
pc=part('electrical.pc',(-.32,-.165,.5425))
box('NUC13ANH-B enclosure',(0,0,0),(.115,.112,.055),pc,DARK,.004)
for i in range(7):box('NUC vents',(-.043+i*.014,0,.028),(.004,.070,.001),pc,AL,0)
label('NUC',(0,0,.029),pc,.015)
stop=part('safety.estop',(-.33,.205,.521))
box('Estop mounting metal plate',(0,0,-.003),(.075,.068,.006),stop,AL)
cyl('E-stop flange',(0,0,.001),.023,.006,stop,DARK)
cyl('Red stop mushroom',(0,0,.013),.018,.019,stop,RED)
for tag,loc,size in [('arduino',(-.010,0,.428),(.0686,.0534,.0016)),('mosfet',(.074,.028,.428),(.048,.030,.0016)),('rs485',(.074,-.025,.428),(.044,.022,.0016))]:
    board=part('lift.control.'+tag,loc)
    box(tag+' PCB',(0,0,0),size,board,PCB,.001)
    for xx in [-size[0]/2+.004,size[0]/2-.004]:
        for yy in [-size[1]/2+.004,size[1]/2-.004]:cyl('PCB standoff',(xx,yy,-.007),.0025,.012,board,AL,vertices=12)
    if tag=='arduino':
        box('USB type B',(-.028,.011,.007),(.016,.012,.013),board,AL)
        box('DC socket',(-.030,-.015,.006),(.014,.010,.011),board,DARK)
        box('ATmega package',(.008,-.005,.003),(.032,.008,.004),board,DARK)
        for yy in [-.023,.023]:box('UNO pin header',(.006,yy,.004),(.043,.003,.007),board,DARK)
        label('UNO',(.015,.010,.0012),board,.007)
    else:
        box('Interface IC',(0,0,.003),(.015,.009,.005),board,DARK)
        for xx in [-size[0]/2+.006,size[0]/2-.006]:box('Screw terminal',(xx,0,.006),(.010,size[1]*.7,.010),board,BLUE)
        label('5V > 24V' if tag=='mosfet' else 'RS485',(0,0,.009),board,.004)
for side,y in [('left',.218),('right',-.218)]:
    for idx,x in enumerate([-.260,-.095],1):
        battery=part(f'electrical.battery.{side}{idx}',(x,y,.227))
        # Body envelope including terminals is exactly 150 x 65 x 92mm.
        box('IT12B-FP black case',(0,0,-.004),(.150,.065,.084),battery,DARK,.003)
        box('Battery top',(0,0,.036),(.150,.065,.006),battery,DARK,.001)
        for sx,material in [(-1,RED),(1,AL)]:box('Battery terminal',(sx*.058,-.018,.0425),(.018,.017,.007),battery,material,.001)
        box('Battery retention strap',(0,0,.040),(.014,.066,.002),battery,DARK)
        sy=1 if y>0 else -1
        label('AZ  IT12B-FP',(0,sy*.0326,-.004),battery,.012,(math.pi/2 if sy<0 else -math.pi/2,0,0))
        box('Battery metal support',(0,0,-.049),(.154,.071,.006),battery,AL)
        for xx in [-.065,.065]:box('Battery metal hanger',(xx,0,-.017),(.004,.071,.064),battery,AL)
cables=part('cables.main',(0,0,FLOOR))
line('Main vertical loom',[(.185,.13,.32-FLOOR),(.185,.13,.60-FLOOR),(.185,.13,1.26-FLOOR)],cables,DARK,.003)

# Default-hidden metrology helpers; measured planes retain unassigned structural names.
helpers=empty('helper__root','80_HELPERS')
for z in [.3,.515,.62,1.33]:
    line('helper__measured_plane_'+str(z),[(-.44,-.30,z),(.26,-.30,z),(.26,.30,z),(-.44,.30,z),(-.44,-.30,z)],helpers,BLUE,.0008)
line('helper__lift_stroke',[(.37,.10,1.005),(.37,.10,1.205)],helpers,BLUE,.002)
for o in collections['80_HELPERS'].objects:o.hide_render=True;o.hide_set(True)

DESIRED={
'robot.root':(0,0,0),'base.frame':(0,0,0),
'mobility.wheel.front_left':(.10,.32,0),'mobility.wheel.front_right':(.10,-.32,0),'mobility.wheel.rear':(-.32,0,0),
'mobility.drive_motor':(-.12,-.20,.06),'mobility.steer_motor':(0,.23,.20),
'lift.stage.eas':(-.26,0,.28),'arm.mount':(.28,.0,.38),'arm.so101':(.39,0,.52),'arm.camera.wrist':(.48,0,.52),
'perception.camera.pan_tilt':(.32,-.18,.06),'perception.camera.d435':(.48,-.18,.06),
'perception.lidar.mid360':(0,0,.34),'lift.driver.azd_kd':(-.16,-.38,.18),
'electrical.controllers':(-.32,.24,.10),'safety.estop':(-.20,-.3,.22),'cables.main':(0,0,0)}
DESIRED.update({'perception.lidar.holder':(0,0,.17),'electrical.pc':(-.20,-.32,.20),'lift.control.carrier':(-.26,.28,.16),'lift.driver.azd_kd':(-.26,.28,.16)})
for side,sgn in [('left',1),('right',-1)]:
    for idx in [1,2]:DESIRED[f'electrical.battery.{side}{idx}']=(-.10,sgn*.30,-.04)
def ancestor_component(o):
    while o:
        if o.name.startswith('part__'):return o.name[6:]
        o=o.parent
    return None
def vecg(v):return [v[0],v[2],-v[1]]
bpy.context.view_layer.update()
for cid,o in N.items():
    c=PARTS[cid];p=ancestor_component(o.parent)
    DESIRED.setdefault(cid,DESIRED.get(p,(-.18,.18,.12)))
    relative=Vector(DESIRED[cid])-Vector(DESIRED.get(p,(0,0,0)))
    delta=o.parent.matrix_world.to_3x3().inverted()@relative if o.parent else relative
    c['assembly_transform']={'space':'Blender local parent','translation_m':list(o.location),'quaternion_wxyz':list(o.rotation_euler.to_quaternion()),'world_floor_xyz_m':list(o.matrix_world.translation)}
    c['exploded_offset']=list(DESIRED[cid]);c['exploded_offset_parent_gltf_m']=vecg(delta)
    c['explode_group']=c['interaction_group'];c['pivot_type']=o.get('pivot_type','fixed');c['node_name']=o.name
    c['geometry_status']='source-mesh' if cid in ['arm.so101','perception.camera.d435'] else c['geometry_status']
    c.setdefault('geometry_note','照片估算外形。')
    c.setdefault('installation_status','操作员相对位置 / 照片估算')
    o['assembly_translation_m']=list(o.location);o['exploded_offset_local_m']=list(delta)
    start=o.location.copy();o.keyframe_insert(data_path='location',frame=1)
    o.location=start+delta;o.keyframe_insert(data_path='location',frame=90);o.location=start
scene.frame_set(1)
scene.frame_end=90
scene.timeline_markers.new('ASSEMBLED',frame=1);scene.timeline_markers.new('EXPLODED — presentation only',frame=90)
DATA['schema_version']=2
DATA['build']={'version':'v003','date':'2026-09-20','lift_default_mm':100,'arm_pose':'see_front / captured 2026-09-02','pose_source':'references/runtime-config/arm_real_dashboard_test.yaml','glb_convention':'right-handed Y-up; ROS (x,y,z) -> glTF (x,z,-y)','geometry_level':'v003 official ROBOTIS / Livox CAD, source SO101 / D435; drawing/photo reconstruction elsewhere','runtime_only':False}
DATA['arm_joints']=[{'node':o.name,'name':o['joint_name'],'pose_rad':o['pose_rad'],'rest_quaternion_wxyz':list(o['rest_quaternion_wxyz'])} for o in joints]
(ROOT/'data/components.json').write_text(json.dumps(DATA,ensure_ascii=False,indent=2))

for o in scene.objects:
    if o.type=='MESH' and o.data.materials:
        o['material_class']='printed' if o.data.materials[0]==AMBER else 'printed-arm' if o.data.materials[0]==TEAL else 'device-or-metal'

# Photographic studio and repeatable cameras (excluded from GLB).
floor=box('Studio ground',(0,0,-.025),(200,200,.04),None,WHITE,0)
def point_at(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
for name,loc,power,size in [('Key',(3,-4,6),800,5),('Fill',(-3,-2,3),500,4),('Rim',(1,3,5),650,3)]:
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);collections['STUDIO'].objects.link(o);o.location=loc;point_at(o,(0,0,.8))
def cam(name,loc,target,scale):
    d=bpy.data.cameras.new(name);d.type='ORTHO';d.ortho_scale=scale
    o=bpy.data.objects.new(name,d);collections['STUDIO'].objects.link(o);o.location=loc;point_at(o,target);return o
assembled=cam('assembled_isometric',(3,-4,2.9),(0,0,.84),2.05)
exploded=cam('exploded_isometric',(3,-4,2.9),(0,0,.90),2.65)
detail=cam('arm_perception_detail',(3,-4,2.9),(.29,0,1.07),.95)
scene.camera=assembled
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_distance=2.4
            area.spaces.active.region_3d.view_location=(0,0,.8)
            area.spaces.active.region_3d.view_rotation=assembled.rotation_euler.to_quaternion()
            area.spaces.active.shading.color_type='MATERIAL'
            area.spaces.active.clip_end=100
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/robot_master_v003.blend'))

# Export only the semantic robot tree, in metre units, without presentation animation.
bpy.ops.object.select_all(action='DESELECT')
for o in [root]+list(root.children_recursive):o.select_set(True)
glb=ROOT/'web/robot_web.glb'
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_yup=True,export_apply=True)
for o in scene.objects:
    if o.type=='MESH' and o.select_get() and len(o.data.polygons)>300:
        m=o.modifiers.new('Mobile LOD','DECIMATE');m.ratio=.35
bpy.ops.export_scene.gltf(filepath=str(ROOT/'web/robot_web_lod1.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_yup=True,export_apply=True)
for o in scene.objects:
    if o.type=='MESH' and 'Mobile LOD' in o.modifiers:o.modifiers.remove(o.modifiers['Mobile LOD'])
manifest={'version':'v003','blender_version':bpy.app.version_string,'source_blend':'blender/robot_master_v003.blend','export_date':'2026-09-20','schema_version':2,'coordinates':'glTF Y-up metres; Blender ROS Z-up metres','files':{}}
for f in [glb,ROOT/'web/robot_web_lod1.glb',ROOT/'data/components.json']:
    manifest['files'][str(f.relative_to(ROOT))]={'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
(ROOT/'web/export-manifest.json').write_text(json.dumps(manifest,indent=2))
for name,camera,frame_num in [('assembled',assembled,1),('exploded',exploded,90),('arm-detail',detail,1)]:
    scene.frame_set(frame_num);scene.camera=camera
    cables.hide_render=(frame_num==90)
    for o in cables.children_recursive:o.hide_render=(frame_num==90)
    scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
scene.frame_set(1);scene.camera=assembled
print('BUILD_COMPLETE',len(N),'components')
