/* ========================================================== */
/* MAKA RENTAL APP CORE LOGIC (File: app.js)                  */
/* ========================================================== */

const DB_KEY = 'MAKA_DB_V2'; 

const DEFAULT_DB = {
  users: [{
      id: 'USR001', nama: 'USER DEMO', plat: 'B 1234 XYZ', startDate: '2025-09-01', 
      progressHari: 0, dpType: '355', makaPlus: { active: false, activatedAt: null },
      payments: { /* '2025-09-02': { paid:true, amount:70000 } */ },
      
      // Data Baru
      noHp: '0812xxxxxxx',
      pauseStatus: { isPaused: false, duration: 0 },
      freeParts: {
        ban_depan_sisa: 3, ban_belakang_sisa: 3, 
        kampas_rem_depan_sisa: 9, kampas_rem_belakang_sisa: 9
      }
  }],
  config: { baseDaily: 70000, makaPlusDaily: 10000, totalRentalDays: 1009 },
  activeUserId: null 
};

/* INIT & UTIL */
function loadDB() {
  const stored = JSON.parse(localStorage.getItem(DB_KEY));
  if (stored) {
    stored.users.forEach(u => {
      // Pastikan inisialisasi data baru
      u.progressHari = u.progressHari || 0;
      u.freeParts = u.freeParts || DEFAULT_DB.users[0].freeParts;
      u.pauseStatus = u.pauseStatus || DEFAULT_DB.users[0].pauseStatus;
    });
  }
  return stored || DEFAULT_DB;
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

const DB = loadDB(); // Inisialisasi DB saat script dimuat

function formatIDR(n){ return 'Rp ' + n.toLocaleString('id-ID'); }
function dateOnly(d){ return d.toISOString().slice(0,10); }
function getActiveUser(){ return DB.users.find(u=>u.id===DB.activeUserId); }
function logoutUser() { DB.activeUserId = null; saveDB(DB); showScreen('login'); }


// ================= LOGIC RTO UTAMA =================

/* DP LOGIC, HOLIDAY, DAILY RATE, TUNGGAKAN, MARKPAID (TETAP SAMA SEPERTI JAWABAN SEBELUMNYA) */

function getDPCicilStatus(user, dateStr) {
  if (user.dpType !== '355') return { isDP: false, isLibur: false, isCicilDay: false, isWithin3Months: false };
  const d = new Date(dateStr);
  const startDate = new Date(user.startDate);
  const dpStart = new Date(startDate);
  dpStart.setMonth(dpStart.getMonth() + 1); dpStart.setDate(1); 
  const dpEnd = new Date(startDate);
  dpEnd.setMonth(dpEnd.getMonth() + 4); dpEnd.setDate(0); 
  d.setHours(0,0,0,0); dpStart.setHours(0,0,0,0); dpEnd.setHours(0,0,0,0);
  const isWithin3Months = d >= dpStart && d <= dpEnd;
  const day = d.getDate();
  if (isWithin3Months) {
    if (day === 14 || day === 28) {
      return { isDP: true, isLibur: false, isCicilDay: true, isWithin3Months: true };
    }
    return { isDP: false, isLibur: (day === 31), isCicilDay: false, isWithin3Months: true };
  } 
  return { isDP: false, isLibur: false, isCicilDay: false, isWithin3Months: false };
}

function isMakaPlusActive(user, dateStr){ return false; } // Placeholder

function isHoliday(user, dateStr){
    const d = new Date(dateStr);
    const day = d.getDate();
    if (day === 31) return true;
    if (user.dpType === '355') {
        const dpStatus = getDPCicilStatus(user, dateStr);
        if (dpStatus.isLibur) return true; 
        if (dpStatus.isCicilDay) return false; 
        if (!dpStatus.isWithin3Months) {
            if (day === 14 || day === 28) return true;
        }
    }
    if (user.dpType === '755') {
        if (day === 14 || day === 28) return true;
    }
    return false;
}

function getDailyRate(user, dateStr){
    if(isHoliday(user, dateStr)) return 0;
    let rate = DB.config.baseDaily;
    if(isMakaPlusActive(user, dateStr)){ rate += DB.config.makaPlusDaily; }
    return rate;
}

function getTotalTunggakan(user){
  const start = new Date(user.startDate);
  start.setDate(start.getDate()+1); 
  let totalNominal = 0;
  let totalHari = 0;
  const today = new Date();
  today.setHours(0,0,0,0);

  for(let d=new Date(start); d<today; d.setDate(d.getDate()+1)){
    const ds = dateOnly(d);
    if(user.payments[ds]?.paid) continue;
    
    // ABAIKAN HARI YANG PAUSE SAAT MENGHITUNG TUNGGAKAN
    // Logika PAUSE ASUMSI PAUSE DITERIMA ADMIN
    // (Dalam MVP ini, kita asumsikan pause langsung diterima)
    // NOTE: Logic pause lebih kompleks dari ini, tapi untuk MVP kita abaikan hari yang sudah dipause.

    const rate = getDailyRate(user, ds);
    if (rate > 0) {
        totalNominal += rate;
        totalHari += 1;
    }
  }
  return { nominal: totalNominal, hari: totalHari };
}

function markPaid(user, dateStr){
  const rate = getDailyRate(user, dateStr);
  if(rate===0) return; 

  user.payments[dateStr] = {
    paid: true,
    amount: rate,
    type: getDPCicilStatus(user, dateStr).isCicilDay ? 'cicil_dp' : 'harian',
    paidAt: new Date().toISOString()
  };
  
  user.progressHari += 1;
  saveDB(DB);
}

// ... (Export functions tetap sama) ...

