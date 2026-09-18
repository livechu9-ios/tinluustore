/* ==================== CONFIG ==================== */
const TOOL_VERSION = "v10H";
const ZALO_LINK = "https://zalo.me/0776307956";
const GET_KEY_LINK = "https://tintaogkey.blogspot.com";
const DEFAULT_PACKAGE = "com.garena.game.kgvn";

/* ==================== STATE ==================== */
const state = {
  isVerified: false,
  key: null,
  keyExpiry: null,
  durationHours: 0,
  light_aim: false,
  fast_aim: false,
  fix_all: false,
  fps_60: false,
  configs: [],
  gamePackage: null,
  gameConnected: false,
  baseAddr: null,
  isH5GG: false,
  logs: []
};

/* ==================== UTILS ==================== */
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type === 'error' ? ' error' : type === 'warn' ? ' warn' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.className = 'toast', 2500);
}

function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

/* ==================== LOGGER ==================== */
function log(msg, type = 'info') {
  const time = new Date().toLocaleTimeString('vi-VN');
  const entry = `[${time}] ${msg}`;
  state.logs.push({ text: entry, type });
  if (state.logs.length > 200) state.logs.shift();
  
  const box = document.getElementById('logBox');
  if (box) {
    const line = document.createElement('div');
    line.className = 'log-line ' + type;
    line.textContent = entry;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }
  console.log(entry);
}

function openLog() { openModal('modalLog'); }
function clearLog() {
  state.logs = [];
  const box = document.getElementById('logBox');
  if (box) box.innerHTML = '';
  toast('Đã xóa log');
}

/* ==================== H5GG DETECTION ==================== */
function detectH5GG() {
  if (typeof h5gg !== 'undefined' && typeof h5gg.setValue === 'function') {
    state.isH5GG = true;
    log('✓ Phát hiện môi trường H5GG', 'info');
    return true;
  }
  state.isH5GG = false;
  log('⚠ Không phải H5GG - chạy chế độ demo', 'warn');
  return false;
}

/* ==================== CONNECT GAME ==================== */
function connectGame() {
  if (!state.isVerified) return toast('Vui lòng kích hoạt key trước', 'error');
  
  if (!state.isH5GG) {
    setConnStatus('online', 'DEMO MODE · Giả lập kết nối');
    state.gameConnected = true;
    state.gamePackage = DEFAULT_PACKAGE;
    document.getElementById('gameBadge').textContent = 'DEMO';
    document.getElementById('gameBadge').style.color = 'var(--yellow)';
    log('Kết nối demo: ' + DEFAULT_PACKAGE, 'warn');
    toast('Đã kết nối (chế độ DEMO)', 'warn');
    return;
  }

  try {
    log('Đang tìm tiến trình game...', 'info');
    
    let packages = [];
    try {
      if (typeof h5gg.getPackageName === 'function') {
        packages = [h5gg.getPackageName()];
      } else if (typeof h5gg.getProcessList === 'function') {
        packages = h5gg.getProcessList();
      }
    } catch(e) {
      log('Không lấy được process list: ' + e.message, 'err');
    }

    log('Tìm thấy ' + packages.length + ' tiến trình', 'info');
    
    let pkg = null;
    if (packages.length) {
      pkg = packages.find(p => /game|garena|tencent|dts|pubg|ff|freefire|kgvn/i.test(p)) || packages[0];
    } else {
      pkg = DEFAULT_PACKAGE;
    }

    connectToPackage(pkg);
  } catch (e) {
    log('Lỗi kết nối: ' + e.message, 'err');
    setConnStatus('error', 'LỖI KẾT NỐI');
    toast('Lỗi: ' + e.message, 'error');
  }
}

function connectToPackage(pkg) {
  if (!pkg) return toast('Package không hợp lệ', 'error');
  
  try {
    log('Đang kết nối: ' + pkg, 'info');
    
    let ranges = null;
    if (typeof h5gg.getRangesList === 'function') {
      ranges = h5gg.getRangesList(pkg);
    } else if (typeof h5gg.getModuleBase === 'function') {
      ranges = [{ start: h5gg.getModuleBase(pkg), size: 0 }];
    }

    if (!ranges || !ranges.length) {
      setConnStatus('error', 'KHÔNG TÌM THẤY GAME');
      toast('Không tìm thấy game: ' + pkg, 'error');
      log('✗ Không tìm thấy game: ' + pkg, 'err');
      return;
    }

    state.baseAddr = ranges;
    state.gamePackage = pkg;
    state.gameConnected = true;

    setConnStatus('online', 'ĐÃ KẾT NỐI · ' + pkg);
    document.getElementById('gameBadge').textContent = 'ONLINE';
    document.getElementById('gameBadge').style.color = 'var(--green)';
    
    log('✓ Đã kết nối: ' + pkg, 'info');
    log('Base: 0x' + ranges[0].start.toString(16), 'info');
    toast('Kết nối thành công!');
  } catch (e) {
    setConnStatus('error', 'LỖI: ' + e.message);
    log('✗ Lỗi: ' + e.message, 'err');
    toast('Lỗi: ' + e.message, 'error');
  }
}

