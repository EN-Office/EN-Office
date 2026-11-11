"""Deal Tamers mockup: procedural GLB models (企業獣・建物・小物).

Run:  python3 tools/blender/build_models.py           (pip install bpy)
  or  blender --background --python tools/blender/build_models.py

Writes mockup/assets/models/*.glb and regenerates mockup/assets/models.js
(base64 copies so the mockup also works from file://).

Conventions (Blender is Z-up / front = -Y; the glTF exporter turns that into
Y-up / front = +Z):
  * origin = ground centre, beasts ~1 unit tall, buildings ~1x1 footprint
  * beasts: root `beast_<key>` > `Body`, `Eye_L`, `Eye_R`, `Mouth_smile|worry|o`
  * buildings: top-level `Base` (h 0.5), `Floor` (h 0.35), `Roof`, each origin at
    its own bottom centre; stacked Base/Floor/Roof in the file (= level 2)
"""
import base64
import math
import os
import sys

import bpy  # noqa: I001  (bpy must be imported before bmesh/mathutils)
import bmesh
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'mockup', 'assets', 'models')
JS = os.path.join(ROOT, 'mockup', 'assets', 'models.js')

# ---------------------------------------------------------------- palette
# (same values as mockup/js/core.js B{} and mockup/js/state.js CO{})
BEASTS = {
    'machi':    dict(c='#f0a14a', d='#c76d14', horn='gear',  belly='#ffe2b8'),
    'hayate':   dict(c='#8fb5ff', d='#4f78c9', horn='ear',   belly='#e1ebff'),
    'misemori': dict(c='#ef6b5b', d='#b8473a', horn='cap',   belly='#ffd6cf'),
    'pan':      dict(c='#ffd29a', d='#d39a52', horn='none',  belly='#fff3de'),
    'it':       dict(c='#b48cff', d='#7b55c9', horn='spike', belly='#eadcff'),
    'seed':     dict(c='#5fc192', d='#3f9a70', horn='leaf',  belly='#d7f3e5'),
    'oyaji':    dict(c='#c9a27a', d='#8e6c48', horn='none',  belly='#f1e2d0', oyaji=True),
}
CO = {
    'pan':    dict(wall='#ffe2b8', side='#e8b878', roof='#ef6b5b'),
    'hayate': dict(wall='#d9e6ff', side='#9fb8ea', roof='#4f78c9'),
    'it':     dict(wall='#eadcff', side='#b9a0e8', roof='#7b55c9'),
    'machi':  dict(wall='#ffd9a8', side='#e0a35e', roof='#c76d14'),
}
INK = '#16251f'
CREAM = '#f6efe2'
WIN = '#ffe7a3'
WOOD = '#8e6c48'
AMBER = '#f0a14a'


# ---------------------------------------------------------------- helpers
def lin(h):
    h = h.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return out


def mix(a, b, t):
    a, b = a.lstrip('#'), b.lstrip('#')
    r = [round(int(a[i:i + 2], 16) * (1 - t) + int(b[i:i + 2], 16) * t) for i in (0, 2, 4)]
    return '#%02x%02x%02x' % tuple(r)


_MATS = {}
PARTS = []


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _MATS.clear()
    PARTS.clear()


def mat(hexc, rough=0.6, metal=0.0, emit=None, strength=1.0):
    key = (hexc, rough, metal, emit, strength)
    if key in _MATS:
        return _MATS[key]
    m = bpy.data.materials.new('m_%s%s' % (hexc.lstrip('#'), '_e' if emit else ''))
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*lin(hexc), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*lin(emit), 1)
        b.inputs['Emission Strength'].default_value = strength
    m.diffuse_color = (*lin(hexc), 1)
    _MATS[key] = m
    return m


def shade(me, angle):
    """angle=None: all smooth. angle=0: flat. else: sharp above angle (deg)."""
    bm = bmesh.new()
    bm.from_mesh(me)
    for f in bm.faces:
        f.smooth = angle != 0
    if angle:
        lim = math.radians(angle)
        for e in bm.edges:
            if len(e.link_faces) == 2 and e.calc_face_angle(0) > lim:
                e.smooth = False
    bm.to_mesh(me)
    bm.free()


def bake(o, sh=None):
    """Apply modifiers + shading."""
    if o.modifiers:
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        o.modifiers.clear()
        o.data = me
    shade(o.data, sh)
    return o


def _add(o, m, loc, rot, scale, sh):
    o.location = loc
    if rot is not None:
        if len(rot) == 4:
            o.rotation_mode = 'QUATERNION'
            o.rotation_quaternion = rot
        else:
            o.rotation_euler = rot
    o.scale = scale
    if m is not None:
        o.data.materials.clear()
        o.data.materials.append(m)
    bake(o, sh)
    PARTS.append(o)
    return o


def sphere(m, loc=(0, 0, 0), scale=(1, 1, 1), r=1.0, seg=24, rings=12, rot=None, sh=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r)
    return _add(bpy.context.active_object, m, loc, rot, scale, sh)


def cyl(m, r, depth, loc=(0, 0, 0), rot=None, scale=(1, 1, 1), verts=24, sh=40, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth)
    o = bpy.context.active_object
    if bevel:
        bv = o.modifiers.new('bv', 'BEVEL')
        bv.width = bevel
        bv.segments = 2
        bv.limit_method = 'ANGLE'
    return _add(o, m, loc, rot, scale, sh)


def cone(m, r1, r2, depth, loc=(0, 0, 0), rot=None, scale=(1, 1, 1), verts=20, sh=50):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth)
    return _add(bpy.context.active_object, m, loc, rot, scale, sh)


def torus(m, R, r, loc=(0, 0, 0), rot=None, scale=(1, 1, 1), seg=24, mseg=8):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r,
                                     major_segments=seg, minor_segments=mseg)
    return _add(bpy.context.active_object, m, loc, rot, scale, None)


