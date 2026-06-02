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
      src="data:image/jpeg;base64,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HMMOBKONKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAECBLPFMGPKNGLCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAIAAAAAAAAAAAAEFAGFPCIBHEIAAAAAAAAAIABAABAAAAKABAAAAAAAAAAAAAAAAAAAAAACMIIAAAAAIAAAFMIAAAPDAKCNBKNMMJOAAADELAAAAAAAAAAAAAICHLHNOONNJEDBAAAAAAAAAEAAAFHGKECAAAAAAAMOGJDAADEMAAAAMMIAKPAAEDCKNACAAEAAAAAAABDGAAAAAAAAIDGJAAAAAAAAAAABANMIFHCAAAAAEMACNOALLLBHAPBCABFAHJALNFONAAAAAAAAAAAADKDHNNPPPCAJIEMJAAAAAAAAAAOGILKEBMAAAAHFCILCEPKKAJEFLDDGOAHCNKKPAAGICAAAAAAAAABADJFGBDCIEAJCAFPKAAAAAAAAANDKCMDAPJAAPAJAMICEEDKAKAhb0WucCBIOAKHALIAAAAAAAAAJODAKPBPDIAAIIFDKAFNAAAAAAAAAEKHEJAAMJABOBIIGIFIADG7guvAY078CTSAAPPEGIAAAAAAAAAEIIAAMKLPDDHHCHNKEJKAAAAAAAAAEBHMODJEKKBPAAOLPOAAKAq9qfsQLHgK6nKAPPFBDAAAAAAAAAAAJAMALEMMNMMAHBKFFAAAAAAAACAAAPIANGAJAAEBHBCFAAFBNOADKOMPOFGCLIAKPFBAAAAAAAAAAAHOACMKAAAAAAAMFKFHAAIAAAAAAAAAALDLAIEBPIOAHEIAAFOBHLLLDDHCELOMLAOPAILIAAAAAAAAANDCGICAAAAAABDFAGPAAAAAAAAAAAAANAEEBCIINCNGCAAAAMMPKCKACBBMINGAELKAMJBNOMPONNDAAMBEGJNFDOOIKJCAJHAAAAAAAAAAAAAEHGAJBMFMHCHACAIAHKIAAAAAAAEIGECBLMNJAAAAAAAELKKFHDJKAAAAAAAAACLGDGAAAAAAAAAAEAAFOFNELKEIKIBAAAFHGAOPBAABOBKENLMAGLGHHBCAMADJFAKINEHNMPJICANNHDEJHAAAAAABEAAAEAAPIOOGKGGKAAAAAFAACFMOAINHBAJGFGMFBMPDDCFPHMKKIGLFKCHOCOHCFJAAIMKIAAAAAAAAAAAAAAEOMDJALPIAAAAAELKMCAALAPPHGEDOAAHHLHDJBGKJINDFEHDNHFKKMMMIJOLMEGAAAAAAAAAAAAAAAAEEDHHEIAAABAAAEBCBPPPOPHPGPEAAAEFHEHOJAIBOJKIAEIHOJMCBADBHELKIAAAEAAAAAAAAAAIAAACAAAAAFFBBDCACLLANONBOGFIAACAGHNCAFBLBHHJDBJJCMHMLGHINMMIAAAAAAAAAAAAAAAAAAADBCBPIICIJHFNJLPHFGMAADLNHBHABAECLBBJAHOBHADAFKDELKPJCJAADPPACOGAAAAAAAAAAAEAAALNPDCDIIAJJGILHAAOHCCOINACEFAAKBACMEKLLLKNKFHFCNDAAGDKCAAEPDLDLIIAAAAAAAAAAAAAAAAEAAAACAIAAMAAIAEIEIEAEINDOAAEAAKAMAIBIIEHGEOAMHMIOMFEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABCAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAABAMAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAABCAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACCAAAAAAAIAAAAAAAAAAAAAAAEAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAABEAAAAAAEAAAAABAAAAAAAAAAAAAAAAAAEAAAAAAAIAAAAAAAAAABAAAAAAAAAAAAAAAEAAAAAAAAAAAIAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAABAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAACAAAIAAAAAAAIAIAAAAAAAAAAAAAAAAAAAAAABAAAACAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAABAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAA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"
      alt="VELO - Tu viaje, sin límites"
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
      <div style={{color:"#334155",fontSize:10,letterSpacing:3,marginBottom:8}}>
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
          <button onClick={()=>saveFavs([...favs,r])} style={{background:"#e2e8f0",border:"1px solid #2563eb33",borderRadius:7,padding:"5px 10px",color:"#2563eb",fontSize:10,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
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
      <div style={{display:"flex",background:"#e2e8f0",borderRadius:12,padding:3,marginBottom:24,gap:2,width:"100%",maxWidth:340}}>
        {[{id:"login",label:t.signIn},{id:"register",label:t.createAccount}].map(m=>(
          <button key={m.id} onClick={()=>{setMode(m.id);setError("");setPin("");setPin2("");}} style={{
            flex:1,padding:"8px 0",border:"none",borderRadius:9,cursor:"pointer",
            background:mode===m.id?"linear-gradient(135deg,#2563eb,#1d4ed8)":"transparent",
            color:mode===m.id?"#fff":"#475569",fontSize:12,fontWeight:mode===m.id?600:400,transition:"all 0.2s",
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

      {/* Discount banner */}}
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
          border:"2px solid #2563eb44",borderRadius:14,
          padding:"14px 16px",marginBottom:14,
          position:"relative",overflow:"hidden",
        }}>
          {/* Subtle glow */}
          <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"#2563eb08",pointerEvents:"none"}}/>

          {/* Status row */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:driverStatus==="onroute"?"#ef4444":"#2563eb",animation:"pulse 1.5s infinite",flexShrink:0}}/>
              <span style={{color:driverStatus==="onroute"?"#ef4444":"#1d4ed8",fontSize:12,fontWeight:800,letterSpacing:0.5}}>
                {driverStatus==="onroute"?t.onRoute:t.driverAvailable}
              </span>
            </div>
            <div style={{background:"#2563eb18",border:"1px solid #2563eb33",borderRadius:20,padding:"2px 10px"}}>
              <span style={{color:"#2563eb",fontSize:9,fontWeight:700,letterSpacing:2}}>PRIVATE TRANSFERS</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{height:1,background:"linear-gradient(90deg,transparent,#2563eb33,transparent)",marginBottom:12}}/>

          {/* Vehicle info */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {/* Tesla T logo */}
            <div style={{
              width:42,height:42,borderRadius:10,
              background:"linear-gradient(135deg,#dbeafe,#bfdbfe)",
              border:"1px solid #2563eb66",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            }}>
              <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
                <path d="M50 12 C30 12 15 18 10 26 C18 24 34 22 50 22 C66 22 82 24 90 26 C85 18 70 12 50 12Z" fill="#2563eb"/>
                <path d="M10 26 C18 24 34 22 50 22 L50 88 C40 60 25 42 10 26Z" fill="#2563eb"/>
                <path d="M90 26 C82 24 66 22 50 22 L50 88 C60 60 75 42 90 26Z" fill="#2563eb"/>
              </svg>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:3}}>
                <span style={{color:"#0f172a",fontSize:16,fontFamily:"'DM Sans',sans-serif",fontWeight:800,letterSpacing:0.5}}>Tesla Model 3</span>
                
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:12,height:12,borderRadius:"50%",background:"#f1f5f9",border:"1.5px solid #444",boxShadow:"inset 0 0 4px rgba(255,255,255,0.1)"}}/>
                <span style={{color:"#334155",fontSize:11}}>{lang==="en"?"Midnight Black · Electric":"Negro Medianoche · Eléctrico"}</span>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5,flexWrap:"wrap"}}>
                  <span style={{color:"#2563eb",fontSize:12,fontWeight:700,letterSpacing:2,background:"#2563eb15",border:"1px solid #2563eb44",borderRadius:6,padding:"2px 8px"}}>🔲 5361MZC</span>
                  <span style={{color:"#334155",fontSize:11}}>· Sebastián Echevarría</span>
                </div>
              </div>
            </div>
            {/* Electric bolt */}
            <div style={{flexShrink:0}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563eb" opacity="0.7">
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
            background:isArrived?"linear-gradient(135deg,#dcfce7,#f1f5f9)":isOngoing?"linear-gradient(135deg,#dbeafe,#f1f5f9)":urgency?"linear-gradient(135deg,#fef3c7,#f1f5f9)":"linear-gradient(135deg,#e0e7ff,#f1f5f9)",
            border:`2px solid ${isArrived?"#22c55e":isOngoing?"#22c55e":urgency?"#f59e0b":"#2563eb44"}`,
            borderRadius:18,overflow:"hidden",
            boxShadow:isArrived?"0 0 24px #22c55e44":isOngoing?"0 0 20px #22c55e33":urgency?"0 0 20px #f59e0b33":"none",
          }}>
            <div style={{padding:"10px 16px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:isArrived?"#22c55e":urgency?"#f59e0b":"#2563eb",animation:"pulse 1s infinite",flexShrink:0}}/>
                <span style={{color:"#334155",fontSize:10,letterSpacing:2,fontWeight:600}}>
                  {isArrived?"🚗 CONDUCTOR LLEGÓ":"PRÓXIMO VIAJE"}
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
                <div style={{flex:1,background:isOngoing?"#22c55e12":urgency?"#f59e0b12":"#2563eb10",borderRadius:12,padding:"10px 14px"}}>
                  <div style={{color:"#334155",fontSize:9,letterSpacing:2,marginBottom:3}}>{isOngoing?(lang==="en"?"IN PROGRESS":"EN CURSO"):(lang==="en"?"TIME REMAINING":"TIEMPO RESTANTE")}</div>
                  <div style={{color:isOngoing?"#22c55e":urgency?"#f59e0b":"#f1f5f9",fontSize:26,fontFamily:"'DM Sans',sans-serif",fontWeight:700,letterSpacing:2}}>{countdownStr}</div>
                </div>
              )}
              {isArrived&&(
                <div style={{flex:1,background:"#22c55e12",borderRadius:12,padding:"10px 14px",border:"1.5px solid #22c55e44"}}>
                  <div style={{color:"#22c55e",fontSize:11,fontWeight:700,marginBottom:2}}>🚗 Conductor esperando</div>
                  <div style={{color:"#334155",fontSize:9,marginBottom:3}}>ESPERA HASTA LAS {String(new Date(waitEndMs).getHours()).padStart(2,"0")}:{String(new Date(waitEndMs).getMinutes()).padStart(2,"0")}</div>
                  <div style={{color:wSecs<120?"#ef4444":"#22c55e",fontSize:24,fontFamily:"'DM Sans',sans-serif",fontWeight:700,letterSpacing:2}}>{pad(wMins)}:{pad(wSecsR)}</div>
                  {wSecs===0&&<div style={{color:"#ef4444",fontSize:10,fontWeight:700,marginTop:4}}>⚠️ Tiempo de espera agotado</div>}
                </div>
              )}
              {basePrice>0&&(
                <div style={{background:"#2563eb10",borderRadius:12,padding:"10px 14px",textAlign:"right",flexShrink:0}}>
                  <div style={{color:"#334155",fontSize:9,marginBottom:2}}>{lang==="en"?"FARE":"TARIFA"}</div>
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
                    <button onClick={()=>{handleClientCancelTrip&&handleClientCancelTrip(upcoming.id);setCancelConfirm(null);}} style={{flex:1,background:"linear-gradient(135deg,#ef4444,#b91c1c)",border:"none",borderRadius:8,padding:"10px 0",color:"#0f172a",fontSize:12,fontWeight:700,cursor:"pointer"}}>{lang==="en"?"Yes, cancel":"Sí, cancelar"}</button>
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
          <div style={{color:"#1e3a8a",fontSize:14,fontWeight:800}}>{t.discount15}</div>
          <div style={{color:"#1e40af",fontSize:12,fontWeight:700}}>{t.autoDiscount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:"#e2e8f0",borderRadius:12,padding:3,marginBottom:18,gap:2}}>
        {[{id:"avail",label:t.tabAvail},{id:"mine",label:t.tabTrips}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"8px 4px",border:"none",borderRadius:9,cursor:"pointer",
            background:tab===t.id?"linear-gradient(135deg,#2563eb,#1d4ed8)":"transparent",
            color:tab===t.id?"#fff":"#475569",fontSize:11,fontWeight:tab===t.id?600:400,transition:"all 0.2s"}}>
            {t.label}
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

          {/* ── VIAJES FAVORITOS ── */}
          <FavRoutes
            clientId={client.id}
            myBookings={myBookings}
            lang={lang}
            t={t}
            onBook={r=>{setTab("new");setForm(fm=>({...fm,origin:r.origin,destination:r.destination}));}}
          />
                    <div style={{color:"#334155",fontSize:11,letterSpacing:3,marginBottom:12}}>{t.myTripsSection}</div>
          {myBookings.length===0&&<div style={{color:"#334155",fontSize:13,textAlign:"center",padding:"32px 0"}}>{t.noTrips}</div>}
          {(()=>{
            const active=myBookings.filter(b=>!["completed","cancelled","client_rejected","rejected"].includes(b.status)).sort((a,b)=>{const o={inprogress:0,confirmed:1,price_proposed:2,pending:3};return(o[a.status]??3)-(o[b.status]??3);});
            const hist=myBookings.filter(b=>["completed","cancelled","client_rejected","rejected"].includes(b.status)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
            return(<>
            {active.length>0&&<div style={{color:"#2563eb",fontSize:11,letterSpacing:3,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><span style={{width:6,height:6,borderRadius:"50%",background:"#2563eb",animation:"pulse 1.5s infinite",display:"inline-block"}}/>{lang==="en"?"MY BOOKINGS":"MIS RESERVAS"}</div>}
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
                <span style={{color:"#334155",fontSize:11,letterSpacing:3}}>{lang==="en"?"TRIP HISTORY":"HISTORIAL DE VIAJES"}</span>
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
            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.phone}</label>
            <input type="tel" value={form.guestPhone} placeholder={t.phonePlaceholder} onChange={e=>setForm({...form,guestPhone:e.target.value})} style={inputStyle}/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <label style={{color:"#334155",fontSize:11,letterSpacing:2}}>{t.origin}</label>
              <button onClick={()=>getLocation(addr=>setForm(f=>({...f,origin:addr})))} disabled={geoLoading} style={{
                background:"none",border:"none",cursor:geoLoading?"default":"pointer",padding:0,
                display:"flex",alignItems:"center",gap:4,
                color:geoLoading?"#475569":"#2563eb",fontSize:11,
              }}>
                <span style={{fontSize:13}}>📍</span>{geoLoading?(lang==="en"?"Getting...":"Obteniendo..."):(lang==="en"?"Use my location":"Usar mi ubicación")}
              </button>
            </div>
            {geoError==="denied"?<GeoErrorMsg onClose={()=>setGeoState({loading:false,error:null,denied:false})}/>:geoError&&<div style={{color:"#ef4444",fontSize:11,marginBottom:6}}>{geoError}</div>}
            <input value={form.origin} placeholder={t.originPlaceholder} onChange={e=>setForm({...form,origin:e.target.value})} style={inputStyle}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{color:"#334155",fontSize:11,letterSpacing:2,display:"block",marginBottom:5}}>{t.destination}</label>
            <input value={form.destination} placeholder={t.destPlaceholder} onChange={e=>setForm({...form,destination:e.target.value})} style={inputStyle}/>
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
                {lang==="en"?"Install NEXTTRIP VIP App":"Instalar App NEXTTRIP VIP"}
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
              {lang==="en"?"Install NEXTTRIP VIP App":"Instalar App NEXTTRIP VIP"}
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
            {/* Fila 1: banderas + botón salir */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <LangToggle lang={lang} setLang={setLang}/>
              <button onClick={()=>{setScreen("auth");setCurrentClient(null);}} style={{
                background:"#1e3a8a",border:"none",borderRadius:8,
                color:"#ffffff",fontSize:11,fontWeight:700,padding:"6px 12px",cursor:"pointer",whiteSpace:"nowrap",
              }}>{TRANSLATIONS[lang]?.exit||"Salir"}</button>
            </div>
            {/* Fila 2: círculo LE azul marino + nombre */}
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{
                width:26,height:26,borderRadius:"50%",
                background:"#1e3a8a",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#ffffff",fontSize:10,fontWeight:800,flexShrink:0,
              }}>{initials(currentClient?.name||"")}</div>
              <span style={{color:"#0f172a",fontSize:12,fontWeight:800,whiteSpace:"nowrap"}}>{currentClient?.name}</span>
            </div>
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
      {showInstall&&<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:9998,background:"#ffffff",border:"2px solid #1e3a8a",borderRadius:16,padding:"14px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px #00000088"}}>
        <div style={{width:44,height:44,borderRadius:10,overflow:"hidden",flexShrink:0}}>
          <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAIQAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMABAMDBAMDBAQDBAUEBAUGCgcGBgYGDQkKCAoPDRAQDw0PDhETGBQREhcSDg8VHBUXGRkbGxsQFB0fHRofGBobGv/bAEMBBAUFBgUGDAcHDBoRDxEaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGv/CABEIBOYE5gMBIgACEQEDEQH/xAAcAAEBAAIDAQEAAAAAAAAAAAAAAQIDBAcIBQb/xAAbAQEBAAIDAQAAAAAAAAAAAAAAAQIGAwQFB//aAAwDAQACEAMQAAAB79AABZYAAAAAAAAALAAAAAAAAAAAWAAAAAAACUJQAAAlFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAAAAAEBQAAAAAAAQFAAJQABYAAACwAAAAAAAAAAAAAAAAAAAAAAWAAAAAAIUAAAAAAAABKAAAAAAAAAAAAAAAAAAAAEoAAAAAAAKQAAAAAAAAAAABcSkKAAAAACUAAAAAAACCgAJQCwBCgAAAAAAAAAAAAAJQAAAAQoEoAlAAAQoAAAAALACAoAAAAAAAAAAAAAAlABCgAAAEKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlAAAAAAAAAAJQAJQAAUgBCgAqAAAAAAAAAAAAAAAAAAAAAsAAEoASgAAAAAAAAAAAAAAAAAQqUAAAAAAAAAAAAAAAAAEKAAAAAAAAAAAAAAAAACWUAAAAAAAAAAAAAAlAAAAAAQoAAAAAAAAAJQAAAAAAAEKAQoAAAAAAJQAAAAAAlAAAAQoAAAALAAEKAACUAAAAAAAAAAAAAAABCgAAAAAAAASiUAAAAAAAJQSgAAAAAAAAABKAEoAAIFlAAAAAAAAJQAAAlBKAAJQJQAQoAAAAAEoAAAAAAAAAAAEKAAAAlAAAAACUAAAAAAAAAAAAAAAAAAAEKAAAAAAAAlCUAAAlAlAAAAJQSgABKAAAAAAAAAAJQAAAAAAAJQAAABKAAAAAAAACwAAAAAAAALAAABKAAAAAAAAAAAAAAAAAAAAAAAAJQAAAAJQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUAAAAAAAAAAAAAABCgRQAQoAAAAAEoAWAAAAAlAJQAAAAEKAAAAACUAAAAAAAAEolAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQoACUlAlAJQAAAAAAAAAAAAAAAlAAAAABFAAAAABCgACAoAABYABCgAsAAlAAAAAAAAAAAAAAAAAAAAAAAAJQAAAAAlAAAAAAAICgACUAAAlAAAAAAAAAAAAAAAAAABKAAAAAAAAAAAAEoAAAAAAAAACAoAAAAAAAAAAAICgCUAAAAEKAACUAAIoAAAAAAAAAAAAAAAAAAJQABKAEolAgoAABCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQAAAAAAAAAAAAAAAAAAQVCgAAlCVCgAASgAACKAAAAAAAAABCgAAAAAAAAIKAAAAAAAAACUAAAAAAAAAJQAlAAAABKAAAAAAAAAEoAAAAAAAJQCUAAAAAJQAAAAAALAACUAAAAAAAAFgAAAASgAQoAEsKAAAAAAAAAAAAAQoAAAAAA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+VjQxwDiShBQARjiwBCASACAgAgAARBAQQQAABQCCTzgulgITCQyPn/hwAQhAzTRlkSKY5PH24I/+t1inRRgAwAAABAABDiwACBCQADxRCAAiAQCSBAihygBRwS6zsGPqSiAFz3igQgQyBFzHVHGZj7lXsoccJ6zjiwAAAgAiAAAQBgAQCAQBggAABgAACBBARAAARCSgiD7oBAGMZrJcYjBgAQx8kqAaHGUbl9ojRRyAzihghSABAgBAgSQARAAiDADQDAghCQCAgACBASCAACxyzLooxjDgcKsbfyiizjKu/I7oCq+5higDzzAAiABSQCwQTDQxARRCgABAAATAARgQQAQAQCAgARAQQQTyQrniNMETwRUhjQBzANAXONfMJIgiwABwASSAiAAzBBCixgCQAAiAAAwTwBSQAgBBABAABQggAABAiBiDBLRyzsLOd4pmxQzvlcTCAkBpKDyAAADAAwCiiAAARCAgACBAwAghBCAABhgBAQAhhAQwQQAgggSCRTRzoRSWSQ6hU2iTxFCiVMPp6lpixgBSgAACBRiSQgAwAgBCgAiRAAgRgDBwQzDyCyAAhASAgQCADAAgDyiBbm89nHF9VdDhOsAQjJcV/7QjgAAQRAxyDCCQBABQARwAABhBACAwzAAySACQCCxCgAAAABSBRAQAgxioqUAoIpdzneEiaegAz8PKBQhAABwAACSATCBjAAgACixBQAQACAgAwiBDggAghQBQQQRCABwiAAQSRSyYEt2lkF2iIcGDqIYDDqTiQDAwATRAhCQAgDBCACDCgAggBDiQRCQBgBAAixDAASgSwCggAACAgCgTgDzuIwqtEDUsapV31Q1w6zigAAATAACBAgAgwCAwQQBDBQgBAACgAgAQgBBhAAAQAABCBQBiAAQABBBySgJm/APzQDw0h76r7C8RyhBAADCiBAwAjjygQAAzCQAgARRwRACQgAAwAAiAAQCACQDAQggAAAABAADShz60vJyT1yVEEmRd8xyyBBCBAAAChSATiDAAgAACgACiRTAACAgADABABAAihARgCAACgACgigBRBhBQj7CjoVB4qJ4RysJ7zDiRQwAADACBSjAQSAQDhQRBDQRACDAACgAyAgAwACBxCAQiiAAgAgBAihSAAATxSbPLas2uMcdiSbiSgCABAAAQgAACAADgQAABBACgAgSgAAQjRgBAwgQCAACACACAASACAgAgAjQAQRyABaTEAAQVjE17JziDCCAhAABASQiQBBSAgARTyhACAAAAAQAAAAiSBQQASggjBBCgBwSgQAgAAgCDACSAIIAliBHKTf7jxwAzhAAAiAAiAwAiCBBQwgCBwDQAwhyggRCgwBCgQhQAwQAAABgAQBTwDiBCABAgSQxDrQ9flA6lZySQAQAgBACAABQCBAQxACAADggAgwAAQBASRyTAgCyChQhDwQgAAAQiAARABDggwiRQAjBDYe5K+67yBiRBCABBAwQAgBDATQgBgSAgCACACgAjQSQiAAyAAQQACAAABADAQAAQAwAgACAAABDBBjiTywwhyCRCAAiARBBCAQgjBBABASBAQQAQwAABAAghCBAAABgAAiAgACDBQwAQAACAASQwRTBAQQgxCyAxzCRxAjAQSAAAASgwwDAACBABAgDjBAACAQChgAAAhARQAABQBABBwQQAAgxAiAggzSQAABzwyyjyzwwwxwQQBBwBjBQwyBABAgAQSjyCxSTyRhyTQQBAAAAijRzAAAACwRAgjgiAyhSSgSBjyzAjjCBTCAAAACATCBBSzCghwzATgBiAwAhQAhCDDDDDDBCghhBAACCAAgAzgABzAixiAAxyQCCQShBjTRDwAQAQwwwgwwQhjCxwBhSySgBTwgAgBjATTzDzzzzzDChBDxBACBQCAAQAAiCQzyigABywgByiACBRQTCzjAAABAhiDTjwDiwARCAhgQgBgRAjCgDgjTjygBTQjiAwwgwCCAAgAAgAABBADTBgBSSABgDTxBCAxDtDjDRvPZHpHBgCjwBAgAQggARCABTyQQgBTzzzzwhTjBjigSCADSgAAiQAyTDDCSg6SzDDRRxzwgBBgI5dDM73hZj/eTyjiDCgCASQQQAAhTzgAxgBDTADyCBQjACiAiAAAAzAQACAiQhTxCZACAzCjYSygxjxa3OYB946ksgzwyiAgCAhjRSAAAABTywAyiAiAgAABCiwwjgAQyBAAARgACgwBAAiCBIDBAQjBAgAQCQhCTDzDDCQTSzQChyCiQizQwwgwSBTyCBSwhiyxSwwxRjSCgyAAQAwAQAQgAQAAgDDiCyAQzjRgRChBxxgQxDAAAQggghjyjBRCDTjDzTQgjCxwRAwwAAQAABBBRRygQQAhCgBCgDgARyiARAwggxBTQRDxABCxAAQAAQAABAAhhDDhKwCgAAAAABDyxxQwwAAAAAAAABQjDCCQQSCAgwgCCSgACCAAhCQhRQjiQBgCATwyQQziwRyxwDBQCTSwRgyzzzzhCCgQCxCizjwxxSxxwDzTDBAhCAAAAAxCARRQBhRiCyAxhihCDiQwCBjAxwwwxzzQjzAAADTRDzTTxzgATCADDizgAAACAACwTSiAQwghBAACQAAiAABgQCQjShyxAACAAAAhADzzzzzTzzzwwjAxDAhDzzzzzzjhQChiAjyzSxzzzzihQAACAAAhADACTABhQDABTAhAiQAiAgQgQCRAThiRwAQgwyCggAAwwghwzTBBiBgQxgQCyiARigACQhBBBCACQjwBQAACAgABwgCQwgxAAhDRTgjxATxwBBThTQCxxgDzigiyTwgBhyDQCDBTiwxSzCgwCAAgAAQiSAggjACABQQBAAAijSCDBBBQAgxTwyAzAxCBDTSQxQDAxiAiggQwwjRQTBxBTRSjjAyjwRgCgBCBDQAggAABxADAzgQwABBgwAQACBBAAAQBwAAAwACAhCCRjDDAADCBDCAACQBCBBACASRBBSgDADQgxQBggAATAAChCACQCBABAhTAAACAwQSABDACCABSCAQSACyxBBCCABBDSiBiSDAAADAiiAABTCCQAAgjACABCQAhQgAhAxAAAwRghgAhBhRACAQDCgACgAQACQQgRiAwAAQjCgAjABQBQAQBQSQAggARQQAjAAQQgQQBgRRgBggACwCCABQSBAgggSggQQSCAiAgASACABAgABQAACQhQBAQhADQAgAggBAAAABAhAAgABABQAABAADACQAAAABRSQAAQAgAhAAAwBCAQCgwQCBgAAxhByQDwAAiAASDAAxwAAiCBAAgAQQRhCARCRQBBAwBAiCBDDBACDQyCyAAgADAQRAAQAwwABgQSDwgTAwAiAAAAAABywyChACAAQAQQAQgBwgCSTwABAAAgBgBABBAgBggBAAQxgDDxAAiAiBxACAwADRBAQCCCCCAAAhBAgwQjABwgTQAwQCAAAhAyBBAASjxggQCAhSigAiQCACTAAygAAAQCBAAAwQBggAAiRQgQABBgihQgCwQQhgABQCBAiBAAAQgASgAgAQACAQAACAAADBABiAACyADAACBAABCCAhBDQAAhAwAAAggDCABSgABSBQggTCAASxABCAAAQAgAQyCAgADAABAjARSiRQBgTAQACSCQxAAjRSQAABwRCgBAAgQAAiAiSRBwAghTQAQgyjhBAAQCQgiCCBAAAAiQCwwxgAQAAwAACQAAAQDBATAyQgADAxSgDDQCwAAQCiBAACgiACAAAAQSgSCAAQAgAAAQAAAASQhCDDQBgCBgQDSiDCgBACQAAxBDQiCihQACRjAhCCgRABQABACQRQQAhwACQQCAAAQghAxQAAgACAACAyBSBAASgACAQxQAAQRCCDCAAiCAAAAAACiAQBBgCARgAggAABAwgAAAjQAgAiwgBCgAABAggAQiABAQDBBCABCAwBAgTAACBwBRDATAQAAABBARAAAhhgAgCiggCwAAAACAijRRyAAACShDgAAAAAhCAgAQAQAAAQQQAQCAwiAgABBgADADCAAwDiAACQgCDAgQgRRACjQRAARASACBSQAAADAAAjCACBgSABgABBAiBRggCAAAQAgAAAARACgABhAACSgARSgBQDAiCAAAgQgCBABDAgwBAhhABQgAQAhDAARgDCSADACAghAAACAAhAjBgAABgATCgACAAwBAhQAAhCzQiBSBCiAAACTACARhQAAhAARzSBgBAAhRAgCihwgBAiAhgAAABCRAAAAAACgABDTBxADAAwBwCBzzzzyACCDwABxwAABwAAADyAABwACCBzwCCBwADwDwDwADwCDzyDwCADwAAByADyAACAAByCDzz/8QALxEAAgECAggHAQEAAwEAAAAAAAERITEQQVFhcYGRwdHhIFBgobHw8TBAcICgsP/aAAgBAwEBPxD/AMlxPoIqTFrG1oqb4k/BpNsT6GY27qxK89rS6kmjx7DzoOPUXGLIhLnJpH06cKaBDToXoSvvPeAs/UZ+4z9Ri7kzuZjzAM1OI7286lK5Kahqr35LeU1S66vkvkurucfEDmXMk7slsWWGeSqVnjNLnJb/AL30MiLYm+aFb/DuyQ7yZimyFgjLKtKk/PdD890PxXQS+n6C7C6EXRdBDHS1KPIfeRIeU8TVTVzVTUxrHHCiZl/hdoa93qQ6M1Cu9r5WG23LwWKiqv2Wll7jN5v7oK4QQJEkkk4QR5HrnGx5rn4Zwn/XxwsNVy59Hq/u138lpf241yPhakQQR4Gaa93PBWLMuL6Dlhuf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" width="44" height="44" alt="VELO" style={{objectFit:"contain"}}/>
        </div>
        <div style={{flex:1}}>
          <div style={{color:"#0f172a",fontSize:13,fontWeight:800,marginBottom:2}}>Instalar VELO App</div>
          <div style={{color:"#334155",fontSize:11,fontWeight:700}}>Añadir a pantalla de inicio</div>
        </div>
        <button onClick={handleInstall} style={{background:"#1e3a8a",border:"none",borderRadius:10,color:"#ffffff",fontSize:12,fontWeight:700,padding:"8px 14px",cursor:"pointer"}}>Instalar</button>
        <button onClick={()=>setShowInstall(false)} style={{background:"none",border:"none",color:"#475569",fontSize:18,cursor:"pointer",padding:"0 4px"}}>×</button>
      </div>}
    </div>
  );
}