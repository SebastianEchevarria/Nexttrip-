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
const t2m = t=>{ if(!t)return 0; const [h,m]=t.split(":").map(Number); return h*60+m; };
const TRIP_DURATION = 45; // minutos bloqueados por viaje

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

  // Countdown tick for "Próximo viaje"
  const [nowTick,setNowTick]=useState(()=>new Date());
  useEffect(()=>{const t=setInterval(()=>setNowTick(new Date()),1000);return()=>clearInterval(t);},[]);

  // Phase tracking — persisted so a page refresh doesn't lose progress
  const [arrivedBookingId,setArrivedBookingId]=useState(()=>{try{return localStorage.getItem("velo_desktop_arrived_id")||null;}catch{return null;}});
  useEffect(()=>{try{localStorage.setItem("velo_desktop_arrived_id",arrivedBookingId||"");}catch{}},[arrivedBookingId]);
  const [tripStarted,setTripStarted]=useState(()=>{try{return localStorage.getItem("velo_desktop_trip_started")==="1";}catch{return false;}});
  useEffect(()=>{try{localStorage.setItem("velo_desktop_trip_started",tripStarted?"1":"0");}catch{}},[tripStarted]);
  const [showQuickMsgs,setShowQuickMsgs]=useState(false);
  const [cancelConfirm,setCancelConfirm]=useState(null);

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
  // Update local driver status AND push it to Firebase (merge-style, preserves serviceStatus/driverArrived)
  const setDriverStatusRemote=status=>{
    setDStatus(status);
    fbGet("nexttrip/status").then(cur=>{
      fbSet("nexttrip/status",{...(cur||{}),driverStatus:status,updatedAt:Date.now()});
    });
  };
  // "He llegado" — marks arrival, notifies client, starts the 10-min courtesy window
  const onArrive=b=>{
    setArrivedBookingId(b.id);
    setShowQuickMsgs(false);
    const waitEnd=new Date(new Date(`${b.date}T${b.time}:00`).getTime()+10*60*1000);
    const wH=String(waitEnd.getHours()).padStart(2,"0"),wM=String(waitEnd.getMinutes()).padStart(2,"0");
    fbGet("nexttrip/status").then(cur=>{
      fbSet("nexttrip/status",{...(cur||{}),driverArrived:{bookingId:b.id,arrivedAt:Date.now()},updatedAt:Date.now()});
    });
    sendMsg(b.id,`🚗 He llegado al punto de recogida y estoy esperándote. El tiempo de espera de 10 minutos comienza a las ${b.time} (hora de tu reserva) y finaliza a las ${wH}:${wM}.`);
    showToast("✅ Cliente notificado — esperando desde las "+b.time);
  };
  // Clear the "driver arrived" flag in Firebase (keeps other status fields)
  const clearArrived=()=>{
    fbGet("nexttrip/status").then(cur=>{const u={...(cur||{})};delete u.driverArrived;fbSet("nexttrip/status",{...u,updatedAt:Date.now()});});
  };
  const onCancelTrip=(id,reason)=>{
    mutate(id,{status:"cancelled",cancelReason:reason});
    setArrivedBookingId(null);
    setTripStarted(false);
    setDriverStatusRemote("free");
    clearArrived();
  };

  if(!loggedIn) return <LoginScreen onLogin={()=>setLoggedIn(true)}/>;

  const today=new Date().toISOString().slice(0,10);
  const pending  =bookings.filter(b=>b.status==="pending");
  const confirmed=bookings.filter(b=>["confirmed","inprogress"].includes(b.status));
  const history  =bookings.filter(b=>["completed","cancelled","rejected"].includes(b.status)).slice(-30).reverse();
  const todayDone=bookings.filter(b=>b.date===today&&b.status==="completed");
  const todayEarnings=todayDone.reduce((s,b)=>s+Number(b.fare||0),0);
  const totalGross=bookings.filter(b=>b.status==="completed").reduce((s,b)=>s+Number(b.fare||0),0);
  const upcoming=[...bookings]
    .filter(b=>(b.status==="confirmed"||b.status==="inprogress"))
    .sort((a,b)=>new Date(`${a.date}T${a.time}:00`)-new Date(`${b.date}T${b.time}:00`))
    .find(b=>{const dt=new Date(`${b.date}T${b.time}:00`);return dt-nowTick>-TRIP_DURATION*60*1000;});
  const isOnRoute=dStatus==="onroute";

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
            {id:"calendar",  icon:"📅",label:"Calendario"},
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
              {{dashboard:"Dashboard",calendar:"Calendario",pending:"Viajes Pendientes",confirmed:"Viajes Confirmados",history:"Historial",billing:"Facturación"}[section]}
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
                <NextTripCard
                  upcoming={upcoming}
                  nowTick={nowTick}
                  fmt={fmt}
                  messages={messages}
                  isOnRoute={isOnRoute}
                  tripStarted={tripStarted}
                  setTripStarted={setTripStarted}
                  arrivedBookingId={arrivedBookingId}
                  setArrivedBookingId={setArrivedBookingId}
                  showQuickMsgs={showQuickMsgs}
                  setShowQuickMsgs={setShowQuickMsgs}
                  cancelConfirm={cancelConfirm}
                  setCancelConfirm={setCancelConfirm}
                  onStartTrip={id=>{mutate(id,{status:"inprogress"});setDriverStatusRemote("onroute");setTripStarted(true);showToast("🚗 Viaje iniciado");}}
                  onEndTrip={id=>{mutate(id,{status:"completed"});setDriverStatusRemote("free");setTripStarted(false);setArrivedBookingId(null);clearArrived();showToast("✅ Viaje completado");}}
                  onCancelTrip={onCancelTrip}
                  onArrive={onArrive}
                  sendMsg={sendMsg}
                  setChatB={setChatB}
                  setDriverStatusRemote={setDriverStatusRemote}
                  showToast={showToast}
                />

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

          {/* ── CALENDARIO ── */}
          {section==="calendar"&&<CalendarSection bookings={bookings} onSelect={setSelected}/>}

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

