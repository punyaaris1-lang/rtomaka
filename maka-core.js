/* ===========================
   MAKA CORE LOGIC (SINGLE SOURCE)
=========================== */

const MAKA = {};

/* ====== CONFIG USER ====== */
MAKA.user = JSON.parse(localStorage.getItem('maka_user_data')) || {
  name: 'User',
  plate: '-',
  pickup_date: '2025-09-20',
  dp_option: '355' // '355' | '755'
};

/* ====== ADMIN ====== */
MAKA.admin = JSON.parse(localStorage.getItem('maka_finance_settings')) || {
  hwb_rate: 80000,
  cdp_rate: 70000,
  maka_plus_rate: 10000
};

/* ====== STORAGE ====== */
MAKA.payments = JSON.parse(localStorage.getItem('maka_payments')) || {};
MAKA.dpPaid = Number(localStorage.getItem('maka_dp_paid') || 0);
MAKA.makaPlus = JSON.parse(localStorage.getItem('maka_plus_status')) || { active:false };

/* ====== DATE UTILS ====== */
MAKA.startPayDate = () => {
  const d = new Date(MAKA.user.pickup_date);
  d.setDate(d.getDate() + 1); // H+1
  return d;
};

MAKA.dpWindow = () => {
  const pick = new Date(MAKA.user.pickup_date);
  const start = new Date(pick.getFullYear(), pick.getMonth() + 1, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 3, 1);
  return { start, end };
};

/* ====== STATUS DAY ====== */
MAKA.getDayStatus = (date) => {
  const d = date.getDate();

  if (d === 31) return 'HLB';

  if (MAKA.user.dp_option === '755') {
    if (d === 14 || d === 28) return 'HLB';
    return 'HWB';
  }

  const { start, end } = MAKA.dpWindow();

  if (d === 14 || d === 28) {
    if (MAKA.dpPaid < 6) return 'CDP';
    return 'HLB';
  }

  return 'HWB';
};

/* ====== TUNGGAKAN ====== */
MAKA.calculateOutstanding = () => {
  let total = 0, days = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  const start = MAKA.startPayDate();

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0,10);
    if (MAKA.payments[key]) continue;

    const status = MAKA.getDayStatus(d);
    if (status === 'HWB') { total += MAKA.admin.hwb_rate; days++; }
    if (status === 'CDP') { total += MAKA.admin.cdp_rate; days++; }
  }

  if (MAKA.makaPlus.active) {
    total += days * MAKA.admin.maka_plus_rate;
  }

  return { total, days };
};

/* ====== SAVE HELPERS ====== */
MAKA.save = () => {
  localStorage.setItem('maka_user_data', JSON.stringify(MAKA.user));
  localStorage.setItem('maka_payments', JSON.stringify(MAKA.payments));
  localStorage.setItem('maka_dp_paid', MAKA.dpPaid);
};
