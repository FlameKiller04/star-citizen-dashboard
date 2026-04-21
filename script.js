import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  deleteDoc, doc, updateDoc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔑 PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let squadId = null;

let contractsRef, inventoryRef, cargoRef;

// AUTH
onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) initApp();
});

window.signup = () =>
  createUserWithEmailAndPassword(auth, email.value, password.value);

window.login = () =>
  signInWithEmailAndPassword(auth, email.value, password.value);

window.logout = () => signOut(auth);

// SQUADS
window.createSquad = async () => {
  const ref = doc(collection(db, "squads"));
  squadId = ref.id;

  await setDoc(ref, {
    name: squadName.value,
    members: [currentUser.uid]
  });

  localStorage.setItem("squadId", squadId);
  initApp();
};

window.joinSquad = async () => {
  squadId = joinId.value;

  const ref = doc(db, "squads", squadId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, {
      members: [...snap.data().members, currentUser.uid]
    });

    localStorage.setItem("squadId", squadId);
    initApp();
  }
};

// INIT
function initApp() {
  squadId = localStorage.getItem("squadId");
  if (!squadId) return;

  currentSquad.innerText = "Squad: " + squadId;

  contractsRef = collection(db, "squads", squadId, "contracts");
  inventoryRef = collection(db, "squads", squadId, "inventory");
  cargoRef = collection(db, "squads", squadId, "cargo");

  setupListeners();
  initMap();
}

// REALTIME
function setupListeners() {

  onSnapshot(contractsRef, snap => {
    contractList.innerHTML = "";
    snap.forEach(d => {
      let li = document.createElement("li");
      li.textContent = d.data().text;
      contractList.appendChild(li);
    });
  });

  onSnapshot(inventoryRef, snap => {
    inventoryList.innerHTML = "";
    snap.forEach(d => {
      let li = document.createElement("li");
      li.textContent = `${d.data().name} x${d.data().qty}`;
      inventoryList.appendChild(li);
    });
  });

  onSnapshot(cargoRef, snap => {
    cargoList.innerHTML = "";
    snap.forEach(d => {
      const c = d.data();
      const profit = (c.sell - c.buy) * c.qty;

      let li = document.createElement("li");
      li.textContent = `${c.name} profit: ${profit}`;
      cargoList.appendChild(li);
    });
  });
}

// ADD
window.addContract = async () =>
  addDoc(contractsRef, { text: contractInput.value });

window.addItem = async () =>
  addDoc(inventoryRef, {
    name: itemName.value,
    qty: parseInt(itemQty.value)
  });

window.addCargo = async () =>
  addDoc(cargoRef, {
    name: cargoName.value,
    qty: parseInt(cargoQty.value),
    buy: parseFloat(cargoBuy.value),
    sell: parseFloat(cargoSell.value)
  });

// PROFIT
window.calcProfit = () => {
  let p = (sellPrice.value - buyPrice.value) * amount.value;
  profitResult.innerText = "Profit: " + p;
};

// LIVE DATA
window.loadTradeData = async () => {
  const res = await fetch("https://api.uexcorp.space/2.0/commodities");
  const data = await res.json();

  tradeList.innerHTML = "";
  data.data.slice(0,10).forEach(c => {
    let li = document.createElement("li");
    li.textContent = `${c.name} ${c.price_buy_avg}`;
    tradeList.appendChild(li);
  });
};

// MAP
function initMap() {
  const map = L.map('map', { crs: L.CRS.Simple, minZoom: -2 });

  const bounds = [[0,0],[1000,1000]];
  L.imageOverlay("https://i.imgur.com/your-map.jpg", bounds).addTo(map);
  map.fitBounds(bounds);

  const locations = [
    {name:"Hurston",x:400,y:600},
    {name:"MicroTech",x:800,y:200}
  ];

  locations.forEach(l => {
    L.marker([l.y,l.x]).addTo(map)
      .bindPopup(l.name);
  });
}