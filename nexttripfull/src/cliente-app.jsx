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
function RivieraLogo({ size=36 }) {
  const w = size * 3.15;
  const h = size;
  return (
    <img
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAgAAAFICAYAAADd+czRAAEAAElEQVR42uz9a4xl25YWiH1jzLle+xEROzIjz8lz696ibz0wZVyAy5RRFWWah4T4g8ASNkaWW0I27pbtbqktq2Ub2UbqP6htqW0J2bK728KysBHCYBAuWiq1wAZcUMJNoeJCVVGXqnPqnkdGZu6I2I/1mnMM/5hrrb32jh0RmSfOveece+YnZa6IHXuvvR5zzjXHN7/xDaL8DF9lEBEiInqoarwIEREREV8C8Oc8XD92/uARnzcRETG+iPPriC/g8zVegoiIiIiIiIiIiIiIiIiIiEgQRERERERERERERERERERERIIgIiIiIiIiIiIiIiIiIiIiEgQRERERERERERERERERERGIBEFERERERERERERERERERAQiQRAREREREREREREREREREYFIEERERERERERERERERERERACw8RJEfJUxrlOrqiCiWKs1IiIiIiIiIiIi4lMizqW/3IgKgoiIiIiIiIiIiIiIiIiIiEgQRERERERERERERERERERERIIgIiIiIiIiIiIiIiIiIiICkSCIiIiIiIiIiIiIiIiIiIhAJAgiIiIiIiIiIiIiIiIiIiIQCYKIiIiIiIiIiIiIiIiIiAhEgiAiIiIiIiIiIiIiIiIiIgKAfdsPjOvGfxaIdTIjPk8ca3+fdRv/ImN8rv21iH3yi3l/4vgaEfHFf368XQeP1zCO198/4/Xbnv93e/7xVZrLfRHbk6qCiIZ/cV7y5WoPUUEQERERERERERERERERERERCYKIiIiIiIiIiIiIiIiIiIhIEERERERERERERERERERERCASBBEREREREREREREREREREYgEQUREREREREREREREREREBCJBEBERERERERERERERERERgUgQREREREREREREREREREREALDxEkREREREREREREREfK9wWJf9beu0R3yxQUS37isRHX094ouHqCCIiIiIiIiIiIiIiIiIiIiIBEFEREREREREREREREREREQkCCIiIiIiIiIiIiIiIiIiIhAJgoiIiIiIiIiIiIiIiIiICESCICIiIiIiIiIiIiIiIiIiApEgiIiIiIiIiIiIiIiIiIiIQCQIIiIiIiIivrcP3ljdKSIiIiIiIuILCtvXo/y88Hl/f0TEVxnH6tDGPnn/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"
      alt="NextTrip Private Transfers"
      style={{ width:w, height:h, objectFit:"contain", display:"block" }}
    />
  );
}

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