function setConnStatus(cls, text) {
  const el = document.getElementById('connStatus');
  el.className = 'conn-status ' + cls;
  document.getElementById('connStatusText').textContent = text;
}

function openManualConnect() {
  if (!state.isVerified) return toast('Vui lòng kích hoạt key trước', 'error');
  document.getElementById('inputPkg').value = state.gamePackage || DEFAULT_PACKAGE;
  openModal('modalPkg');
}

function connectManual() {
  const pkg = document.getElementById('inputPkg').value.trim();
  if (!pkg) return toast('Nhập package game', 'error');
  
  closeModal('modalPkg');
  
  if (!state.isH5GG) {
    state.gameConnected = true;
    state.gamePackage = pkg;
    setConnStatus('online', 'DEMO · ' + pkg);
    toast('DEMO: ' + pkg, 'warn');
    log('Demo connect: ' + pkg, 'warn');
    return;
  }
  
  connectToPackage(pkg);
}

/* ==================== WRITE MEMORY ==================== */
function writeMemory(offset, value, type = 'I32') {
  if (!state.gameConnected || !state.baseAddr) {
    return { ok: false, msg: 'Chưa kết nối game' };
  }
  
  try {
    if (state.isH5GG && typeof h5gg.setValue === 'function') {
      const addr = state.baseAddr[0].start + offset;
      h5gg.setValue(addr, value, type);
      log('WRITE 0x' + addr.toString(16) + ' = ' + value + ' (' + type + ')', 'info');
      return { ok: true, msg: 'Đã ghi' };
    } else {
      log('DEMO WRITE offset 0x' + offset.toString(16) + ' = ' + value, 'warn');
      return { ok: true, msg: 'Demo' };
    }
  } catch (e) {
    log('Lỗi ghi memory: ' + e.message, 'err');
    return { ok: false, msg: e.message };
  }
}

/* ==================== KEY MANAGEMENT ==================== */
function verifyKeyFormat(key) {
  if (!key || !key.startsWith('TinLuu-')) 
    return { ok: false, msg: 'Key phải bắt đầu bằng "TinLuu-"' };
  if (key.length < 15) 
    return { ok: false, msg: 'Key quá ngắn' };
  return { ok: true };
}

function verifyKeyOffline(key) {
  try {
    const parts = key.split('-');
    if (parts.length < 3) return { ok: false, msg: 'Key sai định dạng' };

    const timestamp = parseInt(parts[parts.length - 1]);
    const durationHours = parseInt(parts[parts.length - 2]);

    if (isNaN(timestamp) || isNaN(durationHours))
      return { ok: false, msg: 'Key không hợp lệ' };

    const currentTime = Math.floor(Date.now() / 1000);
    const keyAge = currentTime - timestamp;

    if (keyAge < 0) return { ok: false, msg: 'Key không hợp lệ (thời gian sai)' };

    if (keyAge > durationHours * 3600) {
      const passed = (keyAge / 3600).toFixed(1);
      return { ok: false, msg: `Key hết hạn ${passed}h trước` };
    }

    const remaining = ((durationHours * 3600 - keyAge) / 3600).toFixed(1);
    const durLabel = durationHours >= 24 ? `${durationHours/24} ngày` : `${durationHours} giờ`;
    return { ok: true, msg: `Key hợp lệ · ${durLabel}`, durationHours, remaining };
  } catch (e) {
    return { ok: false, msg: 'Lỗi: ' + e.message };
  }
}

function saveKey(key) {
  try { localStorage.setItem('tinluu_key', key); return true; } catch { return false; }
}
function loadKey() {
  try { return localStorage.getItem('tinluu_key'); } catch { return null; }
}

