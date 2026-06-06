// =====================================================================
// JARVIS - GLOBAL DEĞİŞKENLER VE ARAÇLAR
// =====================================================================

window.musteriler = [];
window.ayarlar = { columns: [], pin: null, theme: 'light', hatirlaticilar: [], currency: '₺', kurlar: { '₺': 1, '$': 32.5, '€': 35.0, '£': 41.0 } };
window.APP_METINLERI = {};
window.mevcutYil = new Date().getFullYear();
window.aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
window.mevcutAy = new Date().getMonth();

window.getEl = (id) => document.getElementById(id);

window.loadConfig = function() {
    try {
        const configPath = window.jarvisAPI.pathJoin(window.jarvisAPI.getHomedir(), 'Desktop', 'config.json'); // Güvenlik sebebiyle kök dizin veya ana dizin okumaları
        const defaultPath = './config.json';
        const okunanVeri = window.jarvisAPI.readFileSyncStr(defaultPath);
        if(okunanVeri) {
            window.APP_METINLERI = JSON.parse(okunanVeri);
        }
    } catch(e) { console.error("Config dosyası bulunamadı, varsayılanlar boş."); }
};

window.initPaths = function() {
    if (typeof window.jarvisAPI === 'undefined') {
        alert("KRİTİK HATA: Güvenlik Köprüsü (preload.js) yüklenemedi!");
        return false;
    }
    window.dataDir = window.jarvisAPI.pathJoin(window.jarvisAPI.getHomedir(), 'SatisTakipData');
    window.photosDir = window.jarvisAPI.pathJoin(window.dataDir, 'resimler');
    
    if (!window.jarvisAPI.existsSync(window.dataDir)) window.jarvisAPI.mkdirSync(window.dataDir); 
    if (!window.jarvisAPI.existsSync(window.photosDir)) window.jarvisAPI.mkdirSync(window.photosDir);
    
    window.dataFilePath = window.jarvisAPI.pathJoin(window.dataDir, 'data.jrv');
    window.analizFilePath = window.jarvisAPI.pathJoin(window.dataDir, 'analiz.jrv');
    window.settingsFilePath = window.jarvisAPI.pathJoin(window.dataDir, 'settings.jrv'); 
    return true;
};

window.xssKoru = function(str) {
    if (!str || typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
};

window.formatliPara = function(miktar) {
    return Number(miktar).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

window.writeSecureFile = function(pathStr, dataObj) { 
    window.jarvisAPI.writeFileSyncStr(pathStr, window.jarvisAPI.encryptText(JSON.stringify(dataObj, null, 2))); 
};

window.readSecureFile = function(pathStr, defaultObj) { 
    if (window.jarvisAPI.existsSync(pathStr)) { 
        try { 
            const raw = window.jarvisAPI.readFileSyncStr(pathStr);
            const decrypted = window.jarvisAPI.decryptText(raw);
            if (decrypted) return JSON.parse(decrypted);
        } catch(e) { return defaultObj; } 
    } 
    window.writeSecureFile(pathStr, defaultObj); 
    return defaultObj; 
};

window.getSafeImgUrl = function(fileName) { 
    if (!fileName) return ''; 
    const tY = window.jarvisAPI.pathJoin(window.photosDir, fileName); 
    if (!window.jarvisAPI.existsSync(tY)) return ''; 
    try { 
        if (fileName.endsWith('.jrv')) { 
            const b64 = window.jarvisAPI.okuBase64Sifreli(tY);
            return b64 ? 'data:image/jpeg;base64,' + b64 : '';
        } else { return 'file:///' + tY.replace(/\\/g, '/'); } 
    } catch (e) { return ''; } 
};

window.fotoKaydet = function(sourcePath) { return window.jarvisAPI.fotoKaydet(sourcePath, window.photosDir); };

window.fotoSil = function(fileName) { 
    if (!fileName) return; 
    const p = window.jarvisAPI.pathJoin(window.photosDir, fileName); 
    if (window.jarvisAPI.existsSync(p)) window.jarvisAPI.unlinkSync(p); 
};

window.resimBuyut = function(b64) { 
    const m = document.createElement('div'); 
    m.className = "fixed inset-0 bg-slate-900 bg-opacity-90 flex items-center justify-center z-[99999] cursor-pointer fade-in"; 
    m.innerHTML = `<img src="${b64}" class="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl border-4 border-slate-700">`; 
    m.onclick = () => document.body.removeChild(m); 
    document.body.appendChild(m); 
};

window.jarvisAlert = function(msg, type = "warning", title = "Sistem Mesajı") {
    const modal = window.getEl('jarvis-modal');
    if (!modal) return alert(title + "\n" + msg);
    window.getEl('jarvis-modal-icon').innerText = type === "success" ? "✅" : (type === "error" ? "❌" : "⚠️");
    window.getEl('jarvis-modal-title').innerText = title;
    window.getEl('jarvis-modal-message').innerHTML = msg.replace(/\n/g, '<br>');
    window.getEl('jarvis-modal-buttons').innerHTML = `<button id="jm-ok" class="px-6 py-2.5 bg-brand text-white rounded-xl hover:bg-brandHover transition font-bold shadow-md cursor-pointer">Tamam</button>`;
    modal.classList.remove('hidden');
    window.getEl('jm-ok').onclick = () => modal.classList.add('hidden');
};

window.jarvisConfirm = function(msg, onConfirm) {
    const modal = window.getEl('jarvis-modal');
    if (!modal) { if(confirm(msg)) onConfirm(); return; }
    window.getEl('jarvis-modal-icon').innerText = "❓";
    window.getEl('jarvis-modal-title').innerText = "Onay Bekleniyor";
    window.getEl('jarvis-modal-message').innerHTML = msg.replace(/\n/g, '<br>');
    window.getEl('jarvis-modal-buttons').innerHTML = `
        <button id="jm-cancel" class="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition font-bold cursor-pointer">İptal</button>
        <button id="jm-yes" class="px-6 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-bold shadow-md cursor-pointer">Evet, Onaylıyorum</button>
    `;
    modal.classList.remove('hidden');
    window.getEl('jm-cancel').onclick = () => modal.classList.add('hidden');
    window.getEl('jm-yes').onclick = () => { modal.classList.add('hidden'); onConfirm(); };
};

window.onerror = function(msg, url, line) { window.jarvisAlert("SİSTEM HATASI:\n" + msg, "error", "KRİTİK HATA"); };