def box(m, size, loc=(0, 0, 0), rot=None, bevel=0.02, seg=2):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.data.transform(Matrix.Diagonal((size[0], size[1], size[2], 1)))
    if bevel:
        bv = o.modifiers.new('bv', 'BEVEL')
        bv.width = min(bevel, min(size) * 0.45)
        bv.segments = seg
        bv.limit_method = 'NONE'
    return _add(o, m, loc, rot, (1, 1, 1), 35 if bevel else 0)


def prism(m, pts2d, x0, x1, sh=35, bevel=0.0):
    """Extrude a YZ polygon (list of (y,z)) along X from x0 to x1."""
    me = bpy.data.meshes.new('prism')
    bm = bmesh.new()
    a = [bm.verts.new((x0, y, z)) for y, z in pts2d]
    b = [bm.verts.new((x1, y, z)) for y, z in pts2d]
    n = len(pts2d)
    bm.faces.new(list(reversed(a)))
    bm.faces.new(b)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('prism', me)
    bpy.context.scene.collection.objects.link(o)
    if bevel:
        bv = o.modifiers.new('bv', 'BEVEL')
        bv.width = bevel
        bv.segments = 2
    return _add(o, m, (0, 0, 0), None, (1, 1, 1), sh)


def extrude_poly(m, pts2d, depth, loc=(0, 0, 0), rot=None, sh=30):
    """Flat XZ polygon (list of (x,z)) extruded along Y (centred)."""
    me = bpy.data.meshes.new('poly')
    bm = bmesh.new()
    vs = [bm.verts.new((x, -depth / 2, z)) for x, z in pts2d]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    nv = [g for g in r['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=nv, vec=(0, depth, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('poly', me)
    bpy.context.scene.collection.objects.link(o)
    return _add(o, m, loc, rot, (1, 1, 1), sh)


def tube(m, pts, r, res=3, caps=True):
    """Rounded tube along points (bezier, auto handles) with ball caps."""
    cu = bpy.data.curves.new('tube', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = 1
    cu.resolution_u = res
    cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    co = bpy.data.objects.new('tubec', cu)
    bpy.context.scene.collection.objects.link(co)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(co.evaluated_get(dg))
    bpy.data.objects.remove(co)
    o = bpy.data.objects.new('tube', me)
    bpy.context.scene.collection.objects.link(o)
    _add(o, m, (0, 0, 0), None, (1, 1, 1), None)
    out = [o]
    if caps:
        for p in (pts[0], pts[-1]):
            out.append(sphere(m, p, r=r, seg=10, rings=6))
    return out


def take():
    out = list(PARTS)
    PARTS.clear()
    return out


def join(objs, name, origin=(0, 0, 0)):
    objs = [o for o in objs if o is not None]
    ids = {o.as_pointer() for o in objs}
    PARTS[:] = [o for o in PARTS if o.as_pointer() not in ids]
    a = objs[0]
    if len(objs) > 1:
        with bpy.context.temp_override(active_object=a, object=a, selected_objects=objs,
                                       selected_editable_objects=objs):
            bpy.ops.object.join()
    # freeze transform, put origin at `origin`
    a.data.transform(a.matrix_basis)
    a.matrix_basis = Matrix.Identity(4)
    a.data.transform(Matrix.Translation(-Vector(origin)))
    a.location = origin
    a.name = name
    a.data.name = name
    bpy.context.view_layer.update()
    return a


def parent(child, par):
    bpy.context.view_layer.update()
    mw = child.matrix_world.copy()
    child.parent = par
    child.matrix_world = mw


def rot_z(objs, ang):
    R = Matrix.Rotation(ang, 4, 'Z')
    for o in objs:
        o.matrix_world = R @ o.matrix_world


def facing(n):
    """Quaternion turning local -Y to direction n."""
    return Vector((0, -1, 0)).rotation_difference(Vector(n).normalized())


def surf(objs, x, z, push=0.0):
    """Front surface point (ray along +Y) and normal on the given objects."""
    bpy.context.view_layer.update()
    best = None
    for ob in objs:
        mw = ob.matrix_world
        inv = mw.inverted()
        o = inv @ Vector((x, -5, z))
        d = (inv.to_3x3() @ Vector((0, 1, 0))).normalized()
        ok, loc, nrm, _ = ob.ray_cast(o, d)
        if ok:
            p = mw @ loc
            n = (inv.to_3x3().transposed() @ nrm).normalized()
            if best is None or p.y < best[0].y:
                best = (p, n)
    if best is None:
        return Vector((x, 0, z)), Vector((0, -1, 0))
    p, n = best
    return p + n * push, n


def export(name):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name + '.glb')
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', export_yup=True, export_apply=True,
        export_texcoords=False, export_normals=True, export_materials='EXPORT',
        export_cameras=False, export_lights=False, export_animations=False,
        export_draco_mesh_compression_enable=False, use_visible=False,
        export_extras=False)
    print('  %-14s %6.1f KB' % (name, os.path.getsize(path) / 1024))
    return path


def root_empty(name):
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    return e


# ---------------------------------------------------------------- beasts
def eye(objs, x, z, r, white, ink, name, pupil_dx=0.0):
    p, n = surf(objs, x, z)
    q = facing(n)
    wq = sphere(white, p - n * 0.004, (r, r * 0.45, r), rot=q, seg=18, rings=9)
    up = Vector((0, 0, 1))
    side = n.cross(up).normalized()  # points to the beast's right/left
    pc = p + n * (r * 0.4) + Vector((pupil_dx, 0, -r * 0.06))
    pu = sphere(ink, pc, (r * 0.58, r * 0.2, r * 0.64), rot=q, seg=16, rings=8)
    hl = sphere(mat('#ffffff', 0.3, emit='#ffffff', strength=0.6),
                pc + n * (r * 0.1) + Vector((r * 0.2, 0, r * 0.24)) - side * 0,
                (r * 0.2, r * 0.1, r * 0.2), rot=q, seg=8, rings=5)
    return join([wq, pu, hl], name, origin=tuple(p))


def mouth_set(objs, zc, ink, w=0.085, depth=0.042, r=0.017):
    out = {}
    for mood in ('smile', 'worry', 'o'):
        if mood == 'o':
            p, n = surf(objs, 0, zc - depth * 0.6, push=0.004)
            o = sphere(ink, p, (0.04, 0.018, 0.05), rot=facing(n), seg=14, rings=8)
            out[mood] = join([o], 'Mouth_o', origin=tuple(p))
            continue
        pts = []
        for i in range(7):
            t = -1 + 2 * i / 6
            dz = -depth * (1 - t * t) if mood == 'smile' else -depth * 0.85 * (t * t)
            p, n = surf(objs, t * w, zc + dz, push=r * 0.6)
            pts.append(tuple(p))
        parts = tube(ink, pts, r)
        c, _ = surf(objs, 0, zc)
        out[mood] = join(parts, 'Mouth_' + mood, origin=tuple(c))
    return out


def build_beast(key, c, d, horn, belly, oyaji=False):
    reset()
    C, D = mat(c), mat(d)
    BL = mat(mix(c, belly, 0.62))
    W = mat('#ffffff', 0.35)
    K = mat(INK, 0.35)
    CX, CY, CZ, Z0 = 0.40, 0.355, 0.37, 0.40

    body = sphere(C, (0, 0, Z0), (CX, CY, CZ), seg=40, rings=22)
    # soft "mochi" deformation: heavier bottom, slightly flat seat
    me = body.data
    for v in me.vertices:
        z = v.co.z
        if z < 0:
            k = 1 + 0.07 * math.sin(-z * math.pi * 0.9)
            v.co.x *= k
            v.co.y *= k
        if z < -0.8:
            v.co.z = -0.8 + (z + 0.8) * 0.45
        if z > 0.6:
            v.co.z = 0.6 + (z - 0.6) * 0.9
    bump = sphere(BL, (0, -0.2, 0.245), (0.235, 0.17, 0.175), seg=36, rings=18)
    face = [body, bump]
    # feet
    for sx in (-1, 1):
        sphere(D, (sx * 0.19, -0.13, 0.055), (0.085, 0.11, 0.06), seg=18, rings=9)

    ex, ez, er = 0.14, 0.505, 0.112
    eyes = [eye(face, -ex, ez, er, W, K, 'Eye_R', 0.008), eye(face, ex, ez, er, W, K, 'Eye_L', -0.008)]
    # blush (tiny, toy-like)
    for sx in (-1, 1):
        p, n = surf(face, sx * 0.24, 0.40)
        sphere(mat(mix(c, '#ff7a7a', 0.45), 0.7), p - n * 0.004, (0.05, 0.012, 0.03), rot=facing(n),
               seg=12, rings=6)

    mz = 0.40 if not oyaji else 0.345
    mouths = mouth_set(face, mz, K)

    # horns
    top = Z0 + CZ * 0.96
    if horn == 'spike':
        for sx in (-1, 1):
            a = sx * math.radians(16)
            base = Vector((sx * 0.17, 0.0, top - 0.09))
            dirv = Vector((math.sin(a), 0, math.cos(a)))
            cone(C, 0.085, 0.012, 0.27, tuple(base + dirv * 0.135), rot=(0, a, 0), verts=24, sh=None)
            sphere(C, tuple(base + dirv * 0.27), r=0.016, seg=10, rings=6)
    elif horn == 'ear':
        for sx in (-1, 1):
            a = sx * math.radians(12)
            sphere(C, (sx * 0.2, 0.02, top + 0.06), (0.062, 0.05, 0.19), rot=(0, a, 0), seg=20, rings=12)
            sphere(BL, (sx * 0.2 + sx * 0.012, -0.022, top + 0.08), (0.034, 0.03, 0.13), rot=(0, a, 0),
                   seg=16, rings=10)
    elif horn == 'gear':
        gz = top + 0.11
        torus(D, 0.085, 0.032, (0, 0.0, gz), rot=(math.pi / 2, 0, 0), seg=28, mseg=10)
        for i in range(8):
            a = i * math.pi / 4 + math.pi / 8
            box(D, (0.05, 0.06, 0.05), (math.cos(a) * 0.125, 0, gz + math.sin(a) * 0.125),
                rot=(0, -a, 0), bevel=0.012, seg=1)
        cyl(mat(mix(d, '#000000', 0.15)), 0.03, 0.07, (0, 0, gz), rot=(math.pi / 2, 0, 0), verts=16,
            sh=40, bevel=0.008)
    elif horn == 'leaf':
        G1, G2 = mat('#3f9a70'), mat('#7fd3a8')
        stem = (0, 0, top + 0.02)
        cyl(G1, 0.016, 0.1, (0, 0, top + 0.04), verts=10)
        for sx, col, ang, ln in ((-1, G2, 50, 0.15), (1, G1, 28, 0.13)):
            a = math.radians(ang)
            dirv = Vector((sx * math.cos(a), 0, math.sin(a)))
            ctr = Vector((0, 0, top + 0.08)) + dirv * ln
            sphere(col, tuple(ctr), (ln, 0.028, ln * 0.45), rot=(0, -sx * a, 0), seg=20, rings=10)
    elif horn == 'cap':
        cz = Z0 + 0.235
        sphere(D, (0, 0.03, cz), (0.355, 0.335, 0.235), seg=32, rings=16)
        sphere(D, (0, 0.03, cz + 0.235), r=0.03, seg=10, rings=6)
        bz = cz + 0.005
        cyl(mat(mix(d, '#000000', 0.12)), 0.2, 0.028, (0, -0.35, bz), rot=(math.radians(-12), 0, 0), scale=(1.05, 0.75, 1), verts=28,
            bevel=0.008)
    if oyaji:
        WH = mat(CREAM, 0.7)
        for sx in (-1, 1):
            p, n = surf(face, sx * 0.135, 0.635, push=0.01)
            sphere(WH, p, (0.075, 0.03, 0.026), rot=facing(n), seg=14, rings=8)
        for sx in (-1, 1):
            p, n = surf(face, sx * 0.07, 0.425, push=0.016)
            a = sx * math.radians(-18)
            sphere(WH, p, (0.085, 0.04, 0.042), rot=facing(n) @ _yrot(a), seg=16, rings=8)
            p2, n2 = surf(face, sx * 0.145, 0.405, push=0.012)
            sphere(WH, p2, (0.045, 0.03, 0.032), rot=facing(n2) @ _yrot(sx * math.radians(-35)), seg=12, rings=6)

    # join body parts (excluding eyes + mouths which are already joined & removed from PARTS)
    rest = take()
    bodyj = join(rest, 'Body')
    root = root_empty('beast_' + key)
    for o in [bodyj] + eyes + list(mouths.values()):
        parent(o, root)
    # default mood
    for k, o in mouths.items():
        o.hide_set(k != 'smile')
    export('beast_' + key)


# ---------------------------------------------------------------- owl (Minato)
def build_owl():
    reset()
    T, TD = mat('#2f5e6e'), mat('#1d3a46')
    CR = mat(CREAM, 0.7)
    A = mat(AMBER, 0.4, metal=0.1)
    AD = mat('#c76d14', 0.5)
    K = mat(INK, 0.35)
    body = sphere(T, (0, 0, 0.43), (0.34, 0.31, 0.42), seg=36, rings=18)
    for v in body.data.vertices:
        if v.co.z < -0.82:
            v.co.z = -0.82 + (v.co.z + 0.82) * 0.4
    bel = sphere(CR, (0, -0.17, 0.30), (0.23, 0.16, 0.22), seg=28, rings=14)
    face = [body, bel]
    # ear tufts
    for sx in (-1, 1):
        a = sx * math.radians(24)
        cone(T, 0.08, 0.01, 0.2, (sx * 0.2, 0.02, 0.84), rot=(0, a, 0), verts=4, sh=None,
             scale=(1, 0.6, 1))
    # wings
    for sx in (-1, 1):
        sphere(TD, (sx * 0.31, 0.03, 0.40), (0.075, 0.2, 0.25), rot=(0, sx * math.radians(-12), 0),
               seg=20, rings=10)
    # face discs, eyes, glasses
    eyes = []
    for sx, nm in ((-1, 'Eye_R'), (1, 'Eye_L')):
        p, n = surf(face, sx * 0.125, 0.585)
        q = facing(n)
        sphere(CR, p - n * 0.015, (0.125, 0.045, 0.125), rot=q, seg=24, rings=10)
        pc = p + n * 0.03
        pu = sphere(K, pc, (0.055, 0.025, 0.058), rot=q, seg=16, rings=8)
        hl = sphere(mat('#ffffff', 0.3, emit='#ffffff', strength=0.6), pc + n * 0.02 + Vector((0.018, 0, 0.022)),
                    (0.014, 0.008, 0.014), rot=q, seg=8, rings=5)
        eyes.append(join([pu, hl], nm, origin=tuple(pc)))
        torus(A, 0.13, 0.017, tuple(p + n * 0.05), rot=facing(n) @ _xrot(), seg=32, mseg=8)
    pl, _ = surf(face, -0.01, 0.6, push=0.05)
    cyl(A, 0.012, 0.05, tuple(pl), rot=(0, math.pi / 2, 0), verts=8)
    # beak
    p, n = surf(face, 0, 0.47, push=0.0)
    cone(A, 0.05, 0.005, 0.11, tuple(p + n * 0.03 + Vector((0, 0, -0.01))),
         rot=facing(n) @ _xrot(-1), verts=12, sh=None, scale=(1, 0.8, 1))
    # chest chevron (like the 2D mark)
    pts = [tuple(surf(face, x, z, push=0.008)[0]) for x, z in ((-0.08, 0.26), (0, 0.2), (0.08, 0.26))]
    tube(AD, pts, 0.014)
    # feet
    for sx in (-1, 1):
        for t in (-1, 0, 1):
            sphere(A, (sx * 0.12 + t * 0.035, -0.25, 0.03), (0.022, 0.06, 0.03), rot=(0, 0, t * 0.3),
                   seg=10, rings=6)
    rest = take()
    bodyj = join(rest, 'Body')
    root = root_empty('owl')
    for o in [bodyj] + eyes:
        parent(o, root)
    export('owl')


def _yrot(a):
    """Rotation about local Y (the facing axis): tilts a face decal in its plane."""
    from mathutils import Quaternion
    return Quaternion((0, 1, 0), a)


def _xrot(sign=1):
    """Quaternion: rotate local +Z (torus/cone axis) onto local -Y."""
    return Vector((0, 0, 1)).rotation_difference(Vector((0, -sign, 0)) if sign == 1 else Vector((0, -1, 0)))


# ---------------------------------------------------------------- props
def build_trees():
    reset()
    TR = mat(WOOD)
    cyl(TR, 0.055, 0.24, (0, 0, 0.12), verts=12, bevel=0.01)
    for z, r, h, col in ((0.16, 0.36, 0.36, '#3f9a70'), (0.38, 0.29, 0.31, '#4fae80'), (0.58, 0.2, 0.28, '#5fc192')):
        cone(mat(col), r, 0.035, h, (0, 0, z + h / 2), verts=12, sh=None)
        torus(mat(col), r * 0.93, 0.03, (0, 0, z + 0.02), seg=12, mseg=6)
    sphere(mat('#5fc192'), (0, 0, 0.88), r=0.04, seg=10, rings=6)
    join(take(), 'Tree')
    export('tree_pine')

    reset()
    TR = mat(WOOD)
    cyl(TR, 0.06, 0.4, (0, 0, 0.2), verts=12, bevel=0.01)
    G1, G2 = mat('#5fc192'), mat('#4fae80')
    sphere(G1, (0, 0, 0.6), r=0.3, seg=24, rings=12)
    sphere(G2, (-0.17, 0.05, 0.47), r=0.19, seg=18, rings=9)
    sphere(G1, (0.16, -0.06, 0.50), r=0.2, seg=18, rings=9)
    sphere(mat('#7fd3a8'), (0.05, -0.12, 0.76), r=0.14, seg=16, rings=8)
    join(take(), 'Tree')
    export('tree_round')


def build_coin():
    reset()
    GO = mat('#f5c542', 0.32, metal=0.55)
    GD = mat('#e0a92e', 0.38, metal=0.55)
    R, Z = 0.3, 0.31
    rx = (math.pi / 2, 0, 0)
    cyl(GD, R - 0.01, 0.07, (0, 0, Z), rot=rx, verts=36, bevel=0.0)
    torus(GO, R - 0.025, 0.04, (0, 0, Z), rot=rx, seg=36, mseg=10)
    # embossed star on both faces
    pts = []
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5
        rr = 0.17 if i % 2 == 0 else 0.075
        pts.append((math.cos(a) * rr, Z + math.sin(a) * rr))
    o = extrude_poly(GO, pts, 0.1, sh=30)
    bv = o.modifiers.new('bv', 'BEVEL')
    bv.width = 0.008
    bv.segments = 1
    bake(o, 30)
    join(take(), 'Coin', origin=(0, 0, 0))
    export('coin')


def build_slot():
    reset()
    A = mat(AMBER, 0.45)
    CRm = mat(CREAM, 0.6)
    torus(A, 0.36, 0.03, (0, 0, 0.03), scale=(1, 1, 0.6), seg=36, mseg=8)
    cyl(mat(CREAM, 0.7), 0.34, 0.02, (0, 0, 0.01), verts=36)
    box(A, (0.3, 0.085, 0.09), (0, 0, 0.065), bevel=0.03, seg=3)
    box(A, (0.085, 0.3, 0.09), (0, 0, 0.065), bevel=0.03, seg=3)
    _ = CRm
    join(take(), 'Slot')
    export('flag_slot')


# ---------------------------------------------------------------- buildings
WW = 0.86   # wall width
HB, HF = 0.5, 0.35


def _mesh_obj(name, verts, faces):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


def pane(m, w, h, loc):
    """Front-facing quad (only the front of a window pane is ever seen)."""
    x, y, z = loc
    o = _mesh_obj('pane', [(x - w / 2, y, z - h / 2), (x + w / 2, y, z - h / 2),
                           (x + w / 2, y, z + h / 2), (x - w / 2, y, z + h / 2)], [(0, 1, 2, 3)])
    return _add(o, m, (0, 0, 0), None, (1, 1, 1), 0)


def frame_ring(m, w, h, t, d, loc):
    """Rectangular window frame (front + inner/outer sides, no back), light on vertices."""
    x, y, z = loc
    ow, oh, iw, ih = w / 2 + t, h / 2 + t, w / 2, h / 2
    rect = lambda a, b: [(-a, -b), (a, -b), (a, b), (-a, b)]  # noqa: E731
    vs = []
    for (rx, rz) in rect(ow, oh):
        vs.append((x + rx, y - d, z + rz))
    for (rx, rz) in rect(iw, ih):
        vs.append((x + rx, y - d, z + rz))
    for (rx, rz) in rect(ow, oh):
        vs.append((x + rx, y, z + rz))
    for (rx, rz) in rect(iw, ih):
        vs.append((x + rx, y, z + rz))
    f = []
    for i in range(4):
        j = (i + 1) % 4
        f.append((i, j, 4 + j, 4 + i))              # front ring
        f.append((8 + i, 8 + j, j, i))              # outer side
        f.append((4 + i, 4 + j, 12 + j, 12 + i))    # inner side
    o = _mesh_obj('frame', vs, f)
    return _add(o, m, (0, 0, 0), None, (1, 1, 1), 0)


def windows_face(Wm, Fm, xs, zc, w, h, mullion=True, depth=WW / 2):
    """Front-face windows (y=-depth) with frame + sill; caller rotates."""
    y = -depth
    for x in xs:
        t = 0.024
        pane(Wm, w, h, (x, y - 0.006, zc))
        frame_ring(Fm, w, h, t, 0.03, (x, y, zc))
        box(Fm, (w + 2 * t + 0.02, 0.05, t * 1.1), (x, y - 0.015, zc - h / 2 - t * 0.55), bevel=0)
        if mullion:
            box(Fm, (0.014, 0.03, h), (x, y - 0.006, zc), bevel=0)


def all_sides(fn, sides=(0, 1, 2, 3)):
    for s in sides:
        before = list(PARTS)
        fn()
        new = [o for o in PARTS if o not in before]
        rot_z(new, s * math.pi / 2)


def build_building(key):
    reset()
    c = CO[key]
    Wm, Sm, Rm = mat(c['wall'], 0.7), mat(c['side'], 0.65), mat(c['roof'], 0.55)
    Em = mat(WIN, 0.5, emit=WIN, strength=1.3)
    Dk = mat(mix(c['roof'], '#16251f', 0.45), 0.6)
    Wd = mat(WOOD, 0.65)
    Gl = mat('#a9d8ff', 0.15, metal=0.1, emit='#7fbfff', strength=0.25)

    # ============ BASE (0..0.5)
    box(Sm, (0.96, 0.96, 0.05), (0, 0, 0.025), bevel=0.02)
    box(Wm, (WW, WW, HB - 0.05), (0, 0, 0.05 + (HB - 0.05) / 2), bevel=0.03, seg=3)
    box(Sm, (WW + 0.03, WW + 0.03, 0.035), (0, 0, HB - 0.02), bevel=0.012)
    fy = -WW / 2
    if key == 'pan':
        # door
        box(Wd, (0.17, 0.03, 0.27), (0.18, fy - 0.006, 0.05 + 0.135), bevel=0.01)
        box(Em, (0.1, 0.02, 0.08), (0.18, fy - 0.016, 0.25), bevel=0)
        sphere(mat('#f5c542', 0.3, metal=0.5), (0.24, fy - 0.03, 0.17), r=0.014, seg=8, rings=5)
        # shop window
        windows_face(Em, Sm, [-0.14], 0.21, 0.26, 0.17)
        # striped awning
        n = 7
        wdt = 0.66 / n
        for i in range(n):
            m = Rm if i % 2 == 0 else mat(CREAM, 0.7)
            x = -0.33 + wdt * (i + 0.5)
            box(m, (wdt, 0.2, 0.025), (x, fy - 0.09, 0.39), rot=(math.radians(-24), 0, 0), bevel=0)
            sphere(m, (x, fy - 0.185, 0.345), (wdt / 2, 0.03, 0.035), seg=12, rings=6)
        # bread sign (on the awning)
        box(Wd, (0.3, 0.03, 0.08), (0, fy - 0.01, 0.445), bevel=0.012)
        loaf = mat('#d39a52', 0.6)
        sphere(loaf, (0, fy - 0.04, 0.45), (0.11, 0.045, 0.05), seg=18, rings=9)
        for dx in (-0.05, 0, 0.05):
            box(mat('#fff3de', 0.7), (0.012, 0.02, 0.05), (dx, fy - 0.08, 0.465), rot=(0, math.radians(25), 0),
                bevel=0)
        # side windows
        all_sides(lambda: windows_face(Em, Sm, [0], 0.25, 0.18, 0.16), sides=(1, 2, 3))
        # planters
        for x in (-0.34,):
            box(Wd, (0.14, 0.08, 0.06), (x + 0.05, fy - 0.06, 0.08), bevel=0.012)
            sphere(mat('#5fc192'), (x + 0.05, fy - 0.06, 0.12), (0.07, 0.045, 0.045), seg=12, rings=6)
    elif key == 'hayate':
        # garage door (slats)
        box(Dk, (0.42, 0.02, 0.33), (-0.12, fy - 0.004, 0.05 + 0.165), bevel=0)
        for i in range(5):
            box(Sm, (0.38, 0.03, 0.05), (-0.12, fy - 0.012, 0.085 + i * 0.062), bevel=0.01, seg=1)
        box(Rm, (0.48, 0.05, 0.035), (-0.12, fy - 0.02, 0.4), bevel=0.012)
        # side door + window
        box(Rm, (0.13, 0.03, 0.24), (0.27, fy - 0.006, 0.05 + 0.12), bevel=0.01)
        box(Em, (0.07, 0.02, 0.06), (0.27, fy - 0.016, 0.22), bevel=0)
        # crates
        cr = mat('#d39a52', 0.7)
        crd = mat('#a8763c', 0.7)
        for (x, y, z, s) in ((0.37, -0.5, 0.05, 0.13), (0.4, -0.38, 0.05, 0.11), (0.36, -0.49, 0.18, 0.1)):
            box(cr, (s, s, s), (x, y, z + s / 2), bevel=0.012, seg=1)
            box(crd, (s * 1.02, s * 1.02, 0.018), (x, y, z + s / 2), bevel=0.005, seg=1)
        # hayate arrow stripe
        all_sides(lambda: (box(Rm, (0.6, 0.02, 0.05), (0, fy - 0.004, 0.44), bevel=0),
                           windows_face(Em, Sm, [-0.16, 0.16], 0.25, 0.14, 0.14)), sides=(1, 3))
    elif key == 'it':
        # glass facade with mullions
        box(Gl, (0.74, 0.02, 0.38), (0, fy - 0.004, 0.05 + 0.2), bevel=0)
        for x in (-0.37, -0.185, 0, 0.185, 0.37):
            box(Sm, (0.025, 0.035, 0.4), (x, fy - 0.01, 0.25), bevel=0)
        box(Sm, (0.76, 0.035, 0.025), (0, fy - 0.01, 0.32), bevel=0)
        # door
        box(mat('#ffffff', 0.2, emit=WIN, strength=0.6), (0.15, 0.025, 0.24), (0, fy - 0.014, 0.17), bevel=0)
        box(Rm, (0.22, 0.12, 0.025), (0, fy - 0.06, 0.32), bevel=0.01)
        # neon "</>" sign above
        neon = mat('#f3b8ff', 0.4, emit='#e58cff', strength=1.6)
        box(Rm, (0.3, 0.03, 0.09), (0, fy - 0.01, 0.43), bevel=0.012)
        sx = 0.03
        for x, a in ((-0.08, 35), (-0.08, -35)):
            box(neon, (0.045, 0.02, 0.012), (x, fy - 0.03, 0.43 + (0.012 if a > 0 else -0.012)),
                rot=(0, math.radians(a), 0), bevel=0)
        for x, a in ((0.08, -35), (0.08, 35)):
            box(neon, (0.045, 0.02, 0.012), (x, fy - 0.03, 0.43 + (0.012 if a < 0 else -0.012)),
                rot=(0, math.radians(a), 0), bevel=0)
        box(neon, (0.012, 0.02, 0.07), (0, fy - 0.03, 0.43), rot=(0, math.radians(-20), 0), bevel=0)
        _ = sx
        all_sides(lambda: windows_face(Gl, Sm, [-0.2, 0, 0.2], 0.25, 0.14, 0.26, mullion=False), sides=(1, 2, 3))
    elif key == 'machi':
        box(Dk, (0.36, 0.02, 0.3), (0.12, fy - 0.004, 0.05 + 0.15), bevel=0)
        for i in range(5):
            box(Sm, (0.33, 0.03, 0.045), (0.12, fy - 0.012, 0.08 + i * 0.056), bevel=0.01, seg=1)
        # hazard header
        for i in range(6):
            m = mat('#ffd166', 0.6) if i % 2 == 0 else mat(INK, 0.6)
            box(m, (0.07, 0.04, 0.04), (0.12 - 0.175 + 0.035 + i * 0.07, fy - 0.016, 0.38), bevel=0)
        windows_face(Em, Rm, [-0.25], 0.26, 0.14, 0.18)
        # pipe along wall
        pm = mat('#9aa7ad', 0.4, metal=0.4)
        cyl(pm, 0.025, 0.45, (-0.40, fy - 0.03, 0.27), verts=10)
        cyl(pm, 0.03, 0.02, (-0.40, fy - 0.03, 0.15), verts=10)
        # barrels
        bm = mat('#4f78c9', 0.55)
        for x, y in ((-0.38, -0.52), (-0.25, -0.53)):
            cyl(bm, 0.05, 0.12, (x, y, 0.11), verts=14, bevel=0.01)
        all_sides(lambda: windows_face(Em, Rm, [-0.18, 0.18], 0.27, 0.16, 0.2), sides=(1, 2, 3))
    base = join(take(), 'Base')

    # ============ FLOOR (0..0.35)
    box(Wm, (WW, WW, HF), (0, 0, HF / 2), bevel=0.03, seg=3)
    box(Sm, (WW + 0.03, WW + 0.03, 0.035), (0, 0, HF - 0.02), bevel=0.012)
    if key == 'it':
        all_sides(lambda: (box(Gl, (WW - 0.06, 0.02, 0.17), (0, -WW / 2 - 0.004, 0.16), bevel=0),
                           [box(Sm, (0.022, 0.035, 0.19), (x, -WW / 2 - 0.01, 0.16), bevel=0)
                            for x in (-0.4, -0.2, 0, 0.2, 0.4)],
                           box(Sm, (WW - 0.02, 0.05, 0.025), (0, -WW / 2 - 0.015, 0.065), bevel=0.008),
                           box(Em, (0.12, 0.022, 0.09), (-0.1, -WW / 2 - 0.006, 0.17), bevel=0)))
    elif key == 'machi':
        all_sides(lambda: windows_face(Em, Rm, [-0.19, 0.19], 0.17, 0.2, 0.17))
    elif key == 'hayate':
        all_sides(lambda: (windows_face(Em, Sm, [-0.2, 0.2], 0.17, 0.17, 0.16),
                           box(Rm, (0.08, 0.02, 0.16), (0, -WW / 2 - 0.004, 0.17), bevel=0)))
    else:
        all_sides(lambda: windows_face(Em, Sm, [-0.19, 0.19], 0.17, 0.17, 0.17))
        # small flower boxes on front
        for x in (-0.19, 0.19):
            box(Wd, (0.19, 0.06, 0.035), (x, -WW / 2 - 0.035, 0.065), bevel=0.01, seg=1)
            sphere(mat('#ef6b5b', 0.6), (x, -WW / 2 - 0.035, 0.09), (0.08, 0.03, 0.025), seg=10, rings=5)
    floor = join(take(), 'Floor')

    # ============ ROOF
    if key == 'pan':
        H, hw = 0.32, WW / 2
        prism(Wm, [(-hw, 0), (hw, 0), (hw, 0.02)], -hw, hw, sh=0)  # tiny cap plate
        # gable wall: ridge along Y -> polygon in XZ extruded along Y
        extrude_poly(Wm, [(-hw, 0), (hw, 0), (0, H)], WW - 0.02, sh=0)
        L = math.hypot(hw + 0.07, H + 0.05)
        a = math.atan2(H + 0.05, hw + 0.07)
        for sx in (-1, 1):
            box(Rm, (L, 1.0, 0.06), (sx * (hw + 0.07) / 2, 0, (H + 0.05) / 2 - 0.0),
                rot=(0, sx * a, 0), bevel=0.025, seg=2)
        cyl(Rm, 0.035, 1.02, (0, 0, H + 0.05), rot=(math.pi / 2, 0, 0), verts=12)
        # round bread sign on the front gable
        cyl(mat(CREAM, 0.6), 0.1, 0.03, (0, -WW / 2 - 0.02, 0.13), rot=(math.pi / 2, 0, 0), verts=28, bevel=0.008)
        torus(Rm, 0.1, 0.014, (0, -WW / 2 - 0.035, 0.13), rot=(math.pi / 2, 0, 0), seg=28, mseg=6)
        sphere(mat('#d39a52'), (0, -WW / 2 - 0.05, 0.125), (0.072, 0.03, 0.045), seg=16, rings=8)
        for dx in (-0.03, 0.0, 0.03):
            box(mat('#fff3de', 0.7), (0.008, 0.02, 0.04), (dx, -WW / 2 - 0.075, 0.135),
                rot=(0, math.radians(25), 0), bevel=0)
        # chimney
        box(Sm, (0.1, 0.1, 0.22), (0.24, 0.22, 0.25), bevel=0.015)
        box(Rm, (0.13, 0.13, 0.04), (0.24, 0.22, 0.37), bevel=0.012)
    elif key == 'hayate':
        box(Rm, (WW + 0.04, WW + 0.04, 0.06), (0, 0, 0.03), bevel=0.02)
        for s in range(4):
            before = list(PARTS)
            box(Sm, (WW + 0.04, 0.05, 0.07), (0, -(WW + 0.04) / 2 + 0.025, 0.095), bevel=0.015)
            rot_z([o for o in PARTS if o not in before], s * math.pi / 2)
        # rooftop sign board with chevrons
        box(Wm, (0.06, 0.06, 0.18), (-0.2, 0.1, 0.15), bevel=0.01)
        box(Wm, (0.06, 0.06, 0.18), (0.2, 0.1, 0.15), bevel=0.01)
        box(Rm, (0.6, 0.05, 0.2), (0, 0.1, 0.32), bevel=0.02)
        wh = mat('#ffffff', 0.5)
        for x in (-0.12, 0.0, 0.12):
            for sgn in (1, -1):
                box(wh, (0.08, 0.02, 0.03), (x, 0.07, 0.32 + sgn * 0.025), rot=(0, sgn * math.radians(-40), 0),
                    bevel=0)
        # water tank
        cyl(Sm, 0.09, 0.14, (0.25, -0.2, 0.13), verts=16, bevel=0.012)
        cone(Rm, 0.1, 0.02, 0.06, (0.25, -0.2, 0.23), verts=16, sh=None)
    elif key == 'it':
        box(Rm, (WW + 0.04, WW + 0.04, 0.07), (0, 0, 0.035), bevel=0.02)
        box(Sm, (0.36, 0.3, 0.12), (0.12, 0.12, 0.13), bevel=0.02)
        # satellite dish
        me = bpy.data.meshes.new('dish')
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=0.14)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > 0.02], context='VERTS')
        bm.to_mesh(me)
        bm.free()
        dish = bpy.data.objects.new('dish', me)
        bpy.context.scene.collection.objects.link(dish)
        so = dish.modifiers.new('s', 'SOLIDIFY')
        so.thickness = 0.015
        dish.scale = (1, 1, 0.55)
        _add(dish, mat('#f6f2ff', 0.4), (-0.2, -0.12, 0.27), (math.radians(-55), 0, math.radians(20)), (1, 1, 0.55), None)
        cyl(Sm, 0.02, 0.18, (-0.2, -0.12, 0.15), verts=10)
        cyl(mat('#9aa7ad', 0.4, metal=0.4), 0.008, 0.12, (-0.2, -0.17, 0.3),
            rot=(math.radians(35), 0, math.radians(20)), verts=8)
        sphere(Rm, (-0.218, -0.215, 0.34), r=0.02, seg=10, rings=6)
        # antenna mast
        cyl(mat('#9aa7ad', 0.4, metal=0.4), 0.012, 0.5, (0.25, 0.22, 0.43), verts=8)
        for z in (0.36, 0.48):
            cyl(mat('#9aa7ad', 0.4, metal=0.4), 0.006, 0.14, (0.25, 0.22, z), rot=(0, math.pi / 2, 0), verts=6)
        sphere(mat('#ff8a7a', 0.4, emit='#ff5a4a', strength=2.0), (0.25, 0.22, 0.69), r=0.03, seg=12, rings=6)
    elif key == 'machi':
        box(Rm, (WW + 0.04, WW + 0.04, 0.05), (0, 0, 0.025), bevel=0.018)
        hw = WW / 2
        depth = WW / 3
        for i in range(3):
            y0 = -hw + i * depth
            prism(Sm, [(y0, 0.05), (y0 + depth, 0.05), (y0, 0.27)], -hw, hw, sh=35, bevel=0.012)
            box(Em, (WW - 0.1, 0.02, 0.13), (0, y0 - 0.006, 0.15), bevel=0)
            for x in (-0.2, 0, 0.2):
                box(Rm, (0.02, 0.03, 0.14), (x, y0 - 0.01, 0.15), bevel=0)
            box(Rm, (WW + 0.02, depth * 1.08, 0.025), (0, y0 + depth / 2 - 0.005, 0.165),
                rot=(math.atan2(0.22, depth), 0, 0), bevel=0.008)
        # chimney (striped)
        cyl(mat('#e9e2d6', 0.6), 0.065, 0.55, (-0.3, 0.26, 0.32), verts=16)
        for z in (0.3, 0.45):
            cyl(Rm, 0.07, 0.05, (-0.3, 0.26, z), verts=16)
        torus(mat(INK, 0.6), 0.06, 0.018, (-0.3, 0.26, 0.6), seg=16, mseg=6)
        # gear sign
        gz, gx, gy = 0.4, 0.26, -0.33
        cyl(mat('#9aa7ad', 0.4, metal=0.4), 0.015, 0.25, (gx, gy + 0.03, 0.25), verts=8)
        torus(mat('#f0a14a', 0.45), 0.085, 0.03, (gx, gy, gz), rot=(math.pi / 2, 0, 0), seg=28, mseg=8)
        for i in range(8):
            a = i * math.pi / 4
            box(mat('#f0a14a', 0.45), (0.05, 0.05, 0.05), (gx + math.cos(a) * 0.12, gy, gz + math.sin(a) * 0.12),
                rot=(0, -a, 0), bevel=0)
        cyl(mat('#c76d14', 0.5), 0.03, 0.065, (gx, gy, gz), rot=(math.pi / 2, 0, 0), verts=14)
    roof = join(take(), 'Roof')

    floor.location = (0, 0, HB)
    roof.location = (0, 0, HB + HF)
    _ = base
    export('bld_' + key)


