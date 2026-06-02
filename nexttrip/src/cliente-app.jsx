import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, doc,
  onSnapshot, setDoc, getDoc, runTransaction
} from "firebase/firestore";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const _fbApp = initializeApp({
  apiKey: "AIzaSyAfhidX6gGyElvwOwUpoBsNhbk_OFd4roY",
  authDomain: "nexttrip-1df2b.firebaseapp.com",
  projectId: "nexttrip-1df2b",
  storageBucket: "nexttrip-1df2b.firebasestorage.app",
  messagingSenderId: "666473738063",
  appId: "1:666473738063:web:424a4f62dc73c93282df3a",
});
const _db = getFirestore(_fbApp);

async function fbSet(docPath, data) {
  try { await setDoc(doc(_db, ...docPath.split("/")), data); } catch(e) { console.error("fbSet",e); }
}
async function fbGet(docPath) {
  try { const s = await getDoc(doc(_db, ...docPath.split("/"))); return s.exists() ? s.data() : null; } catch { return null; }
}
function fbListen(docPath, cb) {
  return onSnapshot(doc(_db, ...docPath.split("/")), snap => cb(snap.exists() ? snap.data() : null));
}

function sanitizeBookings(arr) {
  if (!arr || !arr.length) return null;
  return arr.map(b => {
    // Strip large binary fields before saving to Firestore (1MB doc limit)
    const { boltScreenshot, routeDoc, commissionProof, ...rest } = b;
    const clean = {
      paymentMethod: "cash", guestPhone: "", passengers: 1,
      notes: "", cancelReason: "", commissionStatus: null, ...rest,
    };
    // Keep a flag so UI knows these files exist, without storing the data
    if (boltScreenshot) clean.hasBoltScreenshot = true;
    if (routeDoc) clean.hasRouteDoc = true;
    if (commissionProof) clean.hasCommissionProof = true;
    return clean;
  });
}


// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  html,body,#root{width:100%;min-height:100%;margin:0;padding:0;background:#000;}
  input[type=date],input[type=time]{color-scheme:dark;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:none;opacity:1}}
  @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:#2a3a4a;border-radius:2px;}
  a,button{touch-action:manipulation;-webkit-tap-highlight-color:transparent;}
  .app-inner{width:100%;max-width:480px;margin:0 auto;padding:0 4px;}
`;
// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  es: {
    vipService:"VIP CUSTOMER SERVICE", tagline:"Viajes privados con descuento exclusivo",
    signIn:"Iniciar sesión", createAccount:"Crear cuenta",
    fullName:"NOMBRE COMPLETO", namePlaceholder:"Tu nombre completo",
    email:"EMAIL", emailPlaceholder:"tu@email.com",
    choosePin:"ELIGE TU PIN DE 4 DÍGITOS", confirmPin:"CONFIRMA TU PIN",
    pinPlaceholder:"••••", pinsMatch:"✓ PINs coinciden", pinsNoMatch:"⚠️ Los PINs no coinciden",
    discountBanner:"15% de descuento en todos tus viajes", minFare:"Precio mínimo 30 €",
    createBtn:"CREAR CUENTA",
    yourPin:"TU PIN DE 4 DÍGITOS", accountFound:"Cuenta encontrada — introduce tu PIN",
    noAccount:"No existe ninguna cuenta con ese email",
    enterEmail:"Introduce tu email para continuar",
    forgotPin:"¿No recuerdas tu PIN?", back:"← Volver",
    changePin:"CAMBIAR PIN", newPinTitle:"Establece un nuevo PIN de acceso",
    account:"Cuenta:", newPin:"NUEVO PIN DE 4 DÍGITOS",
    confirmNewPin:"CONFIRMA EL NUEVO PIN", savePin:"Guardar nuevo PIN",
    pinChanged:"PIN cambiado", pinChangedSub:"Ya puedes iniciar sesión con tu nuevo PIN",
    exit:"Salir",
    serviceUnavailable:"🔴 SERVICIO NO DISPONIBLE",
    driverOffline:"El conductor está fuera de servicio.",
    lastActive:"Último día operativo:", returnDate:"Regreso previsto:",
    availabilityNotice:"⚠️ Aviso de disponibilidad",
    availableUntil:"Servicio disponible hasta el",
    bookEarly:"Reserva con antelación.", returnSuffix:"Regreso:",
    onRoute:"🚗 Conductor en ruta", driverAvailable:"✅ Conductor disponible",
    onRouteSub:"El conductor está en servicio actualmente",
    availableSub:"Puedes realizar nuevas reservas",
    discount15:"Tu descuento exclusivo: 15%",
    autoDiscount:"Aplicado automáticamente en cada reserva",
    tabAvail:"🕐 Disponib.", tabTrips:"📋 Mis Viajes",
    sectionAvail:"DISPONIBILIDAD DEL CONDUCTOR",
    occupied:"Ocupado", notAvail:"No disponible", reserveBtn:"+ Reservar",
    newBookingTitle:"Nueva reserva de transfer",
    selectedTime:"HORA SELECCIONADA", passengerName:"NOMBRE DEL PASAJERO",
    phone:"TELÉFONO", phonePlaceholder:"+34 600 000 000",
    origin:"ORIGEN (punto de recogida)", originPlaceholder:"Dirección de recogida",
    destination:"DESTINO", destPlaceholder:"Dirección de destino",
    passengers:"PASAJEROS", payment:"PAGO",
    notes:"NOTAS", notesPlaceholder:"Equipaje, preferencias...",
    cash:"Efectivo", card:"Tarjeta",
    slotAvailable:"Horario disponible", slotUnavailable:"Horario no disponible",
    slotAvailSub:"El horario está libre", slotUnavailSub:"No disponible en ese horario",
    submitBtn:"SOLICITAR TRANSFER", backToAvail:"← Ver disponibilidad",
    offlineBtn:"🔴 Servicio no disponible", noPrice:"Introduce origen y destino para ver el precio",
    routeCalc:"RUTA CALCULADA", km:"km", mins:"min aprox.", seeRoute:"Ver ruta",
    base:"Base", perKm:"km ×", priceBase:"Precio base", yourDiscount:"Tu descuento (15%)",
    youPay:"PAGAS TÚ", luxuryVtc:"Conductor profesional · Private Transfers",
    unknownAddr:"No se reconocen las direcciones. Añade la ciudad.",
    calculating:"Calculando ruta y precio...",
    myTripsSection:"MIS VIAJES", noTrips:"No tienes viajes todavía",
    priceBase2:"Precio base", discount:"🏷️ Descuento 15%", yourPrice:"💶 Tu precio",
    pending:"⏳ Esperando confirmación del conductor",
    confirmed:"✅ Confirmado — en espera del viaje",
    inprogress:"🚗 Conductor en camino al destino",
    completed:"✅ Viaje completado",
    cancelled:"✕ Cancelado:", rejected:"✕ Rechazado:",
    chat:"💬 Chat con el conductor",
    statusConfirmed:"Confirmado", statusPending:"Pendiente",
    statusRejected:"Rechazado", statusInprogress:"En Curso",
    statusCompleted:"Completado", statusCancelled:"Cancelado",
    sentTitle:"Reserva enviada", sentSub:"Pendiente de confirmación del conductor",
    enterName:"Introduce tu nombre completo",
    invalidEmail:"Email no válido",
    pinLength:"El PIN debe tener exactamente 4 dígitos",
    pinDigits:"El PIN solo puede contener números",
    pinConfirmErr:"Los PINs no coinciden",
    emailTaken:"Ya existe una cuenta con ese email",
    pinError:"El PIN debe tener 4 dígitos",
    wrongCredentials:"Email o PIN incorrectos",
    digitsMore:"dígito más...", digitMore:"dígito más...",
  },
  en: {
    vipService:"VIP CUSTOMER SERVICE", tagline:"Private rides with exclusive discount",
    signIn:"Sign in", createAccount:"Create account",
    fullName:"FULL NAME", namePlaceholder:"Your full name",
    email:"EMAIL", emailPlaceholder:"you@email.com",
    choosePin:"CHOOSE YOUR 4-DIGIT PIN", confirmPin:"CONFIRM YOUR PIN",
    pinPlaceholder:"••••", pinsMatch:"✓ PINs match", pinsNoMatch:"⚠️ PINs do not match",
    discountBanner:"15% discount on every ride", minFare:"Minimum fare €30",
    createBtn:"CREATE ACCOUNT",
    yourPin:"YOUR 4-DIGIT PIN", accountFound:"Account found — enter your PIN",
    noAccount:"No account found with that email",
    enterEmail:"Enter your email to continue",
    forgotPin:"Forgot your PIN?", back:"← Back",
    changePin:"CHANGE PIN", newPinTitle:"Set a new access PIN",
    account:"Account:", newPin:"NEW 4-DIGIT PIN",
    confirmNewPin:"CONFIRM NEW PIN", savePin:"Save new PIN",
    pinChanged:"PIN changed", pinChangedSub:"You can now sign in with your new PIN",
    exit:"Sign out",
    serviceUnavailable:"🔴 SERVICE UNAVAILABLE",
    driverOffline:"The driver is currently out of service.",
    lastActive:"Last operating day:", returnDate:"Expected return:",
    availabilityNotice:"⚠️ Availability notice",
    availableUntil:"Service available until",
    bookEarly:"Book in advance.", returnSuffix:"Return:",
    onRoute:"🚗 Driver on route", driverAvailable:"✅ Driver available",
    onRouteSub:"Driver is currently in service",
    availableSub:"You can make new bookings",
    discount15:"Your exclusive discount: 15%",
    autoDiscount:"Automatically applied to every booking",
    tabAvail:"🕐 Availability", tabTrips:"📋 My Trips",
    sectionAvail:"DRIVER AVAILABILITY",
    occupied:"Booked", notAvail:"Not available", reserveBtn:"+ Book",
    newBookingTitle:"New private transfer",
    selectedTime:"SELECTED TIME", passengerName:"PASSENGER NAME",
    phone:"PHONE", phonePlaceholder:"+34 600 000 000",
    origin:"PICKUP LOCATION", originPlaceholder:"Pickup address",
    destination:"DESTINATION", destPlaceholder:"Drop-off address",
    passengers:"PASSENGERS", payment:"PAYMENT",
    notes:"NOTES", notesPlaceholder:"Luggage, preferences...",
    cash:"Cash", card:"Card",
    slotAvailable:"Time slot available", slotUnavailable:"Time slot unavailable",
    slotAvailSub:"Driver is free at this time", slotUnavailSub:"Not available at this time",
    submitBtn:"REQUEST TRANSFER", backToAvail:"← See availability",
    offlineBtn:"🔴 Service unavailable", noPrice:"Enter pickup & destination to see price",
    routeCalc:"ROUTE CALCULATED", km:"km", mins:"min approx.", seeRoute:"View route",
    base:"Base", perKm:"km ×", priceBase:"Base price", yourDiscount:"Your discount (15%)",
    youPay:"YOU PAY", luxuryVtc:"Professional driver · Private Transfers",
    unknownAddr:"Addresses not recognised. Please include the city.",
    calculating:"Calculating route and price...",
    myTripsSection:"MY TRIPS", noTrips:"No trips yet",
    priceBase2:"Base price", discount:"🏷️ Discount 15%", yourPrice:"💶 Your price",
    pending:"⏳ Awaiting driver confirmation",
    confirmed:"✅ Confirmed — awaiting ride",
    inprogress:"🚗 Driver on the way",
    completed:"✅ Trip completed",
    cancelled:"✕ Cancelled:", rejected:"✕ Rejected:",
    chat:"💬 Chat with driver",
    statusConfirmed:"Confirmed", statusPending:"Pending",
    statusRejected:"Rejected", statusInprogress:"In Progress",
    statusCompleted:"Completed", statusCancelled:"Cancelled",
    sentTitle:"Booking sent", sentSub:"Awaiting driver confirmation",
    enterName:"Please enter your full name",
    invalidEmail:"Invalid email address",
    pinLength:"PIN must be exactly 4 digits",
    pinDigits:"PIN can only contain numbers",
    pinConfirmErr:"PINs do not match",
    emailTaken:"An account with this email already exists",
    pinError:"PIN must be 4 digits",
    wrongCredentials:"Incorrect email or PIN",
    digitsMore:"more digit...", digitMore:"more digit...",
  },
};


const TRIP_DURATION = 45;
const DISCOUNT_RATE = 0.15;

// ── VELO THEME SYSTEM ──
const VELO_DARK = {
  bg: "#0a0a0f",
  bgCard: "#111827",
  bgCard2: "#1e293b",
  bgInput: "#0f172a",
  border: "#1e3a5f",
  borderAccent: "#2563eb44",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textDim: "#475569",
  accent: "#3b82f6",
  accentGlow: "#3b82f633",
  accentDark: "#1d4ed8",
  accentLight: "#60a5fa",
  vip: "#a78bfa",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
  gold: "#c9a96e",
  header: "linear-gradient(180deg,#060612,#0a0a1a)",
  cardGrad: "linear-gradient(135deg,#111827,#0f172a)",
  buttonPrimary: "linear-gradient(135deg,#2563eb,#1d4ed8)",
  buttonSuccess: "linear-gradient(135deg,#22c55e,#16a34a)",
  buttonDanger: "linear-gradient(135deg,#ef4444,#b91c1c)",
};
const VELO_LIGHT = {
  bg: "#f0f4ff",
  bgCard: "#ffffff",
  bgCard2: "#f8faff",
  bgInput: "#eef2ff",
  border: "#c7d7ff",
  borderAccent: "#3b82f644",
  text: "#0f172a",
  textMuted: "#334155",
  textDim: "#64748b",
  accent: "#2563eb",
  accentGlow: "#2563eb22",
  accentDark: "#1d4ed8",
  accentLight: "#3b82f6",
  vip: "#7c3aed",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#d97706",
  gold: "#92400e",
  header: "linear-gradient(180deg,#dbeafe,#eff6ff)",
  cardGrad: "linear-gradient(135deg,#ffffff,#f8faff)",
  buttonPrimary: "linear-gradient(135deg,#2563eb,#1d4ed8)",
  buttonSuccess: "linear-gradient(135deg,#16a34a,#15803d)",
  buttonDanger: "linear-gradient(135deg,#dc2626,#b91c1c)",
};

const BOOKINGS_KEY  = "riviera_bookings_v1";
const BLOCKS_KEY    = "riviera_blocks_v1";
const CLIENTS_KEY   = "nexttrip_clients_v1";
const inputStyle={width:"100%",background:"#1e293b",border:"1px solid #1e3a5f",borderRadius:10,padding:"12px 14px",color:"#f8fafc",fontSize:14,outline:"none",boxSizing:"border-box"};

const USERS_KEY = "riviera_users_v1";
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}
const DRIVER_PIN = "1234";
const EMPLOYEES = [];

function loadClients() {
  try { return JSON.parse(localStorage.getItem(CLIENTS_KEY)) || []; } catch { return []; }
}
function saveClients(clients) {
  try { localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients)); } catch {}
  fbSet("nexttrip/clients", { data: clients });
}
function findClientByEmailAndPin(email, pin) {
  return loadClients().find(c => c.email.toLowerCase() === email.toLowerCase() && c.pin === pin) || null;
}
function emailExists(email) {
  return !!loadClients().find(c => c.email.toLowerCase() === email.toLowerCase());
}
function createClient(name, email, pin) {
  const clients = loadClients();
  if (clients.find(c => c.email.toLowerCase() === email.toLowerCase()))
    return { error: "Ya existe una cuenta con ese email." };
  const BLUE_COLORS = ["#c9a96e","#e8d5a3","#b8924a","#d4b483","#c9a96e","#c9a96e"];
  const avatar = BLUE_COLORS[clients.length % BLUE_COLORS.length];
  const client = { id: `c_${Date.now()}`, name, email, pin, avatar, createdAt: new Date().toLocaleDateString("es-ES") };
  saveClients([...clients, client]);
  return { client };
}
function loadBookings() {
  try {
    const saved = JSON.parse(localStorage.getItem(BOOKINGS_KEY));
    return sanitizeBookings(saved);
  } catch { return null; }
}
function saveBookings(bookings) {
  try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings)); } catch {}
  fbSet("nexttrip/bookings", { data: bookings, updatedAt: Date.now() });
}
function loadBlocks() {
  try { return JSON.parse(localStorage.getItem(BLOCKS_KEY)) || {}; } catch { return {}; }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = n => {
  const num = Number(n);
  if (isNaN(num)) return "0";
  // Show up to 2 decimal places, strip trailing zeros
  return num % 1 === 0 ? String(num) : num.toFixed(2).replace(/\.?0+$/, "");
};

const t2m = t => { const [h,m]=t.split(":").map(Number); return h*60+m; };
const m2t = m => `${String(Math.floor(m/60)%24).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const initials = n => (n||"").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);

function mapsUrl(a) { return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a)}`; }

function mapsRouteUrl(o, d) { return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}&travelmode=driving`; }
function statusColor(s){return{confirmed:"#c9a96e",pending:"#f59e0b",rejected:"#ef4444",inprogress:"#c9a96e",completed:"#22c55e",cancelled:"#f97316"}[s]||"#94a3b8";}
function statusLabel(s,t){return(t&&{confirmed:t.statusConfirmed,pending:t.statusPending,rejected:t.statusRejected,inprogress:t.statusInprogress,completed:t.statusCompleted,cancelled:t.statusCancelled}[s])||{confirmed:"Confirmado",pending:"Pendiente",rejected:"Rechazado",inprogress:"En Curso",completed:"Completado",cancelled:"Cancelado"}[s]||s;}
function haversineKm(lat1,lng1,lat2,lng2){const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180,a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}

