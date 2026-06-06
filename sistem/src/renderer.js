// =====================================================================
// 👑 JARVIS VIP OTEL CRM - TEKİL VE ZIRHLI ANA SİSTEM
// =====================================================================

window.addEventListener('DOMContentLoaded', () => {

    // 🛑 1. GÜVENLİK VE ALTYAPI KONTROLÜ
    if (typeof window.jarvisAPI === 'undefined') {
        alert("KRİTİK HATA: Güvenlik Köprüsü (preload.js) yüklenemedi! Lütfen preload.js'in main.js ile yan yana olduğundan emin olun.");
        return;
    }

    const getEl = id => document.getElementById(id);
    const xssKoru = str => (typeof str === 'string' ? str.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t] || t)) : str);
    const formatliPara = m => Number(m).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 🛑 2. DOSYA YOLU VE KLASÖR KURULUMU
    const dataDir = window.jarvisAPI.pathJoin(window.jarvisAPI.getHomedir(), 'SatisTakipData');
    const photosDir = window.jarvisAPI.pathJoin(dataDir, 'resimler');
    
    if (!window.jarvisAPI.existsSync(dataDir)) window.jarvisAPI.mkdirSync(dataDir); 
    if (!window.jarvisAPI.existsSync(photosDir)) window.jarvisAPI.mkdirSync(photosDir);

    const dataFilePath = window.jarvisAPI.pathJoin(dataDir, 'data.jrv');
    const analizFilePath = window.jarvisAPI.pathJoin(dataDir, 'analiz.jrv');
    const settingsFilePath = window.jarvisAPI.pathJoin(dataDir, 'settings.jrv'); 

    // 🛑 3. GLOBAL DEĞİŞKENLER
    let musteriler = [];
    let analizVerileri = {};
    let ayarlar = { columns: [], pin: null, theme: 'light', hatirlaticilar: [], currency: '₺', kurlar: { '₺': 1, '$': 32.5, '€': 35.0, '£': 41.0 } };
    const mevcutYil = new Date().getFullYear();
    const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const mevcutAy = new Date().getMonth();

    // 🛑 4. CONFIG.JSON OKUMA (METİNLER)
    let APP_METINLERI = {
        logo_yazisi: "VIP OTEL CRM", menu_1: "Dashboard", menu_2: "Misafirler", menu_3: "Aylık Analiz", menu_4: "Hesap Makinesi", menu_5: "Otonom Bot",
        baslik_1: "Finansal Dashboard", baslik_2: "MİSAFİR LİSTESİ", baslik_3: "Tarihsel Analiz & Defter",
        donem_gelir: "DÖNEM TOPLAM GELİRİ", donem_gider: "DÖNEM TOPLAM GİDERİ", secili_yil_gelir: "SEÇİLİ YIL TOPLAM GELİR", secili_yil_gider: "SEÇİLİ YIL TOPLAM GİDER",
        harcama_butcesi: "Harcama Bütçesi", vip_arac: "VIP Araç", varsayilan_gelir_tablosu: "AYLIK KAZANÇ", varsayilan_gider_tablosu: "AYLIK GİDER"
    };

    try {
        const cPath1 = window.jarvisAPI.pathJoin(__dirname, '..', 'config.json');
        const cPath2 = window.jarvisAPI.pathJoin(window.jarvisAPI.getHomedir(), 'Desktop', 'config.json');
        
        if (window.jarvisAPI.existsSync(cPath1)) {
            APP_METINLERI = { ...APP_METINLERI, ...JSON.parse(window.jarvisAPI.readFileSyncStr(cPath1)) };
        } else if (window.jarvisAPI.existsSync(cPath2)) {
            APP_METINLERI = { ...APP_METINLERI, ...JSON.parse(window.jarvisAPI.readFileSyncStr(cPath2)) };
        }
    } catch(e) { console.warn("Config yüklenemedi, varsayılan metinler kullanılıyor."); }

    // HTML METİNLERİNİ GÜNCELLEME
    const metinleriUygula = () => {
        ['txt-logo','txt-menu-1','txt-menu-2','txt-menu-3','txt-menu-4','txt-menu-5','txt-baslik-1','txt-baslik-2','txt-baslik-3',
         'txt-donem-gelir','txt-donem-gider','txt-yil-gelir','txt-yil-gider','txt-harcama-1'].forEach(id => {
            const el = getEl(id);
            if(el) {
                const key = id.replace('txt-', '').replace('-', '_');
                if(APP_METINLERI[key]) el.innerText = APP_METINLERI[key];
            }
        });
        if(getEl('txt-vip-1')) { getEl('txt-vip-1').innerText = APP_METINLERI.vip_arac; getEl('txt-vip-1').value = APP_METINLERI.vip_arac; }
    };
    metinleriUygula();

    // 🛑 5. GÜVENLİ DOSYA İŞLEMLERİ (I/O)
    const writeSecureFile = (p, d) => window.jarvisAPI.writeFileSyncStr(p, window.jarvisAPI.encryptText(JSON.stringify(d, null, 2)));
    const readSecureFile = (p, defObj) => {
        if (window.jarvisAPI.existsSync(p)) {
            try { return JSON.parse(window.jarvisAPI.decryptText(window.jarvisAPI.readFileSyncStr(p))); } catch(e) { return defObj; }
        }
        writeSecureFile(p, defObj); return defObj;
    };
    
    const getSafeImgUrl = fn => {
        if (!fn) return ''; const p = window.jarvisAPI.pathJoin(photosDir, fn);
        if (!window.jarvisAPI.existsSync(p)) return '';
        try { return fn.endsWith('.jrv') ? (window.jarvisAPI.okuBase64Sifreli(p) ? 'data:image/jpeg;base64,'+window.jarvisAPI.okuBase64Sifreli(p) : '') : 'file:///'+p.replace(/\\/g, '/'); } catch(e) { return ''; }
    };
    const fotoKaydet = s => window.jarvisAPI.fotoKaydet(s, photosDir);
    const fotoSil = f => { if(f){ const p = window.jarvisAPI.pathJoin(photosDir, f); if(window.jarvisAPI.existsSync(p)) window.jarvisAPI.unlinkSync(p); } };
    
    window.resimBuyut = b64 => {
        const m = document.createElement('div'); m.className = "fixed inset-0 bg-slate-900 bg-opacity-90 flex items-center justify-center z-[99999] cursor-pointer fade-in";
        m.innerHTML = `<img src="${b64}" class="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl border-4 border-slate-700">`;
        m.onclick = () => document.body.removeChild(m); document.body.appendChild(m);
    };

    // 🛑 6. MODAL (UYARI) MİMARİSİ
    const jarvisModal = getEl('jarvis-modal');
    window.jarvisAlert = (msg, type="warning", title="Sistem Mesajı") => {
        if(!jarvisModal) return alert(title + "\n" + msg);
        getEl('jarvis-modal-icon').innerText = type === "success" ? "✅" : (type === "error" ? "❌" : "⚠️");
        getEl('jarvis-modal-title').innerText = title; getEl('jarvis-modal-message').innerHTML = msg.replace(/\n/g, '<br>');
        getEl('jarvis-modal-buttons').innerHTML = `<button id="jm-ok" class="px-6 py-2.5 bg-brand text-white rounded-xl hover:bg-brandHover transition font-bold shadow-md cursor-pointer">Tamam</button>`;
        jarvisModal.classList.remove('hidden'); getEl('jm-ok').onclick = () => jarvisModal.classList.add('hidden');
    };
    window.jarvisConfirm = (msg, onConfirm) => {
        if(!jarvisModal) { if(confirm(msg)) onConfirm(); return; }
        getEl('jarvis-modal-icon').innerText = "❓"; getEl('jarvis-modal-title').innerText = "Onay Bekleniyor"; getEl('jarvis-modal-message').innerHTML = msg.replace(/\n/g, '<br>');
        getEl('jarvis-modal-buttons').innerHTML = `<button id="jm-cancel" class="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 font-bold cursor-pointer">İptal</button><button id="jm-yes" class="px-6 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold cursor-pointer">Evet, Onaylıyorum</button>`;
        jarvisModal.classList.remove('hidden');
        getEl('jm-cancel').onclick = () => jarvisModal.classList.add('hidden');
        getEl('jm-yes').onclick = () => { jarvisModal.classList.add('hidden'); onConfirm(); };
    };

    // 🛑 7. MENÜ VE GÖRÜNÜM GEÇİŞLERİ
    const views = { dashboard: getEl('view-dashboard'), musteriler: getEl('view-musteriler'), analiz: getEl('view-analiz'), otonom: getEl('view-otonom') };
    const navBtns = { dashboard: getEl('nav-dashboard'), musteriler: getEl('nav-musteriler'), analiz: getEl('nav-analiz'), otonom: getEl('nav-otonom') };
    
    function switchView(target) {
        Object.keys(views).forEach(k => {
            if(views[k]) { views[k].classList.add('hidden'); views[k].classList.remove('flex','flex-col'); }
            if(navBtns[k]) navBtns[k].classList.remove('bg-brandHover','active-shadow');
        });
        if(views[target]) {
            views[target].classList.remove('hidden');
            if(target === 'musteriler') views[target].classList.add('flex'); else views[target].classList.add('flex','flex-col');
        }
        if(navBtns[target]) navBtns[target].classList.add('bg-brandHover','active-shadow');
    }
    
    if(navBtns.dashboard) navBtns.dashboard.addEventListener('click', () => switchView('dashboard'));
    if(navBtns.musteriler) navBtns.musteriler.addEventListener('click', () => switchView('musteriler'));
    if(navBtns.analiz) navBtns.analiz.addEventListener('click', () => { switchView('analiz'); window.analizGorselleriniYenile(); });
    if(navBtns.otonom) navBtns.otonom.addEventListener('click', () => switchView('otonom'));

    // 🛑 8. TEMA VE KUR SİSTEMİ
    const temaUygula = () => {
        if (ayarlar.theme === 'dark') { document.documentElement.classList.add('dark'); if(getEl('theme-toggle-btn')) getEl('theme-toggle-btn').innerText = '☀️'; } 
        else { document.documentElement.classList.remove('dark'); if(getEl('theme-toggle-btn')) getEl('theme-toggle-btn').innerText = '🌙'; }
        if(views.analiz && !views.analiz.classList.contains('hidden')) window.analizGorselleriniYenile();
    };
    if(getEl('theme-toggle-btn')) getEl('theme-toggle-btn').addEventListener('click', () => { ayarlar.theme = ayarlar.theme === 'dark' ? 'light' : 'dark'; writeSecureFile(settingsFilePath, ayarlar); temaUygula(); });
    
    const kurlariGuncelle = () => {
        fetch('https://api.exchangerate-api.com/v4/latest/TRY').then(r=>r.json()).then(d=>{
            if(d && d.rates) { ayarlar.kurlar['$'] = 1/d.rates.USD; ayarlar.kurlar['€'] = 1/d.rates.EUR; ayarlar.kurlar['£'] = 1/d.rates.GBP; writeSecureFile(settingsFilePath, ayarlar); guncelleDashboard(); window.musterileriGoster(); }
        }).catch(e=>console.log('Offline Kur'));
    };
    if(getEl('currency-selector')) getEl('currency-selector').addEventListener('change', e => {
        ayarlar.currency = e.target.value; writeSecureFile(settingsFilePath, ayarlar);
        guncelleDashboard(); window.analizGorselleriniYenile(); window.musterileriGoster();
        if (getEl('detail-panel')) getEl('detail-panel').innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-60"><div class="text-7xl mb-6">🛎️</div><h3 class="text-lg font-bold text-slate-500">MİSAFİR DOSYASI</h3></div>`;
    });

    // 🛑 9. HESAP MAKİNESİ (REGEX KORUMALI)
    let calcExp = '';
    if(getEl('nav-calc')) getEl('nav-calc').addEventListener('click', () => getEl('calc-modal') && getEl('calc-modal').classList.remove('hidden'));
    if(getEl('close-calc-btn')) getEl('close-calc-btn').addEventListener('click', () => getEl('calc-modal') && getEl('calc-modal').classList.add('hidden'));
    window.calcAction = (v) => {
        const cD = getEl('calc-display'); if(!cD) return;
        if(v === 'C') { calcExp = ''; cD.innerText = '0'; }
        else if(v === 'DEL') { calcExp = calcExp.slice(0,-1); cD.innerText = calcExp || '0'; }
        else if(v === '=') {
            try { 
                if(!/^[0-9+\-*/.() ]+$/.test(calcExp)) return window.jarvisAlert("Geçersiz veya zararlı işlem!","error","Güvenlik Duvarı");
                const res = new Function('return ' + calcExp)();
                cD.innerText = Number.isInteger(res) ? res : res.toFixed(2); calcExp = cD.innerText;
            } catch(e) { cD.innerText = 'Hata'; calcExp = ''; }
        } else { calcExp += v; cD.innerText = calcExp; }
    };

    // 🛑 10. MÜŞTERİ SEKMELERİ (TÜM, TAM, EKSİK)
    let aktifTab = 'hepsi';
    const tabHepsi = getEl('tab-hepsi'), tabTam = getEl('tab-tam'), tabEksik = getEl('tab-eksik');
    const sekmeStilGuncelle = () => {
        const p = ['text-slate-400','border-transparent']; const h = ['text-brand','dark:text-white','border-brand','dark:border-white']; 
        const t = ['text-emerald-600','border-emerald-600']; const e = ['text-red-600','border-red-600'];
        [tabHepsi,tabTam,tabEksik].forEach(el=>{ if(el) { el.classList.remove(...h,...t,...e); el.classList.add(...p); } });
        if(aktifTab==='hepsi' && tabHepsi) { tabHepsi.classList.remove(...p); tabHepsi.classList.add(...h); }
        if(aktifTab==='tam' && tabTam) { tabTam.classList.remove(...p); tabTam.classList.add(...t); }
        if(aktifTab==='eksik' && tabEksik) { tabEksik.classList.remove(...p); tabEksik.classList.add(...e); }
    };
    if(tabHepsi) tabHepsi.addEventListener('click', ()=>{aktifTab='hepsi'; sekmeStilGuncelle(); window.musterileriGoster();});
    if(tabTam) tabTam.addEventListener('click', ()=>{aktifTab='tam'; sekmeStilGuncelle(); window.musterileriGoster();});
    if(tabEksik) tabEksik.addEventListener('click', ()=>{aktifTab='eksik'; sekmeStilGuncelle(); window.musterileriGoster();});

    // 🛑 11. MÜŞTERİ LİSTESİ YÜKLEME VE DETAY EKRANI
    window.musterileriGoster = (filt="") => {
        const cl = getEl('customer-list'); if(!cl) return; cl.innerHTML = '';
        let s = musteriler.filter(m => m.Ad.toLowerCase().includes(filt.toLowerCase()) || (m.Sehir && m.Sehir.toLowerCase().includes(filt.toLowerCase())));
        s = s.filter(m => {
            const tamMi = (m.Ad && m.TC && m.Setup && m.Resim);
            if(aktifTab==='tam') return tamMi; if(aktifTab==='eksik') return !tamMi; return true;
        });
        s.sort((a,b)=>a.Ad.localeCompare(b.Ad,'tr'));
        if(s.length===0){ cl.innerHTML=`<div class="text-slate-500 text-center py-16">Kayıt bulunamadı.</div>`; return; }

        s.forEach(m => {
            const i = musteriler.indexOf(m); const isTam = (m.Ad && m.TC && m.Setup && m.Resim);
            const rz = isTam ? `<div class="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>` : `<div class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 border-2 border-white rounded-full"></div>`;
            const tcS = m.TC ? `<span class="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded ml-2">TC: ${xssKoru(m.TC)}</span>` : '';
            const shS = m.Sehir ? `<span class="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded ml-2">${xssKoru(m.Sehir)}</span>` : '';
            const pic = m.Resim ? `<img src="${getSafeImgUrl(m.Resim)}" class="w-full h-full object-cover">` : `👤`;
            let h = Number(m.Harcama)||0; let bk = ayarlar.kurlar||{'₺':1,'$':32.5,'€':35.0,'£':41.0};
            let dh = (h * (bk[m.HarcamaKur||'₺']||1)) / (bk[ayarlar.currency]||1);
            cl.innerHTML += `<div onclick="window.musteriDetay(${i})" class="flex justify-between items-center p-5 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 cursor-pointer active-shadow mb-4 relative"><div class="flex items-center space-x-4"><div class="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xl overflow-hidden relative">${pic}${rz}</div><div><div class="text-lg font-bold text-slate-800">${xssKoru(m.Ad)}${shS}${tcS}</div><div class="text-sm text-brand truncate w-48">${xssKoru(m.Transfer)||'Transfer Belirtilmemiş'}</div></div></div><div class="text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">💳 ${h ? formatliPara(dh) : '0,00'} ${ayarlar.currency}</div></div>`;
        });
    };
    if(getEl('search-input')) getEl('search-input').addEventListener('input', e => window.musterileriGoster(e.target.value));

    window.musteriDetay = i => {
        const dp = getEl('detail-panel'); if(!dp) return; const m = musteriler[i];
        const pic = m.Resim ? `<img src="${getSafeImgUrl(m.Resim)}" class="w-full h-full object-cover">` : `👤`;
        let kH = m.Kimlik ? `<div><span class="text-xs font-bold text-slate-400">Kimlik</span><div class="w-full h-32 bg-slate-100 rounded-xl overflow-hidden cursor-pointer" onclick="window.resimBuyut('${getSafeImgUrl(m.Kimlik)}')"><img src="${getSafeImgUrl(m.Kimlik)}" class="w-full h-full object-cover"></div></div>` : '';
        let pH = m.Pasaport ? `<div><span class="text-xs font-bold text-slate-400">Pasaport</span><div class="w-full h-32 bg-slate-100 rounded-xl overflow-hidden cursor-pointer" onclick="window.resimBuyut('${getSafeImgUrl(m.Pasaport)}')"><img src="${getSafeImgUrl(m.Pasaport)}" class="w-full h-full object-cover"></div></div>` : '';
        let dh = ((Number(m.Harcama)||0) * ((ayarlar.kurlar||{})[m.HarcamaKur||'₺']||1)) / ((ayarlar.kurlar||{})[ayarlar.currency]||1);
        
        dp.innerHTML = `
            <div class="flex flex-col items-center mb-6"><div class="w-28 h-28 bg-slate-100 rounded-full border-4 border-white shadow-md flex items-center justify-center text-5xl mb-4 overflow-hidden z-10">${pic}</div><h2 class="text-2xl font-bold text-brand">${xssKoru(m.Ad)}</h2><div class="text-sm text-slate-500 mt-1">📍 ${xssKoru(m.Sehir)||'Belirtilmemiş'}</div><div class="bg-slate-100 text-slate-700 px-3 py-1 mt-2 rounded-lg font-bold border border-slate-200 text-sm">TC: ${xssKoru(m.TC)||'GİRİLMEMİŞ'}</div></div>
            <div class="flex-grow overflow-y-auto pr-2 space-y-4">
                <div class="bg-emerald-50 p-4 rounded-2xl flex items-center justify-between shadow-sm"><div class="flex items-center space-x-4"><div class="text-2xl">💳</div><div><div class="text-xs font-bold text-emerald-600">${APP_METINLERI.harcama_butcesi || 'Bütçe'}</div><div class="font-bold text-emerald-900 text-xl">${m.Harcama ? formatliPara(dh)+' '+ayarlar.currency : 'Belirtilmemiş'}</div></div></div></div>
                <div class="bg-slate-50 p-4 rounded-2xl space-y-3 shadow-sm"><div class="text-xs font-bold text-slate-400 border-b pb-2 mb-2">İletişim Bilgileri</div><div>📞 ${xssKoru(m.Telefon)||'-'}</div><div>✉️ ${xssKoru(m.Email)||'-'}</div><div>🏠 ${xssKoru(m.Adres)||'-'}</div></div>
                <div class="bg-brand text-white p-5 rounded-2xl shadow-md space-y-4"><div class="text-xs font-bold text-brandHover border-b border-slate-600 pb-2 text-slate-300">Konaklama Tercihleri</div><div class="text-sm">${xssKoru(m.Setup)||'Özel istek belirtilmedi.'}</div><div class="grid grid-cols-2 pt-2 border-t border-slate-600"><div>🚕 ${xssKoru(m.Transfer)||'-'}</div><div>🏨 ${xssKoru(m.Oteller)||'-'}</div></div></div>
                ${(kH||pH) ? `<div class="grid grid-cols-${(kH&&pH)?'2':'1'} gap-4">${kH}${pH}</div>` : ''}
            </div>
            <div class="flex space-x-3 mt-6"><button onclick="window.pdfIndir(${i})" class="flex-grow py-3 bg-brand text-white rounded-xl font-bold cursor-pointer">📄 PDF İndir</button><button onclick="window.silMusteri(${i})" class="flex-grow py-3 bg-red-50 text-red-600 rounded-xl font-bold cursor-pointer">🗑️ Sil</button></div>
        `;
    };

    window.silMusteri = i => {
        window.jarvisConfirm("Bu misafirin tüm kayıtlarını silmek istediğinize emin misiniz?", () => {
            fotoSil(musteriler[i].Resim); fotoSil(musteriler[i].Kimlik); fotoSil(musteriler[i].Pasaport);
            musteriler.splice(i,1); window.verileriKaydet();
            if(getEl('detail-panel')) getEl('detail-panel').innerHTML=`<div class="flex flex-col items-center justify-center h-full opacity-60"><div class="text-7xl mb-6">🛎️</div><h3 class="text-lg font-bold text-slate-500">MİSAFİR DOSYASI</h3></div>`;
        });
    };

    window.pdfIndir = i => {
        const m = musteriler[i]; const sY = getEl('dash-yil-secici')?getEl('dash-yil-secici').value:mevcutYil; const sA = getEl('dash-ay-secici')?getEl('dash-ay-secici').value:aylar[0];
        let rH = ''; let tG=0, tZ=0;
        if(ayarlar.columns) ayarlar.columns.forEach(c => { const v = m.Finans&&m.Finans[sY]&&m.Finans[sY][sA]?m.Finans[sY][sA][c.id]:''; if(c.type==='gelir')tG+=Number(v)||0; if(c.type==='gider')tZ+=Number(v)||0; if(v) rH+=`<tr><td style="padding:12px;border-bottom:1px solid #ddd;">${c.name}</td><td style="padding:12px;text-align:right;border-bottom:1px solid #ddd;">${c.type==='notr'?v:formatliPara(v)+' '+ayarlar.currency}</td></tr>`; });
        const d = document.createElement('div');
        d.innerHTML = `<div style="padding:40px;font-family:sans-serif;width:800px;"><h2>${APP_METINLERI.logo_yazisi} Faturası</h2><p><b>Ad:</b> ${m.Ad}</p><p><b>Dönem:</b> ${sA} ${sY}</p><table style="width:100%;border-collapse:collapse;margin-top:20px;"><thead><tr style="background:#1a2035;color:white;"><th style="padding:12px;text-align:left;">Hizmet</th><th style="padding:12px;text-align:right;">Tutar</th></tr></thead><tbody>${rH||'<tr><td colspan="2">Kayıt yok.</td></tr>'}</tbody></table><h3 style="text-align:right;margin-top:20px;">Net: ${formatliPara(tG-tZ)} ${ayarlar.currency}</h3></div>`;
        html2pdf().set({filename:`Fatura_${m.Ad}.pdf`}).from(d).save();
    };

    // 🛑 12. YENİ MÜŞTERİ EKLEME (TC VE FOTOĞRAFLAR)
    if(getEl('yeni-ekle-btn')) getEl('yeni-ekle-btn').addEventListener('click', () => {
        ['new-ad','new-tc','new-telefon','new-email','new-sehir','new-adres','new-setup','new-oteller','new-harcama'].forEach(id => { if(getEl(id)) getEl(id).value = ''; });
        if(getEl('photo-preview')) getEl('photo-preview').innerHTML = `👤`;
        ['kimlik-preview','pasaport-preview'].forEach(id=>{if(getEl(id)){getEl(id).innerHTML=''; getEl(id).classList.add('hidden');}});
        if(getEl('add-modal')) getEl('add-modal').classList.remove('hidden');
    });
    
    ['new-photo','new-kimlik','new-pasaport'].forEach(id => {
        const inp = getEl(id); if(!inp) return;
        inp.addEventListener('change', e => {
            if(e.target.files[0]) {
                const pID = id.replace('new-', '') + '-preview';
                const p = getEl(pID); if(!p) return;
                p.innerHTML = `<img src="file:///${e.target.files[0].path.replace(/\\/g,'/')}" class="w-full h-full object-cover">`;
                p.classList.remove('hidden');
            }
        });
    });

    if(getEl('cancel-add-btn')) getEl('cancel-add-btn').addEventListener('click', () => { if(getEl('add-modal')) getEl('add-modal').classList.add('hidden'); });
    if(getEl('save-add-btn')) getEl('save-add-btn').addEventListener('click', () => {
        const ad = getEl('new-ad')?getEl('new-ad').value:''; if(!ad) return window.jarvisAlert("İsim zorunlu!");
        const rI = getEl('new-photo'), kI = getEl('new-kimlik'), pI = getEl('new-pasaport');
        const yM = {
            Ad: ad, TC: getEl('new-tc')?getEl('new-tc').value:'', Telefon: getEl('new-telefon')?getEl('new-telefon').value:'', Email: getEl('new-email')?getEl('new-email').value:'', Sehir: getEl('new-sehir')?getEl('new-sehir').value:'', Adres: getEl('new-adres')?getEl('new-adres').value:'', Setup: getEl('new-setup')?getEl('new-setup').value:'', Transfer: getEl('new-transfer')?getEl('new-transfer').value:'', Oteller: getEl('new-oteller')?getEl('new-oteller').value:'', Harcama: getEl('new-harcama')?getEl('new-harcama').value:'0', HarcamaKur: getEl('new-harcama-kur')?getEl('new-harcama-kur').value:ayarlar.currency, Sirket: "Misafir",
            Resim: rI&&rI.files[0]?fotoKaydet(rI.files[0].path):null, Kimlik: kI&&kI.files[0]?fotoKaydet(kI.files[0].path):null, Pasaport: pI&&pI.files[0]?fotoKaydet(pI.files[0].path):null, Finans: {}
        };
        yM.Finans[mevcutYil]={}; aylar.forEach(a=>yM.Finans[mevcutYil][a]={});
        musteriler.push(yM); window.verileriKaydet(); if(getEl('add-modal')) getEl('add-modal').classList.add('hidden');
    });

    // 🛑 13. OTONOM BOT (ÇAKIŞMA / BİRLEŞTİRME KORUMALI)
    if(getEl('btn-otonom-baslat')) getEl('btn-otonom-baslat').addEventListener('click', () => getEl('otonom-file-input') && getEl('otonom-file-input').click());
    if(getEl('otonom-file-input')) getEl('otonom-file-input').addEventListener('change', e => {
        const file = e.target.files[0]; if(!file) return;
        window.jarvisConfirm(`${file.name} dosyası okunsun ve içindeki tüm veriler (TC, Telefon, İsim) otomatik birleştirilerek sisteme gömülsün mü?`, () => {
            try {
                const lines = window.jarvisAPI.readFileSyncStr(file.path).split('\n').map(s=>s.trim()).filter(s=>s.length>0);
                if(lines.length===0) return window.jarvisAlert("Dosya boş.", "warning");
                let ekl=0, gnc=0;
                lines.forEach(satir => {
                    let ad=satir, tel="", tc="";
                    const tcM = ad.match(/\b[1-9][0-9]{10}\b/); if(tcM){tc=tcM[0]; ad=ad.replace(tc,'').trim();}
                    const telM = ad.match(/(\+?[\d\s\-\(\)]{10,})/); if(telM && telM[0].replace(/\D/g,'').length>=10){tel=telM[0].trim(); ad=ad.replace(telM[0],'').trim();}
                    ad = ad.replace(/^[\s,\-]+|[\s,\-]+$/g, '').trim(); if(!ad) ad="İsimsiz Misafir";

                    let match = musteriler.find(m => (tc && m.TC===tc) || (tel && m.Telefon && m.Telefon.replace(/\D/g,'')===tel.replace(/\D/g,'')) || (m.Ad.toLowerCase()===ad.toLowerCase()));
                    if(match) {
                        let g=false; if(!match.TC&&tc){match.TC=tc;g=true;} if(!match.Telefon&&tel){match.Telefon=tel;g=true;} if(match.Ad==="İsimsiz Misafir"&&ad){match.Ad=ad;g=true;}
                        if(g) gnc++;
                    } else {
                        const y = { Ad:xssKoru(ad), TC:xssKoru(tc), Telefon:xssKoru(tel), Email:"", Sehir:"", Adres:"", Setup:"", Transfer:"", Oteller:"", Harcama:"0", HarcamaKur:ayarlar.currency, Sirket:"Misafir", Resim:null, Kimlik:null, Pasaport:null, Finans:{} };
                        y.Finans[mevcutYil]={}; aylar.forEach(a=>y.Finans[mevcutYil][a]={});
                        musteriler.push(y); ekl++;
                    }
                });
                window.verileriKaydet(); window.jarvisAlert(`✅ Otonom İşlem Başarılı!\nYeni Eklenen: ${ekl}\nBirleştirilen: ${gnc}`, "success");
            } catch(err) { window.jarvisAlert("Hata: "+err.message,"error"); }
        });
        e.target.value = '';
    });

    // 🛑 14. DASHBOARD VE ANALİZ 
    const dashYilSecici = getEl('dash-yil-secici'); const dashAySecici = getEl('dash-ay-secici');
    if(dashYilSecici) { dashYilSecici.innerHTML=''; for(let i=0;i<=10;i++){ const y=mevcutYil-i; dashYilSecici.innerHTML+=`<option value="${y}">${y}</option>`;} dashYilSecici.value=mevcutYil; dashYilSecici.addEventListener('change', guncelleDashboard); }
    if(dashAySecici) { dashAySecici.innerHTML=''; aylar.forEach(a=>dashAySecici.innerHTML+=`<option value="${a}">${a}</option>`); dashAySecici.value=aylar[mevcutAy]; dashAySecici.addEventListener('change', guncelleDashboard); }

    function guncelleDashboard() {
        const tb = getEl('dashboard-table-body'); const th = getEl('dashboard-table-head');
        if(!tb || !th || !dashYilSecici || !dashAySecici) return;
        const sY = dashYilSecici.value; const sA = dashAySecici.value;
        let hH = `<th class="p-5 font-bold w-[300px] border-b border-slate-200">Misafir Dosyası (A-Z)</th>`;
        if(ayarlar.columns) ayarlar.columns.forEach(c => { hH += `<th class="p-5 font-bold border-b border-slate-200 border-l">${xssKoru(c.name)}</th>`; });
        hH += `<th class="p-5 font-bold border-b border-slate-200 border-l text-center">Net Durum</th>`;
        th.innerHTML = hH; tb.innerHTML = '';
        
        let tK=0, tZ=0; musteriler.forEach(m => { if(m.Finans&&m.Finans[sY]&&m.Finans[sY][sA]){ ayarlar.columns.forEach(c=>{ const v=Number(m.Finans[sY][sA][c.id])||0; if(c.type==='gelir')tK+=v; if(c.type==='gider')tZ+=v; }); } });
        if(getEl('stat-total-customer')) getEl('stat-total-customer').innerText = musteriler.length;
        if(getEl('stat-total-kazanc')) getEl('stat-total-kazanc').innerText = formatliPara(tK) + ' ' + ayarlar.currency;
        if(getEl('stat-total-zarar')) getEl('stat-total-zarar').innerText = formatliPara(tZ) + ' ' + ayarlar.currency;

        const sirali = [...musteriler].map((m,i)=>({m,i})).sort((a,b)=>a.m.Ad.localeCompare(b.m.Ad,'tr'));
        if(sirali.length===0){ tb.innerHTML = `<tr><td colspan="${(ayarlar.columns?ayarlar.columns.length:0)+2}" class="p-10 text-center text-slate-400">Kayıtlı misafir bulunamadı.</td></tr>`; return; }

        sirali.forEach(item => {
            const m = item.m; const idx = item.i;
            if(!m.Finans) m.Finans={}; if(!m.Finans[sY]){ m.Finans[sY]={}; aylar.forEach(a=>m.Finans[sY][a]={}); }
            const img = m.Resim ? `<img src="${getSafeImgUrl(m.Resim)}" class="w-10 h-10 rounded-full object-cover">` : `<div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">👤</div>`;
            let cH = ''; let nG=0, nZ=0;
            if(ayarlar.columns) ayarlar.columns.forEach(c => {
                const val = m.Finans[sY][sA][c.id] || '';
                if(c.type==='gelir') nG+=Number(val)||0; if(c.type==='gider') nZ+=Number(val)||0;
                const isN = c.type === 'notr'; const isD = document.documentElement.classList.contains('dark');
                const tC = isN?'text-slate-700 dark:text-slate-300':(c.type==='gelir'?'text-emerald-600 dark:text-emerald-400':'text-red-600 dark:text-red-400');
                cH += `<td class="p-0 border-l border-slate-100 relative bg-white transition"><input type="${isN?'text':'number'}" value="${xssKoru(val.toString())}" data-i="${idx}" data-f="${c.id}" class="dash-input w-full h-full py-5 px-4 bg-transparent outline-none font-semibold ${tC}"></td>`;
            });
            const net = nG - nZ; const nCol = net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
            const tr = document.createElement('tr'); tr.className = "hover:bg-slate-50 transition group";
            tr.innerHTML = `<td class="p-4 flex items-center space-x-4 sticky left-0 bg-white group-hover:bg-slate-50 z-20 border-r border-slate-100">${img}<span class="font-bold truncate max-w-[200px]">${xssKoru(m.Ad)}</span></td>${cH}<td class="p-4 border-l text-center font-bold ${nCol}" id="net-${idx}">${formatliPara(net)} ${ayarlar.currency}</td>`;
            tb.appendChild(tr);
        });

        document.querySelectorAll('.dash-input').forEach(inp => {
            inp.addEventListener('input', e => {
                const i = e.target.getAttribute('data-i'); const f = e.target.getAttribute('data-f');
                musteriler[i].Finans[dashYilSecici.value][dashAySecici.value][f] = e.target.value;
                let tk=0, tz=0; if(ayarlar.columns) ayarlar.columns.forEach(c => { const v=Number(musteriler[i].Finans[dashYilSecici.value][dashAySecici.value][c.id])||0; if(c.type==='gelir') tk+=v; if(c.type==='gider') tz+=v; });
                const netE = getEl(`net-${i}`); if(netE) netE.innerText = formatliPara(tk-tz) + ' ' + ayarlar.currency;
            });
            inp.addEventListener('change', window.verileriKaydet);
        });
    }

    let analizGrafik = null;
    window.analizGorselleriniYenile = () => {
        const yS = getEl('analiz-yil-secici'); const aT = getEl('analiz-tablo-body');
        if(!yS || !aT) return; const sY = yS.value;
        if(!analizVerileri[sY]) { analizVerileri[sY]={}; aylar.forEach(a=>analizVerileri[sY][a]={kazanc:0,gider:0}); }
        aT.innerHTML = ''; let tk=0, tg=0; const kD=[], gD=[];
        aylar.forEach(a => {
            const k = Number(analizVerileri[sY][a].kazanc)||0; const g = Number(analizVerileri[sY][a].gider)||0;
            tk+=k; tg+=g; kD.push(k); gD.push(g);
            aT.innerHTML += `<tr class="hover:bg-slate-50"><td class="p-4 font-bold bg-white">${a}</td><td class="p-0 border-l bg-white"><input type="number" data-y="${sY}" data-a="${a}" data-t="kazanc" value="${k||''}" class="a-inp w-full py-4 px-4 text-right text-emerald-600 font-bold bg-transparent outline-none"></td><td class="p-0 border-l bg-white"><input type="number" data-y="${sY}" data-a="${a}" data-t="gider" value="${g||''}" class="a-inp w-full py-4 px-4 text-right text-red-600 font-bold bg-transparent outline-none"></td></tr>`;
        });
        if(getEl('analiz-toplam-kazanc')) getEl('analiz-toplam-kazanc').innerText = formatliPara(tk)+' '+ayarlar.currency;
        if(getEl('analiz-toplam-gider')) getEl('analiz-toplam-gider').innerText = formatliPara(tg)+' '+ayarlar.currency;
        if(getEl('analiz-toplam-net')) getEl('analiz-toplam-net').innerText = formatliPara(tk-tg)+' '+ayarlar.currency;

        document.querySelectorAll('.a-inp').forEach(inp => {
            inp.addEventListener('input', e => {
                analizVerileri[e.target.getAttribute('data-y')][e.target.getAttribute('data-a')][e.target.getAttribute('data-t')] = e.target.value;
                window.analizGorselleriniYenile();
            });
            inp.addEventListener('change', () => writeSecureFile(analizFilePath, analizVerileri));
        });

        const ctx = getEl('analizGrafigi'); if(!ctx) return;
        if(analizGrafik) analizGrafik.destroy();
        analizGrafik = new Chart(ctx.getContext('2d'), { type: 'bar', data: { labels: aylar, datasets: [{ label: '+ (Artı)', data: kD, backgroundColor: '#10b981', borderRadius: 6 }, { label: '- (Eksi)', data: gD, backgroundColor: '#ef4444', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false }});
    };

    window.verileriKaydet = function() { writeSecureFile(dataFilePath, musteriler); window.musterileriGoster(); guncelleDashboard(); };

    // 🛑 15. KİLİT EKRANI VE SİSTEMİ BAŞLATMA
    const pinInput = getEl('pin-input'); const lockScreen = getEl('lock-screen');
    const kilidiAc = () => { if(lockScreen) lockScreen.classList.add('opacity-0'); setTimeout(() => { if(lockScreen) lockScreen.classList.add('hidden'); sistemiBaslat(); }, 500); };
    
    window.kilidiAcMAYACalis = () => {
        try {
            if(!pinInput) return; const val = pinInput.value;
            if(val.length < 4) { pinInput.focus(); return; }
            if(!window.jarvisAPI.hashPIN) { alert("PRELOAD ESKİ. KİLİT ATLANDI."); kilidiAc(); return; }
            
            if(!ayarlar.pin || window.jarvisAPI.hashPIN(val) === ayarlar.pin) {
                if(!ayarlar.pin) { ayarlar.pin = window.jarvisAPI.hashPIN(val); writeSecureFile(settingsFilePath, ayarlar); }
                kilidiAc();
            } else {
                pinInput.value = ''; pinInput.classList.add('border-red-500','text-red-400');
                setTimeout(()=>pinInput.classList.remove('border-red-500','text-red-400'), 800);
            }
        } catch(e) { alert("GİRİŞ HATASI: "+e.message); kilidiAc(); }
    };

    if(getEl('unlock-btn')) getEl('unlock-btn').addEventListener('click', window.kilidiAcMAYACalis);
    if(pinInput) { pinInput.addEventListener('input', function(){this.value=this.value.replace(/[^0-9]/g,'');}); pinInput.addEventListener('keypress', e => { if(e.key==='Enter') window.kilidiAcMAYACalis(); }); }

    function sistemiBaslat() {
        try {
            ayarlar = readSecureFile(settingsFilePath, { columns: [{id:'kazanc',name:"Gelir",type:'gelir'},{id:'zarar',name:"Gider",type:'gider'}], pin:null, theme:'light', hatirlaticilar:[], currency:'₺', kurlar:{'₺':1,'$':32.5,'€':35.0,'£':41.0} });
            musteriler = readSecureFile(dataFilePath, []);
            analizVerileri = readSecureFile(analizFilePath, {});
            
            kurlariGuncelle(); temaUygula(); sekmeStilGuncelle(); window.musterileriGoster(); guncelleDashboard(); 
            
            if(getEl('analiz-yil-secici')) {
                getEl('analiz-yil-secici').innerHTML=''; for(let i=0;i<=10;i++){ const y=mevcutYil-i; getEl('analiz-yil-secici').innerHTML+=`<option value="${y}">${y}</option>`;}
                getEl('analiz-yil-secici').value=mevcutYil; getEl('analiz-yil-secici').addEventListener('change', window.analizGorselleriniYenile);
            }
            switchView('dashboard');
        } catch(e) { alert("BAŞLATMA HATASI: "+e.message); switchView('dashboard'); }
    }

    try {
        ayarlar = readSecureFile(settingsFilePath, ayarlar);
        if(ayarlar.pin) {
            if(getEl('lock-message')) getEl('lock-message').innerHTML = "Lütfen Jarvis güvenlik protokolünü açmak için PIN kodunuzu girin.";
            if(getEl('unlock-btn')) getEl('unlock-btn').innerText = "Kilidi Aç";
        } else {
            if(getEl('lock-message')) getEl('lock-message').innerHTML = "İlk giriş. 4 Haneli PIN belirleyin.";
            if(getEl('unlock-btn')) getEl('unlock-btn').innerText = "Belirle ve Gir";
        }
    } catch(e) {}
});