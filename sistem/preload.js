const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const XLSX = require('xlsx');

const SECRET_KEY = crypto.createHash('sha256').update('Jarvis_VIP_Otel_Secure_Bora_2026!').digest();

contextBridge.exposeInMainWorld('jarvisAPI', {
    getHomedir: () => os.homedir(),
    getDesktopDir: () => path.join(os.homedir(), 'Desktop'),
    pathJoin: (...args) => path.join(...args),
    existsSync: (p) => fs.existsSync(p),
    mkdirSync: (p) => fs.mkdirSync(p),
    readFileSyncStr: (p) => fs.readFileSync(p, 'utf8'),
    writeFileSyncStr: (p, data) => fs.writeFileSync(p, data, 'utf8'),
    unlinkSync: (p) => fs.unlinkSync(p),
    hashPIN: (pin) => crypto.createHash('sha256').update(pin).digest('hex'),
    encryptText: (text) => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, iv);
        return iv.toString('hex') + ':' + Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]).toString('hex');
    },
    decryptText: (text) => {
        try {
            const parts = text.split(':');
            const iv = Buffer.from(parts.shift(), 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, iv);
            return Buffer.concat([decipher.update(Buffer.from(parts.join(':'), 'hex')), decipher.final()]).toString('utf8');
        } catch (e) { return null; }
    },
    fotoKaydet: (sourcePath, destDir) => {
        if (!sourcePath) return null;
        try {
            const buf = fs.readFileSync(sourcePath);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, iv);
            const fn = Date.now() + "_" + Math.floor(Math.random() * 1000) + ".jrv";
            fs.writeFileSync(path.join(destDir, fn), Buffer.concat([iv, cipher.update(buf), cipher.final()]));
            return fn;
        } catch (error) { return null; }
    },
    okuBase64Sifreli: (imgPath) => {
        if (!fs.existsSync(imgPath)) return null;
        try {
            const fB = fs.readFileSync(imgPath);
            const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, fB.slice(0, 16));
            return Buffer.concat([decipher.update(fB.slice(16)), decipher.final()]).toString('base64');
        } catch (e) { return null; }
    },
    yazBase64Sifreli: (b64, destDir) => {
        if (!b64) return null;
        try {
            const buf = Buffer.from(b64, 'base64');
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, iv);
            const n = Date.now() + "_" + Math.floor(Math.random() * 1000) + ".jrv";
            fs.writeFileSync(path.join(destDir, n), Buffer.concat([iv, cipher.update(buf), cipher.final()]));
            return n;
        } catch (e) { return null; }
    },
    exportExcel: (data, filePath) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Misafirler");
        XLSX.writeFile(workbook, filePath);
    }
});