// ─── GEOLOCATION ──────────────────────────────────────────────────────────────
function useGeolocation() {
  const [geoState,setGeoState]=useState({loading:false,error:null,denied:false});
  const getLocation=async(onSuccess)=>{
    if(!navigator.geolocation){setGeoState({loading:false,error:"No soportado",denied:false});return;}
    if(navigator.permissions){try{const p=await navigator.permissions.query({name:"geolocation"});if(p.state==="denied"){setGeoState({loading:false,error:"denied",denied:true});return;}}catch{}}
    setGeoState({loading:true,error:null,denied:false});
    navigator.geolocation.getCurrentPosition(
      async(pos)=>{
        const{latitude:lat,longitude:lng}=pos.coords;
        try{
          const controller=new AbortController();
          const timer=setTimeout(()=>controller.abort(),5000);
          const res=await fetch("https://nominatim.openstreetmap.org/reverse?lat="+lat+"&lon="+lng+"&format=json&addressdetails=1",{headers:{"Accept-Language":"es","User-Agent":"NextTrip/1.0"},signal:controller.signal});
          clearTimeout(timer);
          const data=await res.json();
          setGeoState({loading:false,error:null,denied:false});
          onSuccess(data.display_name||lat.toFixed(5)+", "+lng.toFixed(5));
        }catch{setGeoState({loading:false,error:null,denied:false});onSuccess(lat.toFixed(5)+", "+lng.toFixed(5));}
      },
      (err)=>{if(err.code===1)setGeoState({loading:false,error:"denied",denied:true});else setGeoState({loading:false,error:"No se pudo obtener ubicación.",denied:false});},
      {enableHighAccuracy:true,timeout:6000,maximumAge:60000}
    );
  };
  return{...geoState,getLocation,setGeoState};
}
function GeoErrorMsg({onClose}){
  const ua=navigator.userAgent;
  const isIOS=/iPhone|iPad|iPod/.test(ua),isSafari=/Safari/.test(ua)&&!/Chrome/.test(ua);
  const isFirefox=/Firefox/.test(ua),isChromeMobile=/Android/.test(ua)&&/Chrome/.test(ua);
  const steps=isIOS||isSafari?["Ajustes iPhone","Privacidad-Localizacion","Safari-Al usar","Recarga"]
    :isFirefox?["Candado-Permisos","Ubicacion-Quita bloqueo","Recarga"]
    :isChromeMobile?["3puntos-Ajustes","Config sitio-Ubicacion","Permite-Recarga"]
    :["Candado-Config sitio","Ubicacion-Preguntar","Recarga"];
  return(
    <div style={{background:"#1a0a0a",border:"1.5px solid #ef444466",borderRadius:12,padding:"14px 16px",marginTop:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <div style={{color:"#ef4444",fontSize:12,fontWeight:700}}>Ubicación bloqueada</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#a8b8cc",fontSize:14,cursor:"pointer"}}>×</button>
      </div>
      {steps.map((s,i)=>(<div key={i} style={{display:"flex",gap:8,marginBottom:5}}><div style={{width:18,height:18,borderRadius:"50%",background:"#ef444422",display:"flex",alignItems:"center",justifyContent:"center",color:"#ef4444",fontSize:10,fontWeight:700,flexShrink:0}}>{i+1}</div><div style={{color:"#f8fafc",fontSize:11}}>{s}</div></div>))}
    </div>
  );
}

const TRAVEL_PREP=30;
const MIN_CLIENT_ADVANCE_MINS = 30; // min advance booking time for clients

function isClientAdvanceOk(date, time) {
  if (!date || !time) return true;
  const tripDt = new Date(`${date}T${time}:00`);
  return (tripDt - new Date()) >= MIN_CLIENT_ADVANCE_MINS * 60 * 1000;
}

function isSlotFree(bookings,date,time,blockedSlots){const slotM=t2m(time);const blocked=(blockedSlots&&(blockedSlots[date]||[]).some(bt=>{const bm=t2m(bt);return slotM>=bm-TRAVEL_PREP&&slotM<bm+TRIP_DURATION;}));if(blocked)return false;return!bookings.some(b=>{if(b.date!==date||["rejected","cancelled","completed"].includes(b.status))return false;const sM=t2m(b.time),eM=sM+TRIP_DURATION;return slotM>=sM-TRAVEL_PREP&&slotM<eM;});}

const KNOWN_PLACES = [
  // ── AEROPUERTOS ──────────────────────────────────────────────────────────────
  { keys:["t4","terminal 4","aeropuerto adolfo suárez","aeropuerto barajas","barajas","mad","aeropuerto madrid"],  lat:40.4983, lng:-3.5676 },
  { keys:["t1","terminal 1","barajas t1"],                                                                         lat:40.4719, lng:-3.5607 },
  { keys:["t2","terminal 2","barajas t2"],                                                                         lat:40.4694, lng:-3.5659 },
  { keys:["aeropuerto ciudad real","ciudad real central airport"],                                                  lat:38.8564, lng:-3.9698 },
  { keys:["aeropuerto albacete","los llanos albacete"],                                                             lat:38.9485, lng:-1.8632 },

  // ── TOLEDO CIUDAD ────────────────────────────────────────────────────────────
  { keys:["toledo centro","casco histórico toledo","plaza zocodover","zocodover","toledo"],                         lat:39.8628, lng:-4.0273 },
  { keys:["estación toledo","tren toledo","renfe toledo","estacion de toledo"],                                     lat:39.8558, lng:-4.0209 },
  { keys:["hospital virgen de la salud","hospital toledo"],                                                         lat:39.8750, lng:-4.0366 },
  { keys:["parador toledo","parador de turismo toledo"],                                                            lat:39.8568, lng:-4.0459 },
  { keys:["hospital nacional parapléjicos","parapléjicos toledo"],                                                  lat:39.8831, lng:-4.0449 },
  { keys:["polígono industrial toledo","polígono santa maría de benquerencia"],                                     lat:39.8300, lng:-3.9900 },
  { keys:["talavera de la reina","talavera"],                                                                      lat:39.9626, lng:-4.8302 },
  { keys:["illescas"],                                                                                              lat:40.1205, lng:-3.8496 },
  { keys:["ocaña"],                                                                                                 lat:39.9564, lng:-3.4989 },
  { keys:["mora toledo","mora"],                                                                                    lat:39.6864, lng:-3.7703 },
  { keys:["orgaz"],                                                                                                 lat:39.6386, lng:-3.8769 },
  { keys:["madridejos"],                                                                                            lat:39.4700, lng:-3.5350 },
  { keys:["consuegra"],                                                                                             lat:39.4611, lng:-3.6072 },
  { keys:["tembleque"],                                                                                             lat:39.6942, lng:-3.5000 },
  { keys:["quintanar de la orden","quintanar"],                                                                     lat:39.5931, lng:-3.0406 },
  { keys:["torrijos"],                                                                                              lat:39.9919, lng:-4.2798 },
  { keys:["santa olalla"],                                                                                          lat:40.0319, lng:-4.4230 },
  { keys:["escalona"],                                                                                              lat:40.1622, lng:-4.4086 },
  { keys:["maqueda"],                                                                                               lat:40.0631, lng:-4.3697 },
  { keys:["valmojado"],                                                                                             lat:40.1858, lng:-3.9997 },
  { keys:["yébenes","los yébenes"],                                                                                 lat:39.5933, lng:-3.8814 },
  { keys:["puebla de montalbán","la puebla de montalbán"],                                                          lat:39.8636, lng:-4.3636 },
  { keys:["cebolla"],                                                                                               lat:39.9822, lng:-4.5358 },
  { keys:["aldea en cabo","el puente del arzobispo"],                                                               lat:39.7972, lng:-5.1769 },
  { keys:["oropesa"],                                                                                               lat:39.9161, lng:-5.1717 },
  { keys:["calera y chozas"],                                                                                      lat:39.8742, lng:-4.8717 },
  { keys:["pepino","toledo pepino"],                                                                                lat:39.9658, lng:-4.4008 },

  // ── CIUDAD REAL ──────────────────────────────────────────────────────────────
  { keys:["ciudad real","ciudad real centro"],                                                                      lat:38.9848, lng:-3.9274 },
  { keys:["estación ciudad real","tren ciudad real","ave ciudad real"],                                             lat:38.9814, lng:-3.9191 },
  { keys:["alcázar de san juan","alcazar de san juan"],                                                             lat:39.3961, lng:-3.2094 },
  { keys:["puertollano"],                                                                                           lat:38.6872, lng:-4.1085 },
  { keys:["valdepeñas"],                                                                                            lat:38.7611, lng:-3.3842 },
  { keys:["manzanares ciudad real","manzanares"],                                                                   lat:38.9989, lng:-3.3689 },
  { keys:["daimiel"],                                                                                               lat:39.0689, lng:-3.6097 },
  { keys:["tomelloso"],                                                                                             lat:39.1542, lng:-3.0119 },
  { keys:["campo de criptana","criptana"],                                                                          lat:39.4039, lng:-3.1197 },
  { keys:["almagro"],                                                                                               lat:38.8875, lng:-3.7128 },
  { keys:["bolaños de calatrava","bolaños"],                                                                        lat:38.9928, lng:-3.6733 },
  { keys:["miguelturra"],                                                                                           lat:38.9658, lng:-3.8996 },
  { keys:["socuéllamos"],                                                                                            lat:39.2880, lng:-2.7962 },

  // ── ALBACETE ─────────────────────────────────────────────────────────────────
  { keys:["albacete","albacete centro"],                                                                            lat:38.9942, lng:-1.8585 },
  { keys:["estación albacete","tren albacete","ave albacete"],                                                      lat:38.9978, lng:-1.8639 },
  { keys:["hellín"],                                                                                                 lat:38.5147, lng:-1.6933 },
  { keys:["villarrobledo"],                                                                                          lat:39.2961, lng:-2.6056 },
  { keys:["almansa"],                                                                                                lat:38.8697, lng:-1.0892 },
  { keys:["la roda"],                                                                                                lat:39.2103, lng:-2.1558 },
  { keys:["caudete"],                                                                                                lat:38.7042, lng:-0.9894 },

  // ── CUENCA ───────────────────────────────────────────────────────────────────
  { keys:["cuenca","cuenca centro","ciudad de cuenca"],                                                             lat:40.0704, lng:-2.1374 },
  { keys:["casas ibáñez","casas ibanez"],                                                                           lat:39.2919, lng:-1.4753 },
  { keys:["tarancón"],                                                                                               lat:40.0119, lng:-3.0075 },
  { keys:["san clemente"],                                                                                           lat:39.4025, lng:-2.4303 },
  { keys:["motilla del palancar","motilla"],                                                                         lat:39.5644, lng:-1.8897 },

  // ── GUADALAJARA ──────────────────────────────────────────────────────────────
  { keys:["guadalajara","guadalajara centro"],                                                                       lat:40.6333, lng:-3.1642 },
  { keys:["azuqueca de henares","azuqueca"],                                                                         lat:40.5617, lng:-3.2614 },
  { keys:["cabanillas del campo","cabanillas"],                                                                      lat:40.6156, lng:-3.2328 },
  { keys:["alovera"],                                                                                                 lat:40.5756, lng:-3.2494 },
  { keys:["molina de aragón","molina"],                                                                              lat:40.8481, lng:-1.8867 },
  { keys:["sigüenza"],                                                                                               lat:41.0642, lng:-2.6381 },
  { keys:["pastrana"],                                                                                               lat:40.4614, lng:-2.9175 },

  // ── MADRID (rutas frecuentes desde Toledo) ───────────────────────────────────
  { keys:["madrid","madrid centro","puerta del sol","sol"],                                                          lat:40.4168, lng:-3.7038 },
  { keys:["atocha","estación atocha","renfe atocha"],                                                                lat:40.4065, lng:-3.6892 },
  { keys:["chamartin","chamartín","estación chamartín"],                                                             lat:40.4726, lng:-3.6827 },
  { keys:["ifema","feria de madrid"],                                                                                lat:40.4726, lng:-3.6080 },
  { keys:["bernabéu","bernabeu","estadio bernabéu"],                                                                 lat:40.4531, lng:-3.6883 },
  { keys:["wanda metropolitano","metropolitano"],                                                                    lat:40.4361, lng:-3.5995 },
  { keys:["prado","museo del prado"],                                                                                lat:40.4138, lng:-3.6922 },
  { keys:["gran vía madrid"],                                                                                        lat:40.4200, lng:-3.7025 },

  // ── OTRAS CIUDADES LIMÍTROFES ────────────────────────────────────────────────
  { keys:["aranjuez"],                                                                                               lat:40.0322, lng:-3.6036 },
  { keys:["getafe"],                                                                                                  lat:40.3056, lng:-3.7327 },
  { keys:["leganés","leganes"],                                                                                       lat:40.3286, lng:-3.7641 },
  { keys:["fuenlabrada"],                                                                                             lat:40.2836, lng:-3.7945 },
  { keys:["móstoles","mostoles"],                                                                                     lat:40.3222, lng:-3.8638 },
  { keys:["alcorcón","alcorcon"],                                                                                     lat:40.3453, lng:-3.8249 },
  { keys:["toledo parque empresarial","parque empresarial"],                                                          lat:39.9100, lng:-4.0200 },
  { keys:["ávila","avila"],                                                                                           lat:40.6566, lng:-4.6814 },
  { keys:["segovia"],                                                                                                  lat:40.9429, lng:-4.1088 },
  { keys:["cáceres"],                                                                                                  lat:39.4753, lng:-6.3724 },
  { keys:["badajoz"],                                                                                                  lat:38.8794, lng:-6.9706 },
  { keys:["córdoba"],                                                                                                  lat:37.8882, lng:-4.7794 },
  { keys:["jaén"],                                                                                                     lat:37.7796, lng:-3.7849 },
  { keys:["murcia"],                                                                                                   lat:37.9922, lng:-1.1307 },
  { keys:["valencia"],                                                                                                  lat:39.4699, lng:0.3763 },
  { keys:["alicante"],                                                                                                  lat:38.3452, lng:-0.4810 },
];

function geocodeLocal(address) {
  if (!address) return null;
  const low = address.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  // Check known places first
  for (const p of KNOWN_PLACES) {
    if (p.keys.some(k => low.includes(k.normalize("NFD").replace(/[\u0300-\u036f]/g,"")))) {
      return { lat: p.lat, lng: p.lng };
    }
  }
  // Province-level fallback for Castilla-La Mancha
  if (low.includes("toledo"))     return { lat:39.8628+(Math.random()-0.5)*0.3, lng:-4.0273+(Math.random()-0.5)*0.5 };
  if (low.includes("ciudad real"))return { lat:38.9848+(Math.random()-0.5)*0.4, lng:-3.9274+(Math.random()-0.5)*0.5 };
  if (low.includes("albacete"))   return { lat:38.9942+(Math.random()-0.5)*0.3, lng:-1.8585+(Math.random()-0.5)*0.4 };
  if (low.includes("cuenca"))     return { lat:40.0704+(Math.random()-0.5)*0.4, lng:-2.1374+(Math.random()-0.5)*0.5 };
  if (low.includes("guadalajara"))return { lat:40.6333+(Math.random()-0.5)*0.3, lng:-3.1642+(Math.random()-0.5)*0.4 };
  if (low.includes("madrid"))     return { lat:40.4168+(Math.random()-0.5)*0.15, lng:-3.7038+(Math.random()-0.5)*0.15 };
  if (low.includes("castilla"))   return { lat:39.5+(Math.random()-0.5)*0.8, lng:-3.0+(Math.random()-0.5)*1.0 };
  return null;
}

function estimateTrip(origin, destination) {
  const a = geocodeLocal(origin);
  const b = geocodeLocal(destination);
  if (!a || !b) return null;
  const straightKm = haversineKm(a.lat, a.lng, b.lat, b.lng);
  // Road factor: urban ~1.35, airport routes ~1.25
  const isAirport = [origin, destination].some(s => s.toLowerCase().includes("aeropuerto") || s.toLowerCase().includes("airport") || s.toLowerCase().includes("t4") || s.toLowerCase().includes("t1") || s.toLowerCase().includes("t2"));
  const factor = isAirport ? 1.28 : 1.38;
  const km = Math.round(straightKm * factor);
  // Speed: urban 30 km/h, mixed with highway 55 km/h
  const speed = isAirport ? 55 : (km > 10 ? 45 : 28);
  const mins = Math.round((km / speed) * 60);
  return { km, mins, isAirport };
}

// ─── PRICING ─────────────────────────────────────────────────────────────────
function calcLuxuryPrice(km) {
  const raw = PRICE_BASE_KM + km * PRICE_PER_KM;
  return Math.max(MIN_FARE_CLIENT, Math.ceil(raw));
}

function ClientPriceBox({ origin, destination, onPriceCalculated, t }) {
  const _t = t || TRANSLATIONS.es;
  const [state, setState] = useState({ status:"idle", km:null, mins:null, price:null, error:null, sameMuni:false });

  useEffect(() => {
    if (!origin || !destination || origin.length < 5 || destination.length < 5) {
      setState({ status:"idle" });
      onPriceCalculated && onPriceCalculated(null);
      return;
    }
    const normOrigin = origin.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
    const normDest   = destination.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();

    const est = estimateTrip(origin, destination);

    if (!est) {
      setState({ status:"unknown" });
      onPriceCalculated && onPriceCalculated(null);
      return;
    }

    const price = calcLuxuryPrice(est.km); // calcLuxuryPrice already enforces MIN_FARE_CLIENT (30€)
    setState({ status:"ok", km:est.km, mins:est.mins, price, sameMuni:false, error:null });
    onPriceCalculated && onPriceCalculated(price);
  }, [origin, destination]);

  if (state.status === "idle") return null;

  if (state.status === "loading") return (
    <div style={{background:"#0f172a",border:"1px solid #c9a96e22",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid #c9a96e",borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>
      <span style={{color:"#a8b8cc",fontSize:12}}>Calculando ruta y precio...</span>
    </div>
  );

  if (state.status === "unknown") return (
    <div style={{background:"#0f172a",border:"1px solid #c9a96e22",borderRadius:12,padding:"12px 16px",marginBottom:14}}>
      <div style={{color:"#a8b8cc",fontSize:12}}>📍 {_t.unknownAddr}</div>
    </div>
  );

  // OK — show pricing
  const withDiscount = state.price * (1 - DISCOUNT_RATE);
  return (
    <div style={{background:"linear-gradient(135deg,#1a130a,#1e293b)",border:"2px solid #c9a96e",borderRadius:14,padding:"16px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
        <span style={{fontSize:16}}>🗺️</span>
        <span style={{color:"#e8d5a3",fontSize:11,fontWeight:700,letterSpacing:1}}>RUTA CALCULADA</span>
      </div>
      {/* Distance / time row */}
      <div style={{display:"flex",gap:16,marginBottom:14,padding:"8px 12px",background:"#0f172a",borderRadius:8}}>
        <div style={{textAlign:"center"}}>
          <div style={{color:"#f8fafc",fontSize:22,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,lineHeight:1}}>{state.km}</div>
          <div style={{color:"#a8b8cc",fontSize:10}}>km</div>
        </div>
        <div style={{width:1,background:"#1e3a5f"}}/>
        <div style={{textAlign:"center"}}>
          <div style={{color:"#f8fafc",fontSize:22,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,lineHeight:1}}>{state.mins}</div>
          <div style={{color:"#a8b8cc",fontSize:10}}>min aprox.</div>
        </div>
        <div style={{flex:1}}/>
        <a href={mapsRouteUrl(origin, destination)} target="_blank" rel="noopener noreferrer"
          style={{display:"flex",alignItems:"center",gap:4,alignSelf:"center",background:"#c9a96e18",border:"1px solid #c9a96e44",borderRadius:8,padding:"5px 10px",textDecoration:"none",color:"#c9a96e",fontSize:11,fontWeight:600}}>
          Ver ruta
        </a>
      </div>
      {/* Pricing breakdown */}
      <div style={{marginBottom:4}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{color:"#a8b8cc",fontSize:11}}>Base</span>
          <span style={{color:"#a8b8cc",fontSize:11}}>{fmt(PRICE_BASE_KM)} €</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{color:"#a8b8cc",fontSize:11}}>{state.km} km × {fmt(PRICE_PER_KM)} €/km</span>
          <span style={{color:"#a8b8cc",fontSize:11}}>{fmt(state.km * PRICE_PER_KM)} €</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,borderTop:"1px solid #1e3a5f",marginBottom:8}}>
          <span style={{color:"#f8fafc",fontSize:12}}>Precio base</span>
          <span style={{color:"#a8b8cc",fontSize:13,textDecoration:"line-through"}}>{fmt(state.price)} €</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{color:"#c9a96e",fontSize:12}}>🏷️ Tu descuento (15%)</span>
          <span style={{color:"#c9a96e",fontSize:12,fontWeight:600}}>-{fmt(state.price * DISCOUNT_RATE)} €</span>
        </div>
        {/* Final price — hero */}
        <div style={{
          background:"linear-gradient(135deg,#1e3a6e,#0a1628)",
          border:"1px solid #c9a96e66",borderRadius:10,
          padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",
        }}>
          <div>
            <div style={{color:"#e8d5a3",fontSize:10,letterSpacing:2,marginBottom:2}}>{_t.youPay}</div>
            <div style={{color:"#a8b8cc",fontSize:9}}>{_t.luxuryVtc}</div>
          </div>
          <div style={{color:"#e8d5a3",fontSize:32,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,
            textShadow:"0 0 20px rgba(96,165,250,0.4)"}}>
            {fmt(withDiscount)} €
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function VeloLogo({ dark=true, size=120 }) {
  const textColor = dark ? "#ffffff" : "#0a0a0f";
  const subColor = dark ? "#94a3b8" : "#334155";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0}}>
      <svg width={size} height={size*0.65} viewBox="0 0 200 130" fill="none">
        <defs>
          <linearGradient id="vg" x1="20" y1="10" x2="180" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1d4ed8"/>
            <stop offset="55%" stopColor="#3b82f6"/>
            <stop offset="100%" stopColor="#06b6d4"/>
          </linearGradient>
        </defs>
        <path d="M20 15 L100 115 L180 15" stroke="url(#vg)" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <line x1="155" y1="32" x2="193" y2="24" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
        <line x1="160" y1="52" x2="192" y2="46" stroke="#06b6d4" strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
        <line x1="165" y1="70" x2="190" y2="66" stroke="#06b6d4" strokeWidth="3.5" strokeLinecap="round" opacity="0.5"/>
      </svg>
      <div style={{display:"flex",alignItems:"baseline",gap:1,marginTop:-6}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:size*0.28,fontWeight:900,color:textColor,letterSpacing:size*0.015}}>V</span>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:size*0.28,fontWeight:900,color:"transparent",WebkitTextStroke:`1.5px ${textColor}`,letterSpacing:size*0.015}}>E</span>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:size*0.28,fontWeight:900,color:textColor,letterSpacing:size*0.015}}>LO</span>
      </div>
      <div style={{width:size*0.13,height:3,background:"linear-gradient(90deg,#3b82f6,#06b6d4)",borderRadius:2,marginTop:-size*0.035,marginLeft:-size*0.19}}/>
      <div style={{color:subColor,fontSize:size*0.068,letterSpacing:size*0.02,marginTop:size*0.038,fontFamily:"'DM Sans',sans-serif",fontWeight:300}}>TU VIAJE, SIN LÍMITES</div>
    </div>
  );
}
function RivieraLogo({ size=36 }) { return <VeloLogo dark={true} size={size*3}/>; }

