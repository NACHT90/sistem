// =====================================================================
// JARVIS - ARAYÜZ, PDF VE TEMA MODÜLLERİ
// =====================================================================

window.initUIModules = function() {
    
    // TEMA SİSTEMİ
    const themeToggleBtn = window.getEl('theme-toggle-btn');
    window.temaUygula = function() {
        if (window.ayarlar.theme === 'dark') { 
            document.documentElement.classList.add('dark'); 
            if(themeToggleBtn) { themeToggleBtn.innerText = '☀️'; themeToggleBtn.title = "Gündüz Moduna Geç"; }
        } else { 
            document.documentElement.classList.remove('dark'); 
            if(themeToggleBtn) { themeToggleBtn.innerText = '🌙'; themeToggleBtn.title = "Gece Moduna Geç"; }
        }
        if(window.analizGorselleriniYenile) window.analizGorselleriniYenile();
    }
    if(themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => { 
            window.ayarlar.theme = window.ayarlar.theme === 'dark' ? 'light' : 'dark'; 
            window.writeSecureFile(window.settingsFilePath, window.ayarlar); 
            window.temaUygula(); 
        });
    }

    // HESAP MAKİNESİ
    const navCalcBtn = window.getEl('nav-calc'); 
    const calcModal = window.getEl('calc-modal'); 
    const closeCalcBtn = window.getEl('close-calc-btn'); 
    const calcDisplay = window.getEl('calc-display');
    let calcExpression = '';

    if(navCalcBtn) navCalcBtn.addEventListener('click', () => calcModal && calcModal.classList.remove('hidden')); 
    if(closeCalcBtn) closeCalcBtn.addEventListener('click', () => calcModal && calcModal.classList.add('hidden'));
    
    window.calcAction = function(btnVal) { 
        if(!calcDisplay) return;
        if(btnVal === 'C') { calcExpression = ''; calcDisplay.innerText = '0'; } 
        else if(btnVal === 'DEL') { calcExpression = calcExpression.slice(0, -1); calcDisplay.innerText = calcExpression || '0'; } 
        else if(btnVal === '=') { 
            try { 
                if (!/^[0-9+\-*/.() ]+$/.test(calcExpression)) { window.jarvisAlert("Geçersiz işlem!", "error", "Güvenlik Duvarı"); return; }
                const result = new Function('return ' + calcExpression)(); 
                calcDisplay.innerText = Number.isInteger(result) ? result : result.toFixed(2); 
                calcExpression = calcDisplay.innerText; 
            } catch(e) { calcDisplay.innerText = 'Hata'; calcExpression = ''; } 
        } else { calcExpression += btnVal; calcDisplay.innerText = calcExpression; } 
    };

    // PDF FATURA
    window.faturaOlustur = function(index, btnEvent) {
        const m = window.musteriler[index]; 
        const sY = window.getEl('dash-yil-secici') ? window.getEl('dash-yil-secici').value : window.mevcutYil; 
        const sA = window.getEl('dash-ay-secici') ? window.getEl('dash-ay-secici').value : window.aylar[0];
        
        let rHtml = ''; let tG = 0; let tZ = 0;
        let bKur = window.ayarlar.kurlar || { '₺': 1, '$': 32.5, '€': 35.0, '£': 41.0 };
        let donusmusHarcama = (Number(m.Harcama) * (bKur[m.HarcamaKur || '₺'] || 1)) / (bKur[window.ayarlar.currency] || 1);
        let faturaButceYazisi = m.Harcama ? (window.formatliPara(donusmusHarcama) + ' ' + window.ayarlar.currency) : 'Belirtilmemiş';

        if (window.ayarlar.columns) {
            window.ayarlar.columns.forEach(col => {
                const v = m.Finans && m.Finans[sY] && m.Finans[sY][sA] ? m.Finans[sY][sA][col.id] : '';
                if(col.type === 'gelir') tG += Number(v) || 0; 
                if(col.type === 'gider') tZ += Number(v) || 0;
                if(v) { rHtml += `<tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 12px; color: #334155;">${window.xssKoru(col.name)}</td><td style="padding: 12px; text-align: right; font-weight: bold; color: #0f172a;">${col.type === 'notr' ? window.xssKoru(v.toString()) : window.formatliPara(v) + ' ' + window.ayarlar.currency}</td></tr>`; }
            });
        }
        const net = tG - tZ;
        let faturaSatirlari = rHtml !== '' ? rHtml : '<tr><td colspan="2" style="padding: 20px; text-align: center; color: #64748b;">Bu döneme ait harcama kaydı bulunmamaktadır.</td></tr>';

        const invDiv = document.createElement('div');
        invDiv.innerHTML = `<div style="padding: 40px; font-family: 'Inter', sans-serif; background: white; width: 800px; color: #1e293b;"><div style="display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px;"><div><h1 style="margin: 0; font-size: 28px; color: #1a2035; font-weight: 800;">VIP OTEL CRM</h1><p style="margin: 5px 0 0 0; color: #64748b;">Misafir Hesap Özeti / Fatura</p></div><div style="text-align: right;"><p style="margin: 0; font-weight: bold; font-size: 18px;">${sA} ${sY}</p><p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</p></div></div><div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;"><h2 style="margin: 0 0 15px 0; font-size: 16px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Misafir Bilgileri</h2><div style="display: flex; justify-content: space-between;"><div><p style="margin: 0 0 8px 0;"><strong>Ad Soyad:</strong> ${window.xssKoru(m.Ad)}</p><p style="margin: 0;"><strong>Telefon:</strong> ${window.xssKoru(m.Telefon) || '-'}</p></div><div style="text-align: right;"><p style="margin: 0 0 8px 0;"><strong>Oda Setup:</strong> ${window.xssKoru(m.Setup) || '-'}</p><p style="margin: 0;"><strong>Transfer:</strong> ${window.xssKoru(m.Transfer) || '-'}</p><p style="margin: 5px 0 0 0; color:#047857; font-weight:bold;"><strong>Harcama Bütçesi:</strong> ${faturaButceYazisi}</p></div></div></div><table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;"><thead><tr style="background: #1a2035; color: white;"><th style="padding: 12px; text-align: left;">Açıklama / Hizmet</th><th style="padding: 12px; text-align: right;">Tutar / Bilgi</th></tr></thead><tbody>${faturaSatirlari}</tbody></table><div style="display: flex; justify-content: flex-end;"><div style="width: 300px; background: ${net >= 0 ? '#ecfdf5' : '#fef2f2'}; padding: 20px; border-radius: 12px; border: 1px solid ${net >= 0 ? '#a7f3d0' : '#fecaca'};"><div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #64748b;">Toplam + (Artı):</span><span style="font-weight: bold;">${window.formatliPara(tG)} ${window.ayarlar.currency}</span></div><div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #64748b;">Toplam - (Eksi):</span><span style="font-weight: bold;">${window.formatliPara(tZ)} ${window.ayarlar.currency}</span></div><div style="display: flex; justify-content: space-between; border-top: 1px solid ${net >= 0 ? '#a7f3d0' : '#fecaca'}; padding-top: 10px; margin-top: 10px;"><span style="font-weight: 800; font-size: 18px; color: ${net >= 0 ? '#047857' : '#b91c1c'};">NET:</span><span style="font-weight: 800; font-size: 18px; color: ${net >= 0 ? '#047857' : '#b91c1c'};">${window.formatliPara(net)} ${window.ayarlar.currency}</span></div></div></div></div>`;
        const btn = btnEvent.currentTarget; const orgHtml = btn.innerHTML; btn.innerHTML = `<span>⏳</span><span>İndiriliyor...</span>`;
        html2pdf().set({ margin: [0, 0, 0, 0], filename: `Fatura_${m.Ad.replace(/\s+/g, '_')}_${sA}_${sY}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } }).from(invDiv).save().then(() => { btn.innerHTML = orgHtml; });
    };

    // EXCEL EXPORT
    const exportExcelBtn = window.getEl('export-excel-btn');
    if(exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            if (window.musteriler.length === 0) { window.jarvisAlert("Kayıt bulunamadı!", "warning"); return; }
            try {
                const sY = window.getEl('dash-yil-secici') ? window.getEl('dash-yil-secici').value : window.mevcutYil; 
                const sA = window.getEl('dash-ay-secici') ? window.getEl('dash-ay-secici').value : window.aylar[0];
                const excelData = window.musteriler.map(({Resim, Kimlik, Pasaport, Sirket, ResimBase64, KimlikBase64, PasaportBase64, Finans, ...rest}) => {
                    let rowData = { ...rest }; 
                    if(window.ayarlar && window.ayarlar.columns) {
                        window.ayarlar.columns.forEach(col => { 
                            rowData[`${sY} ${sA} ${col.name}`] = Finans && Finans[sY] && Finans[sY][sA] ? Finans[sY][sA][col.id] : 0; 
                        }); 
                    }
                    return rowData;
                });
                const yol = window.jarvisAPI.pathJoin(window.jarvisAPI.getDesktopDir(), `Otel_Misafir_${sY}_${sA}.xlsx`); 
                window.jarvisAPI.exportExcel(excelData, yol); 
                window.jarvisAlert(`✅ Excel raporu Masaüstüne kaydedildi:\n${yol}`, "success");
            } catch (error) { window.jarvisAlert("Hata:\n" + error.message, "error"); }
        });
    }

    // SAĞ TIK / SİLME MENÜSÜ
    const customContextMenu = window.getEl('custom-context-menu');
    const contextMenuText = window.getEl('context-menu-text');
    window.contextMenuTarget = { type: null, id: null };
    
    window.showContextMenu = function(e, type, id) { 
        e.preventDefault(); window.contextMenuTarget = { type, id }; 
        if(contextMenuText) contextMenuText.innerText = type === 'col' ? 'Sütunu Sil' : 'Görevi Sil'; 
        if(customContextMenu) {
            customContextMenu.style.left = e.clientX + 'px'; customContextMenu.style.top = e.clientY + 'px'; customContextMenu.classList.remove('hidden'); 
            setTimeout(() => { customContextMenu.classList.remove('scale-95', 'opacity-0'); customContextMenu.classList.add('scale-100', 'opacity-100'); }, 10); 
        }
    };

    document.addEventListener('click', (e) => { 
        if (customContextMenu && !customContextMenu.classList.contains('hidden') && !customContextMenu.contains(e.target)) { 
            customContextMenu.classList.remove('scale-100', 'opacity-100'); customContextMenu.classList.add('scale-95', 'opacity-0'); 
            setTimeout(() => { customContextMenu.classList.add('hidden'); }, 100); 
        } 
    });
};