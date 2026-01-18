import CryptoJS from "crypto-js";

const AES_SECRET = import.meta.env.VITE_MY_ENCRYPTION_SECRET_KEY;

export function decrypt(text: string) {
    try {
        const bytes = CryptoJS.AES.decrypt(text, AES_SECRET);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted || text;
    } catch {
        return text;
    }
}
