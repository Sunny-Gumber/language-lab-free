const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const skip=new Set(['node_modules','.git']);
const files=[];
function walk(dir){for(const name of fs.readdirSync(dir)){if(skip.has(name))continue;const full=path.join(dir,name),st=fs.statSync(full);if(st.isDirectory())walk(full);else if(name.endsWith('.js'))files.push(full)}}
walk(root);
for(const file of files){const r=cp.spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0){process.stderr.write(`Syntax error: ${path.relative(root,file)}\n${r.stderr}`);process.exit(r.status||1)}}
console.log(`Syntax OK: ${files.length} JavaScript files`);
