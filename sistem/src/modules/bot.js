// =====================================================================
// JARVIS OTONOM AKILLI BOT (BİRLEŞTİRME KORUMALI)
// =====================================================================

window.initOtonomBot = function() {
    const btnOtonomBaslat = window.getEl('btn-otonom-baslat');
    const otonomFileInput = window.getEl('otonom-file-input');

    if (!btnOtonomBaslat || !otonomFileInput) return;

    btnOtonomBaslat.addEventListener('click', () => { otonomFileInput.click(); });
    
    otonomFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        window.jarvisConfirm(`${file.name} dosyası okunsun ve içindeki tüm veriler (TC, Telefon, İsim) otomatik eşleştirilerek sisteme gömülsün mü?\n\n(Aynı kişi varsa tekrar kaydedilmez, eksik verileri tamamlanır)`, () => {
            try {
                const fileContent = window.jarvisAPI.readFileSyncStr(file.path);
                const satirlar = fileContent.split('\n').map(s => s.trim()).filter(s => s.length > 0);

                if (satirlar.length === 0) {
                    window.jarvisAlert("Dosya boş veya geçerli bir kayıt bulunamadı.", "warning", "İşlem İptal Edildi");
                    return;
                }

                let eklenenSayisi = 0;
                let guncellenenSayisi = 0;

                satirlar.forEach(satir => {
                    let ad = satir;
                    let telefon = "";
                    let tc = "";

                    const tcMatch = ad.match(/\b[1-9][0-9]{10}\b/);
                    if (tcMatch) { tc = tcMatch[0]; ad = ad.replace(tc, '').trim(); }

                    const telMatch = ad.match(/(\+?[\d\s\-\(\)]{10,})/);
                    if (telMatch && telMatch[0].replace(/\D/g, '').length >= 10) {
                        telefon = telMatch[0].trim();
                        ad = ad.replace(telMatch[0], '').trim();
                    }
                    
                    ad = ad.replace(/^[\s,\-]+|[\s,\-]+$/g, '').trim();
                    if (!ad) ad = "İsimsiz Misafir";

                    let mevcutMusteri = window.musteriler.find(m => {
                        let sameTC = (tc && m.TC && m.TC === tc);
                        let samePhone = (telefon && m.Telefon && m.Telefon.replace(/\D/g, '') === telefon.replace(/\D/g, '') && telefon.length > 5);
                        let sameName = (m.Ad && m.Ad.toLowerCase() === ad.toLowerCase());
                        return sameTC || samePhone || sameName;
                    });

                    if (mevcutMusteri) {
                        let guncellendiMi = false;
                        if (!mevcutMusteri.TC && tc) { mevcutMusteri.TC = tc; guncellendiMi = true; }
                        if (!mevcutMusteri.Telefon && telefon) { mevcutMusteri.Telefon = telefon; guncellendiMi = true; }
                        if (!mevcutMusteri.Ad || mevcutMusteri.Ad === "İsimsiz Misafir") { mevcutMusteri.Ad = ad; guncellendiMi = true; }
                        if (guncellendiMi) guncellenenSayisi++;
                    } else {
                        const yeniMusteri = {
                            Ad: window.xssKoru(ad), TC: window.xssKoru(tc), Telefon: window.xssKoru(telefon), Email: "", Sehir: "", Adres: "", Setup: "", Transfer: "Bilinmiyor", Oteller: "", Harcama: "0", HarcamaKur: window.ayarlar.currency, Sirket: "Misafir", Resim: null, Kimlik: null, Pasaport: null, Finans: {}
                        };
                        yeniMusteri.Finans[window.mevcutYil] = {};
                        window.aylar.forEach(ay => yeniMusteri.Finans[window.mevcutYil][ay] = {});
                        window.musteriler.push(yeniMusteri);
                        eklenenSayisi++;
                    }
                });

                if (window.verileriKaydet) window.verileriKaydet(); 
                window.jarvisAlert(`✅ Otonom Entegrasyon Tamamlandı!\n\nYeni Eklenen: ${eklenenSayisi} kişi\nEksikleri Tamamlanan: ${guncellenenSayisi} kişi`, "success", "İşlem Raporu");
            } catch (err) { window.jarvisAlert("Dosya okunurken bir hata oluştu:\n" + err.message, "error"); }
        });
        e.target.value = ''; 
    });
};