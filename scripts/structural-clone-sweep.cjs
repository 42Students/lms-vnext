const fs=require("fs");
const KW=new Set("const let var function return if else for while await async import export from default type interface class new throw try catch finally switch case break continue typeof as true false null undefined void of in extends implements".split(" "));
const norm=l=>l.trim().replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g,"S").replace(/\b\d+(\.\d+)?\b/g,"N").replace(/[A-Za-z_$][\w$]*/g,m=>KW.has(m)?m:"I").replace(/\s+/g," ");
const groups={components:f=>f.startsWith("src/components/")&&f.endsWith(".tsx"),pages:f=>/^src\/app\/.*page\.tsx$/.test(f),services:f=>/^src\/modules\/.*\.ts$/.test(f),routes:f=>/^src\/app\/api\/.*route\.ts$/.test(f)};
const all=[];(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(["node_modules",".next","graphify-out"].includes(e.name))continue;const p=d+"/"+e.name;if(e.isDirectory())w(p);else if(/\.tsx?$/.test(e.name))all.push(p)}})("src");
const SH=6;
function shingles(f){const ls=fs.readFileSync(f,"utf8").split(/\r?\n/).map(norm).filter(l=>l.length>=12&&!l.startsWith("import")&&!l.startsWith("//"));const s=new Set();for(let i=0;i+SH<=ls.length;i++)s.add(ls.slice(i,i+SH).join("|"));return s}
for(const [name,flt] of Object.entries(groups)){
 const fl=all.filter(flt);const sets=fl.map(shingles);const inv=new Map();
 sets.forEach((s,i)=>{for(const h of s){if(!inv.has(h))inv.set(h,[]);inv.get(h).push(i)}});
 const pairs=new Map();
 for(const [,idx] of inv){if(idx.length<2||idx.length>30)continue;for(let a=0;a<idx.length;a++)for(let b=a+1;b<idx.length;b++){const k=idx[a]*100000+idx[b];pairs.set(k,(pairs.get(k)||0)+1)}}
 const hits=[];for(const [k,sh] of pairs){const a=Math.floor(k/100000),b=k%100000;const m=Math.min(sets[a].size,sets[b].size);if(m<15)continue;const r=sh/m;if(r>=0.5)hits.push([r,sh,fl[a],fl[b]])}
 hits.sort((x,y)=>y[1]-x[1]);const inv2=new Set(hits.flatMap(h=>[h[2],h[3]]));
 console.log(`\n== ${name}: ${fl.length} files; ${hits.length} structural-clone pairs (>=50% of 6-line normalised blocks shared); ${inv2.size} files involved`);
 for(const [r,s,a,b] of hits.slice(0,10))console.log(`${(r*100)|0}% ${s}  ${a.replace("src/","")}  <>  ${b.replace("src/","")}`);
}