function PinKeypad({ correctPin, onSuccess, onBack, subtitle, accentColor="#c9a96e" }) {
  const [pin,setPin]=useState(""); const [error,setError]=useState(false);
  const handleDigit = d => {
    if(pin.length>=4)return; const next=pin+d; setPin(next); setError(false);
    if(next.length===4) setTimeout(()=>{ if(next===correctPin)onSuccess(); else{setError(true);setPin("");}},200);
  };
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%"}}>
      {onBack&&<button onClick={onBack} style={{alignSelf:"flex-start",background:"none",border:"none",color:"#a8b8cc",cursor:"pointer",fontSize:13,letterSpacing:1,marginBottom:20}}>← VOLVER</button>}
      {subtitle&&<div style={{color:"#a8b8cc",fontSize:12,letterSpacing:1,marginBottom:22}}>{subtitle}</div>}
      <div style={{display:"flex",gap:14,marginBottom:26}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:13,height:13,borderRadius:"50%",
            background:pin.length>i?(error?"#ef4444":accentColor):"#1e293b",
            border:`2px solid ${error?"#ef4444":pin.length>i?accentColor:"#2a3a4a"}`,
            transition:"all 0.15s",transform:pin.length>i?"scale(1.2)":"scale(1)"}}/>
        ))}
      </div>
      {error&&<div style={{color:"#ef4444",fontSize:11,marginBottom:12,letterSpacing:1}}>PIN INCORRECTO</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:230}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
          <button key={i} onClick={()=>d==="⌫"?setPin(p=>p.slice(0,-1)):d!==""?handleDigit(String(d)):null}
            disabled={d===""} style={{height:60,borderRadius:12,
              background:d===""?"transparent":d==="⌫"?"#1e293b":"linear-gradient(135deg,#1e293b,#0f172a)",
              border:d===""?"none":"1px solid #1e3a5f",color:d==="⌫"?"#a8b8cc":"#f8fafc",
              fontSize:d==="⌫"?18:20,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,
              cursor:d===""?"default":"pointer",transition:"all 0.1s"}}
            onMouseDown={e=>{if(d!=="")e.currentTarget.style.transform="scale(0.93)"}}
            onMouseUp={e=>e.currentTarget.style.transform="none"}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function DistancePriceCalcClient({ origin, destination, onPriceCalculated, pricePerKm=3.15 }) {
  const [state, setState] = useState({ status:"idle", km:null, duration:null, price:null });
  useEffect(() => {
    if (!origin || !destination || origin.length < 5 || destination.length < 5) {
      setState({ status:"idle", km:null, duration:null, price:null }); return;
    }
    const timer = setTimeout(async () => {
      setState({ status:"loading", km:null, duration:null, price:null });
      try {
        const res = await fetch(`/api/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const basePrice = Math.max(30, Math.round(data.km * pricePerKm * 100) / 100);
        const discounted = Math.round(basePrice * 0.85 * 100) / 100;
        let durMin=Math.round(data.km*1.5);
        if(data.duration){const hm=data.duration.match(/([0-9]+)\s*h/),mm=data.duration.match(/([0-9]+)\s*min/);const d=(hm?parseInt(hm[1])*60:0)+(mm?parseInt(mm[1]):0);if(d)durMin=d;}
        setState({ status:"ok", km:data.km, duration:data.duration, price:basePrice, discounted });
        onPriceCalculated && onPriceCalculated(basePrice, data.km, durMin);
      } catch(e) {
        setState({ status:"error", km:null, duration:null, price:null });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [origin, destination]);
  if (state.status === "idle") return null;
  return (
    <div style={{marginBottom:14}}>
      {state.status==="loading"&&(
        <div style={{background:"#1e293b",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:10,height:10,borderRadius:"50%",border:"2px solid #c9a96e",borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>
          <span style={{color:"#a8b8cc",fontSize:11}}>🗺️ Calculando ruta...</span>
        </div>
      )}
      {state.status==="ok"&&(
        <div style={{background:"linear-gradient(135deg,#0a1628,#1e293b)",border:"1.5px solid #c9a96e55",borderRadius:12,padding:"12px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div>
              <span style={{color:"#f8fafc",fontSize:13,fontWeight:700}}>🗺️ {state.km} km</span>
              {state.duration&&<span style={{color:"#a8b8cc",fontSize:11,marginLeft:8}}>· {state.duration}</span>}
            </div>
          </div>
          <div style={{background:"#0f172a",borderRadius:8,padding:"8px 10px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{color:"#a8b8cc",fontSize:11}}>Precio base</span>
              <span style={{color:"#a8b8cc",fontSize:11,textDecoration:"line-through"}}>{state.price} €</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{color:"#c9a96e",fontSize:11}}>🏷️ Tu descuento VIP 15%</span>
              <span style={{color:"#c9a96e",fontSize:11}}>-{Math.round(state.price*0.15*100)/100} €</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",paddingTop:4,borderTop:"1px solid #1e3a5f"}}>
              <span style={{color:"#22c55e",fontSize:12,fontWeight:700}}>💶 Tu precio final</span>
              <span style={{color:"#22c55e",fontSize:14,fontWeight:700}}>{state.discounted} €</span>
            </div>
          </div>
        </div>
      )}
      {state.status==="error"&&(
        <div style={{background:"#1a0808",border:"1px solid #ef444433",borderRadius:10,padding:"8px 12px",color:"#ef4444",fontSize:11}}>
          ⚠️ No se pudo calcular la ruta
        </div>
      )}
    </div>
  );
}

function TripEstimateBox({ origin, destination }) {
  if (!origin || !destination || origin.length < 6 || destination.length < 6) return null;
  if (origin === destination) return null;
  const est = estimateTrip(origin, destination);
  const routeLink = mapsRouteUrl(origin, destination);

  return (
    <div style={{
      background:"linear-gradient(135deg,#1a130a,#1e293b)",
      border:"1px solid #c9a96e33",
      borderRadius:10, padding:"10px 14px", marginBottom:14,
      display:"flex", alignItems:"center", gap:10,
    }}>
      <span style={{fontSize:22, flexShrink:0}}>🗺️</span>
      <div style={{flex:1}}>
        <div style={{color:"#a8b8cc",fontSize:9,letterSpacing:2,marginBottom:5}}>TIEMPO ESTIMADO DEL VIAJE</div>
        {est ? (
          <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{color:"#f8fafc",fontSize:20,fontFamily:"'Cormorant Garamond',serif",fontWeight:700}}>{est.mins}</span>
              <span style={{color:"#a8b8cc",fontSize:12}}>min</span>
            </div>
            <div style={{width:1,height:18,background:"#1e3a5f"}}/>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{color:"#f8fafc",fontSize:16,fontFamily:"'Cormorant Garamond',serif",fontWeight:600}}>{est.km}</span>
              <span style={{color:"#a8b8cc",fontSize:12}}>km aprox.</span>
            </div>
            {est.isAirport && <span style={{color:"#f59e0b",fontSize:11}}>✈️ Ruta aeropuerto</span>}
          </div>
        ) : (
          <div style={{color:"#a8b8cc",fontSize:12}}>Introduce direcciones reconocibles para estimar</div>
        )}
      </div>
      <a href={routeLink} target="_blank" rel="noopener noreferrer" style={{
        display:"flex",alignItems:"center",gap:5,flexShrink:0,
        background:"#c9a96e18",border:"1px solid #c9a96e44",
        borderRadius:8,padding:"6px 10px",textDecoration:"none",
        color:"#c9a96e",fontSize:11,fontWeight:600,
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Ver ruta
      </a>
    </div>
  );
}

function FavRoutes({ clientId, myBookings, lang, t, onBook }) {
  const FAVS_KEY = `nexttrip_favs_${clientId}`;
  const [favs, setFavs] = useState(()=>{
    try { return JSON.parse(localStorage.getItem(FAVS_KEY))||[]; } catch { return []; }
  });
  const saveFavs = (f) => { setFavs(f); try{localStorage.setItem(FAVS_KEY,JSON.stringify(f));}catch{} };
  const recentRoutes = myBookings
    .filter(b=>b.status==="completed"&&b.origin&&b.destination)
    .map(b=>({origin:b.origin,destination:b.destination}))
    .filter((r,i,arr)=>arr.findIndex(x=>x.origin===r.origin&&x.destination===r.destination)===i)
    .filter(r=>!favs.find(f=>f.origin===r.origin&&f.destination===r.destination))
    .slice(0,2);
  if(favs.length===0&&recentRoutes.length===0) return null;
  return (
    <div style={{marginBottom:14}}>
      <div style={{color:"#a8b8cc",fontSize:10,letterSpacing:3,marginBottom:8}}>
        ⭐ {lang==="en"?"FAVOURITE ROUTES":"RUTAS FAVORITAS"}
      </div>
      {favs.map((f,i)=>(
        <div key={i} style={{background:"#1e293b",border:"1px solid #c9a96e33",borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>⭐</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:"#f8fafc",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.origin}</div>
            <div style={{color:"#a8b8cc",fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>→ {f.destination}</div>
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>onBook(f)} style={{background:"linear-gradient(135deg,#c9a96e,#a07840)",border:"none",borderRadius:7,padding:"5px 10px",color:"#0a0a0a",fontSize:10,fontWeight:700,cursor:"pointer"}}>
              {lang==="en"?"Book":"Reservar"}
            </button>
            <button onClick={()=>saveFavs(favs.filter((_,j)=>j!==i))} style={{background:"#0f172a",border:"1px solid #2a3a4a",borderRadius:7,padding:"5px 8px",color:"#a8b8cc",fontSize:10,cursor:"pointer"}}>✕</button>
          </div>
        </div>
      ))}
      {recentRoutes.map((r,i)=>(
        <div key={i} style={{background:"#111",border:"1px dashed #c9a96e22",borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14,opacity:0.4}}>☆</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:"#a8b8cc",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.origin}</div>
            <div style={{color:"#475569",fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>→ {r.destination}</div>
          </div>
          <button onClick={()=>saveFavs([...favs,r])} style={{background:"#1e293b",border:"1px solid #c9a96e33",borderRadius:7,padding:"5px 10px",color:"#c9a96e",fontSize:10,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
            + {lang==="en"?"Save":"Guardar"}
          </button>
        </div>
      ))}
    </div>
  );
}

function translateAutoMsg(text, lang) {
  if (!lang || lang === "es") return text;
  if (text.includes("He llegado al punto de recogida")) {
    const endMatch = text.match(/finaliza a las ([0-9]{2}:[0-9]{2})/);
    const startMatch = text.match(/comienza a las ([0-9]{2}:[0-9]{2})/);
    return `🚗 I have arrived at the pickup point and I am waiting for you. The 10-minute wait starts at ${startMatch?startMatch[1]:""} (your booking time) and ends at ${endMatch?endMatch[1]:""}. `;
  }
  if (text.includes("Estoy en camino")) return "🚗 I'm on my way.";
  if (text.includes("Llegaré en aproximadamente 10 minutos")) return "⏱️ I'll arrive in approximately 10 minutes.";
  if (text.includes("aparcado esperándote")) return "🅿️ I'm parked waiting for you at the pickup point.";
  if (text.includes("llámame si tienes algún problema")) return "📞 Please call me if you have any trouble finding me.";
  if (text.includes("ha sido confirmado")) {
    const dateMatch = text.match(/del ([0-9]{4}-[0-9]{2}-[0-9]{2})/);
    const timeMatch = text.match(/las ([0-9]{2}:[0-9]{2}) ha/);
    return `✅ Your trip on ${dateMatch?dateMatch[1]:""} at ${timeMatch?timeMatch[1]:""} has been confirmed. See you soon!`;
  }
  return text;
}

function ChatModal({ booking, messages, onSend, currentUser, isDriver, onClose, onMarkRead, lang: langProp }) {
  const lang = langProp || booking?.clientLang || "es";
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const b = booking;
  const bookingKey = String(b.id);
  const allUsers = [...EMPLOYEES, ...loadUsers()];
  const emp = allUsers.find(e => e.id === b.employeeId);
  const thread = messages[bookingKey] || [];

  // Mark as read immediately when chat opens
  useEffect(() => {
    const relevant = thread.filter(m => isDriver ? m.from !== "driver" : m.from === "driver");
    if (onMarkRead) onMarkRead(bookingKey, relevant.length);
  }, []); // eslint-disable-line

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  const handleClose = () => {
    // Mark as read on close too (in case new messages arrived while open)
    const relevant = thread.filter(m => isDriver ? m.from !== "driver" : m.from === "driver");
    if (onMarkRead) onMarkRead(bookingKey, relevant.length);
    onClose();
  };

  const send = () => {
    if (!text.trim()) return;
    onSend(bookingKey, {
      id: Date.now(),
      from: isDriver ? "driver" : currentUser.id,
      fromName: isDriver ? "Conductor 🚗" : currentUser.name,
      fromAvatar: isDriver ? "#c9a96e" : currentUser.avatar,
      text: text.trim(),
      ts: new Date().toLocaleTimeString("es-ES", { hour:"2-digit", minute:"2-digit" }),
    });
    setText("");
  };

  return (
    <div onClick={handleClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#0f172a", borderRadius:"22px 22px 0 0", width:"100%",
        border:"1px solid #1e3a5f", borderBottom:"none",
        display:"flex", flexDirection:"column", maxHeight:"85vh",
      }}>
        {/* Header */}
        <div style={{padding:"16px 18px 12px",borderBottom:"1px solid #1e293b",flexShrink:0}}>
          <div style={{width:36,height:4,background:"#2a3a4a",borderRadius:2,margin:"0 auto 10px"}}/>
          {/* Back + close row */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <button onClick={handleClose} style={{
              display:"flex",alignItems:"center",gap:6,background:"none",border:"none",
              color:"#a8b8cc",fontSize:13,cursor:"pointer",padding:0,fontFamily:"inherit",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8b8cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              {lang==="en"?"Back":"Volver"}
            </button>
            <button onClick={handleClose} style={{
              background:"#1e293b",border:"1px solid #2a3a4a",borderRadius:"50%",
              width:30,height:30,cursor:"pointer",color:"#a8b8cc",fontSize:16,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>×</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              <div style={{color:"#a8b8cc",fontSize:9,letterSpacing:2,marginBottom:3}}>{lang==="en"?"BOOKING CHAT":"CHAT DE RESERVA"}</div>
              <div style={{color:"#f8fafc",fontSize:15,fontFamily:"'Cormorant Garamond',serif",fontWeight:700}}>{b.guest}</div>
              <div style={{color:"#c9a96e",fontSize:10,marginTop:1}}>{b.hotel} · {b.date} {b.time}</div>
            </div>
            {/* Show who's on the other side */}
            {isDriver && emp ? (
              <div style={{display:"flex",alignItems:"center",gap:6,background:emp.avatar+"15",border:`1px solid ${emp.avatar}33`,borderRadius:8,padding:"5px 10px"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:emp.avatar+"30",border:`1.5px solid ${emp.avatar}66`,display:"flex",alignItems:"center",justifyContent:"center",color:emp.avatar,fontSize:9,fontWeight:700}}>{initials(emp.name)}</div>
                <div>
                  <div style={{color:emp.avatar,fontSize:11,fontWeight:600}}>{emp.name}</div>
                  <div style={{color:"#a8b8cc",fontSize:9}}>{emp.hotel.split(" ").slice(-1)[0]}</div>
                </div>
              </div>
            ) : !isDriver ? (
              <div style={{display:"flex",alignItems:"center",gap:6,background:"#c9a96e15",border:"1px solid #c9a96e33",borderRadius:8,padding:"5px 10px"}}>
                <svg width="28" height="28" viewBox="0 0 80 40" fill="none">
                  <path d="M8 28 L8 32 L16 32 L16 28 Z" fill="#c9a96e" opacity="0.6"/>
                  <path d="M64 28 L64 32 L72 32 L72 28 Z" fill="#c9a96e" opacity="0.6"/>
                  <path d="M4 24 L12 12 L28 8 L52 8 L68 12 L76 24 L76 30 L4 30 Z" fill="#c9a96e" opacity="0.3" stroke="#c9a96e" strokeWidth="1.5"/>
                  <path d="M14 12 L20 8 L60 8 L66 12 Z" fill="#c9a96e" opacity="0.5"/>
                  <circle cx="20" cy="30" r="5" fill="#c9a96e" opacity="0.8"/>
                  <circle cx="60" cy="30" r="5" fill="#c9a96e" opacity="0.8"/>
                </svg>
                <span style={{color:"#c9a96e",fontSize:11,fontWeight:600}}>Conductor</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
          {thread.length === 0 && (
            <div style={{textAlign:"center",color:"#2a3a4a",fontSize:12,marginTop:20}}>
              No hay mensajes aún. ¡Empieza la conversación!
            </div>
          )}
          {thread.map(msg => {
            const mine = isDriver ? msg.from === "driver" : msg.from === currentUser?.id;
            return (
              <div key={msg.id} style={{display:"flex",flexDirection:"column",alignItems:mine?"flex-end":"flex-start"}}>
                {!mine && (
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                    <div style={{width:16,height:16,borderRadius:"50%",background:msg.fromAvatar+"30",border:`1px solid ${msg.fromAvatar}55`,display:"flex",alignItems:"center",justifyContent:"center",color:msg.fromAvatar,fontSize:8,fontWeight:700}}>{msg.fromName[0]}</div>
                    <span style={{color:"#a8b8cc",fontSize:10}}>{msg.fromName}</span>
                  </div>
                )}
                <div style={{
                  maxWidth:"80%",
                  background:mine
                    ?"linear-gradient(135deg,#c9a96e,#a07840)"
                    :"#1e293b",
                  border:mine?"none":"1px solid #2a3a4a",
                  borderRadius:mine?"14px 14px 4px 14px":"14px 14px 14px 4px",
                  padding:"9px 13px",
                }}>
                  <div style={{color:mine?"#0a0a0a":"#f8fafc",fontSize:13,lineHeight:1.4}}>{(!mine&&msg.from==="driver")?translateAutoMsg(msg.text,booking?.clientLang||"es"):msg.text}</div>
                  <div style={{color:mine?"rgba(0,0,0,0.45)":"#475569",fontSize:10,marginTop:3,textAlign:"right"}}>{msg.ts}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{padding:"10px 14px 24px",borderTop:"1px solid #1e293b",display:"flex",gap:8,flexShrink:0}}>
          <input
            value={text}
            onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder={lang==="en"?"Write a message...":"Escribe un mensaje..."}
            style={{flex:1,background:"#1e293b",border:"1px solid #2a3a4a",borderRadius:24,
              padding:"10px 16px",color:"#f8fafc",fontSize:13,outline:"none"}}
          />
          <button onClick={send} disabled={!text.trim()} style={{
            width:42,height:42,borderRadius:"50%",border:"none",cursor:"pointer",flexShrink:0,
            background:text.trim()?"linear-gradient(135deg,#c9a96e,#a07840)":"#1e293b",
            color:text.trim()?"#0a0a0a":"#334155",
            fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",
            transition:"all 0.15s",
          }}>➤</button>
        </div>
      </div>
    </div>
  );
}


function RatingModal({booking,onRate,onClose,lang}) {
  const [stars,setStars]=React.useState(0);
  const [hover,setHover]=React.useState(0);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(135deg,#0a1628,#1e293b)",border:"1.5px solid #c9a96e",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:320,textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:8}}>⭐</div>
        <div style={{color:"#e8d5a3",fontSize:18,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,marginBottom:4}}>{lang==="en"?"Rate your ride":"Valora tu viaje"}</div>
        <div style={{color:"#a8b8cc",fontSize:11,marginBottom:20}}>{booking.origin} → {booking.destination}</div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:20}}>
          {[1,2,3,4,5].map(s=>(
            <button key={s} onClick={()=>setStars(s)} onMouseEnter={()=>setHover(s)} onMouseLeave={()=>setHover(0)}
              style={{background:"none",border:"none",cursor:"pointer",fontSize:38,transform:(hover||stars)>=s?"scale(1.25)":"scale(1)",transition:"transform 0.1s"}}>
              <span style={{color:(hover||stars)>=s?"#f59e0b":"#374151"}}>★</span>
            </button>
          ))}
        </div>
        <button onClick={()=>stars&&onRate(booking.id,stars)} disabled={!stars} style={{width:"100%",background:stars?"linear-gradient(135deg,#c9a96e,#a07840)":"#1e293b",border:"none",borderRadius:12,padding:"12px 0",cursor:stars?"pointer":"default",color:stars?"#0a0a0a":"#475569",fontSize:13,fontWeight:700,marginBottom:8}}>{lang==="en"?"Submit":"Enviar valoracion"}</button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#475569",fontSize:12,cursor:"pointer"}}>{lang==="en"?"Skip":"Omitir"}</button>
      </div>
    </div>
  );
}
function ClientAuth({ onLogin, onBack, lang, setLang, darkMode=true, T=VELO_DARK }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;
  const [mode, setMode]           = useState("login");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [pin, setPin]             = useState("");
  const [pin2, setPin2]           = useState("");
  const [error, setError]         = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [newPin, setNewPin]       = useState("");
  const [newPin2, setNewPin2]     = useState("");
  const [recoveryDone, setRecoveryDone] = useState(false);

  // ── REGISTER ──
  const handleRegister = () => {
    setError("");
    if (!name.trim())               { setError(t.enterName); return; }
    if (!email.includes("@"))       { setError(t.invalidEmail); return; }
    if (pin.length !== 4)           { setError(t.pinLength); return; }
    if (!/^\d{4}$/.test(pin))       { setError(t.pinDigits); return; }
    if (pin !== pin2)               { setError(t.pinConfirmErr); return; }
    if (emailExists(email.trim()))  { setError(t.emailTaken); return; }
    const result = createClient(name.trim(), email.trim().toLowerCase(), pin);
    if (result.error) { setError(result.error); return; }
    onLogin(result.client);
  };

  // ── PIN RECOVERY ──
  const handleResetPin = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setError(t.pinError); return; }
    if (newPin !== newPin2) { setError(t.pinConfirmErr); return; }
    const clients = loadClients();
    const updated = clients.map(c =>
      c.email.toLowerCase() === email.trim().toLowerCase() ? {...c, pin: newPin} : c
    );
    saveClients(updated);
    setRecoveryDone(true);
    setError("");
    setTimeout(() => {
      setShowRecovery(false);
      setRecoveryDone(false);
      setNewPin(""); setNewPin2("");
      setPin("");
    }, 2000);
  };

  // ── LOGIN ──
  const handleLoginPin = (enteredPin) => {
    const client = findClientByEmailAndPin(email.trim().toLowerCase(), enteredPin);
    if (!client) { setError(t.wrongCredentials); return; }
    setError("");
    onLogin(client);
  };

  const emailOk = email.includes("@") && email.includes(".");

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"24px 20px",background:"#000"}}>
      <VeloLogo dark={darkMode} size={150}/>
      <div style={{marginTop:12,marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:"#c9a96e"}}/>
        <span style={{color:"#e8d5a3",fontSize:12,fontWeight:700,letterSpacing:3}}>VIP CUSTOMER SERVICE</span>
      </div>
      <div style={{color:"#a8b8cc",fontSize:11,marginBottom:28}}>{t.tagline}</div>

      {/* Toggle */}
      <div style={{display:"flex",background:"#1e293b",borderRadius:12,padding:3,marginBottom:24,gap:2,width:"100%",maxWidth:340}}>
        {[{id:"login",label:t.signIn},{id:"register",label:t.createAccount}].map(m=>(
          <button key={m.id} onClick={()=>{setMode(m.id);setError("");setPin("");setPin2("");}} style={{
            flex:1,padding:"8px 0",border:"none",borderRadius:9,cursor:"pointer",
            background:mode===m.id?"linear-gradient(135deg,#c9a96e,#a07840)":"transparent",
            color:mode===m.id?"#fff":"#a8b8cc",fontSize:12,fontWeight:mode===m.id?600:400,transition:"all 0.2s",
          }}>{m.label}</button>
        ))}
      </div>

      <div style={{width:"100%",maxWidth:340}}>

        {/* ── REGISTER ── */}
        {mode==="register"&&(
          <>
            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.fullName}</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder={t.namePlaceholder}
              style={{...inputStyle,marginBottom:14}}/>

            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>EMAIL</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder={t.emailPlaceholder} autoCapitalize="none"
              style={{...inputStyle,marginBottom:14}}/>

            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>
              {t.choosePin}
            </label>
            <input
              type="number" inputMode="numeric" pattern="[0-9]*"
              value={pin} onChange={e=>setPin(e.target.value.slice(0,4))}
              placeholder="••••" maxLength={4}
              style={{...inputStyle,letterSpacing:8,fontSize:22,textAlign:"center",marginBottom:14}}
            />

            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>
              {t.confirmPin}
            </label>
            <input
              type="number" inputMode="numeric" pattern="[0-9]*"
              value={pin2} onChange={e=>setPin2(e.target.value.slice(0,4))}
              placeholder="••••" maxLength={4}
              style={{...inputStyle,letterSpacing:8,fontSize:22,textAlign:"center",
                marginBottom:14,
                borderColor: pin2.length===4 ? (pin===pin2?"#22c55e":"#ef4444") : undefined,
              }}
            />
            {pin2.length===4&&pin!==pin2&&(
              <div style={{color:"#ef4444",fontSize:11,marginBottom:10}}>⚠️ Los PINs no coinciden</div>
            )}
            {pin2.length===4&&pin===pin2&&(
              <div style={{color:"#22c55e",fontSize:11,marginBottom:10}}>✓ PINs coinciden</div>
            )}

      {/* Discount banner */}}
            <div style={{background:"#0a1628",border:"1px solid #c9a96e33",borderRadius:10,
              padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>🏷️</span>
              <div>
                <div style={{color:"#e8d5a3",fontSize:12,fontWeight:600}}>{t.discountBanner}</div>
                <div style={{color:"#a8b8cc",fontSize:10,marginTop:1}}>{t.minFare}</div>
              </div>
            </div>

            {error&&<div style={{color:"#ef4444",fontSize:12,marginBottom:12,textAlign:"center"}}>{error}</div>}

            <button onClick={handleRegister} style={{
              width:"100%",background:"linear-gradient(135deg,#c9a96e,#a07840)",
              border:"none",borderRadius:12,padding:"14px 0",
              color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10,
            }}>{t.createBtn}</button>
          </>
        )}

        {/* ── LOGIN ── */}
        {mode==="login"&&(
          <>
            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>EMAIL</label>
            <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");setPin("");}}
              placeholder={t.emailPlaceholder} autoCapitalize="none"
              style={{...inputStyle,marginBottom:14,
                borderColor: emailOk ? (emailExists(email.trim())?"#22c55e":"#ef4444") : undefined,
              }}/>
            {emailOk&&!emailExists(email.trim())&&(
              <div style={{color:"#ef4444",fontSize:11,marginBottom:10}}>
                ⚠️ No existe ninguna cuenta con ese email
              </div>
            )}
            {emailOk&&emailExists(email.trim())&&(
              <>
                <div style={{color:"#22c55e",fontSize:11,marginBottom:14,display:"flex",alignItems:"center",gap:5}}>
                  <span>✓</span> Cuenta encontrada — introduce tu PIN
                </div>
                <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>
                  TU PIN DE 4 DÍGITOS
                </label>
                <input
                  type="number" inputMode="numeric" pattern="[0-9]*"
                  value={pin} onChange={e=>{
                    const val = e.target.value.slice(0,4);
                    setPin(val);
                    if(val.length===4) handleLoginPin(val);
                  }}
                  placeholder="••••" maxLength={4} autoFocus
                  style={{...inputStyle,letterSpacing:8,fontSize:22,textAlign:"center",marginBottom:8}}
                />
                {pin.length>0&&pin.length<4&&(
                  <div style={{color:"#a8b8cc",fontSize:11,textAlign:"center",marginBottom:8}}>
                    {4-pin.length} dígito{4-pin.length>1?"s":""} más...
                  </div>
                )}
                {/* Forgot PIN */}
                <button onClick={()=>setShowRecovery(true)} style={{
                  background:"none",border:"none",color:"#475569",fontSize:11,
                  cursor:"pointer",width:"100%",textAlign:"center",padding:"4px 0",marginBottom:10,
                  textDecoration:"underline",
                }}>
                  ¿No recuerdas tu PIN?
                </button>
              </>
            )}
            {error&&<div style={{color:"#ef4444",fontSize:12,marginBottom:12,textAlign:"center"}}>{error}</div>}
          </>
        )}

        {onBack&&(
          <button onClick={onBack} style={{width:"100%",background:"none",border:"1px solid #1e293b",
            borderRadius:12,padding:"11px 0",color:"#a8b8cc",fontSize:13,cursor:"pointer",marginTop:4}}>
            {lang==="en"?"← Back":"← Volver"}
          </button>
        )}
      </div>

      {/* ── PIN RECOVERY MODAL ── */}
      {showRecovery&&(
        <div onClick={()=>setShowRecovery(false)} style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,
          display:"flex",alignItems:"flex-end",
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"linear-gradient(180deg,#1e293b,#0f172a)",
            borderRadius:"22px 22px 0 0",padding:"20px 20px 40px",width:"100%",
            border:"1px solid #c9a96e44",borderBottom:"none",
            animation:"slideUp 0.3s ease",
          }}>
            <div style={{width:40,height:4,background:"#2a3a4a",borderRadius:2,margin:"0 auto 14px"}}/>
            <button onClick={()=>setShowRecovery(false)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#a8b8cc",fontSize:13,cursor:"pointer",padding:"0 0 14px",fontFamily:"inherit"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8b8cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              {lang==="en"?"Back":"Volver"}
            </button>

            {recoveryDone ? (
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:48,marginBottom:12}}>✅</div>
                <div style={{color:"#22c55e",fontSize:18,fontFamily:"'Cormorant Garamond',serif"}}>PIN cambiado</div>
                <div style={{color:"#a8b8cc",fontSize:13,marginTop:6}}>Ya puedes iniciar sesión con tu nuevo PIN</div>
              </div>
            ) : (
              <>
                <div style={{color:"#e8d5a3",fontSize:11,letterSpacing:3,marginBottom:6}}>CAMBIAR PIN</div>
                <div style={{color:"#f8fafc",fontSize:15,fontFamily:"'Cormorant Garamond',serif",marginBottom:4}}>
                  Establece un nuevo PIN de acceso
                </div>
                <div style={{color:"#a8b8cc",fontSize:11,marginBottom:18}}>
                  Cuenta: <span style={{color:"#e8d5a3"}}>{email}</span>
                </div>

                <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:6}}>
                  NUEVO PIN DE 4 DÍGITOS
                </label>
                <input
                  type="number" inputMode="numeric" pattern="[0-9]*"
                  value={newPin} onChange={e=>setNewPin(e.target.value.slice(0,4))}
                  placeholder="••••" maxLength={4}
                  style={{...inputStyle,letterSpacing:8,fontSize:22,textAlign:"center",marginBottom:14}}
                />

                <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:6}}>
                  CONFIRMA EL NUEVO PIN
                </label>
                <input
                  type="number" inputMode="numeric" pattern="[0-9]*"
                  value={newPin2} onChange={e=>setNewPin2(e.target.value.slice(0,4))}
                  placeholder="••••" maxLength={4}
                  style={{...inputStyle,letterSpacing:8,fontSize:22,textAlign:"center",marginBottom:14,
                    borderColor:newPin2.length===4?(newPin===newPin2?"#22c55e":"#ef4444"):undefined}}
                />
                {newPin2.length===4&&newPin!==newPin2&&(
                  <div style={{color:"#ef4444",fontSize:11,marginBottom:10}}>⚠️ Los PINs no coinciden</div>
                )}

                {error&&<div style={{color:"#ef4444",fontSize:12,marginBottom:12,textAlign:"center"}}>{error}</div>}

                <button onClick={handleResetPin} style={{
                  width:"100%",background:"linear-gradient(135deg,#c9a96e,#a07840)",
                  border:"none",borderRadius:12,padding:"14px 0",
                  color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",
                }}>
                  Guardar nuevo PIN
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function ClientView({ client, bookings, setBookings, onNewBooking, onClientAcceptPrice, onClientRejectPrice, onClientCancelTrip, tab, setTab, driverStatus, blockedSlots, serviceStatus, messages, onSendMessage, onMarkRead, lang, setLang, darkMode=true, setDarkMode, T=VELO_DARK }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;
  const {loading:geoLoading,error:geoError,getLocation,setGeoState}=useGeolocation();
  // Clock tick: forces re-render every 30s so past slots auto-block
  const [now, setNow] = useState(()=>new Date());
  useEffect(()=>{
    const t = setInterval(()=>setNow(new Date()), 1000);
    return ()=>clearInterval(t);
  },[]);
  const [chatBooking,setChatBooking]=useState(null);
  const [arrivedBooking,setArrivedBooking]=useState(null);
  const [pricePerKm,setPricePerKm]=useState(()=>{try{return Number(localStorage.getItem("ntprice_client")||3.15);}catch{return 3.15;}});
  const [cancelConfirm,setCancelConfirm]=useState(null);
  const [historyOpen,setHistoryOpen]=useState(true); // booking to cancel
  const [form,setForm]=useState({
    guest:client.name, guestPhone:"", origin:"", destination:"",
    date:new Date().toISOString().slice(0,10), time:"", passengers:1, notes:"", fare:"", paymentMethod:"cash",
  });
  const [submitted,setSubmitted]=useState(false);

  const myBookings = bookings.filter(b=>b.clientId===client.id);
  const isOffline  = serviceStatus?.status==="offline";
  const slotAvailable = form.date&&form.time ? (isSlotFree(bookings,form.date,form.time,blockedSlots) && isClientAdvanceOk(form.date,form.time)) : null;

  const discountedFare = null; // Price will be proposed by driver

  const resetForm = () => setForm({guest:client.name,guestPhone:"",origin:"",destination:"",date:new Date().toISOString().slice(0,10),time:"",passengers:1,notes:"",fare:"",paymentMethod:"cash"});

  const handleSubmit = () => {
    if(!form.guest||!form.origin||!form.destination||!slotAvailable||!form.time) return;
    if(!isClientAdvanceOk(form.date,form.time)) return;
    onNewBooking({
      ...form, fare:form.fare||0, clientId:client.id, receptionist:client.name,
      hotel:`Cliente VIP: ${client.name}`, employeeId:null,
      isClientBooking:true, discountedFare:null, clientLang:lang,
      status:"pending", createdAt:new Date().toLocaleString(lang==="en"?"en-GB":"es-ES"),
    });
    setSubmitted(true);
    setTimeout(()=>{setTab("mine");setSubmitted(false);resetForm();},2500);
  };

  if(submitted) return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:16}}>✅</div>
      <div style={{color:"#e8d5a3",fontSize:22,fontFamily:"'Cormorant Garamond',serif",marginBottom:8}}>{t.sentTitle}</div>
      <div style={{color:"#a8b8cc",fontSize:14}}>{t.sentSub}</div>
    </div>
  );

  return (
    <div style={{paddingBottom:80}}>
      {/* Offline banner */}
      {isOffline&&(
        <div style={{background:"linear-gradient(135deg,#2a0808,#1a0505)",border:"2px solid #ef4444",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#ef4444",animation:"pulse 1s infinite"}}/>
            <span style={{color:"#ef4444",fontSize:13,fontWeight:700}}>🔴 SERVICIO NO DISPONIBLE</span>
          </div>
          <div style={{color:"#f8fafc",fontSize:13,lineHeight:1.5}}>
            El conductor está fuera de servicio.{serviceStatus?.lastActiveDate&&` Último día operativo: ${serviceStatus.lastActiveDate}.`}
            {serviceStatus?.returnDate&&` Regreso previsto: ${serviceStatus.returnDate}.`}
          </div>
        </div>
      )}

      {/* Last active date notice when online */}
      {!isOffline&&serviceStatus?.lastActiveDate&&(
        <div style={{background:"linear-gradient(135deg,#1a1000,#1e293b)",border:"1.5px solid #f59e0b",borderRadius:12,padding:"10px 14px",marginBottom:14}}>
          <div style={{color:"#f59e0b",fontSize:12,fontWeight:700,marginBottom:3}}>⚠️ Aviso de disponibilidad</div>
          <div style={{color:"#f8fafc",fontSize:12}}>Servicio disponible hasta el <strong>{serviceStatus.lastActiveDate}</strong>. Reserva con antelación.{serviceStatus?.returnDate&&` Regreso: ${serviceStatus.returnDate}.`}</div>
        </div>
      )}

      {/* Driver status + Vehicle card */}
      {!isOffline&&(
        <div style={{
          background:"linear-gradient(135deg,#0a0a0a,#1a1a1a)",
          border:"1px solid #c9a96e33",borderRadius:14,
          padding:"14px 16px",marginBottom:14,
          position:"relative",overflow:"hidden",
        }}>
          {/* Subtle glow */}
          <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"#c9a96e08",pointerEvents:"none"}}/>

          {/* Status row */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:driverStatus==="onroute"?"#ef4444":"#c9a96e",animation:"pulse 1.5s infinite",flexShrink:0}}/>
              <span style={{color:driverStatus==="onroute"?"#ef4444":"#e8d5a3",fontSize:12,fontWeight:700,letterSpacing:0.5}}>
                {driverStatus==="onroute"?t.onRoute:t.driverAvailable}
              </span>
            </div>
            <div style={{background:"#c9a96e18",border:"1px solid #c9a96e33",borderRadius:20,padding:"2px 10px"}}>
              <span style={{color:"#c9a96e",fontSize:9,fontWeight:700,letterSpacing:2}}>PRIVATE TRANSFERS</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{height:1,background:"linear-gradient(90deg,transparent,#c9a96e33,transparent)",marginBottom:12}}/>

          {/* Vehicle info */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {/* Tesla T logo */}
            <div style={{
              width:42,height:42,borderRadius:10,
              background:"linear-gradient(135deg,#111,#222)",
              border:"1px solid #c9a96e44",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            }}>
              <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
                <path d="M50 12 C30 12 15 18 10 26 C18 24 34 22 50 22 C66 22 82 24 90 26 C85 18 70 12 50 12Z" fill="#c9a96e"/>
                <path d="M10 26 C18 24 34 22 50 22 L50 88 C40 60 25 42 10 26Z" fill="#c9a96e"/>
                <path d="M90 26 C82 24 66 22 50 22 L50 88 C60 60 75 42 90 26Z" fill="#c9a96e"/>
              </svg>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:3}}>
                <span style={{color:"#f8fafc",fontSize:15,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,letterSpacing:0.5}}>Tesla Model 3</span>
                
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:12,height:12,borderRadius:"50%",background:"#111",border:"1.5px solid #444",boxShadow:"inset 0 0 4px rgba(255,255,255,0.1)"}}/>
                <span style={{color:"#a8b8cc",fontSize:11}}>{lang==="en"?"Midnight Black · Electric":"Negro Medianoche · Eléctrico"}</span>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5,flexWrap:"wrap"}}>
                  <span style={{color:"#c9a96e",fontSize:12,fontWeight:700,letterSpacing:2,background:"#c9a96e15",border:"1px solid #c9a96e44",borderRadius:6,padding:"2px 8px"}}>🔲 5361MZC</span>
                  <span style={{color:"#a8b8cc",fontSize:11}}>· Sebastián Echevarría</span>
                </div>
              </div>
            </div>
            {/* Electric bolt */}
            <div style={{flexShrink:0}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#c9a96e" opacity="0.7">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ── PRÓXIMO VIAJE CLIENTE ── */}
      {(()=>{
        const upcoming = myBookings
          .filter(b=>["confirmed","inprogress"].includes(b.status))
          .sort((a,b)=>new Date(`${a.date}T${a.time}:00`)-new Date(`${b.date}T${b.time}:00`))
          .find(b=>new Date(`${b.date}T${b.time}:00`)-now>-TRIP_DURATION*60*1000);
        if(!upcoming) return null;
        const tripDt=new Date(`${upcoming.date}T${upcoming.time}:00`);
        const diffMs=tripDt-now;
        const isOngoing=diffMs<0&&diffMs>-TRIP_DURATION*60*1000;
        const totalSecs=Math.max(0,Math.floor(Math.abs(diffMs)/1000));
        const days=Math.floor(totalSecs/86400);
        const hrs=Math.floor((totalSecs%86400)/3600);
        const mins=Math.floor((totalSecs%3600)/60);
        const secs=totalSecs%60;
        const pad=n=>String(n).padStart(2,"0");
        const countdownStr=days>0?`${days}d ${pad(hrs)}h ${pad(mins)}m`:`${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
        const urgency=!isOngoing&&diffMs>0&&diffMs<30*60*1000;
        const isArrived=arrivedBooking&&arrivedBooking.id===upcoming.id;
        const waitEndMs=tripDt.getTime()+10*60*1000;
        const waitRemMs=isArrived?Math.max(0,waitEndMs-Date.now()):0;
        const wSecs=Math.floor(waitRemMs/1000);
        const wMins=Math.floor(wSecs/60);
        const wSecsR=wSecs%60;
        const basePrice=upcoming.proposedPrice||upcoming.fare||0;
        const discountedPrice=basePrice>0?(basePrice*(1-DISCOUNT_RATE)).toFixed(2):0;
        return(
          <div style={{
            marginBottom:16,
            background:isArrived?"linear-gradient(135deg,#0a2a1a,#1e293b)":isOngoing?"linear-gradient(135deg,#0a2a0a,#1e293b)":urgency?"linear-gradient(135deg,#2a1500,#1e293b)":"linear-gradient(135deg,#0a1628,#1e293b)",
            border:`2px solid ${isArrived?"#22c55e":isOngoing?"#22c55e":urgency?"#f59e0b":"#c9a96e44"}`,
            borderRadius:18,overflow:"hidden",
            boxShadow:isArrived?"0 0 24px #22c55e44":isOngoing?"0 0 20px #22c55e33":urgency?"0 0 20px #f59e0b33":"none",
          }}>
            <div style={{padding:"10px 16px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:isArrived?"#22c55e":urgency?"#f59e0b":"#c9a96e",animation:"pulse 1s infinite",flexShrink:0}}/>
                <span style={{color:"#a8b8cc",fontSize:10,letterSpacing:2,fontWeight:600}}>
                  {isArrived?"🚗 CONDUCTOR LLEGÓ":"PRÓXIMO VIAJE"}
                </span>
              </div>
              <span style={{background:isOngoing?"#22c55e22":urgency?"#f59e0b22":"#c9a96e22",border:`1px solid ${isOngoing?"#22c55e44":urgency?"#f59e0b44":"#c9a96e44"}`,borderRadius:8,padding:"3px 10px",color:isOngoing?"#22c55e":urgency?"#f59e0b":"#c9a96e",fontSize:10,fontWeight:700}}>
                {upcoming.status==="confirmed"?"✅ Confirmado":upcoming.status==="inprogress"?"🚗 En curso":"⏳ Pendiente"}
              </span>
            </div>
            <div style={{padding:"10px 16px 0"}}>
              <div style={{color:"#f8fafc",fontSize:16,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,marginBottom:4}}>{upcoming.date} · {upcoming.time}</div>
              <div style={{color:"#a8b8cc",fontSize:11,marginBottom:2}}><span style={{color:"#c9a96e"}}>▶ </span>{upcoming.origin}</div>
              <div style={{color:"#a8b8cc",fontSize:11,marginBottom:10}}><span style={{color:"#3b82f6"}}>■ </span>{upcoming.destination}</div>
            </div>
            {/* ── TRIP INFO ── */}
            {(()=>{
              const fare3 = upcoming.proposedPrice||upcoming.fare||0;
              if(!fare3||!upcoming.time) return null;
              const km3 = upcoming.tripKm || Math.round(fare3/3.15*10)/10;
              const dur3 = upcoming.durationMin || Math.round(km3*1.5);
              const [h3,m3]=upcoming.time.split(":").map(Number);
              const arr3=new Date(0,0,0,h3,m3+dur3);
              const arrStr3=`${String(arr3.getHours()).padStart(2,"0")}:${String(arr3.getMinutes()).padStart(2,"0")}`;
              return(
                <div style={{display:"flex",justifyContent:"space-between",background:"#0f172a",border:"1px solid #1e3a5f",borderRadius:10,padding:"7px 12px",margin:"0 12px 8px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>🗺️</span><span style={{color:"#a8b8cc",fontSize:11}}>{km3} km</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>⏱️</span><span style={{color:"#a8b8cc",fontSize:11}}>~{dur3} min</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>🏁</span><span style={{color:"#c9a96e",fontSize:11,fontWeight:700}}>~{arrStr3}</span></div>
                  <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(upcoming.origin)}&destination=${encodeURIComponent(upcoming.destination)}`} target="_blank" rel="noopener noreferrer" style={{background:"#1e3a5f",border:"1px solid #3b82f655",borderRadius:6,padding:"3px 8px",color:"#3b82f6",fontSize:10,fontWeight:700,textDecoration:"none",flexShrink:0}}>{lang==="en"?"Route":"Ver ruta"}</a>
                </div>
              );
            })()}
            <div style={{margin:"0 12px 12px",display:"flex",gap:8}}>
              {!isArrived&&(
                <div style={{flex:1,background:isOngoing?"#22c55e12":urgency?"#f59e0b12":"#c9a96e10",borderRadius:12,padding:"10px 14px"}}>
                  <div style={{color:"#a8b8cc",fontSize:9,letterSpacing:2,marginBottom:3}}>{isOngoing?(lang==="en"?"IN PROGRESS":"EN CURSO"):(lang==="en"?"TIME REMAINING":"TIEMPO RESTANTE")}</div>
                  <div style={{color:isOngoing?"#22c55e":urgency?"#f59e0b":"#f8fafc",fontSize:26,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,letterSpacing:2}}>{countdownStr}</div>
                </div>
              )}
              {isArrived&&(
                <div style={{flex:1,background:"#22c55e12",borderRadius:12,padding:"10px 14px",border:"1.5px solid #22c55e44"}}>
                  <div style={{color:"#22c55e",fontSize:11,fontWeight:700,marginBottom:2}}>🚗 Conductor esperando</div>
                  <div style={{color:"#a8b8cc",fontSize:9,marginBottom:3}}>ESPERA HASTA LAS {String(new Date(waitEndMs).getHours()).padStart(2,"0")}:{String(new Date(waitEndMs).getMinutes()).padStart(2,"0")}</div>
                  <div style={{color:wSecs<120?"#ef4444":"#22c55e",fontSize:24,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,letterSpacing:2}}>{pad(wMins)}:{pad(wSecsR)}</div>
                  {wSecs===0&&<div style={{color:"#ef4444",fontSize:10,fontWeight:700,marginTop:4}}>⚠️ Tiempo de espera agotado</div>}
                </div>
              )}
              {basePrice>0&&(
                <div style={{background:"#c9a96e10",borderRadius:12,padding:"10px 14px",textAlign:"right",flexShrink:0}}>
                  <div style={{color:"#a8b8cc",fontSize:9,marginBottom:2}}>{lang==="en"?"FARE":"TARIFA"}</div>
                  <div style={{color:"#a8b8cc",fontSize:11,textDecoration:"line-through"}}>{basePrice} €</div>
                  <div style={{color:"#c9a96e",fontSize:20,fontFamily:"'Cormorant Garamond',serif",fontWeight:700}}>{discountedPrice} €</div>
                  <div style={{color:"#22c55e",fontSize:9,fontWeight:700}}>-{Math.round(DISCOUNT_RATE*100)}% VIP</div>
                </div>
              )}
            </div>
            <div style={{margin:"0 12px 12px",display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={()=>setChatBooking(upcoming)} style={{
                width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                background:"linear-gradient(135deg,#1e0a3e,#1e293b)",border:"1px solid #a78bfa55",
                borderRadius:10,padding:"10px 0",color:"#a78bfa",fontSize:12,fontWeight:700,cursor:"pointer",
              }}>💬 {lang==="en"?"Chat with driver":"Chat con el conductor"}</button>
              {/* Cancel with double confirmation */}
              {cancelConfirm===upcoming.id?(
                <div style={{background:"linear-gradient(135deg,#2a0808,#1e293b)",border:"2px solid #ef4444",borderRadius:12,padding:"14px"}}>
                  <div style={{color:"#f8fafc",fontSize:13,fontWeight:700,textAlign:"center",marginBottom:4}}>{lang==="en"?"⚠️ Confirm cancellation?":"⚠️ ¿Confirmas la cancelación?"}</div>
                  <div style={{color:"#a8b8cc",fontSize:11,textAlign:"center",marginBottom:12}}>{lang==="en"?"This cannot be undone":"Esta acción no se puede deshacer"}</div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setCancelConfirm(null)} style={{flex:1,background:"#1e293b",border:"1px solid #475569",borderRadius:8,padding:"10px 0",color:"#a8b8cc",fontSize:12,fontWeight:600,cursor:"pointer"}}>{lang==="en"?"Go back":"No, volver"}</button>
                    <button onClick={()=>{handleClientCancelTrip&&handleClientCancelTrip(upcoming.id);setCancelConfirm(null);}} style={{flex:1,background:"linear-gradient(135deg,#ef4444,#b91c1c)",border:"none",borderRadius:8,padding:"10px 0",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>{lang==="en"?"Yes, cancel":"Sí, cancelar"}</button>
                  </div>
                </div>
              ):(
                <button onClick={()=>setCancelConfirm(upcoming.id)} style={{
                  width:"100%",background:"#1a0808",border:"1.5px solid #ef444466",borderRadius:10,
                  padding:"10px 0",color:"#ef4444aa",fontSize:12,fontWeight:700,cursor:"pointer",
                }}>✕ {lang==="en"?"Cancel trip":"Cancelar viaje"}</button>
              )}
            </div>
          </div>
        );
      })()}

            {/* Discount banner */}
      <div style={{background:"linear-gradient(135deg,#1a130a,#1e293b)",border:"1px solid #c9a96e33",borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>🏷️</span>
        <div>
          <div style={{color:"#e8d5a3",fontSize:13,fontWeight:700}}>{t.discount15}</div>
          <div style={{color:"#a8b8cc",fontSize:11}}>{t.autoDiscount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:"#1e293b",borderRadius:12,padding:3,marginBottom:18,gap:2}}>
        {[{id:"avail",label:t.tabAvail},{id:"mine",label:t.tabTrips}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"8px 4px",border:"none",borderRadius:9,cursor:"pointer",
            background:tab===t.id?"linear-gradient(135deg,#c9a96e,#a07840)":"transparent",
            color:tab===t.id?"#fff":"#a8b8cc",fontSize:11,fontWeight:tab===t.id?600:400,transition:"all 0.2s"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── AVAILABILITY TAB ── */}
      {tab==="avail"&&(
        <div>
          <div style={{color:"#a8b8cc",fontSize:10,letterSpacing:3,marginBottom:12}}>{t.sectionAvail}</div>
          <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value,time:""})}
            style={{background:"#1e293b",border:"1px solid #1e3a5f",borderRadius:10,color:"#f8fafc",fontSize:13,padding:"9px 14px",outline:"none",colorScheme:"dark",width:"100%",boxSizing:"border-box",marginBottom:14}}/>
          <div style={{background:"#111",borderRadius:14,overflow:"hidden",border:"1px solid #1e3a5f"}}>
            {Array.from({length:65},(_,i)=>i).map(i=>{
              const totalMins=6*60+i*15; if(totalMins>22*60)return null;
              const slotTime=m2t(totalMins);
              // Hide past slots on today's date
              const isToday = form.date===new Date().toISOString().slice(0,10);
              const slotDt = new Date(`${form.date}T${slotTime}:00`);
              if(isToday && (slotDt-now) < MIN_CLIENT_ADVANCE_MINS*60*1000) return null;
              const isHour=totalMins%60===0; const isHalfHour=totalMins%30===0;
              const occupied=bookings.some(b=>{
                if(b.date!==form.date||["rejected","cancelled","completed"].includes(b.status))return false;
                const sM=t2m(b.time),eM=sM+TRIP_DURATION; return totalMins>=sM-TRAVEL_PREP&&totalMins<eM;
              });
              const isDriverBlocked=(blockedSlots&&(blockedSlots[form.date]||[]).some(bt=>{const bm=t2m(bt);return totalMins>=bm-TRAVEL_PREP&&totalMins<bm+TRIP_DURATION;}));
              const isFree=!occupied&&!isDriverBlocked;
              return (
                <div key={slotTime} style={{display:"flex",alignItems:"center",borderBottom:`1px solid ${isHour?"#222":"#181818"}`,minHeight:isHour?40:28,
                  background:occupied?"linear-gradient(90deg,#2a0000,#1a0000)":isDriverBlocked?"linear-gradient(90deg,#2a0505,#111)":"transparent",
                }}>
                  <div style={{width:52,flexShrink:0,padding:"0 10px",borderRight:`1px solid ${isHour?"#222":"#181818"}`,display:"flex",alignItems:"center"}}>
                    <span style={{color:isHour?"#ffffff":isHalfHour?"#e2e8f0":"#cbd5e1",fontSize:isHour?12:10,fontWeight:isHour?700:400}}>{slotTime}</span>
                  </div>
                  <div style={{flex:1,padding:"0 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    {occupied&&<span style={{color:"#ef4444",fontSize:10,fontWeight:600}}>{t.occupied}</span>}
                    {isDriverBlocked&&!occupied&&<span style={{color:"#f97316",fontSize:10}}>{t.notAvail}</span>}
                    {isFree&&(isHour||isHalfHour)&&!isOffline&&(
                      <button onClick={()=>{setForm(f=>({...f,time:slotTime}));setTab("new");}} style={{
                        background:"linear-gradient(135deg,#c9a96e,#a07840)",border:"none",borderRadius:7,
                        color:"#fff",fontSize:isHour?11:10,fontWeight:700,padding:isHour?"5px 12px":"3px 10px",cursor:"pointer",
                      }}>{t.reserveBtn}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MY TRIPS TAB ── */}
      {tab==="mine"&&(
        <div>
          {/* ── HISTORIAL DE GASTO ── */}
          {myBookings.filter(b=>b.status==="completed"&&b.proposedPrice).length>0&&(()=>{
            const done = myBookings.filter(b=>b.status==="completed");
            const totalSpent = done.reduce((s,b)=>s+Number(b.proposedPrice||b.fare||0),0);
            const totalSaved = done.reduce((s,b)=>s+Number(b.proposedPrice||b.fare||0)*DISCOUNT_RATE,0);
            return (
              <div style={{
                background:"linear-gradient(135deg,#0a0f1e,#1e293b)",
                border:"1px solid #c9a96e33",borderRadius:14,
                padding:"14px 16px",marginBottom:14,
              }}>
                <div style={{color:"#c9a96e",fontSize:10,letterSpacing:3,marginBottom:10}}>
                  {lang==="en"?"YOUR SPENDING SUMMARY":"RESUMEN DE TU GASTO"}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  <div style={{background:"#0f172a",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{color:"#f8fafc",fontSize:20,fontFamily:"'Cormorant Garamond',serif",fontWeight:700}}>{done.length}</div>
                    <div style={{color:"#a8b8cc",fontSize:9,letterSpacing:1}}>{lang==="en"?"TRIPS":"VIAJES"}</div>
                  </div>
                  <div style={{background:"#0f172a",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{color:"#c9a96e",fontSize:20,fontFamily:"'Cormorant Garamond',serif",fontWeight:700}}>{fmt(totalSpent)}</div>
                    <div style={{color:"#a8b8cc",fontSize:9,letterSpacing:1}}>{lang==="en"?"€ SPENT":"€ GASTADO"}</div>
                  </div>
                  <div style={{background:"#0f172a",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{color:"#22c55e",fontSize:20,fontFamily:"'Cormorant Garamond',serif",fontWeight:700}}>{fmt(totalSaved)}</div>
                    <div style={{color:"#a8b8cc",fontSize:9,letterSpacing:1}}>{lang==="en"?"€ SAVED":"€ AHORRADO"}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── VIAJES FAVORITOS ── */}
          <FavRoutes
            clientId={client.id}
            myBookings={myBookings}
            lang={lang}
            t={t}
            onBook={r=>{setTab("new");setForm(fm=>({...fm,origin:r.origin,destination:r.destination}));}}
          />
                    <div style={{color:"#a8b8cc",fontSize:11,letterSpacing:3,marginBottom:12}}>{t.myTripsSection}</div>
          {myBookings.length===0&&<div style={{color:"#a8b8cc",fontSize:13,textAlign:"center",padding:"32px 0"}}>{t.noTrips}</div>}
          {(()=>{
            const active=myBookings.filter(b=>!["completed","cancelled","client_rejected","rejected"].includes(b.status)).sort((a,b)=>{const o={inprogress:0,confirmed:1,price_proposed:2,pending:3};return(o[a.status]??3)-(o[b.status]??3);});
            const hist=myBookings.filter(b=>["completed","cancelled","client_rejected","rejected"].includes(b.status)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
            return(<>
            {active.length>0&&<div style={{color:"#c9a96e",fontSize:11,letterSpacing:3,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><span style={{width:6,height:6,borderRadius:"50%",background:"#c9a96e",animation:"pulse 1.5s infinite",display:"inline-block"}}/>{lang==="en"?"MY BOOKINGS":"MIS RESERVAS"}</div>}
            {active.map(b=>(
            <div key={b.id} style={{
              background:b.status==="pending"?"linear-gradient(135deg,#1a1200,#1e2010)":"#1e293b",
              borderRadius:12,padding:"14px 16px",marginBottom:10,
              border:b.status==="pending"?"1.5px solid #f59e0b44":"none",
              borderLeft:"3px solid "+statusColor(b.status),
            }}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{color:"#f8fafc",fontSize:14,fontFamily:"'Cormorant Garamond',serif"}}>{b.guest}</span>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:`${statusColor(b.status)}22`,color:statusColor(b.status)}}>{statusLabel(b.status,t).toUpperCase()}</span>
              </div>
              <div style={{color:"#a8b8cc",fontSize:12,marginBottom:6}}>{b.date} · {b.time} · {b.passengers} pax</div>
              <div style={{color:"#a8b8cc",fontSize:11,marginBottom:4}}>📍 {b.origin}</div>
              <div style={{color:"#a8b8cc",fontSize:11,marginBottom:8}}>🏁 {b.destination}</div>
              {/* Fare with discount */}
              {b.fare&&(
                <div style={{background:"#0f172a",borderRadius:8,padding:"8px 12px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:"#a8b8cc",fontSize:11}}>{t.priceBase2}</span>
                    <span style={{color:"#a8b8cc",fontSize:12,textDecoration:"line-through"}}>{fmt(b.fare)} €</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:"#c9a96e",fontSize:11}}>{lang==="en"?"🏷️ 15% VIP discount":"🏷️ Descuento 15% VIP"}</span>
                    <span style={{color:"#c9a96e",fontSize:12}}>-{fmt(b.fare*DISCOUNT_RATE)} €</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:6,borderTop:"1px solid #22c55e33",marginTop:4,background:"#22c55e0d",borderRadius:8,padding:"8px 8px"}}>
                    <span style={{color:"#22c55e",fontSize:14,fontWeight:800,letterSpacing:0.3}}>{lang==="en"?"💶 YOUR PRICE":"💶 TU PRECIO"}</span>
                    <span style={{color:"#22c55e",fontSize:22,fontFamily:"'Cormorant Garamond',serif",fontWeight:800}}>{fmt(b.fare*(1-DISCOUNT_RATE))} €</span>
                  </div>
                </div>
              )}
              {/* ── TRIP INFO — km / duration / arrival ── */}
              {b.fare>0&&b.time&&(()=>{
                const km = b.tripKm || Math.round(b.fare/3.15*10)/10;
                const durationMin = b.durationMin || Math.round(km*1.5);
                const [h,m]=b.time.split(":").map(Number);
                const arr=new Date(0,0,0,h,m+durationMin);
                const arrivalTime=`${String(arr.getHours()).padStart(2,"0")}:${String(arr.getMinutes()).padStart(2,"0")}`;
                return(
                  <div style={{display:"flex",justifyContent:"space-between",background:"#0f172a",border:"1px solid #1e3a5f",borderRadius:10,padding:"8px 12px",marginTop:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span>🗺️</span>
                      <span style={{color:"#a8b8cc",fontSize:11}}>{km} km</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span>⏱️</span>
                      <span style={{color:"#a8b8cc",fontSize:11}}>~{durationMin} min</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span>🏁</span>
                      <span style={{color:"#c9a96e",fontSize:11,fontWeight:700}}>{lang==="en"?"Arrival":"Llegada"} ~{arrivalTime}</span>
                    </div>
                  </div>
                );
              })()}

              {b.status==="pending"&&(
                <div style={{
                  background:"linear-gradient(135deg,#1a1000,#1e293b)",
                  border:"1.5px solid #f59e0b55",
                  borderRadius:12,padding:"14px 16px",marginTop:8,
                }}>
                  {/* Status row */}
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b",animation:"pulse 1.5s infinite",flexShrink:0}}/>
                    <span style={{color:"#f59e0b",fontSize:12,fontWeight:700,letterSpacing:0.5}}>
                      {lang==="en"?"AWAITING DRIVER CONFIRMATION":"ESPERANDO CONFIRMACIÓN DEL CONDUCTOR"}
                    </span>
                  </div>
                  {/* Divider */}
                  <div style={{height:1,background:"linear-gradient(90deg,transparent,#f59e0b33,transparent)",marginBottom:12}}/>
                  {/* Price info */}
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{
                      width:38,height:38,borderRadius:10,flexShrink:0,
                      background:"#f59e0b15",border:"1px solid #f59e0b33",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
                    }}>💶</div>
                    <div>
                      <div style={{color:"#f8fafc",fontSize:12,fontWeight:600,marginBottom:3}}>
                        {lang==="en"?"Price pending driver review":"Precio pendiente de revisión"}
                      </div>
                      <div style={{color:"#a8b8cc",fontSize:11,lineHeight:1.4}}>
                        {lang==="en"
                          ?"The driver will review your route and propose a final price. You'll be able to accept or reject it."
                          :"El conductor revisará tu ruta y propondrá un precio final. Podrás aceptarlo o rechazarlo."}
                      </div>
                    </div>
                  </div>
                  {/* VIP reminder */}
                  <div style={{
                    marginTop:12,padding:"7px 10px",
                    background:"#c9a96e0a",border:"1px solid #c9a96e22",
                    borderRadius:8,display:"flex",alignItems:"center",gap:6,
                  }}>
                    <span style={{fontSize:12}}>🏷️</span>
                    <span style={{color:"#c9a96e",fontSize:10,fontWeight:600}}>
                      {lang==="en"
                        ?"Your 15% VIP discount will be applied automatically"
                        :"Tu descuento VIP del 15% se aplicará automáticamente"}
                    </span>
                  </div>
                </div>
              )}
              {b.status==="price_proposed"&&(
                <div style={{
                  background:"linear-gradient(135deg,#0a0f1e,#1a0f2e)",
                  border:"2px solid #a78bfa",borderRadius:14,
                  padding:"16px",marginTop:8,
                }}>
                  {/* Header */}
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:"#a78bfa",animation:"pulse 1.5s infinite"}}/>
                    <span style={{color:"#a78bfa",fontSize:11,fontWeight:700,letterSpacing:1.5}}>
                      {lang==="en"?"EXCLUSIVE PRICE FOR YOU":"PRECIO EXCLUSIVO PARA TI"}
                    </span>
                  </div>

                  {/* Breakdown */}
                  <div style={{background:"#0f172a",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                    {/* Original price */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{color:"#f8fafc",fontSize:12}}>
                        {lang==="en"?"Standard price":"Precio estándar"}
                      </span>
                      <span style={{color:"#94a3b8",fontSize:15,textDecoration:"line-through",fontFamily:"'Cormorant Garamond',serif"}}>
                        {fmt(b.proposedPrice)} €
                      </span>
                    </div>
                    {/* Discount line */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingBottom:10,borderBottom:"1px solid #1e293b"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{background:"#c9a96e22",border:"1px solid #c9a96e44",borderRadius:20,padding:"2px 8px",color:"#c9a96e",fontSize:10,fontWeight:700}}>
                          VIP −{Math.round(DISCOUNT_RATE*100)}%
                        </span>
                        <span style={{color:"#c9a96e",fontSize:11}}>
                          {lang==="en"?"Your exclusive discount":"Tu descuento exclusivo"}
                        </span>
                      </div>
                      <span style={{color:"#c9a96e",fontSize:13,fontWeight:700}}>
                        −{fmt(b.proposedPrice * DISCOUNT_RATE)} €
                      </span>
                    </div>
                    {/* Final price — hero */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{color:"#a78bfa",fontSize:11,fontWeight:700,letterSpacing:1,marginBottom:2}}>
                          {lang==="en"?"YOU PAY":"PAGAS TÚ"}
                        </div>
                        <div style={{color:"#a8b8cc",fontSize:9}}>
                          {lang==="en"?"Conductor profesional · Private Transfers":"Professional driver · Private Transfers"}
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{color:"#e8d5a3",fontSize:34,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,lineHeight:1,textShadow:"0 0 20px rgba(201,169,110,0.3)"}}>
                          {fmt(b.proposedPrice * (1 - DISCOUNT_RATE))} €
                        </div>
                        <div style={{color:"#22c55e",fontSize:10,marginTop:2,textAlign:"right"}}>
                          {lang==="en"?"You save":"Ahorras"} {fmt(b.proposedPrice * DISCOUNT_RATE)} €
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driver note */}
                  {b.proposedNote&&(
                    <div style={{
                      background:"#a78bfa0a",border:"1px solid #a78bfa22",
                      borderRadius:8,padding:"8px 12px",marginBottom:12,
                      display:"flex",gap:7,alignItems:"flex-start",
                    }}>
                      <span style={{fontSize:14,flexShrink:0}}>💜</span>
                      <div>
                        <div style={{color:"#a78bfa",fontSize:9,letterSpacing:1,marginBottom:2}}>
                          {lang==="en"?"NOTE FROM DRIVER":"NOTA DEL CONDUCTOR"}
                        </div>
                        <div style={{color:"#f8fafc",fontSize:12,fontStyle:"italic"}}>
                          "{b.proposedNote}"
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",background:"#22c55e12",borderRadius:10,border:"1px solid #22c55e33",marginTop:8}}>
                    <span>✅</span>
                    <span style={{color:"#22c55e",fontSize:12,fontWeight:700}}>
                      {lang==="en"?"Trip confirmed by driver":"Viaje confirmado por el conductor"}
                    </span>
                  </div>
                </div>
              )}
              {b.status==="confirmed"&&<div style={{fontSize:11,color:"#c9a96e"}}>✅ {t.confirmed}</div>}
              {(b.status==="confirmed"||b.status==="inprogress")&&b.notes&&(
                <div style={{marginTop:8,background:"#0f172a",border:"1px solid #c9a96e22",borderRadius:10,padding:"10px 12px"}}>
                  <div style={{color:"#a8b8cc",fontSize:9,letterSpacing:2,marginBottom:4}}>{lang==="en"?"YOUR NOTES":"TUS NOTAS"}</div>
                  <div style={{color:"#e8d5a3",fontSize:12}}>📋 {b.notes}</div>
                </div>
              )}
              {b.status==="inprogress"&&<div style={{fontSize:11,color:"#c9a96e",display:"flex",alignItems:"center",gap:4}}><span style={{width:5,height:5,borderRadius:"50%",background:"#c9a96e",display:"inline-block",animation:"pulse 1.5s infinite"}}/>🚗 {t.inprogress}</div>}
              {b.status==="completed"&&(
                <div>
                  <div style={{fontSize:11,color:"#22c55e",marginBottom:8}}>✅ {t.completed}</div>
                  {/* Rating */}
                  {!b.rating ? (
                    <div style={{background:"#0f172a",border:"1px solid #c9a96e22",borderRadius:10,padding:"10px 12px"}}>
                      <div style={{color:"#a8b8cc",fontSize:10,letterSpacing:1,marginBottom:8,textAlign:"center"}}>
                        {lang==="en"?"Rate your experience":"Valora tu experiencia"}
                      </div>
                      <div style={{display:"flex",justifyContent:"center",gap:6}}>
                        {[1,2,3,4,5].map(star=>(
                          <button key={star} onClick={e=>{
                            e.stopPropagation();
                            const updated = bookings.map(bk=>bk.id===b.id?{...bk,rating:star}:bk);
                            saveBookings(updated);
                            setBookings(updated);
                          }} style={{
                            background:"none",border:"none",cursor:"pointer",
                            fontSize:26,padding:"2px",transition:"transform 0.15s",
                          }}
                          onMouseEnter={e=>e.target.style.transform="scale(1.3)"}
                          onMouseLeave={e=>e.target.style.transform="scale(1)"}
                          >⭐</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"#0f172a",borderRadius:8}}>
                      <span style={{fontSize:14}}>{"⭐".repeat(b.rating)}</span>
                      <span style={{color:"#a8b8cc",fontSize:10}}>{lang==="en"?"Your rating":"Tu valoración"}</span>
                    </div>
                  )}
                </div>
              )}
              {b.status==="cancelled"&&<div style={{fontSize:11,color:"#f97316"}}>{t.cancelled} {b.cancelReason||""}</div>}
              {b.status==="rejected"&&<div style={{fontSize:11,color:"#ef4444"}}>{t.rejected} {b.rejectionReason||""}</div>}
              {/* Cancel button — available for pending, price_proposed, confirmed */}
              {["pending","price_proposed","confirmed"].includes(b.status)&&(
                <button onClick={e=>{
                  e.stopPropagation();
                  setCancelConfirm(b);
                }} style={{
                  display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                  width:"100%",marginTop:8,
                  background:"transparent",
                  border:"1px solid #ef444433",
                  borderRadius:8,padding:"7px 0",cursor:"pointer",
                  color:"#ef4444",fontSize:11,fontWeight:600,
                }}>
                  ✕ {lang==="en"?"Cancel trip":"Cancelar viaje"}
                </button>
              )}

              {/* Chat button */}
              <button onClick={()=>{onMarkRead&&onMarkRead(String(b.id),(messages[String(b.id)]||[]).length);setChatBooking(b);}} style={{
                display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                width:"100%",marginTop:8,background:"#0f172a",border:"1px solid #2a3a4a",
                borderRadius:8,padding:"7px 0",cursor:"pointer",color:"#a8b8cc",fontSize:12,fontWeight:600,position:"relative",
              }}>
                {t.chat}
                {(messages[String(b.id)]||[]).filter(m=>m.from==="driver").length>0&&(
                  <span style={{position:"absolute",top:-4,right:8,background:"#ef4444",borderRadius:10,padding:"1px 6px",fontSize:9,color:"#fff",fontWeight:700}}>
                    {(messages[String(b.id)]||[]).filter(m=>m.from==="driver").length}
                  </span>
                )}
              </button>
            </div>
          ))}
            {hist.length>0&&<>
              <button onClick={()=>setHistoryOpen(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",padding:"8px 0",display:"flex",alignItems:"center",gap:8,width:"100%",marginTop:8}}>
                <span style={{color:"#475569",fontSize:11,letterSpacing:3}}>{lang==="en"?"TRIP HISTORY":"HISTORIAL DE VIAJES"}</span>
                <span style={{background:"#1e293b",borderRadius:10,padding:"2px 8px",fontSize:10,color:"#a8b8cc"}}>{hist.length}</span>
                <span style={{color:"#475569",fontSize:12,marginLeft:"auto"}}>{historyOpen?"▲":"▼"}</span>
              </button>
              {historyOpen&&hist.map(b=>{
                const done=b.status==="completed";
                return(<div key={b.id} style={{background:"#111",borderRadius:10,padding:"10px 14px",marginBottom:6,borderLeft:"3px solid "+(done?"#22c55e":"#f97316"),opacity:0.85}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:"#f8fafc",fontSize:12,fontFamily:"'Cormorant Garamond',serif"}}>{b.guest}</span>
                    <span style={{color:done?"#22c55e":"#f97316",fontSize:9,fontWeight:700}}>{done?lang==="en"?"✅ DONE":"✅ COMPLETADO":lang==="en"?"✕ CANCELLED":"✕ CANCELADO"}</span>
                  </div>
                  <div style={{color:"#a8b8cc",fontSize:10}}>{b.date} · {b.time}</div>
                  <div style={{color:"#a8b8cc",fontSize:10}}>📍 {b.origin}</div>
                  <div style={{color:"#a8b8cc",fontSize:10}}>🏁 {b.destination}</div>
                  {done&&b.fare&&<div style={{color:"#c9a96e",fontSize:11,fontWeight:600,marginTop:4}}>💶 {fmt(b.fare*(1-DISCOUNT_RATE))} €</div>}
                </div>);
              })}
            </>}
            </>);})()}
        </div>
      )}

      {/* ── NEW BOOKING TAB ── */}
      {tab==="new"&&(
        <div>
          <div style={{color:"#e8d5a3",fontSize:18,fontFamily:"'Cormorant Garamond',serif",marginBottom:18}}>{t.newBookingTitle}</div>

          {form.time&&(
            <div style={{background:"#0f172a",border:"1px solid #c9a96e44",borderRadius:12,padding:"14px 16px",marginBottom:18,textAlign:"center"}}>
              <div style={{color:"#a8b8cc",fontSize:10,letterSpacing:2,marginBottom:6}}>{t.selectedTime}</div>
              <div style={{color:"#e8d5a3",fontSize:36,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,lineHeight:1}}>{form.time}</div>
              <div style={{color:"#a8b8cc",fontSize:11,marginTop:4}}>{form.date}</div>
            </div>
          )}

          <div style={{marginBottom:14}}>
            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.passengerName}</label>
            <input value={form.guest} onChange={e=>setForm({...form,guest:e.target.value})} style={inputStyle}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.phone}</label>
            <input type="tel" value={form.guestPhone} placeholder={t.phonePlaceholder} onChange={e=>setForm({...form,guestPhone:e.target.value})} style={inputStyle}/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2}}>{t.origin}</label>
              <button onClick={()=>getLocation(addr=>setForm(f=>({...f,origin:addr})))} disabled={geoLoading} style={{
                background:"none",border:"none",cursor:geoLoading?"default":"pointer",padding:0,
                display:"flex",alignItems:"center",gap:4,
                color:geoLoading?"#475569":"#c9a96e",fontSize:11,
              }}>
                <span style={{fontSize:13}}>📍</span>{geoLoading?(lang==="en"?"Getting...":"Obteniendo..."):(lang==="en"?"Use my location":"Usar mi ubicación")}
              </button>
            </div>
            {geoError==="denied"?<GeoErrorMsg onClose={()=>setGeoState({loading:false,error:null,denied:false})}/>:geoError&&<div style={{color:"#ef4444",fontSize:11,marginBottom:6}}>{geoError}</div>}
            <input value={form.origin} placeholder={t.originPlaceholder} onChange={e=>setForm({...form,origin:e.target.value})} style={inputStyle}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.destination}</label>
            <input value={form.destination} placeholder={t.destPlaceholder} onChange={e=>setForm({...form,destination:e.target.value})} style={inputStyle}/>
          </div>
          <TripEstimateBox origin={form.origin} destination={form.destination}/>
          <DistancePriceCalcClient origin={form.origin} destination={form.destination} pricePerKm={pricePerKm} onPriceCalculated={(price,km,durMin)=>setForm(f=>({...f,fare:price,tripKm:km,durationMin:durMin}))}/>
          <div style={{marginBottom:14}}>
            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.passengers}</label>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4].map(n=>(
                <button key={n} onClick={()=>setForm({...form,passengers:n})} style={{flex:1,height:46,borderRadius:10,border:"none",cursor:"pointer",
                  background:form.passengers===n?"linear-gradient(135deg,#c9a96e,#a07840)":"#1e293b",
                  color:form.passengers===n?"#fff":"#a8b8cc",fontSize:18,fontWeight:form.passengers===n?700:400,transition:"all 0.15s"}}>{n}</button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.notes}</label>
            <input value={form.notes} placeholder={t.notesPlaceholder} onChange={e=>setForm({...form,notes:e.target.value})} style={inputStyle}/>
          </div>

          {/* Price info notice */}
          <div style={{background:"#0f172a",border:"1px solid #c9a96e33",borderRadius:12,padding:"14px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:20,flexShrink:0}}>💬</span>
            <div>
              <div style={{color:"#e8d5a3",fontSize:13,fontWeight:600,marginBottom:4}}>
                {lang==="en"?"Price confirmation":"Confirmación de precio"}
              </div>
              <div style={{color:"#a8b8cc",fontSize:12,lineHeight:1.5}}>
                {lang==="en"
                  ? "After sending your request, the driver will review the route and propose a price. You will be able to accept or reject it."
                  : "Tras enviar tu solicitud, el conductor revisará la ruta y te propondrá un precio. Podrás aceptarlo o rechazarlo."}
              </div>
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:8}}>{t.payment}</label>
            <div style={{display:"flex",gap:8}}>
              {[{id:"cash",icon:"💵",label:t.cash,en:t.cash.toUpperCase(),c:"#c9a96e"},{id:"card",icon:"💳",label:t.card,en:t.card.toUpperCase(),c:"#c9a96e"}].map(opt=>(
                <button key={opt.id} onClick={()=>setForm({...form,paymentMethod:opt.id})} style={{
                  flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 8px",borderRadius:12,
                  border:`2px solid ${form.paymentMethod===opt.id?opt.c:opt.c+"33"}`,
                  background:form.paymentMethod===opt.id?`${opt.c}18`:"#1e293b",cursor:"pointer",transition:"all 0.15s",
                }}>
                  <span style={{fontSize:22}}>{opt.icon}</span>
                  <span style={{color:form.paymentMethod===opt.id?opt.c:"#a8b8cc",fontSize:11,fontWeight:700}}>{opt.en}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:18}}>
            <label style={{color:"#a8b8cc",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.notes}</label>
            <input value={form.notes} placeholder={t.notesPlaceholder} onChange={e=>setForm({...form,notes:e.target.value})} style={inputStyle}/>
          </div>

          {form.date&&form.time&&(
            <div style={{background:slotAvailable?"#0f2a1a":"#2a0f0f",border:`1px solid ${slotAvailable?"#c9a96e":"#ef4444"}`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:slotAvailable?"#c9a96e":"#ef4444",animation:"pulse 1.5s infinite",flexShrink:0}}/>
              <div style={{color:slotAvailable?"#e8d5a3":"#ef4444",fontSize:12,fontWeight:600}}>
                {slotAvailable?t.slotAvailable:t.slotUnavailable}
              </div>
            </div>
          )}

          <button onClick={handleSubmit}
            disabled={isOffline||!slotAvailable||!form.guest||!form.origin||!form.destination||!form.time}
            style={{width:"100%",
              background:(isOffline||!slotAvailable||!form.guest||!form.origin||!form.destination||!form.time)?"#1e293b":"linear-gradient(135deg,#c9a96e,#a07840)",
              border:"none",borderRadius:12,padding:"16px 0",
              color:(isOffline||!slotAvailable||!form.guest||!form.origin||!form.destination||!form.time)?"#475569":"#0a0a0a",
              fontSize:14,fontWeight:700,letterSpacing:1,cursor:"pointer",transition:"all 0.2s",marginBottom:12,
            }}>
            {isOffline?t.offlineBtn:t.submitBtn}
          </button>
          <button onClick={()=>setTab("avail")} style={{width:"100%",background:"none",border:"1px solid #1e293b",borderRadius:12,padding:"11px 0",color:"#a8b8cc",fontSize:13,cursor:"pointer"}}>{t.backToAvail}</button>
        </div>
      )}

      {/* ── CANCEL CONFIRMATION MODAL ── */}
      {cancelConfirm&&(
        <div onClick={()=>setCancelConfirm(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:400,display:"flex",alignItems:"flex-end"}}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"linear-gradient(180deg,#1e293b,#0f172a)",
            borderRadius:"22px 22px 0 0",padding:"20px 20px 44px",width:"100%",
            border:"1px solid #ef444433",borderBottom:"none",
            animation:"slideUp 0.3s ease",
          }}>
            <div style={{width:40,height:4,background:"#2a3a4a",borderRadius:2,margin:"0 auto 18px"}}/>
            {/* Icon */}
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"#ef444415",border:"2px solid #ef444433",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto"}}>✕</div>
            </div>
            {/* Title */}
            <div style={{color:"#ef4444",fontSize:17,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,textAlign:"center",marginBottom:6}}>
              {lang==="en"?"Cancel this trip?":"¿Cancelar este viaje?"}
            </div>
            {/* Trip info */}
            <div style={{background:"#0f172a",borderRadius:10,padding:"10px 14px",marginBottom:6,textAlign:"center"}}>
              <div style={{color:"#f8fafc",fontSize:13,fontWeight:600,marginBottom:3}}>{cancelConfirm.guest}</div>
              <div style={{color:"#a8b8cc",fontSize:11}}>{cancelConfirm.date} · {cancelConfirm.time}</div>
              <div style={{color:"#a8b8cc",fontSize:11,marginTop:2}}>📍 {cancelConfirm.origin} → {cancelConfirm.destination}</div>
            </div>
            <div style={{color:"#a8b8cc",fontSize:12,textAlign:"center",marginBottom:20,lineHeight:1.5}}>
              {lang==="en"
                ?"This action cannot be undone. The driver will be notified."
                :"Esta acción no se puede deshacer. El conductor recibirá una notificación."}
            </div>
            {/* Buttons */}
            <button onClick={()=>{
              onClientCancelTrip&&onClientCancelTrip(cancelConfirm.id);
              setCancelConfirm(null);
            }} style={{
              width:"100%",background:"linear-gradient(135deg,#ef4444,#b91c1c)",
              border:"none",borderRadius:12,padding:"14px 0",
              color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10,
            }}>
              {lang==="en"?"Yes, cancel trip":"Sí, cancelar viaje"}
            </button>
            <button onClick={()=>setCancelConfirm(null)} style={{
              width:"100%",background:"#1e293b",border:"1px solid #2a3a4a",
              borderRadius:12,padding:"13px 0",
              color:"#a8b8cc",fontSize:13,cursor:"pointer",
            }}>
              {lang==="en"?"Keep my trip":"Mantener mi reserva"}
            </button>
          </div>
        </div>
      )}

      {/* Chat modal */}
      {chatBooking&&(
        <ChatModal booking={chatBooking} messages={messages} onSend={onSendMessage} currentUser={client} isDriver={false} onClose={()=>setChatBooking(null)} onMarkRead={onMarkRead}/>
      )}
    </div>
  );
}

// ─── NEXTTRIP CLIENT APP ──────────────────────────────────────────────────────
// ─── LANGUAGE TOGGLE COMPONENT ───────────────────────────────────────────────
function LangToggle({ lang, setLang }) {
  return (
    <div onClick={()=>setLang(l=>l==="es"?"en":"es")} style={{
      display:"flex",alignItems:"center",gap:0,
      background:"#1e293b",border:"1px solid #c9a96e33",
      borderRadius:20,overflow:"hidden",cursor:"pointer",
      boxShadow:"0 0 12px rgba(201,169,110,0.08)",
    }}>
      {["es","en"].map(l=>(
        <div key={l} style={{
          padding:"5px 12px",fontSize:11,fontWeight:700,letterSpacing:1,
          transition:"all 0.2s",
          background:lang===l?"linear-gradient(135deg,#c9a96e,#a07840)":"transparent",
          color:lang===l?"#0a0a0a":"#a8b8cc",
          display:"flex",alignItems:"center",gap:5,
        }}>
          <span style={{fontSize:13}}>{l==="es"?"🇪🇸":"🇬🇧"}</span>
          <span>{l.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

export default function NextTripClientApp() {
  const [screen,setScreen]=useState("auth");
  const [clientTab,setClientTab]=useState("avail"); // lifted from ClientView
  const [isOnline,setIsOnline]=useState(navigator.onLine);

  useEffect(()=>{
    const on=()=>setIsOnline(true);
    const off=()=>setIsOnline(false);
    window.addEventListener('online',on);
    window.addEventListener('offline',off);
    return()=>{ window.removeEventListener('online',on); window.removeEventListener('offline',off); };
  },[]);
  const [installPrompt,setInstallPrompt]=useState(null);
  const [showInstall,setShowInstall]=useState(false);
  const [showIOSInstall,setShowIOSInstall]=useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const [ratingModal,setRatingModal]=useState(null);
  useEffect(()=>{
    const handler=e=>{e.preventDefault();setInstallPrompt(e);setShowInstall(true);};
    window.addEventListener('beforeinstallprompt',handler);
    return()=>window.removeEventListener('beforeinstallprompt',handler);
  },[]);
  const handleInstall=async()=>{
    if(!installPrompt)return;
    installPrompt.prompt();
    const{outcome}=await installPrompt.userChoice;
    if(outcome==="accepted"){setShowInstall(false);setInstallPrompt(null);}
  };
  const [lang,setLang]=useState(()=>localStorage.getItem("nexttrip_lang")||"es");
  const [currentClient,setCurrentClient]=useState(null);
  const [bookings,setBookings]=useState([]);

  // Sync clients from Firebase on mount
  useEffect(()=>{
    fbGet("nexttrip/clients").then(d=>{
      if(d?.data?.length) {
        try{localStorage.setItem(CLIENTS_KEY,JSON.stringify(d.data));}catch{}
      }
    });
  },[]);
  const [messages,setMessages]=useState({});
  const [readCounts,setReadCounts]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("nexttrip_read_counts")||"{}");}catch{return {};}
  });
  useEffect(()=>{
    try{localStorage.setItem("nexttrip_read_counts",JSON.stringify(readCounts));}catch{}
  },[readCounts]);
  const [chatNotifOpen,setChatNotifOpen]=useState(null);

  useEffect(()=>{ localStorage.setItem("nexttrip_lang",lang); },[lang]);

  // Real-time Firebase sync for bookings
  useEffect(()=>{
    const unsub = fbListen("nexttrip/bookings", (data) => {
      if (!data || !data.data) return;
      const remote = sanitizeBookings(data.data);
      if (!remote) return;
      setBookings(prev => {
        if (JSON.stringify(prev) === JSON.stringify(remote)) return prev;
        try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(remote)); } catch {}
        return remote;
      });
    });
    return () => unsub();
  },[]);

  // Real-time Firebase sync for messages
  useEffect(()=>{
    const unsub = fbListen("nexttrip/messages", (data) => {
      if (!data || !data.data) return;
      setMessages(prev => {
        const remote = data.data;
        let changed = false;
        const merged = {...prev};
        Object.entries(remote).forEach(([bid,msgs]) => {
          if (!prev[bid] || msgs.length > prev[bid].length) { merged[bid]=msgs; changed=true; }
        });
        return changed ? merged : prev;
      });
    });
    return () => unsub();
  },[]);

  const handleNewBooking=async(data)=>{
    const nb={id:Date.now(),...data,status:"pending",isClientBooking:true,createdAt:new Date().toLocaleString(lang==="en"?"en-GB":"es-ES")};
    try {
      let merged;
      const docRef = doc(_db, "nexttrip", "bookings");
      await runTransaction(_db, async (tx) => {
        const snap = await tx.get(docRef);
        const existing = snap.exists() && snap.data()?.data ? snap.data().data : [];
        merged = [...existing, nb];
        tx.set(docRef, { data: merged, updatedAt: Date.now() });
      });
      try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(merged)); } catch {}
      setBookings(merged);
    } catch(e) {
      console.error("handleNewBooking error:", e);
      setBookings(prev=>{const u=[...prev,nb];saveBookings(u);return u;});
    }
  };
  const _clientMutate=async(mapFn)=>{
    try {
      let next;
      const docRef=doc(_db,"nexttrip","bookings");
      await runTransaction(_db,async(tx)=>{
        const snap=await tx.get(docRef);
        const cur=snap.exists()&&snap.data()?.data?snap.data().data:[];
        next=mapFn(cur);
        tx.set(docRef,{data:next,updatedAt:Date.now()});
      });
      try{localStorage.setItem(BOOKINGS_KEY,JSON.stringify(next));}catch{}
      setBookings(next);
    } catch(e){console.error("clientMutate error:",e);}
  };
  const handleClientAcceptPrice=id=>_clientMutate(p=>p.map(b=>b.id===id?{...b,status:"confirmed",fare:b.proposedPrice}:b));
  const handleClientRejectPrice=id=>_clientMutate(p=>p.map(b=>b.id===id?{...b,status:"client_rejected"}:b));
  const handleClientCancelTrip=id=>_clientMutate(p=>p.map(b=>b.id===id?{...b,status:"cancelled",cancelReason:lang==="en"?"Cancelled by client":"Cancelado por el cliente"}:b));
  const handleSendMessage=async(bookingId,msg)=>{
    const key=String(bookingId);
    try {
      let updated;
      const docRef = doc(_db, "nexttrip", "messages");
      await runTransaction(_db, async (tx) => {
        const snap = await tx.get(docRef);
        const current = snap.exists() && snap.data()?.data ? snap.data().data : {};
        updated = {...current, [key]: [...(current[key]||[]), msg]};
        tx.set(docRef, { data: updated });
      });
      setMessages(updated);
    } catch(e) {
      console.error("handleSendMessage error:", e);
      setMessages(prev=>{
        const updated={...prev,[key]:[...(prev[key]||[]),msg]};
        fbSet("nexttrip/messages", { data: updated });
        return updated;
      });
    }
  };
  const handleMarkRead=(bookingId,count)=>setReadCounts(prev=>({...prev,[String(bookingId)]:count}));
  const handleRate=(bookingId,stars)=>{
    setBookings(prev=>{const u=prev.map(b=>b.id===bookingId?{...b,clientRating:stars,pendingRating:false}:b);saveBookings(u);return u;});
    setRatingModal(null);
  };

  const [blockedSlots,setBlockedSlots]=useState(()=>loadBlocks());
  const [serviceStatus,setServiceStatus]=useState({status:"online",returnDate:""});
  const [driverStatus,setDriverStatus]=useState("free");
  // Real-time Firebase sync for status + blocks
  useEffect(()=>{
    const unsubStatus = fbListen("nexttrip/status", d=>{
      if(d?.driverStatus) setDriverStatus(d.driverStatus);
      if(d?.serviceStatus) setServiceStatus(d.serviceStatus);
      if(d?.driverArrived) setArrivedBooking({id:d.driverArrived.bookingId, arrivedAt:d.driverArrived.arrivedAt});
      else setArrivedBooking(null);
      if(d?.pricePerKmClient){setPricePerKm(d.pricePerKmClient);try{localStorage.setItem("ntprice_client",String(d.pricePerKmClient));}catch{}}
    });
    const unsubBlocks = fbListen("nexttrip/blocks", d=>{
      if(d?.data) { setBlockedSlots(d.data); try{localStorage.setItem(BLOCKS_KEY,JSON.stringify(d.data));}catch{} }
    });
    return ()=>{ unsubStatus(); unsubBlocks(); };
  },[]);

  const unreadConvos=screen==="client"?Object.entries(messages).map(([bid,msgs])=>{
    const rel=msgs.filter(m=>m.from==="driver"&&bookings.some(b=>String(b.id)===bid&&b.clientId===currentClient?.id));
    const unread=rel.length-(readCounts[bid]||0);
    if(unread<=0)return null;
    const booking=bookings.find(b=>String(b.id)===bid);
    if(!booking)return null;
    return{bookingId:bid,unread,booking,lastMsg:rel[rel.length-1]};
  }).filter(Boolean):[];

  // Price proposals waiting for client response
  const priceAlerts = screen==="client"
    ? bookings.filter(b=>b.status==="price_proposed"&&b.clientId===currentClient?.id)
    : [];

  if(screen==="auth") return(
    <div style={{background:T.bg,minHeight:"100vh",width:"100%",fontFamily:"'DM Sans',sans-serif",color:T.text,transition:"background 0.3s"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{position:"fixed",top:12,right:16,zIndex:100,display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setDarkMode(v=>!v)} style={{
          background:darkMode?"#1e293b":"#e0e7ff",border:"none",borderRadius:20,
          padding:"6px 12px",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",gap:4,
        }}>{darkMode?"☀️":"🌙"}</button>
        <LangToggle lang={lang} setLang={setLang}/>
      </div>
      <ClientAuth onLogin={c=>{setCurrentClient(c);setScreen("client");}} onBack={null} lang={lang} setLang={setLang} darkMode={darkMode} T={T}/>
      {/* ── INSTALL BUTTON (always visible, not installed) ── */}
      {!isInStandaloneMode&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9998,width:"calc(100% - 32px)",maxWidth:400}}>
          {isIOS ? (
            <>
              <button onClick={()=>setShowIOSInstall(v=>!v)} style={{
                width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                background:"linear-gradient(135deg,#c9a96e,#a07840)",border:"none",borderRadius:14,
                padding:"14px 0",color:"#0a0a0a",fontSize:14,fontWeight:700,cursor:"pointer",
                boxShadow:"0 4px 20px #c9a96e44",
              }}>
                <span style={{fontSize:20}}>⬇️</span>
                {lang==="en"?"Install NEXTTRIP VIP App":"Instalar App NEXTTRIP VIP"}
              </button>
              {showIOSInstall&&(
                <div style={{marginTop:10,background:"#1e293b",border:"1.5px solid #c9a96e44",borderRadius:14,padding:"16px"}}>
                  <div style={{color:"#c9a96e",fontSize:12,fontWeight:700,marginBottom:12,letterSpacing:1}}>
                    {lang==="en"?"HOW TO INSTALL ON iOS":"CÓMO INSTALAR EN iOS"}
                  </div>
                  {[
                    {icon:"1️⃣", text:lang==="en"?"Tap the Share button at the bottom of Safari":"Toca el botón Compartir en la parte inferior de Safari"},
                    {icon:"2️⃣", text:lang==="en"?"Scroll down and tap 'Add to Home Screen'":"Desliza hacia abajo y toca 'Añadir a pantalla de inicio'"},
                    {icon:"3️⃣", text:lang==="en"?"Tap 'Add' to confirm":"Toca 'Añadir' para confirmar"},
                  ].map((s,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                      <span style={{fontSize:18,flexShrink:0}}>{s.icon}</span>
                      <span style={{color:"#f8fafc",fontSize:13,lineHeight:1.4}}>{s.text}</span>
                    </div>
                  ))}
                  <div style={{marginTop:8,background:"#c9a96e15",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>💡</span>
                    <span style={{color:"#c9a96e",fontSize:11}}>{lang==="en"?"Must use Safari browser":"Debes usar el navegador Safari"}</span>
                  </div>
                </div>
              )}
            </>
          ) : installPrompt ? (
            <button onClick={async()=>{installPrompt.prompt();const{outcome}=await installPrompt.userChoice;if(outcome==="accepted")setInstallPrompt(null);}} style={{
              width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
              background:"linear-gradient(135deg,#c9a96e,#a07840)",border:"none",borderRadius:14,
              padding:"14px 0",color:"#0a0a0a",fontSize:14,fontWeight:700,cursor:"pointer",
              boxShadow:"0 4px 20px #c9a96e44",
            }}>
              <span style={{fontSize:20}}>⬇️</span>
              {lang==="en"?"Install NEXTTRIP VIP App":"Instalar App NEXTTRIP VIP"}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );

  return(
    <div style={{background:"#000",minHeight:"100vh",width:"100%",fontFamily:"'DM Sans',sans-serif",color:"#f8fafc",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>

      {/* ── OFFLINE BANNER ── */}
      {!isOnline&&(
        <div style={{
          position:"fixed",top:0,left:0,right:0,zIndex:9999,
          background:"linear-gradient(135deg,#2a1500,#1a0f00)",
          borderBottom:"2px solid #f59e0b",
          padding:"8px 16px",textAlign:"center",
          animation:"slideDown 0.3s ease",
        }}>
          <span style={{color:"#f59e0b",fontSize:12,fontWeight:700}}>
            📡 {lang==="en"?"No connection — data saved locally":"Sin conexión — los datos se guardan localmente"}
          </span>
        </div>
      )}
      {!isOnline&&<div style={{height:36}}/>}

      {unreadConvos.length>0&&(
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:500,background:"linear-gradient(135deg,#1a130a,#1e293b)",borderBottom:"2px solid #c9a96e",boxShadow:"0 4px 24px rgba(0,0,0,0.7)"}}>
          <div style={{maxWidth:480,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px 4px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1s infinite"}}/>
              <span style={{color:"#e8d5a3",fontSize:11,fontWeight:700,letterSpacing:1}}>💬 {unreadConvos.reduce((s,c)=>s+c.unread,0)} MENSAJE{unreadConvos.reduce((s,c)=>s+c.unread,0)>1?"S":""} SIN LEER</span>
            </div>
            {unreadConvos.map(c=>(
              <div key={c.bookingId} onClick={()=>{setChatNotifOpen(c.booking);handleMarkRead(c.bookingId,(messages[c.bookingId]||[]).filter(m=>m.from==="driver").length);}}
                style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",borderTop:"1px solid #1e3a5f",cursor:"pointer"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"#c9a96e20",border:"1px solid #c9a96e55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💬</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{color:"#f8fafc",fontSize:12,fontWeight:600}}>{c.booking.guest}</span>
                    <span style={{background:"#ef4444",borderRadius:10,padding:"1px 7px",fontSize:10,color:"#fff",fontWeight:700}}>{c.unread}</span>
                  </div>
                  <div style={{color:"#f8fafc",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",opacity:0.8}}>{c.lastMsg?.fromName}: {c.lastMsg?.text}</div>
                </div>
              </div>
            ))}
            <div style={{height:4}}/>
          </div>
        </div>
      )}
      {unreadConvos.length>0&&<div style={{height:44+unreadConvos.length*56}}/>}

      {/* ── PRICE PROPOSAL ALERT BANNER ── */}
      {priceAlerts.length>0&&(
        <div style={{
          position:"fixed",top:unreadConvos.length>0?44+unreadConvos.length*56:0,
          left:0,right:0,zIndex:480,
          background:"linear-gradient(135deg,#1a0f2e,#2d1b69)",
          borderBottom:"2px solid #a78bfa",
          boxShadow:"0 4px 24px rgba(167,139,250,0.3)",
          animation:"slideDown 0.4s ease",
        }}>
          <div style={{maxWidth:480,margin:"0 auto"}}>
            {priceAlerts.map(b=>(
              <div key={b.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px"}}>
                <div style={{width:36,height:36,borderRadius:10,background:"#a78bfa22",border:"1px solid #a78bfa55",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>💜</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:"#a78bfa",fontSize:11,fontWeight:700,letterSpacing:0.5,marginBottom:1}}>
                    {lang==="en"?"DRIVER PROPOSED A PRICE":"EL CONDUCTOR PROPONE UN PRECIO"}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{color:"#94a3b8",fontSize:11,textDecoration:"line-through"}}>{fmt(b.proposedPrice)} €</span>
                    <span style={{color:"#e8d5a3",fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif"}}>{fmt(b.proposedPrice*(1-DISCOUNT_RATE))} €</span>
                    <span style={{background:"#c9a96e22",border:"1px solid #c9a96e44",borderRadius:10,padding:"1px 5px",color:"#c9a96e",fontSize:9,fontWeight:700}}>−{Math.round(DISCOUNT_RATE*100)}%</span>
                  </div>
                </div>
                <button onClick={()=>{
                  setClientTab("mine");
                }} style={{
                  background:"linear-gradient(135deg,#c9a96e,#a07840)",
                  border:"none",borderRadius:8,padding:"6px 12px",
                  color:"#0a0a0a",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap",
                }}>{lang==="en"?"View":"Ver"}</button>
              </div>
            ))}
            <div style={{height:4}}/>
          </div>
        </div>
      )}
      {priceAlerts.length>0&&<div style={{height:56*priceAlerts.length}}/>}
      {chatNotifOpen&&<ChatModal booking={chatNotifOpen} messages={messages} onSend={handleSendMessage} currentUser={currentClient} isDriver={false} onClose={()=>setChatNotifOpen(null)} onMarkRead={handleMarkRead} lang={lang}/>}

      <div style={{padding:"10px 16px 8px",borderBottom:`1px solid ${T.border}`,background:darkMode?"rgba(10,15,30,0.97)":"rgba(240,244,255,0.97)",backdropFilter:"blur(10px)",position:"sticky",top:0,zIndex:50,transition:"background 0.3s"}}>
        {/* Row 1: Logo + Lang + Dark toggle + Exit */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <VeloLogo dark={darkMode} size={80}/>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {setDarkMode&&<button onClick={()=>setDarkMode(v=>!v)} style={{
              background:T.bgCard2,border:`1px solid ${T.border}`,borderRadius:16,
              padding:"4px 8px",cursor:"pointer",fontSize:13,color:T.text,
            }}>{darkMode?"☀️":"🌙"}</button>}
            <LangToggle lang={lang} setLang={setLang}/>
            <button onClick={()=>{setScreen("auth");setCurrentClient(null);}} style={{
              background:T.bgCard2,border:`1px solid ${T.border}`,borderRadius:8,
              color:T.textMuted,fontSize:10,padding:"5px 9px",cursor:"pointer",whiteSpace:"nowrap",
            }}>{TRANSLATIONS[lang]?.exit||"Salir"}</button>
          </div>
        </div>
        {/* Row 2: User pill */}
        <div style={{display:"flex",alignItems:"center",gap:6,background:"#c9a96e12",border:"1px solid #c9a96e33",borderRadius:20,padding:"4px 12px",width:"fit-content"}}>
          <div style={{width:16,height:16,borderRadius:"50%",background:(currentClient?.avatar||"#c9a96e")+"25",border:"1.5px solid "+(currentClient?.avatar||"#c9a96e")+"55",display:"flex",alignItems:"center",justifyContent:"center",color:currentClient?.avatar||"#c9a96e",fontSize:8,fontWeight:700}}>{initials(currentClient?.name||"")}</div>
          <span style={{color:"#e8d5a3",fontSize:11}}>{currentClient?.name}</span>
          <span style={{color:"#c9a96e44",fontSize:10}}>·</span>
          <span style={{color:"#a8b8cc",fontSize:9,letterSpacing:1}}>VIP CLIENT</span>
        </div>
      </div>

      <div className="app-inner" style={{padding:"16px 16px 80px"}}>
        <ClientView client={currentClient} bookings={bookings} setBookings={setBookings} onNewBooking={handleNewBooking}
          onClientAcceptPrice={handleClientAcceptPrice} onClientRejectPrice={handleClientRejectPrice} onClientCancelTrip={handleClientCancelTrip}
          tab={clientTab} setTab={setClientTab}
          driverStatus={driverStatus} blockedSlots={blockedSlots} serviceStatus={serviceStatus}
          messages={messages} onSendMessage={handleSendMessage} onMarkRead={handleMarkRead} lang={lang} setLang={setLang}/>
      </div>
      {ratingModal&&<RatingModal booking={ratingModal} onRate={handleRate} onClose={()=>setRatingModal(null)} lang={lang}/>}
      {showInstall&&<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:9998,background:"linear-gradient(135deg,#c9a96e,#a07840)",border:"1.5px solid #f0d98a",borderRadius:16,padding:"14px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px #00000088"}}>
        <div style={{width:40,height:40,borderRadius:10,overflow:"hidden",flexShrink:0}}>
          <img src="/icon-cliente.svg" width="40" height="40" alt="NEXTTRIP VIP"/>
        </div>
        <div style={{flex:1}}>
          <div style={{color:"#0a0a0a",fontSize:13,fontWeight:700,marginBottom:2}}>Instalar NEXTTRIP VIP</div>
          <div style={{color:"#3a2000",fontSize:11}}>Añadir a pantalla de inicio</div>
        </div>
        <button onClick={handleInstall} style={{background:"#0a0a0a",border:"none",borderRadius:10,color:"#c9a96e",fontSize:12,fontWeight:700,padding:"8px 14px",cursor:"pointer"}}>Instalar</button>
        <button onClick={()=>setShowInstall(false)} style={{background:"none",border:"none",color:"#3a2000",fontSize:18,cursor:"pointer",padding:"0 4px"}}>x</button>
      </div>}
    </div>
  );
}