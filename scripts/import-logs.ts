import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

type L = { id:string; n:number; raw:string; time:string|null; type:"OTHER"|"PLAYER_CONNECTING"|"PLAYER_CONNECTED"|"PLAYER_DISCONNECTED"; name:string|null; reported:string|null; steam:string|null; player:string|null; note:string|null; at:Date|null };
type S = { id:string; steam:string; player:string; connect:string; disconnect:string|null; start:Date; end:Date|null; seconds:number|null };
type EventType = "MOD" | "WW2" | "CW" | "TRN" | "SP" | "PVP" | "OTHER";
type E = { key:string; file:string; sha:string; code:string; eventType:EventType; title:string; date:Date; duration:number|null; threshold:number|null; lines:L[]; sessions:S[]; names:Map<string,string> };
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const logs=path.resolve(process.env.LOG_ARCHIVE_DIR??path.join(project,"data","archive","logs"));
const root=path.dirname(logs), apply=process.argv.includes("--apply"), valid=/^\d{17}$/;
const adminSeeds=JSON.parse(await readFile(path.join(project,"data","admin-users.json"),"utf8")) as {steamId:string;displayName:string}[];
const keyName=(s:string)=>s.normalize("NFKC").replace(/\s*\[bia\]\s*/gi," ").replace(/\s+/g," ").trim().toLowerCase();
const clean=(s:string)=>s.normalize("NFKC").replace(/\s*\[bia\]\s*/gi," ").replace(/\s+/g," ").trim();
async function walk(dir:string,suffix:string):Promise<string[]>{let es;try{es=await readdir(dir,{withFileTypes:true})}catch{return []}const a=await Promise.all(es.map(async e=>e.isDirectory()?walk(path.join(dir,e.name),suffix):e.isFile()&&e.name.toLowerCase().endsWith(suffix)?[path.join(dir,e.name)]:[]));return a.flat()}
async function lookups(){const ids=new Map<string,Set<string>>(),duration=new Map<string,number>();try{const o=JSON.parse(await readFile(path.join(root,"ids.json"),"utf8")) as Record<string,unknown>;for(const [n,v]of Object.entries(o)){const id=String(v);if(valid.test(id)){const k=keyName(n),s=ids.get(k)??new Set<string>();s.add(id);ids.set(k,s)}}}catch{}for(const f of await walk(path.join(root,"mission_duration"),".json"))try{const o=JSON.parse(await readFile(f,"utf8")) as Record<string,unknown>;for(const[k,v]of Object.entries(o)){const d=Array.isArray(v)?v[0]:v,m=Number((d as {Duration?:unknown})?.Duration);if(Number.isInteger(m)&&m>0)duration.set(k,m)}}catch{}return{ids,duration}}
function eventTypeFor(code:string):EventType { if (["MOD","WW2","CW","TRN","SP","PVP"].includes(code)) return code as EventType; if (code === "SPC") return "SP"; if (code === "VIET" || code === "VTN") return "CW"; return "OTHER"; }
function resolve(n:string|null,ids:Map<string,Set<string>>){if(!n)return null;const x=ids.get(keyName(n));return x?.size===1?[...x][0]:null}
async function parse(file:string,ids:Map<string,Set<string>>,durations:Map<string,number>):Promise<E>{
 const bytes=await readFile(file),source=path.basename(file,path.extname(file)),m=source.match(/^BIA_([A-Z0-9]+)_(\d{4})[_.-](\d{1,2})[_.-](\d{1,2})$/i);if(!m)throw Error("Unexpected event filename "+source);
 const code=m[1].toUpperCase(),y=+m[2],mo=+m[3],d=+m[4],date=new Date(Date.UTC(y,mo-1,d));if(date.getUTCFullYear()!==y||date.getUTCMonth()!==mo-1||date.getUTCDate()!==d)throw Error("Invalid event date "+source);
 const duration=durations.get(source)??null,labels:Record<string,string>={WW2:"World War II",TRN:"Training",MOD:"Modern",CW:"Cold War",SP:"Special Event",SPC:"Special Event",PVP:"PVP",CAM:"Campaign",VIET:"Cold War",VTN:"Cold War"};
 const raw=bytes.toString("utf8").split(/\r?\n/);if(raw.at(-1)==="")raw.pop();
 const lines:L[]=[],sessions:S[]=[],names=new Map<string,string>(),active=new Map<string,S[]>();let prev:number|null=null,offset=0;
 for(let i=0;i<raw.length;i++){
  const txt=i===0?raw[i].replace(/^\uFEFF/,""):raw[i],tm=txt.match(/^(\d{2}:\d{2}:\d{2})\s+/),time=tm?.[1]??null;
  let at:Date|null=null;if(time){const[h,mi,se]=time.split(":").map(Number),v=h*3600+mi*60+se;if(prev!==null&&prev-v>43200)offset++;prev=v;at=new Date(Date.UTC(y,mo-1,d+offset,h,mi,se))}
  const a=txt.match(/^\d{2}:\d{2}:\d{2}\s+Player\s+(.+?)\s+(connecting|connected(?:\s+\(id=(\d{17})\))?|disconnected)\.$/i);
  const id=randomUUID();let type:L["type"]="OTHER",name:string|null=null,reported:string|null=null,steam:string|null=null,note:string|null=null;
  if(a){name=a[1].trim();const verb=a[2].toLowerCase();reported=a[3]&&valid.test(a[3])?a[3]:null;steam=reported??resolve(name,ids);type=verb==="connecting"?"PLAYER_CONNECTING":verb==="disconnected"?"PLAYER_DISCONNECTED":"PLAYER_CONNECTED";
   if(type==="PLAYER_CONNECTED"&&steam){names.set(steam,clean(name));const s:S={id:randomUUID(),steam,player:"",connect:id,disconnect:null,start:at??date,end:null,seconds:null};sessions.push(s);const k=keyName(name),bucket=active.get(k)??[];bucket.push(s);active.set(k,bucket)}else if(type==="PLAYER_CONNECTED")note="Connection has no resolvable SteamID64.";
  }
  const line:L={id,n:i+1,raw:raw[i],time,type,name,reported,steam,player:null,note,at};lines.push(line);
  if(type==="PLAYER_DISCONNECTED"){let c=(active.get(keyName(name??""))??[]).filter(s=>!s.disconnect);if(!c.length){const mapped=resolve(name,ids);if(mapped)c=sessions.filter(s=>s.steam===mapped&&!s.disconnect)}
   if(c.length===1&&at&&at>=c[0].start){const s=c[0];s.disconnect=id;s.end=at;s.seconds=Math.round((at.getTime()-s.start.getTime())/1000);line.steam=s.steam}
   else line.note=c.length>1?"Multiple open sessions match this display name; left unresolved.":c.length===1?"Disconnect time precedes its connection; left unresolved.":"No open session matched this disconnect."
  }
 }
 return{key:source,file:path.basename(file),sha:createHash("sha256").update(bytes).digest("hex"),code,eventType:eventTypeFor(code),title:(labels[code]??code)+" — "+date.toISOString().slice(0,10),date,duration,threshold:code==="TRN"?55:duration,lines,sessions,names};
}
async function main(){
 const {ids,duration}=await lookups(),events:E[]=[];for(const f of await walk(logs,".txt"))events.push(await parse(f,ids,duration));events.sort((a,b)=>a.date.getTime()-b.date.getTime()||a.key.localeCompare(b.key));
 const identities=new Map<string,{name:string;seen:number}>();for(const e of events)for(const[id,name]of e.names){const old=identities.get(id);if(!old||e.date.getTime()>=old.seen)identities.set(id,{name,seen:e.date.getTime()})}
 const lines=events.reduce((n,e)=>n+e.lines.length,0),unresolved=events.reduce((n,e)=>n+e.lines.filter(l=>l.type==="PLAYER_CONNECTED"&&!l.steam).length,0),unmatched=events.reduce((n,e)=>n+e.lines.filter(l=>l.note?.startsWith("No open")).length,0),ambiguous=events.reduce((n,e)=>n+e.lines.filter(l=>l.note?.startsWith("Multiple open")).length,0),open=events.reduce((n,e)=>n+e.sessions.filter(s=>!s.disconnect).length,0);
 console.log("Source: "+logs);console.log("Mode: "+(apply?"APPLY":"DRY RUN (no database changes)"));console.log("Events: "+events.length+"; raw lines: "+lines+"; unique Steam IDs: "+identities.size);console.log("Unresolved connects: "+unresolved+"; unmatched disconnects: "+unmatched+"; ambiguous disconnects: "+ambiguous+"; open sessions: "+open);console.log("Events without duration metadata: "+events.filter(e=>e.duration===null).length);
 if(!apply){console.log("Dry run only. Add --apply after reviewing this summary.");return}if(!process.env.DATABASE_URL)throw Error("DATABASE_URL required for --apply");
 const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
 try{
  const prev=await db.event.findMany({select:{sourceKey:true,sourceSha256:true}}),byKey=new Map(prev.map(x=>[x.sourceKey,x.sourceSha256]));
  const changed=events.filter(e=>byKey.has(e.key)&&byKey.get(e.key)!==e.sha);if(changed.length)throw Error("Existing source files changed; no log rows imported. Reconcile first: "+changed.slice(0,8).map(e=>e.key).join(", "));
  const pending=events.filter(e=>!byKey.has(e.key));if(!pending.length)console.log("All archive events already imported.")
  const adminIds=new Set(adminSeeds.map(x=>x.steamId));for(const seed of adminSeeds){if(!valid.test(seed.steamId)||!identities.has(seed.steamId))throw Error("Admin bootstrap SteamID is not present in the archive: "+seed.displayName);identities.set(seed.steamId,{name:seed.displayName,seen:Number.MAX_SAFE_INTEGER})}
  const playerIds=new Map<string,string>();for(const[id,x]of identities){const isAdmin=adminIds.has(id),profileUrl="https://steamcommunity.com/profiles/"+id,user=await db.user.upsert({where:{steamId:id},update:{displayName:x.name,profileUrl,...(isAdmin?{admin:true}:{})},create:{steamId:id,displayName:x.name,profileUrl,admin:isAdmin},select:{id:true}}),p=await db.player.upsert({where:{userId:user.id},update:{nickname:x.name},create:{userId:user.id,nickname:x.name},select:{id:true}});playerIds.set(id,p.id)}
  let done=0;for(const e of pending){await db.$transaction(async tx=>{
   const eventId=randomUUID(),participants=new Map<string,string>(),totals=new Map<string,number>(),complete=new Map<string,boolean>();
   for(const s of e.sessions){const p=playerIds.get(s.steam);if(!p)continue;s.player=p;participants.set(p,participants.get(p)??randomUUID());totals.set(p,(totals.get(p)??0)+(s.seconds??0));complete.set(p,(complete.get(p)??true)&&s.seconds!==null)}
   for(const l of e.lines)if(l.steam){l.player=playerIds.get(l.steam)??null;if(l.type==="PLAYER_DISCONNECTED"){const s=e.sessions.find(x=>x.disconnect===l.id);if(s)l.player=s.player||null}}
   await tx.event.create({data:{id:eventId,sourceKey:e.key,sourceFileName:e.file,sourceSha256:e.sha,title:e.title,eventCode:e.code,eventType:e.eventType,game:"Arma",eventDate:e.date,missionDurationMinutes:e.duration,minimumAttendanceMinutes:e.threshold,importedAt:new Date()}});
   const ps=[...participants].map(([playerId,id])=>{const done=complete.get(playerId)===true&&e.threshold!==null,seconds=totals.get(playerId)??0;return{id,eventId,playerId,totalConnectedSeconds:done?seconds:null,attendanceGranted:done?seconds>=e.threshold!*60:false,attendanceCalculatedAt:done?new Date():null,calculationVersion:done?"raw-log-session-sum-v1":null}});
   for(let i=0;i<ps.length;i+=500)await tx.eventParticipant.createMany({data:ps.slice(i,i+500)});
   const ls=e.lines.map(l=>({id:l.id,eventId,lineNumber:l.n,rawText:l.raw,timeOfDay:l.time,type:l.type,reportedPlayerName:l.name,reportedSteamId:l.reported,playerId:l.player,parseNote:l.note}));
   for(let i=0;i<ls.length;i+=1000)await tx.eventLogLine.createMany({data:ls.slice(i,i+1000)});
   const ss=e.sessions.flatMap(s=>{if(!s.player)return[];const eventParticipantId=participants.get(s.player);return eventParticipantId?[{id:s.id,eventParticipantId,connectLineId:s.connect,disconnectLineId:s.disconnect,connectedAt:s.start,disconnectedAt:s.end,durationSeconds:s.seconds}]:[]});
   for(let i=0;i<ss.length;i+=500)await tx.playerSession.createMany({data:ss.slice(i,i+500)});
  },{maxWait:10000,timeout:120000});
  done++;if(done%25===0||done===pending.length)console.log("Imported "+done+"/"+pending.length+" events.")
 }
  console.log("Imported "+pending.length+" events and linked "+identities.size+" User/Player identities.");
 }finally{await db.$disconnect()}
}
main().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1});
