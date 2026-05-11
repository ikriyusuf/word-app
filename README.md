# WordApp | Premium Vocabulary Learning Experience

WordApp, İngilizce kelime dağarcığınızı geliştirmek için tasarlanmış, Apple'ın minimalist ve kullanıcı dostu tasarım dilinden (Human Interface Guidelines) ilham alan, modern ve güvenli bir web uygulamasıdır.

![Premium Design](https://img.shields.io/badge/Design-Apple--Style-blue?style=flat-square)
![Vite](https://img.shields.io/badge/Framework-Vite-646CFF?style=flat-square&logo=vite)
![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=flat-square&logo=firebase)

## ✨ Özellikler

- **Apple Tasarım Dili:** Yoğun glassmorphism (cam efekti), Inter fontu ve sistem düzeyinde akıcı geçişler.
- **Koyu Mod Desteği:** Sistem ayarlarına otomatik uyum sağlayan, göz yormayan karanlık tema.
- **Sesli Okuma (TTS):** Kelimelere tıklayarak veya quiz sırasında doğru telaffuzları dinleme özelliği.
- **Akıllı Quiz:** Hatalı cevapladığınız kelimelere öncelik veren, ağırlıklı rastgele seçim algoritması.
- **Güvenli Altyapı:** API anahtarlarını `.env` ile gizleyen Vite mimarisi.
- **Merkezi Durum Yönetimi:** Daha temiz ve ölçeklenebilir kod yapısı için geliştirilmiş Store sistemi.

## 🚀 Teknolojiler

- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Modern Flex/Grid & Backdrop Blur)
- **Tooling:** [Vite](https://vitejs.dev/)
- **Backend:** [Firebase](https://firebase.google.com/) (Authentication & Firestore)
- **Deployment:** [Vercel](https://vercel.com/)

## 🛠️ Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/ikriyusuf/w.git
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. `.env` dosyasını oluşturun ve Firebase bilgilerinizi girin:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## 🔐 Deployment (Vercel)

Vercel'e yüklerken, `.env` dosyasındaki tüm anahtarları Vercel panelindeki **Environment Variables** bölümüne eklemeyi unutmayın.

---
*Created with ❤️ by ikriyusuf*