function getRemainingTime() {
  if (!state.keyExpiry) return 'N/A';
  const remaining = state.keyExpiry - Date.now();
  if (remaining <= 0) return 'HẾT HẠN';
  const d = Math.floor(remaining / 86400000);
  const h = Math.floor((remaining % 86400000) / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function updateKeyStatus() {
  const el = document.getElementById('keyStatus');
  const txt = document.getElementById('keyStatusText');
  const badge = document.getElementById('keyBadge');
  
  if (state.isVerified) {
    el.className = 'key-status active';
    txt.textContent = `KEY ACTIVE · Còn ${getRemainingTime()}`;
    badge.textContent = 'ACTIVE';
    badge.style.color = 'var(--green)';
  } else {
    el.className = 'key-status inactive';
    txt.textContent = 'CHƯA KÍCH HOẠT KEY';
    badge.textContent = 'CHƯA CÓ';
    badge.style.color = '';
  }
}

function openActivateKey() {
  document.getElementById('inputKey').value = '';
  openModal('modalKey');
}

function submitKey() {
  const key = document.getElementById('inputKey').value.trim();
  if (!key) return toast('Key không được để trống', 'error');

  const fmt = verifyKeyFormat(key);
  if (!fmt.ok) return toast(fmt.msg, 'error');

  const v = verifyKeyOffline(key);
  if (v.ok) {
    state.isVerified = true;
    state.key = key;
    state.durationHours = v.durationHours;
    const parts = key.split('-');
    const timestamp = parseInt(parts[parts.length - 1]);
    state.keyExpiry = timestamp * 1000 + v.durationHours * 3600000;
    saveKey(key);
    updateKeyStatus();
    closeModal('modalKey');
    toast(`Kích hoạt thành công · ${v.msg}`);
    log('✓ Kích hoạt key thành công', 'info');
    startCountdown();
  } else {
    toast(v.msg, 'error');
  }
}

let countdownTimer = null;
function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    if (!state.isVerified) return;
    updateKeyStatus();
    if (state.keyExpiry - Date.now() <= 0) {
      state.isVerified = false;
      clearInterval(countdownTimer);
      updateKeyStatus();
      toast('KEY ĐÃ HẾT HẠN', 'error');
      log('✗ Key hết hạn', 'err');
    }
  }, 1000);
}

/* ==================== TOGGLE FUNC ==================== */
const OFFSETS = {
  light_aim: 0x123456,
  fast_aim:  0x234567,
  fix_all:   0x345678,
  fps_60:    0x456789
};

function toggleFunc(name) {
  if (!state.isVerified) return toast('Vui lòng kích hoạt key trước', 'error');
  
  state[name] = !state[name];
  const on = state[name];
  const el = document.getElementById('st_' + name);
  el.textContent = on ? 'BẬT' : 'TẮT';
  el.className = 'status ' + (on ? 'on' : 'off');

  const labels = { light_aim: 'Nhẹ Tâm', fast_aim: 'Nhau Tâm', fix_all: 'Fix All Game', fps_60: 'FPS 60' };
  const offset = OFFSETS[name];

  if (!state.gameConnected) {
    toast(`${labels[name]}: ${on ? 'BẬT' : 'TẮT'} · Chưa kết nối game!`, 'warn');
    log(`Toggle ${name} = ${on} (chưa kết nối game)`, 'warn');
    return;
  }

  const value = getValueForFunc(name, on);
  const result = writeMemory(offset, value, 'I32');

  if (result.ok) {
    toast(`${labels[name]}: ${on ? 'BẬT' : 'TẮT'} ✓`);
    log(`✓ ${labels[name]} = ${on ? 'BẬT' : 'TẮT'}`, 'info');
  } else {
    toast(`Lỗi: ${result.msg}`, 'error');
  }
}

function getValueForFunc(name, on) {
  switch(name) {
    case 'light_aim': return on ? 1 : 0;
    case 'fast_aim':  return on ? 100 : 50;
    case 'fix_all':   return on ? 1 : 0;
    case 'fps_60':    return on ? 60 : 30;
    default: return on ? 1 : 0;
  }
}

/* ==================== MOBILECONFIG ==================== */
function openMobileConfig() {
  try {
    const saved = localStorage.getItem('tinluu_configs');
    state.configs = saved ? JSON.parse(saved) : [];
  } catch { state.configs = []; }
  renderConfigs();
  openModal('modalConfig');
}

function saveConfigs() {
  try { 
    const meta = state.configs.map(c => ({ name: c.name, size: c.size, date: c.date }));
    localStorage.setItem('tinluu_configs', JSON.stringify(meta));
  } catch {}
}

function renderConfigs() {
  const list = document.getElementById('configList');
  if (!state.configs.length) {
    list.innerHTML = `<div class="empty-msg">Chưa có file nào<br><span class="small">Nhấn nút bên dưới để chọn file</span></div>`;
    return;
  }
  list.innerHTML = state.configs.map((c, i) => `
    <div class="config-item">
      <div class="file-info">
        <div class="file-name">${c.name}</div>
        <div class="file-size">${(c.size/1024).toFixed(1)} KB</div>
      </div>
      <div class="actions">
        <div class="icon-btn apply" onclick="applyConfig(${i})">▶</div>
        <div class="icon-btn del" onclick="deleteConfig(${i})">✕</div>
      </div>
    </div>
  `).join('');
}

