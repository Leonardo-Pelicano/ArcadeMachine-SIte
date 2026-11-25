import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import vm from 'node:vm';import {fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');let failed=false;
function fail(message){failed=true;console.error('ERRO DE PUBLICAÇÃO: '+message);}
const runtimeScripts=new Set([...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1].split('?')[0]));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'),'utf8')),version=html.match(/data-version="(\d+)"/)?.[1];
if(version!==manifest.version)fail('index.html e manifesto pertencem a versões diferentes.');
if(!html.includes('id="buildVersion">V'+version+'</span>'))fail('O rótulo visível da versão não corresponde aos arquivos.');
for(const [name,expected]of Object.entries(manifest.files)){const file=path.join(root,name);if(!fs.existsSync(file)){fail('Falta '+name+'. Envie o conteúdo completo do ZIP, com as pastas.');continue;}const bytes=fs.readFileSync(file),actual=crypto.createHash('sha256').update(bytes).digest('hex');if(actual!==expected)fail('Arquivo diferente do pacote V'+version+': '+name+'. Substitua os arquivos antigos pelos novos.');if(name.endsWith('.js')&&runtimeScripts.has(name))try{new vm.Script(bytes.toString(),{filename:name});}catch(e){fail('JavaScript inválido em '+name+': '+e.message);}}
for(const match of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g)){const name=match[1];if(!/^(https?:|data:|#)/.test(name)&&!fs.existsSync(path.join(root,name)))fail('Referência ausente: '+name);}
if(failed)process.exitCode=1;else console.log('Arcade V'+version+': HTML, scripts, imagens, áudio e fontes conferidos. Publicação estática pronta.');

const appManifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
if(!['standalone','fullscreen'].includes(appManifest.display))fail('O manifesto deve permitir abrir como aplicativo.');
for(const icon of appManifest.icons||[]){const file=path.join(root,icon.src);if(!fs.existsSync(file))fail('Ícone de instalação ausente: '+icon.src);else{const b=fs.readFileSync(file),size=icon.sizes.split('x').map(Number);if(b.readUInt32BE(16)!==size[0]||b.readUInt32BE(20)!==size[1])fail('Dimensões do ícone inconsistentes: '+icon.src);}}
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),shell=JSON.parse(sw.match(/SHELL=(\[[\s\S]*?\]);/)?.[1]||'[]');
if(!shell.length)fail('Lista de instalação offline ausente.');for(const name of shell)if(!fs.existsSync(path.join(root,name)))fail('Ativo offline ausente: '+name);
if(failed)process.exitCode=1;