# ---------------------------------------------------------------- main
def write_js():
    names = sorted(f[:-4] for f in os.listdir(OUT) if f.endswith('.glb'))
    lines = ["'use strict';",
             "/* GLBモデルをbase64で埋め込んだもの（tools/blender/build_models.py が自動生成。手で編集しない）。",
             "   file:// で開いても3D表示できるようにするため。 */",
             "const MODELS_B64={"]
    for i, n in enumerate(names):
        with open(os.path.join(OUT, n + '.glb'), 'rb') as f:
            b = base64.b64encode(f.read()).decode('ascii')
        lines.append('"%s":"%s"%s' % (n, b, ',' if i < len(names) - 1 else ''))
    lines.append('};')
    with open(JS, 'w') as f:
        f.write('\n'.join(lines) + '\n')
    print('  models.js      %6.1f KB (%d models)' % (os.path.getsize(JS) / 1024, len(names)))


def main():
    only = [a for a in sys.argv[1:] if not a.startswith('-')] if '--' not in sys.argv else \
        sys.argv[sys.argv.index('--') + 1:]
    if os.path.basename(sys.argv[0]) in ('blender', 'blender.exe'):
        only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    want = lambda n: not only or any(n.startswith(o) for o in only)  # noqa: E731
    print('Building models ->', OUT)
    for k, v in BEASTS.items():
        if want('beast_' + k):
            build_beast(k, v['c'], v['d'], v['horn'], v['belly'], v.get('oyaji', False))
    for k in CO:
        if want('bld_' + k):
            build_building(k)
    if want('owl'):
        build_owl()
    if want('tree'):
        build_trees()
    if want('coin'):
        build_coin()
    if want('flag'):
        build_slot()
    write_js()


if __name__ == '__main__':
    main()
