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
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;font-weight:700;}
  html,body,#root{width:100%;min-height:100%;margin:0;padding:0;background:#ffffff;}
  input[type=date],input[type=time]{color-scheme:light;color:#0f172a;font-weight:700;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:none;opacity:1}}
  @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px;}
  a,button{touch-action:manipulation;-webkit-tap-highlight-color:transparent;}
  .app-inner{width:100%;max-width:480px;margin:0 auto;padding:0 4px;}
`;

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(error) { return { hasError:true, error }; }
  componentDidCatch(error, info) { console.error("App error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:20,background:"#fff0f0",border:"2px solid #ef4444",borderRadius:12,margin:16}}>
          <div style={{color:"#ef4444",fontWeight:700,marginBottom:8}}>⚠️ Error detectado</div>
          <div style={{color:"#0f172a",fontSize:12,wordBreak:"break-all"}}>{String(this.state.error)}</div>
          <button onClick={()=>this.setState({hasError:false,error:null})} 
            style={{marginTop:12,background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontWeight:700}}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
const BOOKINGS_KEY  = "riviera_bookings_v1";
const BLOCKS_KEY    = "riviera_blocks_v1";
const CLIENTS_KEY   = "nexttrip_clients_v1";
const inputStyle={width:"100%",background:"#e2e8f0",border:"1px solid #cbd5e1",borderRadius:10,padding:"12px 14px",color:"#0f172a",fontSize:14,outline:"none",boxSizing:"border-box"};

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
  const BLUE_COLORS = ["#2563eb","#38bdf8","#1d4ed8","#60a5fa","#2563eb","#2563eb"];
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
function statusColor(s){return{confirmed:"#2563eb",pending:"#f59e0b",rejected:"#ef4444",inprogress:"#2563eb",completed:"#22c55e",cancelled:"#f97316"}[s]||"#94a3b8";}
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
    <div style={{background:"#fff0f0",border:"1.5px solid #ef444466",borderRadius:12,padding:"14px 16px",marginTop:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <div style={{color:"#ef4444",fontSize:12,fontWeight:700}}>Ubicación bloqueada</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#334155",fontSize:14,cursor:"pointer"}}>×</button>
      </div>
      {steps.map((s,i)=>(<div key={i} style={{display:"flex",gap:8,marginBottom:5}}><div style={{width:18,height:18,borderRadius:"50%",background:"#ef444422",display:"flex",alignItems:"center",justifyContent:"center",color:"#ef4444",fontSize:10,fontWeight:700,flexShrink:0}}>{i+1}</div><div style={{color:"#0f172a",fontSize:11}}>{s}</div></div>))}
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
    <div style={{background:"#f1f5f9",border:"1px solid #2563eb22",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid #2563eb",borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>
      <span style={{color:"#334155",fontSize:12}}>Calculando ruta y precio...</span>
    </div>
  );

  if (state.status === "unknown") return (
    <div style={{background:"#f1f5f9",border:"1px solid #2563eb22",borderRadius:12,padding:"12px 16px",marginBottom:14}}>
      <div style={{color:"#334155",fontSize:12}}>📍 {_t.unknownAddr}</div>
    </div>
  );

  // OK — show pricing
  const withDiscount = state.price * (1 - DISCOUNT_RATE);
  return (
    <div style={{background:"linear-gradient(135deg,#f1f5f9,#e2e8f0)",border:"2px solid #2563eb",borderRadius:14,padding:"16px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
        <span style={{fontSize:16}}>🗺️</span>
        <span style={{color:"#38bdf8",fontSize:11,fontWeight:700,letterSpacing:1}}>RUTA CALCULADA</span>
      </div>
      {/* Distance / time row */}
      <div style={{display:"flex",gap:16,marginBottom:14,padding:"8px 12px",background:"#f1f5f9",borderRadius:8}}>
        <div style={{textAlign:"center"}}>
          <div style={{color:"#0f172a",fontSize:22,fontFamily:"'DM Sans',sans-serif",fontWeight:700,lineHeight:1}}>{state.km}</div>
          <div style={{color:"#334155",fontSize:10}}>km</div>
        </div>
        <div style={{width:1,background:"#cbd5e1"}}/>
        <div style={{textAlign:"center"}}>
          <div style={{color:"#0f172a",fontSize:22,fontFamily:"'DM Sans',sans-serif",fontWeight:700,lineHeight:1}}>{state.mins}</div>
          <div style={{color:"#334155",fontSize:10}}>min aprox.</div>
        </div>
        <div style={{flex:1}}/>
        <a href={mapsRouteUrl(origin, destination)} target="_blank" rel="noopener noreferrer"
          style={{display:"flex",alignItems:"center",gap:4,alignSelf:"center",background:"#2563eb18",border:"1px solid #2563eb44",borderRadius:8,padding:"5px 10px",textDecoration:"none",color:"#2563eb",fontSize:11,fontWeight:600}}>
          Ver ruta
        </a>
      </div>
      {/* Pricing breakdown */}
      <div style={{marginBottom:4}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{color:"#334155",fontSize:11}}>Base</span>
          <span style={{color:"#334155",fontSize:11}}>{fmt(PRICE_BASE_KM)} €</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{color:"#334155",fontSize:11}}>{state.km} km × {fmt(PRICE_PER_KM)} €/km</span>
          <span style={{color:"#334155",fontSize:11}}>{fmt(state.km * PRICE_PER_KM)} €</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,borderTop:"1px solid #cbd5e1",marginBottom:8}}>
          <span style={{color:"#0f172a",fontSize:12}}>Precio base</span>
          <span style={{color:"#334155",fontSize:13,textDecoration:"line-through"}}>{fmt(state.price)} €</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{color:"#2563eb",fontSize:12}}>🏷️ Tu descuento (15%)</span>
          <span style={{color:"#2563eb",fontSize:12,fontWeight:600}}>-{fmt(state.price * DISCOUNT_RATE)} €</span>
        </div>
        {/* Final price — hero */}
        <div style={{
          background:"linear-gradient(135deg,#dbeafe,#eff6ff)",
          border:"1px solid #2563eb66",borderRadius:10,
          padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",
        }}>
          <div>
            <div style={{color:"#38bdf8",fontSize:10,letterSpacing:2,marginBottom:2}}>{_t.youPay}</div>
            <div style={{color:"#334155",fontSize:9}}>{_t.luxuryVtc}</div>
          </div>
          <div style={{color:"#1d4ed8",fontSize:38,fontFamily:"'DM Sans',sans-serif",fontWeight:900,
            textShadow:"0 0 20px rgba(96,165,250,0.4)"}}>
            {fmt(withDiscount)} €
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function RivieraLogo({ size=36 }) {
  const w = size * 1.0;
  const h = size;
  return (
    <img
      src="/logo-velo-header.jpg"
      alt="VELO Private Transfers"
      style={{ width:w, height:h, objectFit:"contain", display:"block" }}
    />
  );
}

function PinKeypad({ correctPin, onSuccess, onBack, subtitle, accentColor="#2563eb" }) {
  const [pin,setPin]=useState(""); const [error,setError]=useState(false);
  const handleDigit = d => {
    if(pin.length>=4)return; const next=pin+d; setPin(next); setError(false);
    if(next.length===4) setTimeout(()=>{ if(next===correctPin)onSuccess(); else{setError(true);setPin("");}},200);
  };
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%"}}>
      {onBack&&<button onClick={onBack} style={{alignSelf:"flex-start",background:"none",border:"none",color:"#334155",cursor:"pointer",fontSize:13,letterSpacing:1,marginBottom:20}}>← VOLVER</button>}
      {subtitle&&<div style={{color:"#334155",fontSize:12,letterSpacing:1,marginBottom:22}}>{subtitle}</div>}
      <div style={{display:"flex",gap:14,marginBottom:26}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:13,height:13,borderRadius:"50%",
            background:pin.length>i?(error?"#ef4444":accentColor):"#e2e8f0",
            border:`2px solid ${error?"#ef4444":pin.length>i?accentColor:"#cbd5e1"}`,
            transition:"all 0.15s",transform:pin.length>i?"scale(1.2)":"scale(1)"}}/>
        ))}
      </div>
      {error&&<div style={{color:"#ef4444",fontSize:11,marginBottom:12,letterSpacing:1}}>PIN INCORRECTO</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:230}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
          <button key={i} onClick={()=>d==="⌫"?setPin(p=>p.slice(0,-1)):d!==""?handleDigit(String(d)):null}
            disabled={d===""} style={{height:60,borderRadius:12,
              background:d===""?"transparent":d==="⌫"?"#e2e8f0":"linear-gradient(135deg,#e2e8f0,#f1f5f9)",
              border:d===""?"none":"1px solid #cbd5e1",color:d==="⌫"?"#475569":"#f1f5f9",
              fontSize:d==="⌫"?18:20,fontFamily:"'DM Sans',sans-serif",fontWeight:600,
              cursor:d===""?"default":"pointer",transition:"all 0.1s"}}
            onMouseDown={e=>{if(d!=="")e.currentTarget.style.transform="scale(0.93)"}}
            onMouseUp={e=>e.currentTarget.style.transform="none"}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function DistancePriceCalcClient({ origin, destination, onPriceCalculated, pricePerKm=3.15, lang="es" }) {
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
        <div style={{background:"#e2e8f0",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:10,height:10,borderRadius:"50%",border:"2px solid #2563eb",borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>
          <span style={{color:"#334155",fontSize:11}}>🗺️ Calculando ruta...</span>
        </div>
      )}
      {state.status==="ok"&&(
        <div style={{background:"linear-gradient(135deg,#e2e8f0,#f1f5f9)",border:"1.5px solid #2563eb55",borderRadius:12,padding:"12px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div>
              <span style={{color:"#0f172a",fontSize:13,fontWeight:700}}>🗺️ {state.km} km</span>
              {state.duration&&<span style={{color:"#334155",fontSize:11,marginLeft:8}}>· {state.duration}</span>}
            </div>
          </div>
          <div style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",border:"1px solid #e2e8f0"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{color:"#0f172a",fontSize:12,fontWeight:700}}>{lang==="en"?"Base price":"Precio base"}</span>
              <span style={{color:"#475569",fontSize:12,textDecoration:"line-through"}}>{state.price} €</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{color:"#1e40af",fontSize:12,fontWeight:700}}>{lang==="en"?"🏷️ VIP discount 15%":"🏷️ Tu descuento VIP 15%"}</span>
              <span style={{color:"#1e40af",fontSize:12,fontWeight:700}}>-{Math.round(state.price*0.15*100)/100} €</span>
            </div>
            <div style={{background:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"2.5px solid #1e3a8a",borderRadius:10,padding:"12px 14px",marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 4px 12px rgba(30,58,138,0.15)"}}>
              <span style={{color:"#1e3a8a",fontSize:14,fontWeight:800}}>💶 {lang==="en"?"Your final price":"Tu precio final"}</span>
              <span style={{color:"#1e3a8a",fontSize:26,fontWeight:900}}>{state.discounted} €</span>
            </div>
          </div>
        </div>
      )}
      {state.status==="error"&&(
        <div style={{background:"#fff0f0",border:"1px solid #ef444433",borderRadius:10,padding:"8px 12px",color:"#ef4444",fontSize:11}}>
          ⚠️ No se pudo calcular la ruta
        </div>
      )}
    </div>
  );
}

function TripEstimateBox({ origin, destination, lang="es" }) {
  if (!origin || !destination || origin.length < 6 || destination.length < 6) return null;
  if (origin === destination) return null;
  const est = estimateTrip(origin, destination);
  const routeLink = mapsRouteUrl(origin, destination);

  return (
    <div style={{
      background:"linear-gradient(135deg,#f1f5f9,#e2e8f0)",
      border:"1px solid #2563eb33",
      borderRadius:10, padding:"10px 14px", marginBottom:14,
      display:"flex", alignItems:"center", gap:10,
    }}>
      <span style={{fontSize:22, flexShrink:0}}>🗺️</span>
      <div style={{flex:1}}>
        <div style={{color:"#334155",fontSize:9,letterSpacing:2,marginBottom:5}}>{lang==="en"?"ESTIMATED TRIP TIME":"TIEMPO ESTIMADO DEL VIAJE"}</div>
        {est ? (
          <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{color:"#0f172a",fontSize:20,fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{est.mins}</span>
              <span style={{color:"#334155",fontSize:12}}>min</span>
            </div>
            <div style={{width:1,height:18,background:"#cbd5e1"}}/>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{color:"#0f172a",fontSize:16,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>{est.km}</span>
              <span style={{color:"#334155",fontSize:12}}>km aprox.</span>
            </div>
            {est.isAirport && <span style={{color:"#f59e0b",fontSize:11}}>✈️ Ruta aeropuerto</span>}
          </div>
        ) : (
          <div style={{color:"#334155",fontSize:12}}>{lang==="en"?"Enter recognizable addresses to estimate":"Introduce direcciones reconocibles para estimar"}</div>
        )}
      </div>
      <a href={routeLink} target="_blank" rel="noopener noreferrer" style={{
        display:"flex",alignItems:"center",gap:5,flexShrink:0,
        background:"#2563eb18",border:"1px solid #2563eb44",
        borderRadius:8,padding:"6px 10px",textDecoration:"none",
        color:"#2563eb",fontSize:11,fontWeight:600,
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
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
  const saveFavs = (f) => { const limited=f.slice(0,2); setFavs(limited); try{localStorage.setItem(FAVS_KEY,JSON.stringify(limited));}catch{} };
  const recentRoutes = myBookings
    .filter(b=>b.status==="completed"&&b.origin&&b.destination)
    .map(b=>({origin:b.origin,destination:b.destination}))
    .filter((r,i,arr)=>arr.findIndex(x=>x.origin===r.origin&&x.destination===r.destination)===i)
    .filter(r=>!favs.find(f=>f.origin===r.origin&&f.destination===r.destination))
    .slice(0,2);
  if(favs.length===0&&recentRoutes.length===0) return null;
  return (
    <div style={{marginBottom:14}}>
      <div style={{color:"#1e3a8a",fontSize:13,letterSpacing:2,fontWeight:800,marginBottom:8}}>
        ⭐ {lang==="en"?"FAVOURITE ROUTES":"RUTAS FAVORITAS"}
      </div>
      {favs.map((f,i)=>(
        <div key={i} style={{background:"#e2e8f0",border:"1px solid #2563eb33",borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>⭐</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:"#0f172a",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.origin}</div>
            <div style={{color:"#334155",fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>→ {f.destination}</div>
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>onBook(f)} style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",borderRadius:7,padding:"5px 10px",color:"#0a0a0a",fontSize:10,fontWeight:700,cursor:"pointer"}}>
              {lang==="en"?"Book":"Reservar"}
            </button>
            <button onClick={()=>saveFavs(favs.filter((_,j)=>j!==i))} style={{background:"#f1f5f9",border:"1px solid #cbd5e1",borderRadius:7,padding:"5px 8px",color:"#334155",fontSize:10,cursor:"pointer"}}>✕</button>
          </div>
        </div>
      ))}
      {recentRoutes.map((r,i)=>(
        <div key={i} style={{background:"#f1f5f9",border:"1px dashed #2563eb22",borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14,opacity:0.4}}>☆</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:"#334155",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.origin}</div>
            <div style={{color:"#334155",fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>→ {r.destination}</div>
          </div>
          <button onClick={()=>{ if(favs.length>=2){alert(lang==="en"?"Max 2 favourite routes":"Máximo 2 rutas favoritas");return;} saveFavs([...favs,r]); }} style={{background:"#e2e8f0",border:"1px solid #2563eb33",borderRadius:7,padding:"5px 10px",color:"#2563eb",fontSize:10,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
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

function ChatModal({ booking, messages, onSend, currentUser, isDriver, onClose, onMarkRead, lang="es" }) {
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
      fromAvatar: isDriver ? "#2563eb" : currentUser.avatar,
      text: text.trim(),
      ts: new Date().toLocaleTimeString("es-ES", { hour:"2-digit", minute:"2-digit" }),
    });
    setText("");
  };

  return (
    <div onClick={handleClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:1000,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#ffffff", borderRadius:"22px 22px 0 0", width:"100%",
        border:"1px solid #cbd5e1", borderBottom:"none",
        display:"flex", flexDirection:"column", maxHeight:"85vh",
        position:"relative", zIndex:1001,
      }}>
        {/* Header */}
        <div style={{padding:"16px 18px 12px",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
          <div style={{width:36,height:4,background:"#cbd5e1",borderRadius:2,margin:"0 auto 10px"}}/>
          {/* Back + close row */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <button onClick={handleClose} style={{
              display:"flex",alignItems:"center",gap:6,background:"none",border:"none",
              color:"#334155",fontSize:13,cursor:"pointer",padding:0,fontFamily:"inherit",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              {lang==="en"?"Back":"Volver"}
            </button>
            <button onClick={handleClose} style={{
              background:"#e2e8f0",border:"1px solid #cbd5e1",borderRadius:"50%",
              width:30,height:30,cursor:"pointer",color:"#334155",fontSize:16,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>×</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              <div style={{color:"#334155",fontSize:9,letterSpacing:2,marginBottom:3}}>{lang==="en"?"BOOKING CHAT":"CHAT DE RESERVA"}</div>
              <div style={{color:"#0f172a",fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{b.guest}</div>
              <div style={{color:"#2563eb",fontSize:10,marginTop:1}}>{b.hotel} · {b.date} {b.time}</div>
            </div>
            {/* Show who's on the other side */}
            {isDriver && emp ? (
              <div style={{display:"flex",alignItems:"center",gap:6,background:emp.avatar+"15",border:`1px solid ${emp.avatar}33`,borderRadius:8,padding:"5px 10px"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:emp.avatar+"30",border:`1.5px solid ${emp.avatar}66`,display:"flex",alignItems:"center",justifyContent:"center",color:emp.avatar,fontSize:9,fontWeight:700}}>{initials(emp.name)}</div>
                <div>
                  <div style={{color:emp.avatar,fontSize:11,fontWeight:600}}>{emp.name}</div>
                  <div style={{color:"#334155",fontSize:9}}>{emp.hotel.split(" ").slice(-1)[0]}</div>
                </div>
              </div>
            ) : !isDriver ? (
              <div style={{display:"flex",alignItems:"center",gap:6,background:"#2563eb15",border:"1px solid #2563eb33",borderRadius:8,padding:"5px 10px"}}>
                <svg width="28" height="28" viewBox="0 0 80 40" fill="none">
                  <path d="M8 28 L8 32 L16 32 L16 28 Z" fill="#2563eb" opacity="0.6"/>
                  <path d="M64 28 L64 32 L72 32 L72 28 Z" fill="#2563eb" opacity="0.6"/>
                  <path d="M4 24 L12 12 L28 8 L52 8 L68 12 L76 24 L76 30 L4 30 Z" fill="#2563eb" opacity="0.3" stroke="#2563eb" strokeWidth="1.5"/>
                  <path d="M14 12 L20 8 L60 8 L66 12 Z" fill="#2563eb" opacity="0.5"/>
                  <circle cx="20" cy="30" r="5" fill="#2563eb" opacity="0.8"/>
                  <circle cx="60" cy="30" r="5" fill="#2563eb" opacity="0.8"/>
                </svg>
                <span style={{color:"#2563eb",fontSize:11,fontWeight:600}}>Conductor</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
          {thread.length === 0 && (
            <div style={{textAlign:"center",color:"#94a3b8",fontSize:12,marginTop:20}}>
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
                    <span style={{color:"#334155",fontSize:10}}>{msg.fromName}</span>
                  </div>
                )}
                <div style={{
                  maxWidth:"80%",
                  background:mine
                    ?"linear-gradient(135deg,#2563eb,#1d4ed8)"
                    :"#f0f4f8",
                  border:mine?"none":"1px solid #cbd5e1",
                  borderRadius:mine?"14px 14px 4px 14px":"14px 14px 14px 4px",
                  padding:"9px 13px",
                }}>
                  <div style={{color:mine?"#ffffff":"#0f172a",fontSize:13,lineHeight:1.4}}>{(!mine&&msg.from==="driver")?translateAutoMsg(msg.text,booking?.clientLang||"es"):msg.text}</div>
                  <div style={{color:mine?"rgba(255,255,255,0.7)":"#475569",fontSize:10,marginTop:3,textAlign:"right"}}>{msg.ts}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{padding:"10px 14px 24px",borderTop:"1px solid #e2e8f0",display:"flex",gap:8,flexShrink:0}}>
          <input
            value={text}
            onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder={lang==="en"?"Write a message...":"Escribe un mensaje..."}
            style={{flex:1,background:"#e2e8f0",border:"1px solid #cbd5e1",borderRadius:24,
              padding:"10px 16px",color:"#0f172a",fontSize:13,outline:"none"}}
          />
          <button onClick={send} disabled={!text.trim()} style={{
            width:42,height:42,borderRadius:"50%",border:"none",cursor:"pointer",flexShrink:0,
            background:text.trim()?"linear-gradient(135deg,#2563eb,#1d4ed8)":"#e2e8f0",
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
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(135deg,#e2e8f0,#f1f5f9)",border:"1.5px solid #2563eb",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:320,textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:8}}>⭐</div>
        <div style={{color:"#1d4ed8",fontSize:18,fontFamily:"'DM Sans',sans-serif",fontWeight:800,marginBottom:4}}>{lang==="en"?"Rate your ride":"Valora tu viaje"}</div>
        <div style={{color:"#334155",fontSize:11,marginBottom:20}}>{booking.origin} → {booking.destination}</div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:20}}>
          {[1,2,3,4,5].map(s=>(
            <button key={s} onClick={()=>setStars(s)} onMouseEnter={()=>setHover(s)} onMouseLeave={()=>setHover(0)}
              style={{background:"none",border:"none",cursor:"pointer",fontSize:38,transform:(hover||stars)>=s?"scale(1.25)":"scale(1)",transition:"transform 0.1s"}}>
              <span style={{color:(hover||stars)>=s?"#f59e0b":"#374151"}}>★</span>
            </button>
          ))}
        </div>
        <button onClick={()=>stars&&onRate(booking.id,stars)} disabled={!stars} style={{width:"100%",background:stars?"linear-gradient(135deg,#2563eb,#1d4ed8)":"#e2e8f0",border:"none",borderRadius:12,padding:"12px 0",cursor:stars?"pointer":"default",color:stars?"#0a0a0a":"#475569",fontSize:13,fontWeight:700,marginBottom:8}}>{lang==="en"?"Submit":"Enviar valoracion"}</button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#334155",fontSize:12,cursor:"pointer"}}>{lang==="en"?"Skip":"Omitir"}</button>
      </div>
    </div>
  );
}
function ClientAuth({ onLogin, onBack, lang, setLang }) {
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
      justifyContent:"center",padding:"24px 20px",background:"#ffffff"}}>
      <RivieraLogo size={250}/>

      <div style={{color:"#334155",fontSize:13,fontWeight:700,marginTop:8,marginBottom:28,textAlign:"center"}}>{t.tagline}</div>

      {/* Toggle */}
      <div style={{display:"flex",background:"#dbeafe",borderRadius:14,padding:4,marginBottom:24,gap:3,width:"100%",maxWidth:340,border:"2px solid #2563eb33",boxShadow:"0 2px 8px rgba(37,99,235,0.12)"}}>
        {[{id:"login",label:t.signIn},{id:"register",label:t.createAccount}].map(m=>(
          <button key={m.id} onClick={()=>{setMode(m.id);setError("");setPin("");setPin2("");}} style={{
            flex:1,padding:"12px 0",border:"none",borderRadius:10,cursor:"pointer",
            background:mode===m.id?"linear-gradient(135deg,#1e3a8a,#2563eb)":"transparent",
            color:mode===m.id?"#ffffff":"#1e3a8a",fontSize:13,fontWeight:700,transition:"all 0.2s",
            boxShadow:mode===m.id?"0 2px 8px rgba(30,58,138,0.3)":"none",
          }}>{m.label}</button>
        ))}
      </div>

      <div style={{width:"100%",maxWidth:340}}>

        {/* ── REGISTER ── */}
        {mode==="register"&&(
          <>
            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.fullName}</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder={t.namePlaceholder}
              style={{...inputStyle,marginBottom:14}}/>

            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>EMAIL</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder={t.emailPlaceholder} autoCapitalize="none"
              style={{...inputStyle,marginBottom:14}}/>

            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>
              {t.choosePin}
            </label>
            <input
              type="number" inputMode="numeric" pattern="[0-9]*"
              value={pin} onChange={e=>setPin(e.target.value.slice(0,4))}
              placeholder="••••" maxLength={4}
              style={{...inputStyle,letterSpacing:8,fontSize:22,textAlign:"center",marginBottom:14}}
            />

            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>
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

      {/* Discount banner */}
            <div style={{background:"#e2e8f0",border:"1px solid #2563eb33",borderRadius:10,
              padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>🏷️</span>
              <div>
                <div style={{color:"#38bdf8",fontSize:12,fontWeight:600}}>{t.discountBanner}</div>
                <div style={{color:"#334155",fontSize:10,marginTop:1}}>{t.minFare}</div>
              </div>
            </div>

            {error&&<div style={{color:"#ef4444",fontSize:12,marginBottom:12,textAlign:"center"}}>{error}</div>}

            <button onClick={handleRegister} style={{
              width:"100%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
              border:"none",borderRadius:12,padding:"14px 0",
              color:"#0f172a",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10,
            }}>{t.createBtn}</button>
          </>
        )}

        {/* ── LOGIN ── */}
        {mode==="login"&&(
          <>
            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>EMAIL</label>
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
                <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>
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
                  <div style={{color:"#334155",fontSize:11,textAlign:"center",marginBottom:8}}>
                    {4-pin.length} dígito{4-pin.length>1?"s":""} más...
                  </div>
                )}
                {/* Forgot PIN */}
                <button onClick={()=>setShowRecovery(true)} style={{
                  background:"none",border:"none",color:"#334155",fontSize:11,
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
          <button onClick={onBack} style={{width:"100%",background:"none",border:"1px solid #e2e8f0",
            borderRadius:12,padding:"11px 0",color:"#334155",fontSize:13,cursor:"pointer",marginTop:4}}>
            {lang==="en"?"← Back":"← Volver"}
          </button>
        )}
      </div>

      {/* ── PIN RECOVERY MODAL ── */}
      {showRecovery&&(
        <div onClick={()=>setShowRecovery(false)} style={{
          position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:1000,
          display:"flex",alignItems:"flex-end",
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"linear-gradient(180deg,#e2e8f0,#f1f5f9)",
            borderRadius:"22px 22px 0 0",padding:"20px 20px 40px",width:"100%",
            border:"1px solid #2563eb44",borderBottom:"none",
            animation:"slideUp 0.3s ease",
          }}>
            <div style={{width:40,height:4,background:"#cbd5e1",borderRadius:2,margin:"0 auto 14px"}}/>
            <button onClick={()=>setShowRecovery(false)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#334155",fontSize:13,cursor:"pointer",padding:"0 0 14px",fontFamily:"inherit"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              {lang==="en"?"Back":"Volver"}
            </button>

            {recoveryDone ? (
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:48,marginBottom:12}}>✅</div>
                <div style={{color:"#22c55e",fontSize:18,fontFamily:"'DM Sans',sans-serif"}}>PIN cambiado</div>
                <div style={{color:"#334155",fontSize:13,marginTop:6}}>Ya puedes iniciar sesión con tu nuevo PIN</div>
              </div>
            ) : (
              <>
                <div style={{color:"#38bdf8",fontSize:11,letterSpacing:3,marginBottom:6}}>CAMBIAR PIN</div>
                <div style={{color:"#0f172a",fontSize:15,fontFamily:"'DM Sans',sans-serif",marginBottom:4}}>
                  Establece un nuevo PIN de acceso
                </div>
                <div style={{color:"#334155",fontSize:11,marginBottom:18}}>
                  Cuenta: <span style={{color:"#38bdf8"}}>{email}</span>
                </div>

                <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:6}}>
                  NUEVO PIN DE 4 DÍGITOS
                </label>
                <input
                  type="number" inputMode="numeric" pattern="[0-9]*"
                  value={newPin} onChange={e=>setNewPin(e.target.value.slice(0,4))}
                  placeholder="••••" maxLength={4}
                  style={{...inputStyle,letterSpacing:8,fontSize:22,textAlign:"center",marginBottom:14}}
                />

                <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:6}}>
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
                  width:"100%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
                  border:"none",borderRadius:12,padding:"14px 0",
                  color:"#0f172a",fontSize:14,fontWeight:700,cursor:"pointer",
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


function ClientView({ client, bookings, setBookings, onNewBooking, onClientAcceptPrice, onClientRejectPrice, onClientCancelTrip, tab, setTab, driverStatus, blockedSlots, serviceStatus, messages, onSendMessage, onMarkRead, lang, setLang }) {
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
  const savedPhone = client?.phone||"";
  const [form,setForm]=useState({
    guest:client.name, guestPhone:savedPhone, origin:"", destination:"",
    date:new Date().toISOString().slice(0,10), time:"", passengers:1, notes:"", fare:"", paymentMethod:"cash",
  });
  const [submitted,setSubmitted]=useState(false);

  const myBookings = bookings.filter(b=>b.clientId===client.id);
  const isOffline  = serviceStatus?.status==="offline";
  const slotAvailable = form.date&&form.time ? (isSlotFree(bookings,form.date,form.time,blockedSlots) && isClientAdvanceOk(form.date,form.time)) : null;

  const discountedFare = null; // Price will be proposed by driver

  const resetForm = () => setForm({guest:client.name,guestPhone:client?.phone||"",origin:"",destination:"",date:new Date().toISOString().slice(0,10),time:"",passengers:1,notes:"",fare:"",paymentMethod:"cash"});

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
      <div style={{color:"#38bdf8",fontSize:22,fontFamily:"'DM Sans',sans-serif",marginBottom:8}}>{t.sentTitle}</div>
      <div style={{color:"#334155",fontSize:14}}>{t.sentSub}</div>
    </div>
  );

  return (
    <div style={{paddingBottom:80}}>
      {/* Offline banner */}
      {isOffline&&(
        <div style={{background:"#fff0f0",border:"2px solid #ef4444",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#ef4444",animation:"pulse 1s infinite"}}/>
            <span style={{color:"#ef4444",fontSize:13,fontWeight:700}}>🔴 SERVICIO NO DISPONIBLE</span>
          </div>
          <div style={{color:"#0f172a",fontSize:13,fontWeight:700,lineHeight:1.5}}>
            El conductor está fuera de servicio.{serviceStatus?.lastActiveDate&&` Último día operativo: ${serviceStatus.lastActiveDate}.`}
            {serviceStatus?.returnDate&&` Regreso previsto: ${serviceStatus.returnDate}.`}
          </div>
        </div>
      )}

      {/* Last active date notice when online */}
      {!isOffline&&serviceStatus?.lastActiveDate&&(
        <div style={{background:"#fffbeb",border:"1.5px solid #f59e0b",borderRadius:12,padding:"10px 14px",marginBottom:14}}>
          <div style={{color:"#f59e0b",fontSize:12,fontWeight:700,marginBottom:3}}>⚠️ Aviso de disponibilidad</div>
          <div style={{color:"#0f172a",fontSize:12}}>Servicio disponible hasta el <strong>{serviceStatus.lastActiveDate}</strong>. Reserva con antelación.{serviceStatus?.returnDate&&` Regreso: ${serviceStatus.returnDate}.`}</div>
        </div>
      )}

      {/* Driver status + Vehicle card */}
      {!isOffline&&(
        <div style={{
          background:"linear-gradient(135deg,#eff6ff,#dbeafe)",
          border:"2px solid #2563eb55",borderRadius:16,
          padding:"16px",marginBottom:14,
          boxShadow:"0 4px 16px rgba(37,99,235,0.12)",
        }}>
          {/* ── Fila 1: Estado + Badge ── */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:driverStatus==="onroute"?"#ef4444":"#16a34a",animation:"pulse 1.5s infinite",flexShrink:0}}/>
              <span style={{color:driverStatus==="onroute"?"#ef4444":"#15803d",fontSize:13,fontWeight:800}}>
                {driverStatus==="onroute"?t.onRoute:t.driverAvailable}
              </span>
            </div>
            <div style={{background:"#1e3a8a",borderRadius:20,padding:"4px 14px"}}>
              <span style={{color:"#ffffff",fontSize:9,fontWeight:700,letterSpacing:2}}>PRIVATE TRANSFERS</span>
            </div>
          </div>

          {/* ── Fila 2: Nombre coche + estrellas + rayo ── */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:46,height:46,borderRadius:12,background:"#ffffff",border:"1.5px solid #2563eb33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 1px 6px rgba(37,99,235,0.12)"}}>
              <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
                <path d="M50 12 C30 12 15 18 10 26 C18 24 34 22 50 22 C66 22 82 24 90 26 C85 18 70 12 50 12Z" fill="#1e3a8a"/>
                <path d="M10 26 C18 24 34 22 50 22 L50 88 C40 60 25 42 10 26Z" fill="#1e3a8a"/>
                <path d="M90 26 C82 24 66 22 50 22 L50 88 C60 60 75 42 90 26Z" fill="#1e3a8a"/>
              </svg>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <span style={{color:"#0f172a",fontSize:16,fontWeight:900}}>Tesla Model 3</span>
                <div style={{display:"flex",gap:1,alignItems:"center"}}>
                  {[1,2,3,4,5].map(s=>(
                    <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                  <span style={{color:"#f59e0b",fontSize:11,fontWeight:700,marginLeft:3}}>5.0</span>
                </div>
              </div>
              <div style={{color:"#475569",fontSize:11}}>{lang==="en"?"Midnight Black · Electric":"Negro Medianoche · Eléctrico"}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563eb" style={{flexShrink:0}}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>

          {/* ── Separador ── */}
          <div style={{height:"1px",background:"linear-gradient(90deg,transparent,#2563eb55,transparent)",marginBottom:10}}/>

          {/* ── Fila 3: Matrícula + Conductor ── */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{background:"#1e3a8a",borderRadius:8,padding:"6px 16px",display:"inline-flex",alignItems:"center",gap:8}}>
              <div style={{width:10,height:14,background:"#ffffff",borderRadius:2,opacity:0.8}}/>
              <span style={{color:"#ffffff",fontSize:16,fontWeight:900,letterSpacing:3}}>5361MZC</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a8a,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{color:"#ffffff",fontSize:11,fontWeight:800}}>SE</span>
              </div>
              <div>
                <div style={{color:"#0f172a",fontSize:13,fontWeight:800}}>Sebastián Echevarría</div>
                <div style={{color:"#2563eb",fontSize:10,fontWeight:700}}>{lang==="en"?"Your driver":"Tu conductor"}</div>
              </div>
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
        // Wait: 15 min FROM booking time (matches driver logic)
        const waitStartMs=tripDt.getTime(); // booking time
        const waitEndMs=tripDt.getTime()+15*60*1000; // 15 min from booking time
        const nowMs=Date.now();
        const waitingMs=nowMs-waitStartMs; // ms since booking time
        const waitRemMs=isArrived?Math.max(0,waitEndMs-nowMs):0;
        const wSecs=Math.floor(waitRemMs/1000);
        const wMins=Math.floor(wSecs/60);
        const wSecsR=wSecs%60;
        const waitExpired=isArrived&&waitRemMs===0;
        const waitProgress=isArrived&&waitingMs>0?Math.min(100,(waitingMs/(15*60*1000))*100):0;
        const basePrice=upcoming.proposedPrice||upcoming.fare||0;
        const discountedPrice=basePrice>0?(basePrice*(1-DISCOUNT_RATE)).toFixed(2):0;
        return(
          <div style={{
            marginBottom:16,
            background:isArrived?"linear-gradient(135deg,#fffbeb,#fef3c7)":isOngoing?"linear-gradient(135deg,#dbeafe,#eff6ff)":urgency?"linear-gradient(135deg,#fef3c7,#fffbeb)":"linear-gradient(135deg,#dbeafe,#eff6ff)",
            border:`3px solid ${isArrived?"#f59e0b":isOngoing?"#16a34a":urgency?"#f59e0b":"#2563eb"}`,
            borderRadius:18,overflow:"hidden",
            boxShadow:isArrived?"0 4px 24px rgba(245,158,11,0.25)":isOngoing?"0 4px 20px rgba(22,163,74,0.2)":urgency?"0 4px 20px rgba(245,158,11,0.25)":"0 4px 20px rgba(37,99,235,0.2)",
          }}>
            <div style={{padding:"10px 16px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:isArrived?"#22c55e":urgency?"#f59e0b":"#2563eb",animation:"pulse 1s infinite",flexShrink:0}}/>
                <span style={{color:isArrived?"#d97706":isOngoing?"#1e3a8a":urgency?"#d97706":"#1e3a8a",fontSize:13,letterSpacing:2,fontWeight:900}}>
                  {isArrived?(lang==="en"?"⏳ WAITING FOR YOU":"⏳ ESPERANDO AL CLIENTE"):isOngoing?(lang==="en"?"🚗 IN PROGRESS":"🚗 EN CURSO"):(lang==="en"?"⚡ NEXT TRIP":"⚡ PRÓXIMO VIAJE")}
                </span>
              </div>
              <span style={{background:isOngoing?"#22c55e22":urgency?"#f59e0b22":"#2563eb22",border:`1px solid ${isOngoing?"#22c55e44":urgency?"#f59e0b44":"#2563eb44"}`,borderRadius:8,padding:"3px 10px",color:isOngoing?"#22c55e":urgency?"#f59e0b":"#2563eb",fontSize:10,fontWeight:700}}>
                {upcoming.status==="confirmed"?"✅ Confirmado":upcoming.status==="inprogress"?"🚗 En curso":"⏳ Pendiente"}
              </span>
            </div>
            <div style={{padding:"10px 16px 0"}}>
              <div style={{color:"#0f172a",fontSize:16,fontFamily:"'DM Sans',sans-serif",fontWeight:800,marginBottom:4}}>{upcoming.date} · {upcoming.time}</div>
              <div style={{color:"#334155",fontSize:11,marginBottom:2}}><span style={{color:"#2563eb"}}>▶ </span>{upcoming.origin}</div>
              <div style={{color:"#334155",fontSize:11,marginBottom:10}}><span style={{color:"#3b82f6"}}>■ </span>{upcoming.destination}</div>
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
                <div style={{display:"flex",justifyContent:"space-between",background:"#f1f5f9",border:"1px solid #cbd5e1",borderRadius:10,padding:"7px 12px",margin:"0 12px 8px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>🗺️</span><span style={{color:"#334155",fontSize:11}}>{km3} km</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>⏱️</span><span style={{color:"#334155",fontSize:11}}>~{dur3} min</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>🏁</span><span style={{color:"#2563eb",fontSize:11,fontWeight:700}}>~{arrStr3}</span></div>
                  <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(upcoming.origin)}&destination=${encodeURIComponent(upcoming.destination)}`} target="_blank" rel="noopener noreferrer" style={{background:"#cbd5e1",border:"1px solid #3b82f655",borderRadius:6,padding:"3px 8px",color:"#3b82f6",fontSize:10,fontWeight:700,textDecoration:"none",flexShrink:0}}>{lang==="en"?"Route":"Ver ruta"}</a>
                </div>
              );
            })()}
            <div style={{margin:"0 12px 12px",display:"flex",gap:8}}>
              {!isArrived&&(
                <div style={{flex:1,background:isOngoing?"#dcfce7":urgency?"#fef3c7":"#eff6ff",borderRadius:12,padding:"10px 14px"}}>
                  <div style={{color:"#1e3a8a",fontSize:11,letterSpacing:2,fontWeight:800,marginBottom:3}}>{isOngoing?(lang==="en"?"IN PROGRESS":"EN CURSO"):(lang==="en"?"TIME REMAINING":"TIEMPO RESTANTE")}</div>
                  <div style={{color:isOngoing?"#16a34a":urgency?"#d97706":"#0f172a",fontSize:30,fontFamily:"'DM Sans',sans-serif",fontWeight:900,letterSpacing:2}}>{countdownStr}</div>
                </div>
              )}
              {isArrived&&(
                <div style={{flex:1,background:waitExpired?"#fee2e2":wSecs<120?"#fff7ed":"#fffbeb",borderRadius:12,padding:"10px 14px",border:`2px solid ${waitExpired?"#ef4444":wSecs<120?"#f97316":"#f59e0b"}`,boxShadow:waitExpired?"0 2px 8px rgba(239,68,68,0.15)":"0 2px 8px rgba(245,158,11,0.15)"}}>
                  <div style={{color:waitExpired?"#ef4444":wSecs<120?"#ea580c":"#d97706",fontSize:11,fontWeight:800,marginBottom:2}}>
                    {lang==="en"?"⏳ WAITING FOR YOU":"⏳ ESPERANDO AL CLIENTE"}
                  </div>
                  <div style={{color:"#64748b",fontSize:9,marginBottom:4}}>
                    {lang==="en"?"Driver is waiting at the pickup point":"El conductor está en el punto de recogida"}
                  </div>
                  {waitExpired?(
                    <div style={{color:"#ef4444",fontSize:13,fontWeight:800}}>
                      {lang==="en"?"⚠️ Wait time expired":"⚠️ Tiempo de espera agotado"}
                    </div>
                  ):(
                    <>
                      <div style={{color:wSecs<120?"#ef4444":"#d97706",fontSize:26,fontFamily:"'DM Sans',sans-serif",fontWeight:900,letterSpacing:2,lineHeight:1}}>{pad(wMins)}:{pad(wSecsR)}</div>
                      <div style={{height:4,background:"#fef3c7",borderRadius:2,overflow:"hidden",marginTop:6}}>
                        <div style={{height:"100%",background:wSecs<120?"linear-gradient(90deg,#ef4444,#b91c1c)":"linear-gradient(90deg,#f59e0b,#ef4444)",borderRadius:2,width:`${waitProgress}%`,transition:"width 1s linear"}}/>
                      </div>
                    </>
                  )}
                </div>
              )}
              {basePrice>0&&(
                <div style={{background:"#2563eb10",borderRadius:12,padding:"10px 14px",textAlign:"right",flexShrink:0}}>
                  <div style={{color:"#334155",fontSize:9,marginBottom:2}}>{lang==="en"?"PRICE":"PRECIO"}</div>
                  <div style={{color:"#334155",fontSize:11,textDecoration:"line-through"}}>{basePrice} €</div>
                  <div style={{color:"#2563eb",fontSize:20,fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{discountedPrice} €</div>
                  <div style={{color:"#22c55e",fontSize:9,fontWeight:700}}>-{Math.round(DISCOUNT_RATE*100)}% VIP</div>
                </div>
              )}
            </div>
            <div style={{margin:"0 12px 12px",display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={()=>setChatBooking(upcoming)} style={{
                width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                background:"linear-gradient(135deg,#1e0a3e,#e2e8f0)",border:"1px solid #a78bfa55",
                borderRadius:10,padding:"12px 0",color:"#ffffff",fontSize:13,fontWeight:800,cursor:"pointer",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",
              }}>💬 {lang==="en"?"Chat with driver":"Chat con el conductor"}</button>
              {/* Cancel with double confirmation */}
              {cancelConfirm===upcoming.id?(
                <div style={{background:"#fff5f5",border:"2px solid #ef4444",borderRadius:12,padding:"14px"}}>
                  <div style={{color:"#0f172a",fontSize:13,fontWeight:700,textAlign:"center",marginBottom:4}}>{lang==="en"?"⚠️ Confirm cancellation?":"⚠️ ¿Confirmas la cancelación?"}</div>
                  <div style={{color:"#334155",fontSize:11,textAlign:"center",marginBottom:12}}>{lang==="en"?"This cannot be undone":"Esta acción no se puede deshacer"}</div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setCancelConfirm(null)} style={{flex:1,background:"#e2e8f0",border:"1px solid #475569",borderRadius:8,padding:"10px 0",color:"#334155",fontSize:12,fontWeight:600,cursor:"pointer"}}>{lang==="en"?"Go back":"No, volver"}</button>
                    <button onClick={()=>{
                      // Notificar al conductor con detalles del viaje
                      const cancelMsg = lang==="en"
                        ? `❌ TRIP CANCELLED BY CLIENT\n📅 ${upcoming.date} · ${upcoming.time}\n📍 ${upcoming.origin}\n🏁 ${upcoming.destination}\n👤 ${upcoming.guest||client.name}`
                        : `❌ VIAJE CANCELADO POR EL CLIENTE\n📅 ${upcoming.date} · ${upcoming.time}\n📍 ${upcoming.origin}\n🏁 ${upcoming.destination}\n👤 ${upcoming.guest||client.name}`;
                      onSendMessage&&onSendMessage(upcoming.id,{from:"client",fromName:client.name,text:cancelMsg,ts:Date.now(),isSystem:true});
                      // Cancelar la reserva
                      onClientCancelTrip&&onClientCancelTrip(upcoming.id);
                      setCancelConfirm(null);
                    }} style={{flex:1,background:"linear-gradient(135deg,#ef4444,#b91c1c)",border:"none",borderRadius:8,padding:"10px 0",color:"#ffffff",fontSize:12,fontWeight:700,cursor:"pointer"}}>{lang==="en"?"Yes, cancel":"Sí, cancelar"}</button>
                  </div>
                </div>
              ):(
                <button onClick={()=>setCancelConfirm(upcoming.id)} style={{
                  width:"100%",background:"#fff0f0",border:"1.5px solid #ef444466",borderRadius:10,
                  padding:"10px 0",color:"#ef4444aa",fontSize:12,fontWeight:700,cursor:"pointer",
                }}>✕ {lang==="en"?"Cancel trip":"Cancelar viaje"}</button>
              )}
            </div>
          </div>
        );
      })()}

            {/* Discount banner */}
      <div style={{background:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"2px solid #1e3a8a44",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10,boxShadow:"0 2px 8px rgba(30,58,138,0.1)"}}>
        <span style={{fontSize:22}}>🏷️</span>
        <div>
          <div style={{color:"#1e3a8a",fontSize:16,fontWeight:900}}>{t.discount15}</div>
          <div style={{color:"#1e40af",fontSize:13,fontWeight:700}}>{t.autoDiscount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:"#dbeafe",borderRadius:14,padding:4,marginBottom:18,gap:3,border:"2px solid #2563eb33",boxShadow:"0 2px 8px rgba(37,99,235,0.12)"}}>
        {[{id:"avail",label:t.tabAvail},{id:"mine",label:t.tabTrips}].map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,padding:"11px 4px",border:"none",borderRadius:10,cursor:"pointer",
            background:tab===tb.id?"linear-gradient(135deg,#1e3a8a,#2563eb)":"transparent",
            color:tab===tb.id?"#fff":"#1e3a8a",fontSize:13,fontWeight:700,transition:"all 0.2s",
            boxShadow:tab===tb.id?"0 2px 8px rgba(30,58,138,0.3)":"none"}}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── AVAILABILITY TAB ── */}
      {tab==="avail"&&(
        <div>
          <div style={{color:"#334155",fontSize:10,letterSpacing:3,marginBottom:12}}>{t.sectionAvail}</div>
          <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value,time:""})}
            style={{background:"#f8fafc",border:"2px solid #2563eb44",borderRadius:10,color:"#0f172a",fontSize:14,fontWeight:700,padding:"10px 14px",outline:"none",colorScheme:"light",width:"100%",boxSizing:"border-box",marginBottom:14}}/>
          <div style={{background:"#f1f5f9",borderRadius:14,overflow:"hidden",border:"1px solid #cbd5e1"}}>
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
                  background:occupied?"#fef2f2":isDriverBlocked?"#fff7ed":"transparent",
                }}>
                  <div style={{width:52,flexShrink:0,padding:"0 10px",borderRight:`1px solid ${isHour?"#222":"#181818"}`,display:"flex",alignItems:"center"}}>
                    <span style={{color:isHour?"#0f172a":isHalfHour?"#334155":"#475569",fontSize:isHour?13:11,fontWeight:700}}>{slotTime}</span>
                  </div>
                  <div style={{flex:1,padding:"0 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    {occupied&&<span style={{color:"#ef4444",fontSize:10,fontWeight:600}}>{t.occupied}</span>}
                    {isDriverBlocked&&!occupied&&<span style={{color:"#f97316",fontSize:10}}>{t.notAvail}</span>}
                    {isFree&&(isHour||isHalfHour)&&!isOffline&&(
                      <button onClick={()=>{setForm(f=>({...f,time:slotTime}));setTab("new");}} style={{
                        background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",borderRadius:7,
                        color:"#ffffff",fontSize:isHour?11:10,fontWeight:700,padding:isHour?"5px 12px":"3px 10px",cursor:"pointer",
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
                background:"linear-gradient(135deg,#0a0f1e,#e2e8f0)",
                border:"1px solid #2563eb33",borderRadius:14,
                padding:"14px 16px",marginBottom:14,
              }}>
                <div style={{color:"#2563eb",fontSize:10,letterSpacing:3,marginBottom:10}}>
                  {lang==="en"?"YOUR SPENDING SUMMARY":"RESUMEN DE TU GASTO"}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  <div style={{background:"#f1f5f9",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{color:"#0f172a",fontSize:20,fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{done.length}</div>
                    <div style={{color:"#334155",fontSize:9,letterSpacing:1}}>{lang==="en"?"TRIPS":"VIAJES"}</div>
                  </div>
                  <div style={{background:"#f1f5f9",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{color:"#2563eb",fontSize:20,fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{fmt(totalSpent)}</div>
                    <div style={{color:"#334155",fontSize:9,letterSpacing:1}}>{lang==="en"?"€ SPENT":"€ GASTADO"}</div>
                  </div>
                  <div style={{background:"#f1f5f9",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{color:"#22c55e",fontSize:20,fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{fmt(totalSaved)}</div>
                    <div style={{color:"#334155",fontSize:9,letterSpacing:1}}>{lang==="en"?"€ SAVED":"€ AHORRADO"}</div>
                  </div>
                </div>
              </div>
            );
          })()}


                    <div style={{color:"#1e3a8a",fontSize:14,letterSpacing:2,fontWeight:900,marginBottom:12}}>{t.myTripsSection}</div>
          {myBookings.length===0&&<div style={{color:"#334155",fontSize:13,textAlign:"center",padding:"32px 0"}}>{t.noTrips}</div>}
          {(()=>{
            const active=myBookings.filter(b=>!["completed","cancelled","client_rejected","rejected"].includes(b.status)).sort((a,b)=>{const o={inprogress:0,confirmed:1,price_proposed:2,pending:3};return(o[a.status]??3)-(o[b.status]??3);});
            const hist=myBookings.filter(b=>["completed","cancelled","client_rejected","rejected"].includes(b.status)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
            return(<>
            {active.length>0&&<div style={{color:"#1e3a8a",fontSize:14,letterSpacing:2,fontWeight:900,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><span style={{width:7,height:7,borderRadius:"50%",background:"#2563eb",animation:"pulse 1.5s infinite",display:"inline-block"}}/>{lang==="en"?"MY BOOKINGS":"MIS RESERVAS"}</div>}
            {active.map(b=>(
            <div key={b.id} style={{
              background:"#ffffff",
              borderRadius:14,padding:"14px 16px",marginBottom:10,
              border:"1.5px solid #e2e8f0",
              boxShadow:"0 2px 12px rgba(30,58,138,0.08)",
              borderLeft:"3px solid "+statusColor(b.status),
            }}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{color:"#0f172a",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>{b.guest}</span>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:`${statusColor(b.status)}22`,color:statusColor(b.status)}}>{statusLabel(b.status,t).toUpperCase()}</span>
              </div>
              <div style={{color:"#334155",fontSize:12,marginBottom:6}}>{b.date} · {b.time} · {b.passengers} pax</div>
              <div style={{color:"#334155",fontSize:11,marginBottom:4}}>📍 {b.origin}</div>
              <div style={{color:"#334155",fontSize:11,marginBottom:8}}>🏁 {b.destination}</div>
              {/* Fare with discount */}
              {b.fare&&(
                <div style={{background:"#f1f5f9",borderRadius:8,padding:"8px 12px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:"#334155",fontSize:11}}>{t.priceBase2}</span>
                    <span style={{color:"#334155",fontSize:12,textDecoration:"line-through"}}>{fmt(b.fare)} €</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:"#2563eb",fontSize:11}}>{lang==="en"?"🏷️ 15% VIP discount":"🏷️ Descuento 15% VIP"}</span>
                    <span style={{color:"#2563eb",fontSize:12}}>-{fmt(b.fare*DISCOUNT_RATE)} €</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:6,borderTop:"1px solid #22c55e33",marginTop:4,background:"#22c55e0d",borderRadius:8,padding:"8px 8px"}}>
                    <span style={{color:"#22c55e",fontSize:14,fontWeight:800,letterSpacing:0.3}}>{lang==="en"?"💶 YOUR PRICE":"💶 TU PRECIO"}</span>
                    <span style={{color:"#16a34a",fontSize:22,fontFamily:"'DM Sans',sans-serif",fontWeight:800}}>{fmt(b.fare*(1-DISCOUNT_RATE))} €</span>
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
                  <div style={{display:"flex",justifyContent:"space-between",background:"#f1f5f9",border:"1px solid #cbd5e1",borderRadius:10,padding:"8px 12px",marginTop:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span>🗺️</span>
                      <span style={{color:"#334155",fontSize:11}}>{km} km</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span>⏱️</span>
                      <span style={{color:"#334155",fontSize:11}}>~{durationMin} min</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span>🏁</span>
                      <span style={{color:"#2563eb",fontSize:11,fontWeight:700}}>{lang==="en"?"Arrival":"Llegada"} ~{arrivalTime}</span>
                    </div>
                  </div>
                );
              })()}

              {b.status==="pending"&&(
                <div style={{
                  background:"#fffbeb",
                  border:"1.5px solid #f59e0b88",
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
                  <div style={{height:1,background:"linear-gradient(90deg,transparent,#cbd5e133,transparent)",marginBottom:12}}/>
                  {/* Price info */}
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{
                      width:38,height:38,borderRadius:10,flexShrink:0,
                      background:"#eff6ff",border:"1px solid #2563eb33",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
                    }}>💶</div>
                    <div>
                      <div style={{color:"#0f172a",fontSize:12,fontWeight:600,marginBottom:3}}>
                        {lang==="en"?"Price pending driver review":"Precio pendiente de revisión"}
                      </div>
                      <div style={{color:"#334155",fontSize:11,lineHeight:1.4}}>
                        {lang==="en"
                          ?"The driver will review your route and propose a final price. You'll be able to accept or reject it."
                          :"El conductor revisará tu ruta y propondrá un precio final. Podrás aceptarlo o rechazarlo."}
                      </div>
                    </div>
                  </div>
                  {/* VIP reminder */}
                  <div style={{
                    marginTop:12,padding:"7px 10px",
                    background:"#2563eb0a",border:"1px solid #2563eb22",
                    borderRadius:8,display:"flex",alignItems:"center",gap:6,
                  }}>
                    <span style={{fontSize:12}}>🏷️</span>
                    <span style={{color:"#2563eb",fontSize:10,fontWeight:600}}>
                      {lang==="en"
                        ?"Your 15% VIP discount will be applied automatically"
                        :"Tu descuento VIP del 15% se aplicará automáticamente"}
                    </span>
                  </div>
                </div>
              )}
              {b.status==="price_proposed"&&(
                <div style={{
                  background:"#faf5ff",
                  border:"2px solid #7c3aed66",borderRadius:14,
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
                  <div style={{background:"#f1f5f9",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                    {/* Original price */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{color:"#0f172a",fontSize:12}}>
                        {lang==="en"?"Standard price":"Precio estándar"}
                      </span>
                      <span style={{color:"#475569",fontSize:15,textDecoration:"line-through",fontFamily:"'DM Sans',sans-serif"}}>
                        {fmt(b.proposedPrice)} €
                      </span>
                    </div>
                    {/* Discount line */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingBottom:10,borderBottom:"1px solid #e2e8f0"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{background:"#2563eb22",border:"1px solid #2563eb44",borderRadius:20,padding:"2px 8px",color:"#2563eb",fontSize:10,fontWeight:700}}>
                          VIP −{Math.round(DISCOUNT_RATE*100)}%
                        </span>
                        <span style={{color:"#2563eb",fontSize:11}}>
                          {lang==="en"?"Your exclusive discount":"Tu descuento exclusivo"}
                        </span>
                      </div>
                      <span style={{color:"#2563eb",fontSize:13,fontWeight:700}}>
                        −{fmt(b.proposedPrice * DISCOUNT_RATE)} €
                      </span>
                    </div>
                    {/* Final price — hero */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{color:"#7c3aed",fontSize:11,fontWeight:700,letterSpacing:1,marginBottom:2}}>
                          {lang==="en"?"YOU PAY":"PAGAS TÚ"}
                        </div>
                        <div style={{color:"#334155",fontSize:9}}>
                          {lang==="en"?"Conductor profesional · Private Transfers":"Professional driver · Private Transfers"}
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{color:"#1e3a8a",fontSize:34,fontFamily:"'DM Sans',sans-serif",fontWeight:700,lineHeight:1}}>
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
                      background:"#f5f3ff",border:"1px solid #7c3aed33",
                      borderRadius:8,padding:"8px 12px",marginBottom:12,
                      display:"flex",gap:7,alignItems:"flex-start",
                    }}>
                      <span style={{fontSize:14,flexShrink:0}}>💜</span>
                      <div>
                        <div style={{color:"#7c3aed",fontSize:9,letterSpacing:1,marginBottom:2}}>
                          {lang==="en"?"NOTE FROM DRIVER":"NOTA DEL CONDUCTOR"}
                        </div>
                        <div style={{color:"#0f172a",fontSize:12,fontStyle:"italic"}}>
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
              {b.status==="confirmed"&&<div style={{fontSize:11,color:"#2563eb"}}>✅ {t.confirmed}</div>}
              {(b.status==="confirmed"||b.status==="inprogress")&&b.notes&&(
                <div style={{marginTop:8,background:"#f1f5f9",border:"1px solid #2563eb22",borderRadius:10,padding:"10px 12px"}}>
                  <div style={{color:"#334155",fontSize:9,letterSpacing:2,marginBottom:4}}>{lang==="en"?"YOUR NOTES":"TUS NOTAS"}</div>
                  <div style={{color:"#2563eb",fontSize:12}}>📋 {b.notes}</div>
                </div>
              )}
              {b.status==="inprogress"&&<div style={{fontSize:11,color:"#2563eb",display:"flex",alignItems:"center",gap:4}}><span style={{width:5,height:5,borderRadius:"50%",background:"#2563eb",display:"inline-block",animation:"pulse 1.5s infinite"}}/>🚗 {t.inprogress}</div>}
              {b.status==="completed"&&(
                <div>
                  <div style={{fontSize:11,color:"#22c55e",marginBottom:8}}>✅ {t.completed}</div>
                  {/* Rating */}
                  {!b.rating ? (
                    <div style={{background:"#f1f5f9",border:"1px solid #2563eb22",borderRadius:10,padding:"10px 12px"}}>
                      <div style={{color:"#334155",fontSize:10,letterSpacing:1,marginBottom:8,textAlign:"center"}}>
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
                    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"#f1f5f9",borderRadius:8}}>
                      <span style={{fontSize:14}}>{"⭐".repeat(b.rating)}</span>
                      <span style={{color:"#334155",fontSize:10}}>{lang==="en"?"Your rating":"Tu valoración"}</span>
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
                width:"100%",marginTop:8,background:"#f1f5f9",border:"1px solid #cbd5e1",
                borderRadius:8,padding:"7px 0",cursor:"pointer",color:"#334155",fontSize:12,fontWeight:600,position:"relative",
              }}>
                {t.chat}
                {(messages[String(b.id)]||[]).filter(m=>m.from==="driver").length>0&&(
                  <span style={{position:"absolute",top:-4,right:8,background:"#ef4444",borderRadius:10,padding:"1px 6px",fontSize:9,color:"#0f172a",fontWeight:700}}>
                    {(messages[String(b.id)]||[]).filter(m=>m.from==="driver").length}
                  </span>
                )}
              </button>
            </div>
          ))}
            {hist.length>0&&<>
              <button onClick={()=>setHistoryOpen(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",padding:"8px 0",display:"flex",alignItems:"center",gap:8,width:"100%",marginTop:8}}>
                <span style={{color:"#1e3a8a",fontSize:14,letterSpacing:2,fontWeight:900}}>{lang==="en"?"TRIP HISTORY":"HISTORIAL DE VIAJES"}</span>
                <span style={{background:"#e2e8f0",borderRadius:10,padding:"2px 8px",fontSize:10,color:"#334155"}}>{hist.length}</span>
                <span style={{color:"#334155",fontSize:12,marginLeft:"auto"}}>{historyOpen?"▲":"▼"}</span>
              </button>
              {historyOpen&&hist.map(b=>{
                const done=b.status==="completed";
                return(<div key={b.id} style={{background:"#f1f5f9",borderRadius:10,padding:"10px 14px",marginBottom:6,borderLeft:"3px solid "+(done?"#22c55e":"#f97316"),opacity:0.85}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:"#0f172a",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{b.guest}</span>
                    <span style={{color:done?"#22c55e":"#f97316",fontSize:9,fontWeight:700}}>{done?lang==="en"?"✅ DONE":"✅ COMPLETADO":lang==="en"?"✕ CANCELLED":"✕ CANCELADO"}</span>
                  </div>
                  <div style={{color:"#334155",fontSize:10}}>{b.date} · {b.time}</div>
                  <div style={{color:"#334155",fontSize:10}}>📍 {b.origin}</div>
                  <div style={{color:"#334155",fontSize:10}}>🏁 {b.destination}</div>
                  {done&&b.fare&&<div style={{color:"#2563eb",fontSize:11,fontWeight:600,marginTop:4}}>💶 {fmt(b.fare*(1-DISCOUNT_RATE))} €</div>}
                </div>);
              })}
            </>}
            </>);})()}
        </div>
      )}

      {/* ── NEW BOOKING TAB ── */}
      {tab==="new"&&(
        <div>
          <div style={{color:"#1d4ed8",fontSize:20,fontFamily:"'DM Sans',sans-serif",marginBottom:18}}>{t.newBookingTitle}</div>

          {form.time&&(
            <div style={{background:"#eff6ff",border:"2.5px solid #1e3a8a",borderRadius:14,padding:"16px 20px",marginBottom:18,textAlign:"center",boxShadow:"0 4px 12px rgba(30,58,138,0.12)"}}>
              <div style={{color:"#1e3a8a",fontSize:11,letterSpacing:3,marginBottom:6,fontWeight:700}}>{t.selectedTime}</div>
              <div style={{color:"#1e3a8a",fontSize:42,fontFamily:"'DM Sans',sans-serif",fontWeight:900,lineHeight:1}}>{form.time}</div>
              <div style={{color:"#1e40af",fontSize:12,fontWeight:700,marginTop:4}}>{form.date}</div>
            </div>
          )}

          <div style={{marginBottom:14}}>
            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.passengerName}</label>
            <input value={form.guest} onChange={e=>setForm({...form,guest:e.target.value})} style={inputStyle}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{color:form.guestPhone?"#334155":"#d97706",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.phone}{!form.guestPhone&&" *"}</label>
            <input type="tel" value={form.guestPhone} placeholder={t.phonePlaceholder} onChange={e=>setForm({...form,guestPhone:e.target.value})} style={{...inputStyle,border:form.guestPhone?"2px solid #2563eb":"2px solid #f59e0b",background:form.guestPhone?"#f0f7ff":"#fffbeb"}}/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <label style={{color:form.origin?"#334155":"#d97706",fontSize:11,letterSpacing:2}}>{t.origin}{!form.origin&&" *"}</label>
              <button onClick={()=>getLocation(addr=>setForm(f=>({...f,origin:addr})))} disabled={geoLoading} style={{
                background:geoLoading?"#e2e8f0":"linear-gradient(135deg,#2563eb,#1d4ed8)",
                border:"none",borderRadius:20,cursor:geoLoading?"default":"pointer",
                padding:"5px 12px",display:"flex",alignItems:"center",gap:5,
                color:"#ffffff",fontSize:11,fontWeight:700,
                boxShadow:geoLoading?"none":"0 2px 8px rgba(37,99,235,0.35)",
              }}>
                <span style={{fontSize:13}}>📍</span>{geoLoading?(lang==="en"?"Getting...":"Obteniendo..."):(lang==="en"?"Use my location":"Usar mi ubicación")}
              </button>
            </div>
            {geoError==="denied"?<GeoErrorMsg onClose={()=>setGeoState({loading:false,error:null,denied:false})}/>:geoError&&<div style={{color:"#ef4444",fontSize:11,marginBottom:6}}>{geoError}</div>}
            <input value={form.origin} placeholder={t.originPlaceholder} onChange={e=>setForm({...form,origin:e.target.value})} style={{...inputStyle,border:form.origin?"2px solid #2563eb":"2px solid #f59e0b",background:form.origin?"#f0f7ff":"#fffbeb"}}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{color:form.destination?"#334155":"#d97706",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.destination}{!form.destination&&" *"}</label>
            <input value={form.destination} placeholder={t.destPlaceholder} onChange={e=>setForm({...form,destination:e.target.value})} style={{...inputStyle,border:form.destination?"2px solid #2563eb":"2px solid #f59e0b",background:form.destination?"#f0f7ff":"#fffbeb"}}/>
          </div>
          <TripEstimateBox origin={form.origin} destination={form.destination} lang={lang}/>
          <DistancePriceCalcClient origin={form.origin} destination={form.destination} pricePerKm={pricePerKm} lang={lang} onPriceCalculated={(price,km,durMin)=>setForm(f=>({...f,fare:price,tripKm:km,durationMin:durMin}))}/>
          <div style={{marginBottom:14}}>
            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.passengers}</label>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4].map(n=>(
                <button key={n} onClick={()=>setForm({...form,passengers:n})} style={{flex:1,height:52,borderRadius:12,cursor:"pointer",
                  border:form.passengers===n?"none":"2px solid #cbd5e1",
                  background:form.passengers===n?"linear-gradient(135deg,#2563eb,#1d4ed8)":"#f8fafc",
                  color:form.passengers===n?"#fff":"#0f172a",fontSize:20,fontWeight:700,transition:"all 0.15s",
                  boxShadow:form.passengers===n?"0 2px 8px rgba(37,99,235,0.3)":"none"}}>{n}</button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.notes}</label>
            <input value={form.notes} placeholder={t.notesPlaceholder} onChange={e=>setForm({...form,notes:e.target.value})} style={inputStyle}/>
          </div>

          {/* Price info notice */}
          <div style={{background:"#eff6ff",border:"2px solid #1e3a8a",borderRadius:12,padding:"14px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start",boxShadow:"0 2px 8px rgba(30,58,138,0.1)"}}>
            <span style={{fontSize:22,flexShrink:0}}>💬</span>
            <div>
              <div style={{color:"#1e3a8a",fontSize:14,fontWeight:800,marginBottom:4}}>
                {lang==="en"?"Price confirmation":"Confirmación de precio"}
              </div>
              <div style={{color:"#1e40af",fontSize:12,fontWeight:700,lineHeight:1.5}}>
                {lang==="en"
                  ? "After sending your request, the driver will review the route and propose a price. You will be able to accept or reject it."
                  : "Tras enviar tu solicitud, el conductor revisará la ruta y te propondrá un precio. Podrás aceptarlo o rechazarlo."}
              </div>
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:8}}>{t.payment}</label>
            <div style={{display:"flex",gap:8}}>
              {[{id:"cash",icon:"💵",label:t.cash,en:t.cash.toUpperCase(),c:"#2563eb"},{id:"card",icon:"💳",label:t.card,en:t.card.toUpperCase(),c:"#2563eb"}].map(opt=>(
                <button key={opt.id} onClick={()=>setForm({...form,paymentMethod:opt.id})} style={{
                  flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 8px",borderRadius:12,
                  border:`2px solid ${form.paymentMethod===opt.id?opt.c:opt.c+"33"}`,
                  background:form.paymentMethod===opt.id?`${opt.c}18`:"#e2e8f0",cursor:"pointer",transition:"all 0.15s",
                }}>
                  <span style={{fontSize:22}}>{opt.icon}</span>
                  <span style={{color:form.paymentMethod===opt.id?opt.c:"#475569",fontSize:11,fontWeight:700}}>{opt.en}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:18}}>
            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.notes}</label>
            <input value={form.notes} placeholder={t.notesPlaceholder} onChange={e=>setForm({...form,notes:e.target.value})} style={inputStyle}/>
          </div>

          {form.date&&form.time&&(
            <div style={{background:slotAvailable?"#f0fdf4":"#fff0f0",border:`2px solid ${slotAvailable?"#16a34a":"#ef4444"}`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:slotAvailable?"#16a34a":"#ef4444",animation:"pulse 1.5s infinite",flexShrink:0}}/>
              <div style={{color:slotAvailable?"#15803d":"#ef4444",fontSize:13,fontWeight:800}}>
                {slotAvailable?t.slotAvailable:t.slotUnavailable}
              </div>
            </div>
          )}

          <button onClick={handleSubmit}
            disabled={isOffline||!slotAvailable||!form.guest||!form.origin||!form.destination||!form.time}
            style={{width:"100%",
              background:(isOffline||!slotAvailable||!form.guest||!form.origin||!form.destination||!form.time)?"#e2e8f0":"linear-gradient(135deg,#2563eb,#1d4ed8)",
              border:"none",borderRadius:12,padding:"16px 0",
              color:(isOffline||!slotAvailable||!form.guest||!form.origin||!form.destination||!form.time)?"#475569":"#0a0a0a",
              fontSize:14,fontWeight:700,letterSpacing:1,cursor:"pointer",transition:"all 0.2s",marginBottom:12,
            }}>
            {isOffline?t.offlineBtn:t.submitBtn}
          </button>
          <button onClick={()=>setTab("avail")} style={{width:"100%",background:"none",border:"1px solid #e2e8f0",borderRadius:12,padding:"11px 0",color:"#334155",fontSize:13,cursor:"pointer"}}>{t.backToAvail}</button>
        </div>
      )}

      {/* ── CANCEL CONFIRMATION MODAL ── */}
      {cancelConfirm&&(
        <div onClick={()=>setCancelConfirm(null)} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:1000,display:"flex",alignItems:"flex-end"}}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"linear-gradient(180deg,#e2e8f0,#f1f5f9)",
            borderRadius:"22px 22px 0 0",padding:"20px 20px 44px",width:"100%",
            border:"1px solid #ef444433",borderBottom:"none",
            animation:"slideUp 0.3s ease",
          }}>
            <div style={{width:40,height:4,background:"#cbd5e1",borderRadius:2,margin:"0 auto 18px"}}/>
            {/* Icon */}
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"#ef444415",border:"2px solid #ef444433",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto"}}>✕</div>
            </div>
            {/* Title */}
            <div style={{color:"#ef4444",fontSize:17,fontFamily:"'DM Sans',sans-serif",fontWeight:700,textAlign:"center",marginBottom:6}}>
              {lang==="en"?"Cancel this trip?":"¿Cancelar este viaje?"}
            </div>
            {/* Trip info */}
            <div style={{background:"#f1f5f9",borderRadius:10,padding:"10px 14px",marginBottom:6,textAlign:"center"}}>
              <div style={{color:"#0f172a",fontSize:13,fontWeight:600,marginBottom:3}}>{cancelConfirm.guest}</div>
              <div style={{color:"#334155",fontSize:11}}>{cancelConfirm.date} · {cancelConfirm.time}</div>
              <div style={{color:"#334155",fontSize:11,marginTop:2}}>📍 {cancelConfirm.origin} → {cancelConfirm.destination}</div>
            </div>
            <div style={{color:"#334155",fontSize:12,textAlign:"center",marginBottom:20,lineHeight:1.5}}>
              {lang==="en"
                ?"This action cannot be undone. The driver will be notified."
                :"Esta acción no se puede deshacer. El conductor recibirá una notificación."}
            </div>
            {/* Buttons */}
            <button onClick={()=>{
              // Notificar al conductor con detalles
              const cMsg = lang==="en"
                ? `❌ TRIP CANCELLED BY CLIENT\n📅 ${cancelConfirm.date} · ${cancelConfirm.time}\n📍 ${cancelConfirm.origin}\n🏁 ${cancelConfirm.destination}\n👤 ${cancelConfirm.guest||client.name}`
                : `❌ VIAJE CANCELADO POR EL CLIENTE\n📅 ${cancelConfirm.date} · ${cancelConfirm.time}\n📍 ${cancelConfirm.origin}\n🏁 ${cancelConfirm.destination}\n👤 ${cancelConfirm.guest||client.name}`;
              onSendMessage&&onSendMessage(cancelConfirm.id,{from:"client",fromName:client.name,text:cMsg,ts:Date.now(),isSystem:true});
              onClientCancelTrip&&onClientCancelTrip(cancelConfirm.id);
              setCancelConfirm(null);
            }} style={{
              width:"100%",background:"linear-gradient(135deg,#ef4444,#b91c1c)",
              border:"none",borderRadius:12,padding:"14px 0",
              color:"#0f172a",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10,
            }}>
              {lang==="en"?"Yes, cancel trip":"Sí, cancelar viaje"}
            </button>
            <button onClick={()=>setCancelConfirm(null)} style={{
              width:"100%",background:"#e2e8f0",border:"1px solid #cbd5e1",
              borderRadius:12,padding:"13px 0",
              color:"#334155",fontSize:13,cursor:"pointer",
            }}>
              {lang==="en"?"Keep my trip":"Mantener mi reserva"}
            </button>
          </div>
        </div>
      )}

      {/* Chat modal */}
      {chatBooking&&(
        <ChatModal booking={chatBooking} messages={messages} onSend={onSendMessage} currentUser={client} isDriver={false} onClose={()=>setChatBooking(null)} onMarkRead={onMarkRead} lang={lang}/>
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
      background:"#e2e8f0",border:"1px solid #2563eb33",
      borderRadius:20,overflow:"hidden",cursor:"pointer",
      boxShadow:"0 0 12px rgba(201,169,110,0.08)",
    }}>
      {["es","en"].map(l=>(
        <div key={l} style={{
          padding:"5px 10px",fontSize:11,fontWeight:700,letterSpacing:1,
          transition:"all 0.2s",
          background:lang===l?"linear-gradient(135deg,#2563eb,#1d4ed8)":"transparent",
          color:lang===l?"#0a0a0a":"#475569",
          display:"flex",alignItems:"center",gap:5,
        }}>
          <span style={{fontSize:20}}>{l==="es"?"🇪🇸":"🇬🇧"}</span>
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
  const [showProfile,setShowProfile]=useState(false);
  const [profilePhone,setProfilePhone]=useState("");
  const [profileSaved,setProfileSaved]=useState(false);
  const [pinView,setPinView]=useState(false);       // true = mostrar formulario cambio PIN
  const [pinCurrent,setPinCurrent]=useState("");    // PIN actual
  const [pinNew,setPinNew]=useState("");            // PIN nuevo
  const [pinConfirm,setPinConfirm]=useState("");    // Confirmación PIN nuevo
  const [pinError,setPinError]=useState("");        // Mensaje de error
  const [pinSuccess,setPinSuccess]=useState(false); // PIN guardado ok
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
  const savePinChange=()=>{
    setPinError("");
    // Verificar PIN actual
    if(currentClient?.pin&&pinCurrent!==currentClient.pin){
      setPinError(lang==="en"?"Current PIN is incorrect":"El PIN actual es incorrecto");
      return;
    }
    if(!/^\d{4}$/.test(pinNew)){
      setPinError(lang==="en"?"New PIN must be 4 digits":"El PIN nuevo debe tener 4 dígitos");
      return;
    }
    if(pinNew!==pinConfirm){
      setPinError(lang==="en"?"PINs do not match":"Los PINs no coinciden");
      return;
    }
    // Guardar nuevo PIN
    const clients=loadClients();
    const updated=clients.map(cl=>cl.email===currentClient?.email?{...cl,pin:pinNew}:cl);
    saveClients(updated);
    setCurrentClient(prev=>({...prev,pin:pinNew}));
    setPinSuccess(true);
    setPinCurrent(""); setPinNew(""); setPinConfirm("");
    setTimeout(()=>{setPinSuccess(false);setPinView(false);},1800);
  };
  const saveProfilePhone=()=>{
    const clients=loadClients();
    const updated=clients.map(cl=>cl.email===currentClient?.email?{...cl,phone:profilePhone}:cl);
    saveClients(updated);
    setCurrentClient(prev=>({...prev,phone:profilePhone}));
    setProfileSaved(true);
    setTimeout(()=>setProfileSaved(false),2000);
  };
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
    <div style={{background:"#f1f5f9",minHeight:"100vh",width:"100%",fontFamily:"'DM Sans',sans-serif",color:"#0f172a"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{position:"fixed",top:12,right:16,zIndex:100}}><LangToggle lang={lang} setLang={setLang}/></div>
      <ClientAuth onLogin={c=>{setCurrentClient(c);setScreen("client");}} onBack={null} lang={lang} setLang={setLang}/>
      {/* ── INSTALL BUTTON (always visible, not installed) ── */}
      {!isInStandaloneMode&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9998,width:"calc(100% - 32px)",maxWidth:400}}>
          {isIOS ? (
            <>
              <button onClick={()=>setShowIOSInstall(v=>!v)} style={{
                width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",borderRadius:14,
                padding:"14px 0",color:"#ffffff",fontSize:14,fontWeight:700,cursor:"pointer",
                boxShadow:"0 4px 20px #2563eb44",
              }}>
                <span style={{fontSize:20}}>⬇️</span>
                {lang==="en"?"Install VELO App":"Instalar App NEXTTRIP VIP"}
              </button>
              {showIOSInstall&&(
                <div style={{marginTop:10,background:"#e2e8f0",border:"1.5px solid #2563eb44",borderRadius:14,padding:"16px"}}>
                  <div style={{color:"#2563eb",fontSize:12,fontWeight:700,marginBottom:12,letterSpacing:1}}>
                    {lang==="en"?"HOW TO INSTALL ON iOS":"CÓMO INSTALAR EN iOS"}
                  </div>
                  {[
                    {icon:"1️⃣", text:lang==="en"?"Tap the Share button at the bottom of Safari":"Toca el botón Compartir en la parte inferior de Safari"},
                    {icon:"2️⃣", text:lang==="en"?"Scroll down and tap 'Add to Home Screen'":"Desliza hacia abajo y toca 'Añadir a pantalla de inicio'"},
                    {icon:"3️⃣", text:lang==="en"?"Tap 'Add' to confirm":"Toca 'Añadir' para confirmar"},
                  ].map((s,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                      <span style={{fontSize:18,flexShrink:0}}>{s.icon}</span>
                      <span style={{color:"#0f172a",fontSize:13,lineHeight:1.4}}>{s.text}</span>
                    </div>
                  ))}
                  <div style={{marginTop:8,background:"#2563eb15",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>💡</span>
                    <span style={{color:"#2563eb",fontSize:11}}>{lang==="en"?"Must use Safari browser":"Debes usar el navegador Safari"}</span>
                  </div>
                </div>
              )}
            </>
          ) : installPrompt ? (
            <button onClick={async()=>{installPrompt.prompt();const{outcome}=await installPrompt.userChoice;if(outcome==="accepted")setInstallPrompt(null);}} style={{
              width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
              background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",borderRadius:14,
              padding:"14px 0",color:"#ffffff",fontSize:14,fontWeight:700,cursor:"pointer",
              boxShadow:"0 4px 20px #2563eb44",
            }}>
              <span style={{fontSize:20}}>⬇️</span>
              {lang==="en"?"Install VELO App":"Instalar App NEXTTRIP VIP"}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );

  return(
    <div style={{background:"#f1f5f9",minHeight:"100vh",width:"100%",fontFamily:"'DM Sans',sans-serif",color:"#0f172a",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>

      {/* ── OFFLINE BANNER ── */}
      {!isOnline&&(
        <div style={{
          position:"fixed",top:0,left:0,right:0,zIndex:9999,
          background:"#1e3a8a",
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
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:200,background:"linear-gradient(135deg,#f1f5f9,#e2e8f0)",borderBottom:"2px solid #2563eb",boxShadow:"0 4px 24px rgba(0,0,0,0.12)"}}>
          <div style={{maxWidth:480,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px 4px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1s infinite"}}/>
              <span style={{color:"#38bdf8",fontSize:11,fontWeight:700,letterSpacing:1}}>💬 {unreadConvos.reduce((s,c)=>s+c.unread,0)} MENSAJE{unreadConvos.reduce((s,c)=>s+c.unread,0)>1?"S":""} SIN LEER</span>
            </div>
            {unreadConvos.map(c=>(
              <div key={c.bookingId} onClick={()=>{setChatNotifOpen(c.booking);handleMarkRead(c.bookingId,(messages[c.bookingId]||[]).filter(m=>m.from==="driver").length);}}
                style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",borderTop:"1px solid #cbd5e1",cursor:"pointer"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"#2563eb20",border:"1px solid #2563eb55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💬</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{color:"#0f172a",fontSize:12,fontWeight:600}}>{c.booking.guest}</span>
                    <span style={{background:"#ef4444",borderRadius:10,padding:"1px 7px",fontSize:10,color:"#0f172a",fontWeight:700}}>{c.unread}</span>
                  </div>
                  <div style={{color:"#0f172a",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",opacity:0.8}}>{c.lastMsg?.fromName}: {c.lastMsg?.text}</div>
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
          left:0,right:0,zIndex:190,
          background:"linear-gradient(135deg,#1a1a3e,#2d1b69)",
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
                    <span style={{color:"#475569",fontSize:11,textDecoration:"line-through"}}>{fmt(b.proposedPrice)} €</span>
                    <span style={{color:"#38bdf8",fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{fmt(b.proposedPrice*(1-DISCOUNT_RATE))} €</span>
                    <span style={{background:"#2563eb22",border:"1px solid #2563eb44",borderRadius:10,padding:"1px 5px",color:"#2563eb",fontSize:9,fontWeight:700}}>−{Math.round(DISCOUNT_RATE*100)}%</span>
                  </div>
                </div>
                <button onClick={()=>{
                  setClientTab("mine");
                }} style={{
                  background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
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

      <div style={{padding:"8px 14px 8px",borderBottom:"2px solid #e2e8f0",background:"#ffffff",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          {/* Logo izquierda — grande y centrado */}
          <div style={{flexShrink:0,display:"flex",alignItems:"center"}}>
            <RivieraLogo size={80}/>
          </div>
          {/* Derecha: columna con 2 filas */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
            {/* Fila 1: solo banderas, más a la derecha */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
              <LangToggle lang={lang} setLang={setLang}/>
            </div>
            {/* Fila 2: botón perfil */}
            <button onClick={()=>{setProfilePhone(currentClient?.phone||"");setShowProfile(true);}} style={{
              display:"flex",alignItems:"center",gap:7,background:"#eff6ff",
              border:"1.5px solid #1e3a8a44",borderRadius:20,padding:"4px 12px 4px 4px",cursor:"pointer",
            }}>
              <div style={{width:26,height:26,borderRadius:"50%",background:"#1e3a8a",display:"flex",alignItems:"center",justifyContent:"center",color:"#ffffff",fontSize:10,fontWeight:800,flexShrink:0}}>
                {initials(currentClient?.name||"")}
              </div>
              <span style={{color:"#0f172a",fontSize:12,fontWeight:800,whiteSpace:"nowrap"}}>{currentClient?.name}</span>
              <span style={{color:"#1e3a8a",fontSize:11,marginLeft:2}}>▾</span>
            </button>
          </div>
        </div>
      </div>

      <div className="app-inner" style={{padding:"16px 16px 80px"}}>
        <ErrorBoundary><ClientView client={currentClient} bookings={bookings} setBookings={setBookings} onNewBooking={handleNewBooking}
          onClientAcceptPrice={handleClientAcceptPrice} onClientRejectPrice={handleClientRejectPrice} onClientCancelTrip={handleClientCancelTrip}
          tab={clientTab} setTab={setClientTab}
          driverStatus={driverStatus} blockedSlots={blockedSlots} serviceStatus={serviceStatus}
          messages={messages} onSendMessage={handleSendMessage} onMarkRead={handleMarkRead} lang={lang} setLang={setLang}/></ErrorBoundary>
      </div>
      {ratingModal&&<RatingModal booking={ratingModal} onRate={handleRate} onClose={()=>setRatingModal(null)} lang={lang}/>}

      
      {/* ── PROFILE DRAWER ── */}
      {showProfile&&(
        <div onClick={()=>setShowProfile(false)} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:1000,display:"flex",alignItems:"flex-end"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#ffffff",borderRadius:"22px 22px 0 0",width:"100%",border:"1px solid #e2e8f0",padding:"0 0 36px",position:"relative",zIndex:1001}}>
            {/* Handle */}
            <div style={{width:40,height:4,background:"#cbd5e1",borderRadius:4,margin:"14px auto 18px"}}/>
            <div style={{padding:"0 20px"}}>
              {/* Avatar + nombre */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:"1px solid #e2e8f0"}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a8a,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{color:"#ffffff",fontSize:20,fontWeight:800}}>{initials(currentClient?.name||"")}</span>
                </div>
                <div>
                  <div style={{color:"#0f172a",fontSize:17,fontWeight:800}}>{currentClient?.name}</div>
                  <div style={{color:"#2563eb",fontSize:11,fontWeight:700,marginTop:2}}>VIP Client</div>
                </div>
              </div>
              {/* Email */}
              <div style={{marginBottom:14}}>
                <label style={{color:"#1e3a8a",fontSize:10,letterSpacing:2,fontWeight:800,display:"block",marginBottom:5}}>EMAIL</label>
                <div style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"11px 14px",color:"#475569",fontSize:13,fontWeight:700}}>{currentClient?.email}</div>
              </div>
              {/* Teléfono */}
              <div style={{marginBottom:14}}>
                <label style={{color:"#1e3a8a",fontSize:10,letterSpacing:2,fontWeight:800,display:"block",marginBottom:5}}>{lang==="en"?"PHONE":"TELÉFONO"}</label>
                <div style={{display:"flex",gap:8}}>
                  <input type="tel" value={profilePhone} onChange={e=>setProfilePhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    style={{flex:1,background:"#f8fafc",border:"2px solid "+(profilePhone?"#2563eb":"#f59e0b"),borderRadius:10,padding:"11px 14px",color:"#0f172a",fontSize:13,fontWeight:700,outline:"none",boxSizing:"border-box"}}/>
                  <button onClick={saveProfilePhone} style={{background:profileSaved?"#16a34a":"linear-gradient(135deg,#1e3a8a,#2563eb)",border:"none",borderRadius:10,padding:"0 16px",color:"#ffffff",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                    {profileSaved?(lang==="en"?"✓ Saved":"✓ Guardado"):(lang==="en"?"Save":"Guardar")}
                  </button>
                </div>
                <div style={{color:"#94a3b8",fontSize:10,marginTop:4}}>{lang==="en"?"Auto-filled in future bookings":"Se rellenará automáticamente en futuras reservas"}</div>
                <div style={{background:"#fffbeb",border:"1px solid #f59e0b55",borderRadius:8,padding:"8px 10px",marginTop:8,display:"flex",gap:6,alignItems:"flex-start"}}>
                  <span style={{fontSize:13,flexShrink:0}}>⚠️</span>
                  <span style={{color:"#92400e",fontSize:11,fontWeight:700}}>{lang==="en"?"Please sign out and sign back in to save changes":"Vuelve a iniciar sesión para guardar los cambios"}</span>
                </div>
              </div>
              {/* Cambiar PIN */}
              {!pinView?(
                <button onClick={()=>{setPinView(true);setPinError("");setPinCurrent("");setPinNew("");setPinConfirm("");setPinSuccess(false);}} style={{width:"100%",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"12px 0",color:"#0f172a",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  🔑 {lang==="en"?"Change PIN":"Cambiar PIN"}
                </button>
              ):(
                <div style={{background:"#f8fafc",border:"1.5px solid #2563eb33",borderRadius:12,padding:"14px",marginBottom:10}}>
                  <div style={{color:"#1e3a8a",fontSize:12,fontWeight:800,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                    🔑 {lang==="en"?"Change PIN":"Cambiar PIN"}
                    <button onClick={()=>setPinView(false)} style={{marginLeft:"auto",background:"none",border:"none",color:"#94a3b8",fontSize:16,cursor:"pointer",padding:0,lineHeight:1}}>✕</button>
                  </div>
                  {/* PIN actual */}
                  <div style={{marginBottom:10}}>
                    <label style={{color:"#475569",fontSize:10,letterSpacing:1,fontWeight:700,display:"block",marginBottom:4}}>{lang==="en"?"CURRENT PIN":"PIN ACTUAL"}</label>
                    <input type="password" inputMode="numeric" maxLength={4} value={pinCurrent} onChange={e=>setPinCurrent(e.target.value.replace(/\D/g,"").slice(0,4))}
                      placeholder="••••"
                      style={{width:"100%",background:"#ffffff",border:"2px solid "+(pinCurrent.length===4?"#2563eb":"#e2e8f0"),borderRadius:8,padding:"10px 12px",color:"#0f172a",fontSize:18,fontWeight:700,outline:"none",letterSpacing:6,boxSizing:"border-box",textAlign:"center"}}/>
                  </div>
                  {/* PIN nuevo */}
                  <div style={{marginBottom:10}}>
                    <label style={{color:"#475569",fontSize:10,letterSpacing:1,fontWeight:700,display:"block",marginBottom:4}}>{lang==="en"?"NEW PIN":"PIN NUEVO"}</label>
                    <input type="password" inputMode="numeric" maxLength={4} value={pinNew} onChange={e=>setPinNew(e.target.value.replace(/\D/g,"").slice(0,4))}
                      placeholder="••••"
                      style={{width:"100%",background:"#ffffff",border:"2px solid "+(pinNew.length===4?"#2563eb":"#e2e8f0"),borderRadius:8,padding:"10px 12px",color:"#0f172a",fontSize:18,fontWeight:700,outline:"none",letterSpacing:6,boxSizing:"border-box",textAlign:"center"}}/>
                  </div>
                  {/* Confirmar PIN */}
                  <div style={{marginBottom:12}}>
                    <label style={{color:"#475569",fontSize:10,letterSpacing:1,fontWeight:700,display:"block",marginBottom:4}}>{lang==="en"?"CONFIRM NEW PIN":"CONFIRMAR PIN NUEVO"}</label>
                    <input type="password" inputMode="numeric" maxLength={4} value={pinConfirm} onChange={e=>setPinConfirm(e.target.value.replace(/\D/g,"").slice(0,4))}
                      placeholder="••••"
                      style={{width:"100%",background:"#ffffff",border:"2px solid "+(pinConfirm.length===4?(pinNew===pinConfirm?"#22c55e":"#ef4444"):"#e2e8f0"),borderRadius:8,padding:"10px 12px",color:"#0f172a",fontSize:18,fontWeight:700,outline:"none",letterSpacing:6,boxSizing:"border-box",textAlign:"center"}}/>
                  </div>
                  {/* Error */}
                  {pinError&&<div style={{background:"#fff0f0",border:"1px solid #ef444455",borderRadius:8,padding:"8px 10px",color:"#ef4444",fontSize:11,fontWeight:700,marginBottom:10}}>{pinError}</div>}
                  {/* Éxito */}
                  {pinSuccess&&<div style={{background:"#f0fdf4",border:"1px solid #22c55e55",borderRadius:8,padding:"8px 10px",color:"#16a34a",fontSize:11,fontWeight:700,marginBottom:10}}>✅ {lang==="en"?"PIN updated successfully":"PIN actualizado correctamente"}</div>}
                  {/* Botón guardar */}
                  <button onClick={savePinChange} style={{width:"100%",background:"linear-gradient(135deg,#1e3a8a,#2563eb)",border:"none",borderRadius:8,padding:"11px 0",color:"#ffffff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    {lang==="en"?"Save new PIN":"Guardar nuevo PIN"}
                  </button>
                </div>
              )}
              {/* Salir */}
              <button onClick={()=>{setShowProfile(false);setScreen("auth");setCurrentClient(null);}} style={{width:"100%",background:"linear-gradient(135deg,#ef4444,#b91c1c)",border:"none",borderRadius:10,padding:"13px 0",color:"#ffffff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                🚪 {TRANSLATIONS[lang]?.exit||"Salir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstall&&<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:9998,background:"#ffffff",border:"2px solid #1e3a8a",borderRadius:16,padding:"14px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px #00000088"}}>
        <div style={{width:44,height:44,borderRadius:10,overflow:"hidden",flexShrink:0}}>
          <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAIQAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMABAMDBAMDBAQDBAUEBAUGCgcGBgYGDQkKCAoPDRAQDw0PDhETGBQREhcSDg8VHBUXGRkbGxsQFB0fHRofGBobGv/bAEMBBAUFBgUGDAcHDBoRDxEaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGv/CABEIBOYE5gMBIgACEQEDEQH/xAAcAAEBAAIDAQEAAAAAAAAAAAAAAQIDBAcIBQb/xAAbAQEBAAIDAQAAAAAAAAAAAAAAAQIGAwQFB//aAAwDAQACEAMQAAAB79AABZYAAAAAAAAALAAAAAAAAAAAWAAAAAAACUJQAAAlFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAAAAAEBQAAAAAAAQFAAJQABYAAACwAAAAAAAAAAAAAAAAAAAAAAWAAAAAAIUAAAAAAAABKAAAAAAAAAAAAAAAAAAAAEoAAAAAAAKQAAAAAAAAAAABcSkKAAAAACUAAAAAAACCgAJQCwBCgAAAAAAAAAAAAAJQAAAAQoEoAlAAAQoAAAAALACAoAAAAAAAAAAAAAAlABCgAAAEKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlAAAAAAAAAAJQAJQAAUgBCgAqAAAAAAAAAAAAAAAAAAAAAsAAEoASgAAAAAAAAAAAAAAAAAQqUAAAAAAAAAAAAAAAAAEKAAAAAAAAAAAAAAAAACWUAAAAAAAAAAAAAAlAAAAAAQoAAAAAAAAAJQAAAAAAAEKAQoAAAAAAJQAAAAAAlAAAAQoAAAALAAEKAACUAAAAAAAAAAAAAAABCgAAAAAAAASiUAAAAAAAJQSgAAAAAAAAABKAEoAAIFlAAAAAAAAJQAAAlBKAAJQJQAQoAAAAAEoAAAAAAAAAAAEKAAAAlAAAAACUAAAAAAAAAAAAAAAAAAAEKAAAAAAAAlCUAAAlAlAAAAJQSgABKAAAAAAAAAAJQAAAAAAAJQAAABKAAAAAAAACwAAAAAAAALAAABKAAAAAAAAAAAAAAAAAAAAAAAAJQAAAAJQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUAAAAAAAAAAAAAABCgRQAQoAAAAAEoAWAAAAAlAJQAAAAEKAAAAACUAAAAAAAAEolAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQoACUlAlAJQAAAAAAAAAAAAAAAlAAAAABFAAAAABCgACAoAABYABCgAsAAlAAAAAAAAAAAAAAAAAAAAAAAAJQAAAAAlAAAAAAAICgACUAAAlAAAAAAAAAAAAAAAAAABKAAAAAAAAAAAAEoAAAAAAAAACAoAAAAAAAAAAAICgCUAAAAEKAACUAAIoAAAAAAAAAAAAAAAAAAJQABKAEolAgoAABCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQAAAAAAAAAAAAAAAAAAQVCgAAlCVCgAASgAACKAAAAAAAAABCgAAAAAAAAIKAAAAAAAAACUAAAAAAAAAJQAlAAAABKAAAAAAAAAEoAAAAAAAJQCUAAAAAJQAAAAAALAACUAAAAAAAAFgAAAASgAQoAEsKAAAAAAAAAAAAAQoAAAAAA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+VjQxwDiShBQARjiwBCASACAgAgAARBAQQQAABQCCTzgulgITCQyPn/hwAQhAzTRlkSKY5PH24I/+t1inRRgAwAAABAABDiwACBCQADxRCAAiAQCSBAihygBRwS6zsGPqSiAFz3igQgQyBFzHVHGZj7lXsoccJ6zjiwAAAgAiAAAQBgAQCAQBggAABgAACBBARAAARCSgiD7oBAGMZrJcYjBgAQx8kqAaHGUbl9ojRRyAzihghSABAgBAgSQARAAiDADQDAghCQCAgACBASCAACxyzLooxjDgcKsbfyiizjKu/I7oCq+5higDzzAAiABSQCwQTDQxARRCgABAAATAARgQQAQAQCAgARAQQQTyQrniNMETwRUhjQBzANAXONfMJIgiwABwASSAiAAzBBCixgCQAAiAAAwTwBSQAgBBABAABQggAABAiBiDBLRyzsLOd4pmxQzvlcTCAkBpKDyAAADAAwCiiAAARCAgACBAwAghBCAABhgBAQAhhAQwQQAgggSCRTRzoRSWSQ6hU2iTxFCiVMPp6lpixgBSgAACBRiSQgAwAgBCgAiRAAgRgDBwQzDyCyAAhASAgQCADAAgDyiBbm89nHF9VdDhOsAQjJcV/7QjgAAQRAxyDCCQBABQARwAABhBACAwzAAySACQCCxCgAAAABSBRAQAgxioqUAoIpdzneEiaegAz8PKBQhAABwAACSATCBjAAgACixBQAQACAgAwiBDggAghQBQQQRCABwiAAQSRSyYEt2lkF2iIcGDqIYDDqTiQDAwATRAhCQAgDBCACDCgAggBDiQRCQBgBAAixDAASgSwCggAACAgCgTgDzuIwqtEDUsapV31Q1w6zigAAATAACBAgAgwCAwQQBDBQgBAACgAgAQgBBhAAAQAABCBQBiAAQABBBySgJm/APzQDw0h76r7C8RyhBAADCiBAwAjjygQAAzCQAgARRwRACQgAAwAAiAAQCACQDAQggAAAABAADShz60vJyT1yVEEmRd8xyyBBCBAAAChSATiDAAgAACgACiRTAACAgADABABAAihARgCAACgACgigBRBhBQj7CjoVB4qJ4RysJ7zDiRQwAADACBSjAQSAQDhQRBDQRACDAACgAyAgAwACBxCAQiiAAgAgBAihSAAATxSbPLas2uMcdiSbiSgCABAAAQgAACAADgQAABBACgAgSgAAQjRgBAwgQCAACACACAASACAgAgAjQAQRyABaTEAAQVjE17JziDCCAhAABASQiQBBSAgARTyhACAAAAAQAAAAiSBQQASggjBBCgBwSgQAgAAgCDACSAIIAliBHKTf7jxwAzhAAAiAAiAwAiCBBQwgCBwDQAwhyggRCgwBCgQhQAwQAAABgAQBTwDiBCABAgSQxDrQ9flA6lZySQAQAgBACAABQCBAQxACAADggAgwAAQBASRyTAgCyChQhDwQgAAAQiAARABDggwiRQAjBDYe5K+67yBiRBCABBAwQAgBDATQgBgSAgCACACgAjQSQiAAyAAQQACAAABADAQAAQAwAgACAAABDBBjiTywwhyCRCAAiARBBCAQgjBBABASBAQQAQwAABAAghCBAAABgAAiAgACDBQwAQAACAASQwRTBAQQgxCyAxzCRxAjAQSAAAASgwwDAACBABAgDjBAACAQChgAAAhARQAABQBABBwQQAAgxAiAggzSQAABzwyyjyzwwwxwQQBBwBjBQwyBABAgAQSjyCxSTyRhyTQQBAAAAijRzAAAACwRAgjgiAyhSSgSBjyzAjjCBTCAAAACATCBBSzCghwzATgBiAwAhQAhCDDDDDDBCghhBAACCAAgAzgABzAixiAAxyQCCQShBjTRDwAQAQwwwgwwQhjCxwBhSySgBTwgAgBjATTzDzzzzzDChBDxBACBQCAAQAAiCQzyigABywgByiACBRQTCzjAAABAhiDTjwDiwARCAhgQgBgRAjCgDgjTjygBTQjiAwwgwCCAAgAAgAABBADTBgBSSABgDTxBCAxDtDjDRvPZHpHBgCjwBAgAQggARCABTyQQgBTzzzzwhTjBjigSCADSgAAiQAyTDDCSg6SzDDRRxzwgBBgI5dDM73hZj/eTyjiDCgCASQQQAAhTzgAxgBDTADyCBQjACiAiAAAAzAQACAiQhTxCZACAzCjYSygxjxa3OYB946ksgzwyiAgCAhjRSAAAABTywAyiAiAgAABCiwwjgAQyBAAARgACgwBAAiCBIDBAQjBAgAQCQhCTDzDDCQTSzQChyCiQizQwwgwSBTyCBSwhiyxSwwxRjSCgyAAQAwAQAQgAQAAgDDiCyAQzjRgRChBxxgQxDAAAQggghjyjBRCDTjDzTQgjCxwRAwwAAQAABBBRRygQQAhCgBCgDgARyiARAwggxBTQRDxABCxAAQAAQAABAAhhDDhKwCgAAAAABDyxxQwwAAAAAAAABQjDCCQQSCAgwgCCSgACCAAhCQhRQjiQBgCATwyQQziwRyxwDBQCTSwRgyzzzzhCCgQCxCizjwxxSxxwDzTDBAhCAAAAAxCARRQBhRiCyAxhihCDiQwCBjAxwwwxzzQjzAAADTRDzTTxzgATCADDizgAAACAACwTSiAQwghBAACQAAiAABgQCQjShyxAACAAAAhADzzzzzTzzzwwjAxDAhDzzzzzzjhQChiAjyzSxzzzzihQAACAAAhADACTABhQDABTAhAiQAiAgQgQCRAThiRwAQgwyCggAAwwghwzTBBiBgQxgQCyiARigACQhBBBCACQjwBQAACAgABwgCQwgxAAhDRTgjxATxwBBThTQCxxgDzigiyTwgBhyDQCDBTiwxSzCgwCAAgAAQiSAggjACABQQBAAAijSCDBBBQAgxTwyAzAxCBDTSQxQDAxiAiggQwwjRQTBxBTRSjjAyjwRgCgBCBDQAggAABxADAzgQwABBgwAQACBBAAAQBwAAAwACAhCCRjDDAADCBDCAACQBCBBACASRBBSgDADQgxQBggAATAAChCACQCBABAhTAAACAwQSABDACCABSCAQSACyxBBCCABBDSiBiSDAAADAiiAABTCCQAAgjACABCQAhQgAhAxAAAwRghgAhBhRACAQDCgACgAQACQQgRiAwAAQjCgAjABQBQAQBQSQAggARQQAjAAQQgQQBgRRgBggACwCCABQSBAgggSggQQSCAiAgASACABAgABQAACQhQBAQhADQAgAggBAAAABAhAAgABABQAABAADACQAAAABRSQAAQAgAhAAAwBCAQCgwQCBgAAxhByQDwAAiAASDAAxwAAiCBAAgAQQRhCARCRQBBAwBAiCBDDBACDQyCyAAgADAQRAAQAwwABgQSDwgTAwAiAAAAAABywyChACAAQAQQAQgBwgCSTwABAAAgBgBABBAgBggBAAQxgDDxAAiAiBxACAwADRBAQCCCCCAAAhBAgwQjABwgTQAwQCAAAhAyBBAASjxggQCAhSigAiQCACTAAygAAAQCBAAAwQBggAAiRQgQABBgihQgCwQQhgABQCBAiBAAAQgASgAgAQACAQAACAAADBABiAACyADAACBAABCCAhBDQAAhAwAAAggDCABSgABSBQggTCAASxABCAAAQAgAQyCAgADAABAjARSiRQBgTAQACSCQxAAjRSQAABwRCgBAAgQAAiAiSRBwAghTQAQgyjhBAAQCQgiCCBAAAAiQCwwxgAQAAwAACQAAAQDBATAyQgADAxSgDDQCwAAQCiBAACgiACAAAAQSgSCAAQAgAAAQAAAASQhCDDQBgCBgQDSiDCgBACQAAxBDQiCihQACRjAhCCgRABQABACQRQQAhwACQQCAAAQghAxQAAgACAACAyBSBAASgACAQxQAAQRCCDCAAiCAAAAAACiAQBBgCARgAggAABAwgAAAjQAgAiwgBCgAABAggAQiABAQDBBCABCAwBAgTAACBwBRDATAQAAABBARAAAhhgAgCiggCwAAAACAijRRyAAACShDgAAAAAhCAgAQAQAAAQQQAQCAwiAgABBgADADCAAwDiAACQgCDAgQgRRACjQRAARASACBSQAAADAAAjCACBgSABgABBAiBRggCAAAQAgAAAARACgABhAACSgARSgBQDAiCAAAgQgCBABDAgwBAhhABQgAQAhDAARgDCSADACAghAAACAAhAjBgAABgATCgACAAwBAhQAAhCzQiBSBCiAAACTACARhQAAhAARzSBgBAAhRAgCihwgBAiAhgAAABCRAAAAAACgABDTBxADAAwBwCBzzzzyACCDwABxwAABwAAADyAABwACCBzwCCBwADwDwDwADwCDzyDwCADwAAByADyAACAAByCDzz/8QALxEAAgECAggHAQEAAwEAAAAAAAERITEQQVFhcYGRwdHhIFBgobHw8TBAcICgsP/aAAgBAwEBPxD/AMlxPoIqTFrG1oqb4k/BpNsT6GY27qxK89rS6kmjx7DzoOPUXGLIhLnJpH06cKaBDToXoSvvPeAs/UZ+4z9Ri7kzuZjzAM1OI7286lK5Kahqr35LeU1S66vkvkurucfEDmXMk7slsWWGeSqVnjNLnJb/AL30MiLYm+aFb/DuyQ7yZimyFgjLKtKk/PdD890PxXQS+n6C7C6EXRdBDHS1KPIfeRIeU8TVTVzVTUxrHHCiZl/hdoa93qQ6M1Cu9r5WG23LwWKiqv2Wll7jN5v7oK4QQJEkkk4QR5HrnGx5rn4Zwn/XxwsNVy59Hq/u138lpf241yPhakQQR4Gaa93PBWLMuL6Dlhuf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" width="44" height="44" alt="VELO" style={{objectFit:"contain"}}/>
        </div>
        <div style={{flex:1}}>
          <div style={{color:"#0f172a",fontSize:13,fontWeight:800,marginBottom:2}}>Instalar VELO</div>
          <div style={{color:"#334155",fontSize:11,fontWeight:700}}>Añadir a pantalla de inicio</div>
        </div>
        <button onClick={handleInstall} style={{background:"#1e3a8a",border:"none",borderRadius:10,color:"#ffffff",fontSize:12,fontWeight:700,padding:"8px 14px",cursor:"pointer"}}>Instalar</button>
        <button onClick={()=>setShowInstall(false)} style={{background:"none",border:"none",color:"#475569",fontSize:18,cursor:"pointer",padding:"0 4px"}}>×</button>
      </div>}
    </div>
  );
}