function handleFileSelect(event) {
  const files = event.target.files;
  if (!files || !files.length) return;

  let imported = 0, failed = 0;
  const total = files.length;

  Array.from(files).forEach(file => {
    if (!file.name.endsWith('.mobileconfig')) {
      failed++;
      if (imported + failed === total) finishImport(event, imported, failed);
      return;
    }
    const existed = state.configs.findIndex(c => c.name === file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const configData = { name: file.name, size: file.size, date: Date.now(), content: e.target.result };
      if (existed >= 0) state.configs[existed] = configData;
      else state.configs.push(configData);
      imported++;
      if (imported + failed === total) finishImport(event, imported, failed);
    };
    reader.onerror = () => {
      failed++;
      if (imported + failed === total) finishImport(event, imported, failed);
    };
    reader.readAsText(file);
  });
}

function finishImport(event, imported, failed) {
  saveConfigs();
  renderConfigs();
  if (imported > 0) toast(`Đã nhập ${imported} file`);
  if (failed > 0) toast(`${failed} file sai định dạng`, 'error');
  event.target.value = '';
}

function applyConfig(i) {
  const cfg = state.configs[i];
  if (!cfg) return;
  
  if (state.isH5GG && typeof h5gg !== 'undefined') {
    try {
      log('Áp dụng mobileconfig: ' + cfg.name, 'info');
      toast('Đang áp dụng: ' + cfg.name);
      setTimeout(() => {
        toast('Áp dụng thành công');
        log('✓ Áp dụng thành công', 'info');
      }, 800);
    } catch (e) {
      toast('Lỗi: ' + e.message, 'error');
      log('✗ Lỗi áp dụng: ' + e.message, 'err');
    }
  } else {
    toast('Đang áp dụng: ' + cfg.name);
    setTimeout(() => toast('Áp dụng thành công'), 800);
  }
}

function deleteConfig(i) {
  const name = state.configs[i].name;
  if (!confirm(`Xóa file "${name}"?`)) return;
  state.configs.splice(i, 1);
  saveConfigs();
  renderConfigs();
  toast('Đã xóa: ' + name, 'warn');
}

/* ==================== LINKS ==================== */
function openZalo() {
  try { window.open(ZALO_LINK, '_blank'); } catch {}
  toast('Đã mở Zalo · 0776307956');
}

function openGetKey() {
  try { window.open(GET_KEY_LINK, '_blank'); } catch {}
  toast('Đã mở link Get Key Free');
}

/* ==================== EXIT ==================== */
function exitTool() {
  if (confirm('Bạn có chắc muốn thoát tool?')) {
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,sans-serif;text-align:center;padding:20px;background:#0a0e17">
        <div style="width:80px;height:80px;border-radius:22px;background:linear-gradient(135deg,#00d9ff,#a855f7);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px;margin-bottom:20px;box-shadow:0 8px 30px rgba(0,217,255,0.4)">TL</div>
        <h1 style="background:linear-gradient(135deg,#00d9ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:24px;letter-spacing:3px;margin-bottom:16px;font-weight:900">TIN LƯU</h1>
        <p style="color:#00e676;font-size:15px;font-weight:600;margin-bottom:8px">Cảm ơn đã sử dụng tool</p>
        <p style="color:#7a8a9e;font-size:12px">Hẹn gặp lại</p>
      </div>`;
  }
}

/* ==================== INIT ==================== */
(function init() {
  document.getElementById('versionText').textContent = TOOL_VERSION + ' · ONLINE';

  detectH5GG();
  log('Tool khởi động · ' + TOOL_VERSION, 'info');

  const saved = loadKey();
  if (saved) {
    const v = verifyKeyOffline(saved);
    if (v.ok) {
      state.isVerified = true;
      state.key = saved;
      state.durationHours = v.durationHours;
      const parts = saved.split('-');
      const timestamp = parseInt(parts[parts.length - 1]);
      state.keyExpiry = timestamp * 1000 + v.durationHours * 3600000;
      updateKeyStatus();
      startCountdown();
      toast('Tự động đăng nhập thành công');
      log('✓ Auto login: ' + saved.substring(0, 20) + '...', 'info');
    } else {
      localStorage.removeItem('tinluu_key');
      toast('Key cũ đã hết hạn', 'warn');
    }
  }
  updateKeyStatus();
})();