// ─── NEXT TRIP CARD (cuenta regresiva + fases) ─────────────────────────────────
function NextTripCard({upcoming,nowTick,fmt,messages,isOnRoute,tripStarted,setTripStarted,arrivedBookingId,setArrivedBookingId,showQuickMsgs,setShowQuickMsgs,cancelConfirm,setCancelConfirm,onStartTrip,onEndTrip,onCancelTrip,onArrive,sendMsg,setChatB,setDriverStatusRemote,showToast}){
  if(!upcoming){
    return(
      <div style={{background:"#ffffff",borderRadius:20,padding:"24px",border:"2px solid #e2e8f0",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
          <div style={{width:4,height:20,background:"linear-gradient(180deg,#1e3a8a,#2563eb)",borderRadius:2}}/>
          <span style={{color:"#1e3a8a",fontSize:13,fontWeight:800,letterSpacing:2}}>PRÓXIMO VIAJE</span>
        </div>
        <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}>
          <div style={{fontSize:48,marginBottom:12}}>🏖</div>
          <div style={{fontSize:15,fontWeight:600}}>Sin viajes programados</div>
          <div style={{fontSize:12,marginTop:4}}>Disfruta del descanso</div>
        </div>
      </div>
    );
  }

  const tripDt=new Date(`${upcoming.date}T${upcoming.time}:00`);
  const diffMs=tripDt-nowTick;
  // isOngoing: SOLO cuando el conductor pulsó "Iniciar viaje" (status inprogress)
  const isOngoing=upcoming.status==="inprogress"||tripStarted;
  // isWaiting: la hora llegó a 0 pero no se inició viaje — ventana de 10 min antes de "He llegado"
  const isWaiting=diffMs<0&&diffMs>-10*60*1000&&!isOngoing;
  const waitMs=10*60*1000+diffMs;
  const absDiff=isWaiting?Math.abs(waitMs):Math.abs(diffMs);
  const totalSecs=Math.floor(absDiff/1000);
  const days=Math.floor(totalSecs/86400);
  const hrs=Math.floor((totalSecs%86400)/3600);
  const mins=Math.floor((totalSecs%3600)/60);
  const secs=totalSecs%60;
  const pad=n=>String(n).padStart(2,"0");
  const countdownStr=days>0?`${days}d ${pad(hrs)}h ${pad(mins)}m`:`${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  const urgency=!isOngoing&&!isWaiting&&diffMs<30*60*1000&&diffMs>0;
  const mapsPickup=mUrl(upcoming.origin);
  const unread=(messages[String(upcoming.id)]||[]).filter(m=>m.from!=="driver").length;

  const accent=isOngoing?"#16a34a":isWaiting?"#ef4444":urgency?"#f59e0b":"#2563eb";
  const bg=isOngoing?"linear-gradient(135deg,#dcfce7,#f0fdf4)":isWaiting?"#fff0f0":urgency?"#fffbeb":"#ffffff";

  return(
    <div style={{background:bg,border:`2.5px solid ${accent}`,borderRadius:20,padding:"24px",boxShadow:`0 4px 20px ${accent}22`}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:9,height:9,borderRadius:"50%",background:accent,animation:"pulse 1.2s infinite",flexShrink:0}}/>
          <span style={{color:accent,fontSize:12,letterSpacing:2,fontWeight:800}}>
            {isOngoing?"EN CURSO":isWaiting?"⏳ EN ESPERA — CLIENTE NO LLEGÓ":urgency?"PRÓXIMO VIAJE — ¡PRONTO!":"PRÓXIMO VIAJE"}
          </span>
        </div>
        <span style={{background:accent+"18",border:`1px solid ${accent}44`,borderRadius:8,padding:"3px 12px",color:accent,fontSize:11,fontWeight:700}}>
          {isWaiting?"🔴 EN ESPERA":"✅ Confirmado"}
        </span>
      </div>

      {/* Guest + fare */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{color:"#0f172a",fontSize:26,fontWeight:900,lineHeight:1}}>{upcoming.guest}</div>
          <div style={{color:"#64748b",fontSize:12,marginTop:6}}>{upcoming.date} · <strong style={{color:"#1e3a8a"}}>{upcoming.time}</strong> · {upcoming.passengers} pax · {upcoming.hotel}</div>
        </div>
        {upcoming.fare>0&&(
          <div style={{textAlign:"right",flexShrink:0,paddingLeft:12}}>
            <div style={{color:"#16a34a",fontSize:26,fontWeight:900}}>{fmt(upcoming.fare)} €</div>
            <span style={{background:sColor(upcoming.status)+"22",color:sColor(upcoming.status),borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700}}>{sLabel(upcoming.status)}</span>
          </div>
        )}
      </div>

      {/* Route */}
      <div style={{background:"linear-gradient(135deg,#eff6ff,#dbeafe)",borderRadius:12,padding:"14px",marginBottom:12,border:"1.5px solid #2563eb22"}}>
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

      {/* Notes */}
      {upcoming.notes&&upcoming.notes.trim()&&(
        <div style={{background:"#fffbeb",border:"1.5px solid #f59e0b44",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#92400e",fontWeight:600}}>📝 {upcoming.notes}</div>
      )}

      {/* Countdown */}
      <div style={{background:isOngoing?"#dcfce7":isWaiting?"#fee2e2":urgency?"#fef3c7":"#eff6ff",borderRadius:12,padding:"14px 18px",marginBottom:16,border:`1.5px solid ${accent}33`}}>
        <div style={{color:isOngoing?"#16a34a":urgency?"#d97706":"#1e3a8a",fontSize:11,fontWeight:700,letterSpacing:2,marginBottom:4}}>{isOngoing?"EN CURSO":isWaiting?"⏳ EN ESPERA":"TIEMPO RESTANTE"}</div>
        <div style={{color:isOngoing?"#16a34a":isWaiting?"#ef4444":urgency?"#d97706":"#0f172a",fontSize:36,fontFamily:"'Inter',sans-serif",fontWeight:900,letterSpacing:2}}>{countdownStr}</div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>

        {/* ── FASE 1: antes de llegar — Punto recogida + Chat + Mensajes rápidos + He llegado ── */}
        {arrivedBookingId!==upcoming.id&&!isOngoing&&upcoming.status!=="inprogress"&&(
          <>
            <div style={{display:"flex",gap:10}}>
              {mapsPickup&&(
                <a href={mapsPickup} target="_blank" rel="noopener noreferrer" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:"#f0fdf4",border:"2px solid #22c55e55",borderRadius:10,padding:"12px 0",color:"#15803d",fontSize:13,fontWeight:700,textDecoration:"none"}}>🗺️ Punto recogida</a>
              )}
              <button onClick={()=>setChatB(upcoming)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:"#f5f3ff",border:"2px solid #7c3aed44",borderRadius:10,padding:"12px 0",color:"#7c3aed",fontSize:13,fontWeight:700,cursor:"pointer",position:"relative"}}>
                💬 Chat
                {unread>0&&<span style={{position:"absolute",top:-6,right:-6,background:"#ef4444",color:"#fff",borderRadius:"50%",width:18,height:18,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{unread}</span>}
              </button>
              <button onClick={()=>setShowQuickMsgs(v=>!v)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:showQuickMsgs?"#f0fdf4":"#fffbeb",border:`2px solid ${showQuickMsgs?"#22c55e55":"#f59e0b44"}`,borderRadius:10,padding:"12px 0",color:showQuickMsgs?"#15803d":"#d97706",fontSize:13,fontWeight:700,cursor:"pointer"}}>⚡ Rápidos</button>
            </div>

            {/* INICIAR VIAJE — aparece tras "Estoy en camino" */}
            {isOnRoute&&!tripStarted&&upcoming.destination&&(
              <a href={mUrl(upcoming.destination)} target="_blank" rel="noopener noreferrer"
                onClick={()=>{onStartTrip(upcoming.id);setShowQuickMsgs(false);}}
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"linear-gradient(135deg,#1e3a8a,#2563eb)",border:"none",borderRadius:12,padding:"14px 0",color:"#ffffff",fontSize:13,fontWeight:700,textDecoration:"none",boxShadow:"0 4px 12px rgba(37,99,235,0.3)"}}>
                🗺️ Iniciar viaje → {upcoming.destination.split(",")[0]}
              </a>
            )}

            {/* Mensajes rápidos */}
            {showQuickMsgs&&(
              <div style={{background:"#ffffff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"14px",display:"flex",flexDirection:"column",gap:8}}>
                <div style={{color:"#64748b",fontSize:10,letterSpacing:2,marginBottom:2}}>MENSAJES RÁPIDOS</div>
                {[
                  {es:"🚗 Estoy en camino."},
                  {es:"⏱️ Llegaré en aproximadamente 10 minutos."},
                  {es:"🅿️ Estoy aparcado esperándote en el punto de recogida."},
                  {es:"📞 Por favor llámame si tienes algún problema para encontrarme."},
                ].map((msg,i)=>(
                  <button key={i} onClick={()=>{
                    sendMsg(upcoming.id,msg.es);
                    if(i===0){setDriverStatusRemote("onroute");setTripStarted(false);}
                    setShowQuickMsgs(false);
                    showToast("✅ Mensaje enviado");
                  }} style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"10px 12px",color:"#0f172a",fontSize:12,textAlign:"left",cursor:"pointer"}}>{msg.es}</button>
                ))}
              </div>
            )}

            {/* HE LLEGADO */}
            <button onClick={()=>onArrive(upcoming)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:12,padding:"14px 0",color:"#ffffff",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(34,197,94,0.3)"}}>🚗 He llegado</button>
          </>
        )}

        {/* ── FASE 2: He llegado — espera 15 min + Iniciar viaje + Chat ── */}
        {arrivedBookingId===upcoming.id&&!isOngoing&&upcoming.status!=="inprogress"&&(
          <>
            {(()=>{
              const bookingTime=tripDt.getTime();
              const now=nowTick.getTime();
              const beforeBooking=now<bookingTime;
              const waitingMs=now-bookingTime;
              const waitEndMs=bookingTime+15*60*1000;
              const isExpired=waitingMs>0&&now>waitEndMs;
              const remainingSecs=Math.floor(Math.max(0,waitEndMs-now)/1000);
              const waitCountStr=`${pad(Math.floor(remainingSecs/60))}:${pad(remainingSecs%60)}`;

              if(beforeBooking){
                return(
                  <div style={{background:"#eff6ff",border:"2px solid #2563eb44",borderRadius:12,padding:"14px",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20}}>✅</span>
                    <div>
                      <div style={{color:"#1e3a8a",fontSize:13,fontWeight:700}}>Has llegado al punto de recogida</div>
                      <div style={{color:"#64748b",fontSize:11,marginTop:2}}>La espera de 15 min empieza a las <strong>{upcoming.time}</strong></div>
                    </div>
                  </div>
                );
              }
              if(isExpired){
                return(
                  <div style={{background:"#fff0f0",border:"2px solid #ef4444",borderRadius:12,padding:"14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:18}}>⏰</span>
                      <div style={{color:"#ef4444",fontSize:13,fontWeight:700}}>Tiempo de espera agotado</div>
                    </div>
                    <div style={{color:"#64748b",fontSize:11,marginBottom:12}}>Han pasado 15 minutos desde la hora de la reserva</div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>{
                        sendMsg(upcoming.id,`❌ El conductor ha cancelado la reserva por no presentación del cliente.\n📅 ${upcoming.date} · ${upcoming.time}\n📍 ${upcoming.origin}`);
                        onCancelTrip(upcoming.id,"No-show: cliente no se presentó");
                        showToast("❌ Reserva cancelada por no presentación");
                      }} style={{flex:1,background:"linear-gradient(135deg,#ef4444,#b91c1c)",border:"none",borderRadius:10,padding:"11px 0",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>❌ Cancelar reserva</button>
                      <button onClick={()=>{onArrive(upcoming);showToast("⏳ Esperando más tiempo...");}} style={{flex:1,background:"#f0fdf4",border:"2px solid #22c55e44",borderRadius:10,padding:"11px 0",color:"#16a34a",fontSize:12,fontWeight:700,cursor:"pointer"}}>⏳ Seguir esperando</button>
                    </div>
                  </div>
                );
              }
              return(
                <div style={{background:"#fffbeb",border:"2px solid #f59e0b44",borderRadius:12,padding:"14px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:18}}>⏰</span>
                      <div>
                        <div style={{color:"#d97706",fontSize:12,fontWeight:700}}>Esperando al cliente</div>
                        <div style={{color:"#64748b",fontSize:10}}>Desde las {upcoming.time} · 15 min máx.</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{color:"#d97706",fontSize:22,fontWeight:900,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{waitCountStr}</div>
                      <div style={{color:"#64748b",fontSize:9}}>restantes</div>
                    </div>
                  </div>
                  <div style={{height:6,background:"#fef3c7",borderRadius:3,overflow:"hidden",marginBottom:12}}>
                    <div style={{height:"100%",background:"linear-gradient(90deg,#f59e0b,#ef4444)",borderRadius:3,width:`${Math.min(100,(Math.max(0,waitingMs)/(15*60*1000))*100)}%`,transition:"width 1s linear"}}/>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{
                      sendMsg(upcoming.id,`❌ El conductor ha cancelado la reserva por no presentación del cliente.\n📅 ${upcoming.date} · ${upcoming.time}\n📍 ${upcoming.origin}`);
                      onCancelTrip(upcoming.id,"No-show: cliente no se presentó");
                      showToast("❌ Reserva cancelada por no presentación");
                    }} style={{flex:1,background:"linear-gradient(135deg,#ef4444,#b91c1c)",border:"none",borderRadius:10,padding:"10px 0",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>❌ Cancelar</button>
                    <button onClick={()=>{onArrive(upcoming);showToast("⏳ Esperando más tiempo...");}} style={{flex:1,background:"#f0fdf4",border:"2px solid #22c55e44",borderRadius:10,padding:"10px 0",color:"#16a34a",fontSize:12,fontWeight:700,cursor:"pointer"}}>⏳ Seguir esperando</button>
                  </div>
                </div>
              );
            })()}

            {/* Iniciar viaje → Maps al destino */}
            <a href={mUrl(upcoming.destination||upcoming.origin)} target="_blank" rel="noopener noreferrer"
              onClick={()=>{onStartTrip(upcoming.id);setShowQuickMsgs(false);}}
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"linear-gradient(135deg,#1e3a8a,#2563eb)",border:"none",borderRadius:12,padding:"14px 0",color:"#ffffff",fontSize:13,fontWeight:700,textDecoration:"none",boxShadow:"0 3px 12px rgba(37,99,235,0.35)"}}>
              🗺️ Iniciar viaje → {upcoming.destination||upcoming.origin}
            </a>
            <button onClick={()=>setChatB(upcoming)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:"#f5f3ff",border:"2px solid #7c3aed44",borderRadius:10,padding:"12px 0",color:"#7c3aed",fontSize:13,fontWeight:700,cursor:"pointer"}}>💬 Chat con cliente</button>
          </>
        )}

        {/* ── FASE 3: en curso — Terminar viaje ── */}
        {(upcoming.status==="inprogress"||tripStarted||isOngoing)&&(
          <button onClick={()=>onEndTrip(upcoming.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:12,padding:"15px 0",color:"#ffffff",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(34,197,94,0.3)"}}>🏁 Terminar viaje</button>
        )}

        {/* ── CANCELAR RESERVA — con motivos ── */}
        {!cancelConfirm?(
          <button onClick={()=>setCancelConfirm({step:"choose",reason:"",custom:""})} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:"#fff5f5",border:"1.5px solid #ef444466",borderRadius:10,padding:"10px 0",color:"#ef4444aa",fontSize:12,fontWeight:700,cursor:"pointer"}}>✕ Cancelar reserva</button>
        ):cancelConfirm.step==="choose"?(
          <div style={{background:"#fff5f5",border:"2px solid #ef4444",borderRadius:12,padding:"14px"}}>
            <div style={{color:"#0f172a",fontSize:13,fontWeight:700,textAlign:"center",marginBottom:4}}>⚠️ Motivo de cancelación</div>
            <div style={{color:"#64748b",fontSize:11,textAlign:"center",marginBottom:12}}>Selecciona el motivo</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {id:"noshow",label:"👤 El cliente no se presentó"},
                {id:"condition",label:"🚫 El cliente no está en condiciones"},
                {id:"other",label:"📝 Otros motivos"},
              ].map(opt=>(
                <button key={opt.id} onClick={()=>setCancelConfirm({step:opt.id==="other"?"custom":"confirm",reason:opt.label,custom:""})} style={{background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:10,padding:"10px 14px",color:"#0f172a",fontSize:12,fontWeight:600,cursor:"pointer",textAlign:"left"}}>{opt.label}</button>
              ))}
              <button onClick={()=>setCancelConfirm(null)} style={{background:"transparent",border:"1px solid #cbd5e1",borderRadius:8,padding:"8px 0",color:"#64748b",fontSize:11,cursor:"pointer"}}>← Volver</button>
            </div>
          </div>
        ):cancelConfirm.step==="custom"?(
          <div style={{background:"#fff5f5",border:"2px solid #ef4444",borderRadius:12,padding:"14px"}}>
            <div style={{color:"#0f172a",fontSize:13,fontWeight:700,marginBottom:10}}>📝 Describe el motivo</div>
            <textarea value={cancelConfirm.custom||""} onChange={e=>setCancelConfirm({...cancelConfirm,custom:e.target.value})} placeholder="Escribe el motivo aquí..." style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:8,padding:"10px",color:"#0f172a",fontSize:12,minHeight:80,resize:"none",outline:"none",boxSizing:"border-box",marginBottom:10}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setCancelConfirm({step:"choose",reason:"",custom:""})} style={{flex:1,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"10px 0",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>← Volver</button>
              <button onClick={()=>setCancelConfirm({...cancelConfirm,step:"confirm",reason:`📝 ${cancelConfirm.custom||"Otros motivos"}`})} disabled={!cancelConfirm.custom?.trim()} style={{flex:1,background:cancelConfirm.custom?.trim()?"linear-gradient(135deg,#ef4444,#b91c1c)":"#cbd5e1",border:"none",borderRadius:8,padding:"10px 0",color:"#fff",fontSize:12,fontWeight:700,cursor:cancelConfirm.custom?.trim()?"pointer":"default"}}>Continuar →</button>
            </div>
          </div>
        ):(
          <div style={{background:"#fff5f5",border:"2px solid #ef4444",borderRadius:12,padding:"14px"}}>
            <div style={{color:"#0f172a",fontSize:13,fontWeight:700,textAlign:"center",marginBottom:6}}>⚠️ ¿Confirmar cancelación?</div>
            <div style={{background:"#ef444415",border:"1px solid #ef444433",borderRadius:8,padding:"8px 12px",marginBottom:12}}>
              <div style={{color:"#ef4444",fontSize:11,fontWeight:700}}>{cancelConfirm.reason}</div>
            </div>
            <div style={{color:"#64748b",fontSize:11,textAlign:"center",marginBottom:12}}>Esta acción no se puede deshacer</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setCancelConfirm(null)} style={{flex:1,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"10px 0",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>No, volver</button>
              <button onClick={()=>{
                sendMsg(upcoming.id,`❌ Reserva cancelada por el conductor.\n📅 ${upcoming.date} · ${upcoming.time}\n📍 ${upcoming.origin}\n📝 Motivo: ${cancelConfirm.reason}`);
                onCancelTrip(upcoming.id,cancelConfirm.reason);
                setCancelConfirm(null);
                showToast("❌ Reserva cancelada: "+cancelConfirm.reason);
              }} style={{flex:1,background:"linear-gradient(135deg,#ef4444,#b91c1c)",border:"none",borderRadius:8,padding:"10px 0",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Sí, cancelar</button>
            </div>
          </div>
        )}
      </div>
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
    <div style={{width:"100vw",height:"100vh",background:"#0a0a0a url('/bg-driver-desktop-login.jpg') center top/cover no-repeat",display:"flex",alignItems:"flex-start",justifyContent:"center",overflow:"hidden",position:"relative"}}>
      <style>{CSS}</style>

      <div style={{textAlign:"center",width:320,zIndex:1,paddingTop:"56vh"}}>
        {/* Dots */}
        <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:err?12:24,animation:shake?"shake 0.4s ease":undefined}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{
              width:13,height:13,borderRadius:"50%",
              background:pin.length>i?(err?"#ef4444":"#38bdf8"):"transparent",
              border:`2.5px solid ${pin.length>i?(err?"#ef4444":"#38bdf8"):"rgba(255,255,255,0.3)"}`,
              transition:"all 0.2s",
              transform:pin.length>i?"scale(1.3)":"scale(1)",
              boxShadow:pin.length>i&&!err?"0 0 12px rgba(56,189,248,0.6)":"none",
            }}/>
          ))}
        </div>
        {err&&<div style={{color:"#ef4444",fontSize:11,fontWeight:700,marginBottom:10,letterSpacing:1}}>PIN INCORRECTO</div>}

        {/* Keypad */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:270,margin:"0 auto"}}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
            <button key={i} className="pin-btn" onClick={()=>d===""?null:d==="⌫"?del():digit(String(d))} disabled={d===""} style={{
              height:60,borderRadius:12,
              border:d===""?"none":`1px solid ${d==="⌫"?"rgba(255,255,255,0.1)":"rgba(96,165,250,0.4)"}`,
              background:d===""?"transparent":d==="⌫"?"rgba(255,255,255,0.05)":"rgba(37,99,235,0.15)",
              color:d==="⌫"?"rgba(255,255,255,0.4)":"#e2e8f0",
              fontSize:d==="⌫"?22:24,fontWeight:700,
              cursor:d===""?"default":"pointer",
              backdropFilter:"blur(8px)",
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

// ─── CALENDARIO ───────────────────────────────────────────────────────────────
function CalendarSection({bookings,onSelect}){
  const [calDate,setCalDate]=useState(()=>new Date().toISOString().slice(0,10));
  const hours=Array.from({length:17},(_,i)=>i+6); // 06:00 → 22:00

  const dayBookings=bookings
    .filter(b=>b.date===calDate&&b.status!=="rejected")
    .sort((a,b)=>(a.time||"").localeCompare(b.time||""));

  const shiftDay=delta=>{
    const d=new Date(calDate+"T00:00:00");
    d.setDate(d.getDate()+delta);
    setCalDate(d.toISOString().slice(0,10));
  };

  const today=new Date().toISOString().slice(0,10);
  const isToday=calDate===today;
  const dateObj=new Date(calDate+"T00:00:00");
  const dateLabel=dateObj.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  const navBtn={width:40,height:40,borderRadius:10,border:"2px solid #e2e8f0",background:"#ffffff",color:"#1e3a8a",fontSize:18,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"};

  return(
    <div>
      {/* Date navigation */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={()=>shiftDay(-1)} className="nav-item" style={navBtn}>‹</button>
        <div style={{flex:1,background:"#ffffff",border:"2px solid #e2e8f0",borderRadius:14,padding:"12px 20px",textAlign:"center"}}>
          <div style={{color:"#0f172a",fontSize:16,fontWeight:800,textTransform:"capitalize"}}>{dateLabel}{isToday&&<span style={{marginLeft:10,background:"#2563eb22",color:"#2563eb",borderRadius:8,padding:"2px 10px",fontSize:11,fontWeight:700}}>HOY</span>}</div>
        </div>
        <button onClick={()=>shiftDay(1)} className="nav-item" style={navBtn}>›</button>
        <button onClick={()=>setCalDate(today)} style={{...navBtn,width:"auto",padding:"0 16px",fontSize:12,fontWeight:700}}>Hoy</button>
        <input type="date" value={calDate} onChange={e=>setCalDate(e.target.value)} style={{...navBtn,width:"auto",padding:"0 12px",fontSize:12,fontWeight:600,color:"#0f172a"}}/>
      </div>

      {/* Day count */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <div style={{width:4,height:18,background:"linear-gradient(180deg,#1e3a8a,#2563eb)",borderRadius:2}}/>
        <span style={{color:"#1e3a8a",fontSize:13,fontWeight:800,letterSpacing:2}}>AGENDA DEL DÍA</span>
        {dayBookings.length>0&&<span style={{background:"#2563eb",color:"#fff",borderRadius:10,padding:"1px 8px",fontSize:10,fontWeight:700}}>{dayBookings.length} viaje{dayBookings.length!==1?"s":""}</span>}
      </div>

      {/* Hourly grid */}
      <div style={{background:"#ffffff",borderRadius:20,border:"2px solid #e2e8f0",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
        {hours.map(h=>{
          const hStr=String(h).padStart(2,"0")+":00";
          const trips=dayBookings.filter(b=>{
            const startM=t2m(b.time);
            const endM=startM+TRIP_DURATION;
            const slotStart=h*60, slotEnd=(h+1)*60;
            return startM<slotEnd&&endM>slotStart;
          });
          const occupied=trips.length>0;
          return(
            <div key={h} style={{display:"flex",alignItems:"stretch",borderBottom:"1px solid #f1f5f9",minHeight:60,background:occupied?"#f8fafc":"transparent"}}>
              <div style={{width:64,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",borderRight:"1px solid #f1f5f9"}}>
                <span style={{color:"#94a3b8",fontSize:12,fontWeight:700}}>{hStr}</span>
              </div>
              <div style={{flex:1,padding:"8px 14px",display:"flex",flexDirection:"column",justifyContent:"center",gap:6}}>
                {occupied?trips.map(trip=>(
                  <div key={trip.id} className="row-hover" onClick={()=>onSelect(trip)} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"8px 12px",borderRadius:10,background:"#ffffff",border:`1.5px solid ${sColor(trip.status)}33`}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:sColor(trip.status),flexShrink:0}}/>
                    <span style={{flex:1,minWidth:0,color:"#0f172a",fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{trip.guest}</span>
                    <span style={{color:"#64748b",fontSize:11,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{trip.origin} → {trip.destination}</span>
                    <span style={{color:"#1e3a8a",fontSize:12,fontWeight:700,flexShrink:0}}>{trip.time}</span>
                    <span style={{fontSize:10,padding:"2px 9px",borderRadius:6,background:sColor(trip.status)+"22",color:sColor(trip.status),fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>{sLabel(trip.status)}</span>
                    <span style={{color:"#2563eb",fontSize:13,flexShrink:0}}>›</span>
                  </div>
                )):(
                  <span style={{color:"#cbd5e1",fontSize:12}}>Libre</span>
                )}
              </div>
            </div>
          );
        })}
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
