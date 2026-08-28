import fs from'node:fs';
import path from'node:path';
import{spawnSync}from'node:child_process';
import{fileURLToPath}from'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const skip=new Set(['node_modules','.git']);
const files=[];

function walk(dir){
  for(const name of fs.readdirSync(dir)){
    if(skip.has(name))continue;
    const full=path.join(dir,name);
    const stat=fs.statSync(full);
    if(stat.isDirectory())walk(full);
    else if(name.endsWith('.js'))files.push(full);
  }
}

walk(root);
for(const file of files){
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0){
    process.stderr.write(`Syntax error: ${path.relative(root,file)}\n${result.stderr}`);
    process.exit(result.status||1);
  }
}
console.log(`Syntax OK: ${files.length} JavaScript files`);