function DistancePriceCalcClient({ origin, destination, onPriceCalculated }) {
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
        const basePrice = Math.max(30, Math.round(data.km * 3.15 * 100) / 100);
        const discounted = Math.round(basePrice * 0.85 * 100) / 100;
        setState({ status:"ok", km:data.km, duration:data.duration, price:basePrice, discounted });
        onPriceCalculated && onPriceCalculated(basePrice);
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

function ChatModal({ booking, messages, onSend, currentUser, isDriver, onClose, onMarkRead }) {
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
              Volver
            </button>
            <button onClick={handleClose} style={{
              background:"#1e293b",border:"1px solid #2a3a4a",borderRadius:"50%",
              width:30,height:30,cursor:"pointer",color:"#a8b8cc",fontSize:16,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>×</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              <div style={{color:"#a8b8cc",fontSize:9,letterSpacing:2,marginBottom:3}}>CHAT DE RESERVA</div>
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
                  <div style={{color:mine?"#0a0a0a":"#f8fafc",fontSize:13,lineHeight:1.4}}>{msg.text}</div>
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
            placeholder="Escribe un mensaje..."
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
      justifyContent:"center",padding:"24px 20px",background:"#000"}}>
      <RivieraLogo size={130}/>
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
            ← Volver
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
              Volver
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
          .filter(b=>["confirmed","pending","inprogress"].includes(b.status))
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
              const km3 = Math.round(fare3/3.15*10)/10;
              const dur3 = Math.round(km3*2);
              const [h3,m3]=upcoming.time.split(":").map(Number);
              const arr3=new Date(0,0,0,h3,m3+dur3);
              const arrStr3=`${String(arr3.getHours()).padStart(2,"0")}:${String(arr3.getMinutes()).padStart(2,"0")}`;
              return(
                <div style={{display:"flex",justifyContent:"space-between",background:"#0f172a",border:"1px solid #1e3a5f",borderRadius:10,padding:"7px 12px",margin:"0 12px 8px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>🗺️</span><span style={{color:"#a8b8cc",fontSize:11}}>{km3} km</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>⏱️</span><span style={{color:"#a8b8cc",fontSize:11}}>~{dur3} min</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>🏁</span><span style={{color:"#c9a96e",fontSize:11,fontWeight:700}}>{lang==="en"?"Arrival":"Llegada"} ~{arrStr3}</span></div>
                </div>
              );
            })()}
            <div style={{margin:"0 12px 12px",display:"flex",gap:8}}>
              {!isArrived&&(
                <div style={{flex:1,background:isOngoing?"#22c55e12":urgency?"#f59e0b12":"#c9a96e10",borderRadius:12,padding:"10px 14px"}}>
                  <div style={{color:"#a8b8cc",fontSize:9,letterSpacing:2,marginBottom:3}}>{isOngoing?"EN CURSO":"TIEMPO RESTANTE"}</div>
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
                  <div style={{color:"#a8b8cc",fontSize:9,marginBottom:2}}>TARIFA</div>
                  <div style={{color:"#a8b8cc",fontSize:11,textDecoration:"line-through"}}>{basePrice} €</div>
                  <div style={{color:"#c9a96e",fontSize:20,fontFamily:"'Cormorant Garamond',serif",fontWeight:700}}>{discountedPrice} €</div>
                  <div style={{color:"#22c55e",fontSize:9,fontWeight:700}}>-{Math.round(DISCOUNT_RATE*100)}% VIP</div>
                </div>
              )}
            </div>
            <div style={{margin:"0 12px 12px"}}>
              <button onClick={()=>setChatBooking(upcoming)} style={{
                width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                background:"linear-gradient(135deg,#1e0a3e,#1e293b)",border:"1px solid #a78bfa55",
                borderRadius:10,padding:"10px 0",color:"#a78bfa",fontSize:12,fontWeight:700,cursor:"pointer",
              }}>💬 {lang==="en"?"Chat with driver":"Chat con el conductor"}</button>
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
                  background:occupied?"linear-gradient(90deg,#1a0a00,#111)":isDriverBlocked?"linear-gradient(90deg,#2a0505,#111)":"transparent",
                }}>
                  <div style={{width:52,flexShrink:0,padding:"0 10px",borderRight:`1px solid ${isHour?"#222":"#181818"}`,display:"flex",alignItems:"center"}}>
                    <span style={{color:isHour?"#ffffff":isHalfHour?"#e2e8f0":"#cbd5e1",fontSize:isHour?12:10,fontWeight:isHour?700:400}}>{slotTime}</span>
                  </div>
                  <div style={{flex:1,padding:"0 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    {occupied&&<span style={{color:"#c9a96e",fontSize:10}}>{t.occupied}</span>}
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
                const km = Math.round(b.fare/3.15*10)/10;
                const durationMin = Math.round(km*2);
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
          <DistancePriceCalcClient origin={form.origin} destination={form.destination} onPriceCalculated={price=>setForm(f=>({...f,fare:price}))}/>
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
    <div style={{background:"#000",minHeight:"100vh",width:"100%",fontFamily:"'DM Sans',sans-serif",color:"#f8fafc"}}>
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
      {chatNotifOpen&&<ChatModal booking={chatNotifOpen} messages={messages} onSend={handleSendMessage} currentUser={currentClient} isDriver={false} onClose={()=>setChatNotifOpen(null)} onMarkRead={handleMarkRead}/>}

      <div style={{padding:"10px 16px 8px",borderBottom:"1px solid #1e293b",background:"rgba(10,15,30,0.97)",backdropFilter:"blur(10px)",position:"sticky",top:0,zIndex:50}}>
        {/* Row 1: Logo + Lang + Exit */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <RivieraLogo size={36}/>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <LangToggle lang={lang} setLang={setLang}/>
            <button onClick={()=>{setScreen("auth");setCurrentClient(null);}} style={{
              background:"#1e293b",border:"1px solid #2a3a4a",borderRadius:8,
              color:"#a8b8cc",fontSize:10,padding:"5px 9px",cursor:"pointer",whiteSpace:"nowrap",
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