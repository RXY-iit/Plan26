// Run npm ci && npm run build after changing app.js, model/data, or reference text.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const web=path.dirname(fileURLToPath(import.meta.url));
const root=process.argv[2]?path.resolve(process.argv[2]):path.resolve(web,'..');
const {build}=await import(process.env.ROBOT_ATLAS_ESBUILD?pathToFileURL(process.env.ROBOT_ATLAS_ESBUILD).href:'esbuild');
await build({entryPoints:[path.join(web,'app.js')],bundle:true,format:'iife',target:['es2020'],minify:true,legalComments:'eof',outfile:path.join(web,'app.bundle.js'),alias:{three:path.join(web,'vendor/three.module.js'),'three/addons':path.join(web,'vendor/addons')}});
const out=path.join(web,'portable');await fs.mkdir(out,{recursive:true});
const payload={json:{},text:{}};
for(const name of ['components.json','source-files.json'])payload.json['data/'+name]=JSON.parse(await fs.readFile(path.join(root,'data',name),'utf8'));
async function collect(dir){for(const item of await fs.readdir(path.join(root,dir),{withFileTypes:true})){
 const rel=path.posix.join(dir,item.name);
 if(item.isDirectory()){if(!['localization','node_modules','.git','web','assets','outputs'].includes(item.name))await collect(rel)}
 else if(/\.(md|txt|json|ya?ml|xml|xacro|urdf|srdf|sdf|csv|py|ini|cfg)$/i.test(item.name)){payload.text[rel]=await fs.readFile(path.join(root,rel),'utf8')}
}}
await collect('');
await fs.writeFile(path.join(out,'data.js'),'window.robotAtlasPortable='+JSON.stringify(payload)+';\n');
const hashes={};
for(const [src,dest] of [['robot_web.glb','model.js'],['robot_web_lod1.glb','model-lod1.js']]){
 const bytes=await fs.readFile(path.join(root,'web',src));
 await fs.writeFile(path.join(out,dest),'window.robotAtlasModelBase64='+JSON.stringify(bytes.toString('base64'))+';\n');
 hashes[src]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
}
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({models:hashes,referenceTextCount:Object.keys(payload.text).length},null,2)+'\n');
console.log('Built local-file compatible scripts and byte-identical model payloads.');
