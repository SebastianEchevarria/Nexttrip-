import React, { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";

const _fbCfg = { apiKey:"AIzaSyAfhidX6gGyElvwOwUpoBsNhbk_OFd4roY", authDomain:"nexttrip-1df2b.firebaseapp.com", projectId:"nexttrip-1df2b", storageBucket:"nexttrip-1df2b.firebasestorage.app", messagingSenderId:"666473738063", appId:"1:666473738063:web:424a4f62dc73c93282df3a" };
const _app = getApps().find(a=>a.name==="[DEFAULT]") || initializeApp(_fbCfg);
const _db  = getFirestore(_app);

async function fbSet(p,d)  { try{await setDoc(doc(_db,...p.split("/")),d);}catch(e){console.error(e);} }
async function fbGet(p)    { try{const s=await getDoc(doc(_db,...p.split("/")));return s.exists()?s.data():null;}catch{return null;} }
function fbListen(p,cb)    { return onSnapshot(doc(_db,...p.split("/")),s=>cb(s.exists()?s.data():null)); }

const PIN="3155", CR=0.20, BK="riviera_bookings_v1";
function san(a){return(Array.isArray(a)?a:[]).filter(b=>b&&b.id&&b.guest);}
function fmt(n){return isNaN(n)?"0":Number(n).toFixed(2).replace(".",",");}
function sLabel(s){return({confirmed:"Confirmado",pending:"Pendiente",rejected:"Rechazado",inprogress:"En Curso",completed:"Completado",cancelled:"Cancelado"})[s]||s;}
function sColor(s){return({confirmed:"#2563eb",pending:"#f59e0b",rejected:"#ef4444",inprogress:"#3b82f6",completed:"#22c55e",cancelled:"#f97316"})[s]||"#64748b";}
function rUrl(o,d){return`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o||"")}&destination=${encodeURIComponent(d||"")}&travelmode=driving`;}
function mUrl(a){return`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a||"")}`;}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;}
body{margin:0;font-family:'Inter',sans-serif;background:#f1f5f9;}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:#f1f5f9;}
::-webkit-scrollbar-thumb{background:#2563eb55;border-radius:3px;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-10px)}40%,80%{transform:translateX(10px)}}
@keyframes spin{to{transform:rotate(360deg)}}
.nav-item{transition:all 0.15s;cursor:pointer;}
.nav-item:hover{background:#eff6ff!important;}
.kpi-card{transition:all 0.2s;cursor:default;}
.kpi-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(37,99,235,0.15)!important;}
.row-hover:hover{background:#f8faff!important;}
.pin-btn{transition:all 0.1s;cursor:pointer;}
.pin-btn:hover{background:#dbeafe!important;transform:scale(1.05);}
.pin-btn:active{transform:scale(0.95)!important;}
`;

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DriverDesktopApp() {
  const [loggedIn,setLoggedIn]=useState(false);
  const [bookings,setBookings]=useState([]);
  const [messages,setMessages]=useState({});
  const [dStatus,setDStatus]=useState("free");
  const [section,setSection]=useState("dashboard");
  const [selected,setSelected]=useState(null);
  const [chatB,setChatB]=useState(null);
  const [chatMsg,setChatMsg]=useState("");
  const [toast,setToast]=useState("");

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),3200);};

  useEffect(()=>{
    if(!loggedIn)return;
    const u1=fbListen("nexttrip/bookings",d=>{if(d?.data){const s=san(d.data);setBookings(s);try{localStorage.setItem(BK,JSON.stringify(s));}catch{}}});
    const u2=fbListen("nexttrip/messages",d=>{if(d)setMessages(d);});
    const u3=fbListen("nexttrip/status",d=>{if(d?.driverStatus)setDStatus(d.driverStatus);});
    return()=>{u1();u2();u3();};
  },[loggedIn]);

  const mutate=(id,patch)=>{
    const next=bookings.map(b=>b.id===id?{...b,...patch}:b);
    setBookings(next);
    fbSet("nexttrip/bookings",{data:next,updatedAt:Date.now()});
  };
  const sendMsg=(bid,text)=>{
    const k=String(bid),prev=messages[k]||[];
    const msg={from:"driver",fromName:"DRIVER",text,ts:Date.now()};
    const next={...messages,[k]:[...prev,msg]};
    setMessages(next);fbSet("nexttrip/messages",next);
  };

  if(!loggedIn) return <LoginScreen onLogin={()=>setLoggedIn(true)}/>;

  const today=new Date().toISOString().slice(0,10);
  const pending  =bookings.filter(b=>b.status==="pending");
  const confirmed=bookings.filter(b=>["confirmed","inprogress"].includes(b.status));
  const history  =bookings.filter(b=>["completed","cancelled","rejected"].includes(b.status)).slice(-30).reverse();
  const todayDone=bookings.filter(b=>b.date===today&&b.status==="completed");
  const todayEarnings=todayDone.reduce((s,b)=>s+Number(b.fare||0),0);
  const totalGross=bookings.filter(b=>b.status==="completed").reduce((s,b)=>s+Number(b.fare||0),0);
  const upcoming=[...confirmed].filter(b=>new Date(`${b.date}T${b.time}`)>=new Date(Date.now()-3600000)).sort((a,b)=>new Date(`${a.date}T${a.time}`)-new Date(`${b.date}T${b.time}`))[0];

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#f1f5f9"}}>
      <style>{CSS}</style>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <aside style={{width:240,background:"#0f1729",display:"flex",flexDirection:"column",flexShrink:0}}>
        {/* Logo area */}
        <div style={{padding:"28px 20px 24px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <img src="/logo-velo.jpg" style={{width:52,height:52,objectFit:"contain",borderRadius:12,marginBottom:12}} alt="VELO"/>
          <div style={{color:"#fff",fontSize:18,fontWeight:900,letterSpacing:0.5}}>VELO Driver</div>
          <div style={{color:"#64748b",fontSize:10,letterSpacing:3,marginTop:2}}>DESKTOP PANEL</div>
          {/* Status */}
          <div style={{marginTop:14,display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"8px 10px"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:dStatus==="onroute"?"#ef4444":"#22c55e",animation:"pulse 1.5s infinite",flexShrink:0}}/>
            <span style={{color:dStatus==="onroute"?"#ef4444":"#22c55e",fontSize:11,fontWeight:700}}>{dStatus==="onroute"?"EN RUTA":"DISPONIBLE"}</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"16px 10px",display:"flex",flexDirection:"column",gap:2}}>
          {[
            {id:"dashboard",icon:"🏠",label:"Dashboard"},
            {id:"pending",  icon:"⏳",label:"Pendientes",badge:pending.length,badgeColor:"#f59e0b"},
            {id:"confirmed",icon:"✅",label:"Confirmados",badge:confirmed.length,badgeColor:"#2563eb"},
            {id:"history",  icon:"🗂", label:"Historial"},
            {id:"billing",  icon:"💶",label:"Facturación"},
          ].map(item=>(
            <button key={item.id} className="nav-item" onClick={()=>setSection(item.id)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"11px 14px",
              borderRadius:10,border:"none",cursor:"pointer",
              background:section===item.id?"rgba(37,99,235,0.3)":"transparent",
              borderLeft:`3px solid ${section===item.id?"#2563eb":"transparent"}`,
            }}>
              <span style={{fontSize:17}}>{item.icon}</span>
              <span style={{color:section===item.id?"#ffffff":"#94a3b8",fontSize:13,fontWeight:section===item.id?700:500,flex:1,textAlign:"left"}}>{item.label}</span>
              {item.badge>0&&<span style={{background:item.badgeColor,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:700}}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{padding:"14px 10px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <button onClick={()=>setLoggedIn(false)} style={{width:"100%",background:"rgba(239,68,68,0.15)",border:"1.5px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"9px 0",color:"#ef4444",fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:8}}>🚪 Cerrar sesión</button>
          <a href="/driver.html" style={{display:"block",textAlign:"center",color:"#475569",fontSize:10,textDecoration:"none"}}>Ir a versión móvil →</a>
        </div>
      </aside>

      {/* ══ MAIN ═════════════════════════════════════════════════════════════ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Top bar */}
        <header style={{background:"#ffffff",borderBottom:"2px solid #e2e8f0",padding:"0 28px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:3,height:22,background:"linear-gradient(180deg,#1e3a8a,#2563eb)",borderRadius:2}}/>
            <span style={{color:"#0f172a",fontSize:19,fontWeight:800}}>
              {{dashboard:"Dashboard",pending:"Viajes Pendientes",confirmed:"Viajes Confirmados",history:"Historial",billing:"Facturación"}[section]}
            </span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <LiveClock/>
            <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",borderRadius:10,padding:"6px 12px",border:"1.5px solid #e2e8f0"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a8a,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800}}>SE</div>
              <div>
                <div style={{color:"#0f172a",fontSize:12,fontWeight:700}}>Sebastián E.</div>
                <div style={{color:"#64748b",fontSize:10}}>Conductor</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{flex:1,overflowY:"auto",padding:"24px 28px",animation:"fadeIn 0.25s ease"}}>

          {/* ── DASHBOARD ── */}
          {section==="dashboard"&&(
            <div>
              {/* KPI row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
                {[
                  {icon:"⏳",label:"Pendientes",value:pending.length,color:"#d97706",bg:"#fffbeb",border:"#f59e0b"},
                  {icon:"✅",label:"Confirmados",value:confirmed.length,color:"#1e3a8a",bg:"#eff6ff",border:"#2563eb"},
                  {icon:"🏁",label:"Completados hoy",value:todayDone.length,color:"#15803d",bg:"#f0fdf4",border:"#22c55e"},
                  {icon:"💶",label:"Ganado hoy",value:fmt(todayEarnings)+" €",color:"#7c3aed",bg:"#faf5ff",border:"#7c3aed"},
                ].map(k=>(
                  <div key={k.label} className="kpi-card" style={{background:k.bg,border:`2px solid ${k.border}33`,borderRadius:18,padding:"22px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                    <div style={{fontSize:32,marginBottom:10}}>{k.icon}</div>
                    <div style={{color:k.color,fontSize:28,fontWeight:900,lineHeight:1}}>{k.value}</div>
                    <div style={{color:"#64748b",fontSize:11,fontWeight:600,marginTop:6,letterSpacing:0.3}}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Main content grid */}
              <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:20}}>
                {/* Next trip card */}
                <div style={{background:"#ffffff",borderRadius:20,padding:"24px",border:"2px solid #e2e8f0",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
                    <div style={{width:4,height:20,background:"linear-gradient(180deg,#1e3a8a,#2563eb)",borderRadius:2}}/>
                    <span style={{color:"#1e3a8a",fontSize:13,fontWeight:800,letterSpacing:2}}>PRÓXIMO VIAJE</span>
                  </div>
                  {upcoming?(
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                        <div>
                          <div style={{color:"#0f172a",fontSize:26,fontWeight:900,lineHeight:1}}>{upcoming.guest}</div>
                          <div style={{color:"#64748b",fontSize:12,marginTop:6}}>{upcoming.date} · <strong style={{color:"#1e3a8a"}}>{upcoming.time}</strong> · {upcoming.passengers} pax · {upcoming.hotel}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0,paddingLeft:12}}>
                          <div style={{color:"#16a34a",fontSize:26,fontWeight:900}}>{upcoming.fare?fmt(upcoming.fare)+" €":"—"}</div>
                          <span style={{background:sColor(upcoming.status)+"22",color:sColor(upcoming.status),borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700}}>{sLabel(upcoming.status)}</span>
                        </div>
                      </div>
                      <div style={{background:"linear-gradient(135deg,#eff6ff,#dbeafe)",borderRadius:12,padding:"14px",marginBottom:14,border:"1.5px solid #2563eb22"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <span style={{color:"#2563eb",fontSize:18}}>▶</span>
                          <span style={{color:"#0f172a",fontSize:13,fontWeight:600}}>{upcoming.origin}</span>
                        </div>
                        <div style={{height:1,background:"#2563eb22",margin:"0 28px 8px"}}/>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{color:"#ef4444",fontSize:18}}>■</span>
                          <span style={{color:"#0f172a",fontSize:13,fontWeight:600}}>{upcoming.destination}</span>
                        </div>
                      </div>
                      {upcoming.notes&&<div style={{background:"#fffbeb",border:"1.5px solid #f59e0b44",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#92400e",fontWeight:600}}>📝 {upcoming.notes}</div>}
                      <div style={{display:"flex",gap:10}}>
                        <a href={rUrl(upcoming.origin,upcoming.destination)} target="_blank" rel="noopener noreferrer" style={{flex:1,background:"linear-gradient(135deg,#1e3a8a,#2563eb)",borderRadius:12,padding:"12px 0",color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",textAlign:"center",boxShadow:"0 4px 12px rgba(37,99,235,0.3)"}}>🗺️ Navegar ruta</a>
                        <button onClick={()=>{mutate(upcoming.id,{status:"inprogress"});setDStatus("onroute");showToast("🚗 Viaje iniciado");}} style={{flex:1,background:"linear-gradient(135deg,#15803d,#22c55e)",border:"none",borderRadius:12,padding:"12px 0",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(34,197,94,0.3)"}}>🚦 Iniciar viaje</button>
                        <button onClick={()=>setChatB(upcoming)} style={{background:"linear-gradient(135deg,#6d28d9,#7c3aed)",border:"none",borderRadius:12,padding:"12px 16px",color:"#fff",fontSize:13,cursor:"pointer",position:"relative",boxShadow:"0 4px 12px rgba(124,58,237,0.3)"}}>
                          💬{(messages[String(upcoming.id)]||[]).filter(m=>m.from!=="driver").length>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#ef4444",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{(messages[String(upcoming.id)]||[]).filter(m=>m.from!=="driver").length}</span>}
                        </button>
                      </div>
                    </div>
                  ):(
                    <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}>
                      <div style={{fontSize:48,marginBottom:12}}>🏖</div>
                      <div style={{fontSize:15,fontWeight:600}}>Sin viajes programados</div>
                      <div style={{fontSize:12,marginTop:4}}>Disfruta del descanso</div>
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {/* Today summary */}
                  <div style={{background:"linear-gradient(135deg,#0f1729,#1e3a8a)",borderRadius:20,padding:"22px"}}>
                    <div style={{color:"rgba(255,255,255,0.6)",fontSize:11,letterSpacing:3,marginBottom:14}}>RESUMEN DE HOY</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      {[
                        {label:"Viajes",value:bookings.filter(b=>b.date===today).length},
                        {label:"Completados",value:todayDone.length},
                        {label:"Ganado",value:fmt(todayEarnings)+"€"},
                        {label:"Pendientes",value:pending.filter(b=>b.date===today).length},
                      ].map(s=>(
                        <div key={s.label} style={{background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"12px",backdropFilter:"blur(4px)"}}>
                          <div style={{color:"#fff",fontSize:22,fontWeight:900,lineHeight:1}}>{s.value}</div>
                          <div style={{color:"rgba(255,255,255,0.5)",fontSize:10,marginTop:4}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending list */}
                  <div style={{background:"#ffffff",borderRadius:20,padding:"20px",border:"2px solid #e2e8f0",flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <div style={{width:4,height:18,background:"#f59e0b",borderRadius:2}}/>
                      <span style={{color:"#0f172a",fontSize:13,fontWeight:800}}>SOLICITUDES PENDIENTES</span>
                      {pending.length>0&&<span style={{background:"#f59e0b",color:"#fff",borderRadius:10,padding:"1px 8px",fontSize:10,fontWeight:700,marginLeft:"auto"}}>{pending.length}</span>}
                    </div>
                    {pending.length===0?(
                      <div style={{textAlign:"center",color:"#94a3b8",padding:"20px 0",fontSize:13}}>Sin solicitudes</div>
                    ):pending.slice(0,4).map(b=>(
                      <div key={b.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{color:"#0f172a",fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.guest}</div>
                          <div style={{color:"#64748b",fontSize:11}}>{b.date} · {b.time} · {b.hotel}</div>
                        </div>
                        <div style={{display:"flex",gap:6,flexShrink:0}}>
                          <button onClick={()=>{mutate(b.id,{status:"confirmed"});showToast("✅ Aceptado: "+b.guest);}} style={{background:"linear-gradient(135deg,#15803d,#22c55e)",border:"none",borderRadius:8,color:"#fff",padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>✓ Aceptar</button>
                          <button onClick={()=>{mutate(b.id,{status:"rejected"});showToast("❌ Rechazado");}} style={{background:"linear-gradient(135deg,#ef4444,#b91c1c)",border:"none",borderRadius:8,color:"#fff",padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>✕</button>
                        </div>
                      </div>
                    ))}
                    {pending.length>4&&<button onClick={()=>setSection("pending")} style={{width:"100%",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 0",color:"#2563eb",fontSize:11,fontWeight:700,cursor:"pointer",marginTop:8}}>Ver todos ({pending.length})</button>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PENDING / CONFIRMED / HISTORY ── */}
          {(section==="pending"||section==="confirmed"||section==="history")&&(
            <BookingsTable
              bookings={section==="pending"?pending:section==="confirmed"?confirmed:history}
              messages={messages}
              isHistory={section==="history"}
              onAccept={section==="pending"?id=>{mutate(id,{status:"confirmed"});showToast("✅ Aceptado");}:null}
              onReject={section==="pending"?id=>{mutate(id,{status:"rejected"});showToast("❌ Rechazado");}:null}
              onStart={section==="confirmed"?id=>{mutate(id,{status:"inprogress"});setDStatus("onroute");showToast("🚗 Iniciado");}:null}
              onEnd={section==="confirmed"?id=>{mutate(id,{status:"completed"});setDStatus("free");showToast("🏁 Completado");}:null}
              onCancel={section==="confirmed"?id=>{mutate(id,{status:"cancelled",cancelReason:"Cancelado por conductor"});showToast("❌ Cancelado");}:null}
              onSelect={setSelected}
              onChat={setChatB}
            />
          )}

          {/* ── BILLING ── */}
          {section==="billing"&&<BillingSection bookings={bookings} fmt={fmt} CR={CR}/>}
        </main>
      </div>

      {/* ══ DETAIL PANEL ═════════════════════════════════════════════════════ */}
      {selected&&(
        <aside style={{width:360,background:"#ffffff",borderLeft:"2px solid #e2e8f0",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"-4px 0 20px rgba(0,0,0,0.06)",animation:"fadeIn 0.2s ease"}}>
          <div style={{padding:"20px 20px 16px",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{color:"#1e3a8a",fontSize:14,fontWeight:800}}>Detalle</div>
            <button onClick={()=>setSelected(null)} style={{background:"#f1f5f9",border:"none",borderRadius:8,color:"#64748b",width:30,height:30,cursor:"pointer",fontSize:16,fontWeight:700}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
            <DetailPanel b={selected} fmt={fmt} CR={CR} messages={messages} onSend={sendMsg} onChat={()=>setChatB(selected)}/>
          </div>
        </aside>
      )}

      {/* ══ CHAT PANEL ═══════════════════════════════════════════════════════ */}
      {chatB&&(
        <div style={{position:"fixed",bottom:20,right:20,width:380,height:500,background:"#ffffff",borderRadius:20,border:"2px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",zIndex:1000,overflow:"hidden",animation:"fadeIn 0.2s ease"}}>
          <div style={{padding:"16px 18px",background:"linear-gradient(135deg,#0f1729,#1e3a8a)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:"#fff",fontSize:14,fontWeight:800}}>💬 {chatB.guest}</div>
              <div style={{color:"#93c5fd",fontSize:10,marginTop:2}}>{chatB.date} · {chatB.time}</div>
            </div>
            <button onClick={()=>setChatB(null)} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,color:"#fff",width:28,height:28,cursor:"pointer",fontSize:14,fontWeight:700}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"14px",background:"#f8fafc"}}>
            {(messages[String(chatB.id)]||[]).map((m,i)=>{
              const mine=m.from==="driver";
              return(
                <div key={i} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",marginBottom:10}}>
                  <div style={{maxWidth:"78%",background:mine?"linear-gradient(135deg,#1e3a8a,#2563eb)":"#ffffff",borderRadius:mine?"16px 16px 2px 16px":"16px 16px 16px 2px",padding:"10px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                    {!mine&&<div style={{color:"#64748b",fontSize:10,fontWeight:600,marginBottom:3}}>{m.fromName||"Cliente"}</div>}
                    <div style={{color:mine?"#fff":"#0f172a",fontSize:12,lineHeight:1.5}}>{m.text}</div>
                    <div style={{color:mine?"rgba(255,255,255,0.5)":"#94a3b8",fontSize:9,marginTop:4,textAlign:"right"}}>{typeof m.ts==="number"?new Date(m.ts).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}):m.ts}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{padding:"12px 14px",borderTop:"1px solid #e2e8f0",display:"flex",gap:8,background:"#fff"}}>
            <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&chatMsg.trim()){sendMsg(chatB.id,chatMsg.trim());setChatMsg("");}}} placeholder="Escribe un mensaje..." style={{flex:1,background:"#f1f5f9",border:"2px solid #e2e8f0",borderRadius:12,padding:"10px 14px",fontSize:13,outline:"none",color:"#0f172a"}}/>
            <button onClick={()=>{if(chatMsg.trim()){sendMsg(chatB.id,chatMsg.trim());setChatMsg("");}}} style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb)",border:"none",borderRadius:12,color:"#fff",width:44,fontSize:16,cursor:"pointer",boxShadow:"0 2px 8px rgba(37,99,235,0.3)"}}>➤</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#0f172a",color:"#fff",padding:"12px 24px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:9999,animation:"fadeIn 0.2s ease",boxShadow:"0 8px 24px rgba(0,0,0,0.25)"}}>{toast}</div>}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const [pin,setPin]=useState("");
  const [err,setErr]=useState(false);
  const [shake,setShake]=useState(false);

  const digit=d=>{
    if(pin.length>=4)return;
    const next=pin+d;
    setPin(next);setErr(false);
    if(next.length===4){
      if(next===PIN){setTimeout(onLogin,400);}
      else{setTimeout(()=>{setShake(true);setTimeout(()=>{setShake(false);setPin("");setErr(true);},500);},200);}
    }
  };
  const del=()=>{setPin(p=>p.slice(0,-1));setErr(false);};

  return(
    <div style={{width:"100vw",height:"100vh",background:"#b0b0b0 url('/bg-driver-desktop-login.jpg') center top/cover no-repeat",display:"flex",alignItems:"flex-start",justifyContent:"center",overflow:"hidden",position:"relative"}}>
      <style>{CSS}</style>

      <div style={{textAlign:"center",width:320,zIndex:1,paddingTop:"58vh"}}>
        {/* Dots */}
        <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:err?10:20,animation:shake?"shake 0.4s ease":undefined}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{
              width:13,height:13,borderRadius:"50%",
              background:pin.length>i?(err?"#ef4444":"#2563eb"):"transparent",
              border:`2.5px solid ${pin.length>i?(err?"#ef4444":"#2563eb"):"rgba(0,0,0,0.25)"}`,
              transition:"all 0.2s",
              transform:pin.length>i?"scale(1.3)":"scale(1)",
              boxShadow:pin.length>i&&!err?"0 0 12px rgba(37,99,235,0.5)":"none",
            }}/>
          ))}
        </div>
        {err&&<div style={{color:"#ef4444",fontSize:11,fontWeight:700,marginBottom:10,letterSpacing:1,textShadow:"0 1px 2px rgba(255,255,255,0.8)"}}>PIN INCORRECTO</div>}

        {/* Keypad */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:270,margin:"0 auto"}}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
            <button key={i} className="pin-btn" onClick={()=>d===""?null:d==="⌫"?del():digit(String(d))} disabled={d===""} style={{
              height:60,borderRadius:12,
              border:d===""?"none":`1px solid ${d==="⌫"?"rgba(0,0,0,0.1)":"rgba(37,99,235,0.35)"}`,
              background:d===""?"transparent":d==="⌫"?"rgba(0,0,0,0.06)":"rgba(37,99,235,0.12)",
              color:d==="⌫"?"rgba(0,0,0,0.35)":"#1e3a8a",
              fontSize:d==="⌫"?22:24,fontWeight:700,
              cursor:d===""?"default":"pointer",
              backdropFilter:"blur(8px)",
              boxShadow:d===""?"none":"0 1px 4px rgba(0,0,0,0.08)",
            }}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BOOKINGS TABLE ───────────────────────────────────────────────────────────
function BookingsTable({bookings,messages,isHistory,onAccept,onReject,onStart,onEnd,onCancel,onSelect,onChat}){
  if(!bookings.length)return(
    <div style={{textAlign:"center",padding:"80px 0",color:"#94a3b8",background:"#ffffff",borderRadius:20,border:"2px solid #e2e8f0"}}>
      <div style={{fontSize:52,marginBottom:14}}>📭</div>
      <div style={{fontSize:16,fontWeight:600}}>Sin viajes en esta sección</div>
    </div>
  );
  return(
    <div style={{background:"#ffffff",borderRadius:20,border:"2px solid #e2e8f0",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
      <div style={{padding:"18px 24px",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f8fafc"}}>
        <div style={{color:"#1e3a8a",fontSize:14,fontWeight:800}}>{bookings.length} viaje{bookings.length!==1?"s":""}</div>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:800}}>
          <thead>
            <tr>
              {["Cliente","Fecha & Hora","Ruta","Tarifa","Estado","Acciones"].map(h=>(
                <th key={h} style={{padding:"11px 20px",textAlign:"left",color:"#64748b",fontSize:11,fontWeight:700,letterSpacing:0.5,borderBottom:"2px solid #e2e8f0",background:"#f8fafc",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map(b=>{
              const unread=(messages[String(b.id)]||[]).filter(m=>m.from!=="driver").length;
              return(
                <tr key={b.id} className="row-hover" style={{borderBottom:"1px solid #f1f5f9",cursor:"pointer",transition:"background 0.1s"}} onClick={()=>onSelect&&onSelect(b)}>
                  <td style={{padding:"14px 20px"}}>
                    <div style={{color:"#0f172a",fontSize:13,fontWeight:700}}>{b.guest}</div>
                    <div style={{color:"#94a3b8",fontSize:10,marginTop:2}}>{b.hotel}</div>
                    {b.notes&&<div style={{color:"#d97706",fontSize:10,marginTop:3}}>📝 {b.notes.slice(0,28)}{b.notes.length>28?"…":""}</div>}
                  </td>
                  <td style={{padding:"14px 20px",whiteSpace:"nowrap"}}>
                    <div style={{color:"#0f172a",fontSize:12,fontWeight:600}}>{b.date}</div>
                    <div style={{color:"#1e3a8a",fontSize:16,fontWeight:900}}>{b.time}</div>
                  </td>
                  <td style={{padding:"14px 20px",maxWidth:220}}>
                    <div style={{color:"#2563eb",fontSize:11,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>▶ {(b.origin||"").split(",")[0]}</div>
                    <div style={{color:"#ef4444",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>■ {(b.destination||"").split(",")[0]}</div>
                  </td>
                  <td style={{padding:"14px 20px",whiteSpace:"nowrap"}}>
                    <div style={{color:"#16a34a",fontSize:16,fontWeight:900}}>{b.fare?fmt(b.fare)+" €":"—"}</div>
                  </td>
                  <td style={{padding:"14px 20px"}}>
                    <span style={{background:sColor(b.status)+"18",color:sColor(b.status),borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{sLabel(b.status)}</span>
                  </td>
                  <td style={{padding:"14px 20px"}} onClick={e=>e.stopPropagation()}>
                    <div style={{display:"flex",gap:6,flexWrap:"nowrap"}}>
                      {onAccept&&<button onClick={()=>onAccept(b.id)} style={{background:"#22c55e",border:"none",borderRadius:8,color:"#fff",padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>✓ Aceptar</button>}
                      {onReject&&<button onClick={()=>onReject(b.id)} style={{background:"#ef4444",border:"none",borderRadius:8,color:"#fff",padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>✕</button>}
                      {onStart&&b.status==="confirmed"&&<button onClick={()=>onStart(b.id)} style={{background:"#2563eb",border:"none",borderRadius:8,color:"#fff",padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Iniciar</button>}
                      {onEnd&&b.status==="inprogress"&&<button onClick={()=>onEnd(b.id)} style={{background:"#16a34a",border:"none",borderRadius:8,color:"#fff",padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Terminar</button>}
                      {onCancel&&!["completed","cancelled","rejected"].includes(b.status)&&<button onClick={()=>onCancel(b.id)} style={{background:"#f97316",border:"none",borderRadius:8,color:"#fff",padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Cancelar</button>}
                      {onChat&&<button onClick={()=>onChat(b)} style={{position:"relative",background:"#7c3aed",border:"none",borderRadius:8,color:"#fff",padding:"5px 10px",fontSize:13,cursor:"pointer"}}>
                        💬{unread>0&&<span style={{position:"absolute",top:-5,right:-5,background:"#ef4444",borderRadius:"50%",width:15,height:15,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{unread}</span>}
                      </button>}
                      <a href={mUrl(b.origin||b.destination)} target="_blank" rel="noopener noreferrer" style={{background:"#eff6ff",borderRadius:8,color:"#2563eb",padding:"5px 10px",fontSize:11,fontWeight:700,textDecoration:"none"}}>📍</a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({b,fmt,CR,messages,onSend,onChat}){
  const [msg,setMsg]=useState("");
  return(
    <div>
      <div style={{background:sColor(b.status)+"15",border:`2px solid ${sColor(b.status)}33`,borderRadius:14,padding:"16px",marginBottom:16}}>
        <div style={{color:"#0f172a",fontSize:22,fontWeight:900,lineHeight:1,marginBottom:6}}>{b.guest}</div>
        <span style={{background:sColor(b.status),color:"#fff",borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700}}>{sLabel(b.status)}</span>
      </div>
      {[["📅 Fecha",b.date],["🕐 Hora",b.time],["👥 Pasajeros",b.passengers+" pax"],["🏨 Hotel",b.hotel],["💳 Pago",b.paymentMethod==="card"?"Tarjeta":"Efectivo"],["📞 Teléfono",b.guestPhone]].filter(([,v])=>v).map(([k,v])=>(
        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #f1f5f9"}}>
          <span style={{color:"#64748b",fontSize:12}}>{k}</span>
          <span style={{color:"#0f172a",fontSize:12,fontWeight:600}}>{v}</span>
        </div>
      ))}
      {b.notes&&<div style={{background:"#fffbeb",borderRadius:10,padding:"10px 12px",margin:"12px 0",fontSize:12,color:"#92400e",fontWeight:600}}>📝 {b.notes}</div>}
      {b.fare&&<div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"2px solid #22c55e33",borderRadius:12,padding:"14px",margin:"12px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{color:"#15803d",fontSize:12,fontWeight:700}}>Total viaje</span>
          <span style={{color:"#16a34a",fontSize:22,fontWeight:900}}>{fmt(b.fare)} €</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{color:"#64748b",fontSize:11}}>Tu ganancia</span>
          <span style={{color:"#16a34a",fontSize:14,fontWeight:700}}>{fmt(b.fare*(1-CR))} €</span>
        </div>
      </div>}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
        <a href={rUrl(b.origin,b.destination)} target="_blank" rel="noopener noreferrer" style={{display:"block",background:"linear-gradient(135deg,#1e3a8a,#2563eb)",borderRadius:10,padding:"10px 0",color:"#fff",fontSize:12,fontWeight:700,textDecoration:"none",textAlign:"center",boxShadow:"0 3px 10px rgba(37,99,235,0.3)"}}>🗺️ Ver ruta completa</a>
        <button onClick={onChat} style={{background:"linear-gradient(135deg,#6d28d9,#7c3aed)",border:"none",borderRadius:10,padding:"10px 0",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>💬 Abrir chat</button>
      </div>
      {/* Mini chat */}
      <div style={{marginTop:16}}>
        <div style={{color:"#1e3a8a",fontSize:11,fontWeight:800,letterSpacing:1,marginBottom:8}}>ÚLTIMOS MENSAJES</div>
        <div style={{height:110,overflowY:"auto",background:"#f8fafc",borderRadius:10,padding:"8px",marginBottom:8,border:"1px solid #e2e8f0"}}>
          {(messages[String(b.id)]||[]).length===0?<div style={{textAlign:"center",color:"#94a3b8",fontSize:11,paddingTop:16}}>Sin mensajes</div>:
          (messages[String(b.id)]||[]).slice(-8).map((m,i)=>(
            <div key={i} style={{textAlign:m.from==="driver"?"right":"left",marginBottom:5}}>
              <span style={{background:m.from==="driver"?"#1e3a8a":"#e2e8f0",color:m.from==="driver"?"#fff":"#0f172a",borderRadius:8,padding:"4px 10px",fontSize:11,display:"inline-block",maxWidth:"85%"}}>{m.text}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:6}}>
          <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&msg.trim()){onSend(b.id,msg.trim());setMsg("");}}} placeholder="Mensaje rápido..." style={{flex:1,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:12,outline:"none"}}/>
          <button onClick={()=>{if(msg.trim()){onSend(b.id,msg.trim());setMsg("");}}} style={{background:"#1e3a8a",border:"none",borderRadius:8,color:"#fff",width:34,cursor:"pointer",fontSize:14}}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ─── BILLING ──────────────────────────────────────────────────────────────────
function BillingSection({bookings,fmt,CR}){
  const done=bookings.filter(b=>b.status==="completed");
  const gross=done.reduce((s,b)=>s+Number(b.fare||0),0);
  const net=gross*(1-CR);
  const now=new Date();
  const months=Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const total=done.filter(b=>b.date?.startsWith(key)).reduce((s,b)=>s+Number(b.fare||0),0);
    return{key,label:d.toLocaleDateString("es-ES",{month:"short"}).toUpperCase(),total};
  });
  const maxM=Math.max(...months.map(m=>m.total),1);
  return(
    <div style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:20}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {[
          {label:"Total facturado",value:fmt(gross)+" €",color:"#1e3a8a",bg:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"#2563eb"},
          {label:"Comisiones hoteles (20%)",value:"-"+fmt(gross*CR)+" €",color:"#d97706",bg:"#fffbeb",border:"#f59e0b"},
          {label:"Tu ganancia neta",value:fmt(net)+" €",color:"#16a34a",bg:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"#22c55e",big:true},
        ].map(k=>(
          <div key={k.label} style={{background:k.bg,border:`2px solid ${k.border}33`,borderRadius:16,padding:"22px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
            <div style={{color:"#64748b",fontSize:11,fontWeight:600,letterSpacing:0.3,marginBottom:8}}>{k.label}</div>
            <div style={{color:k.color,fontSize:k.big?36:24,fontWeight:900,lineHeight:1}}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#ffffff",borderRadius:20,padding:"24px",border:"2px solid #e2e8f0",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <div style={{width:4,height:20,background:"linear-gradient(180deg,#1e3a8a,#2563eb)",borderRadius:2}}/>
          <span style={{color:"#1e3a8a",fontSize:13,fontWeight:800,letterSpacing:2}}>INGRESOS POR MES</span>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:16,height:180,marginBottom:16}}>
          {months.map((m,i)=>(
            <div key={m.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              {m.total>0&&<div style={{color:"#64748b",fontSize:10,fontWeight:600}}>{m.total>=1000?(m.total/1000).toFixed(1)+"k":fmt(m.total)}</div>}
              <div style={{width:"100%",borderRadius:"6px 6px 0 0",height:Math.max((m.total/maxM)*100,2)+"%",background:i===5?"linear-gradient(180deg,#38bdf8,#2563eb)":"linear-gradient(180deg,#bfdbfe,#93c5fd)",transition:"height 0.4s ease",minHeight:4,boxShadow:i===5?"0 4px 12px rgba(37,99,235,0.3)":"none"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:16}}>
          {months.map((m,i)=><div key={m.key} style={{flex:1,textAlign:"center",color:i===5?"#2563eb":"#94a3b8",fontSize:10,fontWeight:i===5?700:400}}>{m.label}</div>)}
        </div>
        <div style={{borderTop:"2px solid #e2e8f0",marginTop:16,paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:"#64748b",fontSize:12,fontWeight:600}}>Total últimos 6 meses</span>
          <span style={{color:"#1e3a8a",fontSize:20,fontWeight:900}}>{fmt(months.reduce((s,m)=>s+m.total,0))} €</span>
        </div>
      </div>
    </div>
  );
}

// ─── LIVE CLOCK ───────────────────────────────────────────────────────────────
function LiveClock(){
  const [t,setT]=useState(new Date());
  useEffect(()=>{const id=setInterval(()=>setT(new Date()),1000);return()=>clearInterval(id);},[]);
  const pad=n=>String(n).padStart(2,"0");
  return(
    <div style={{textAlign:"right"}}>
      <div style={{color:"#0f172a",fontSize:18,fontWeight:800,fontVariantNumeric:"tabular-nums",lineHeight:1}}>{pad(t.getHours())}:{pad(t.getMinutes())}<span style={{color:"#94a3b8",fontSize:13}}>:{pad(t.getSeconds())}</span></div>
      <div style={{color:"#94a3b8",fontSize:10,marginTop:2,textTransform:"capitalize"}}>{t.toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"})}</div>
    </div>
  );
}
