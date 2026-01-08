# OER (Office Equipment Request)

Aplikasi web untuk pengajuan permintaan peralatan kantor (OER).

## Fitur
- **User**: Register/Login, Submit Request (PC, NB/MN/TAB, Software, Lain-lain), Lihat Status Request.
- **Admin**: Dashboard semua request, Filter by Category, Update Status (Active / Close).
- **Keamanan**: Proteksi registrasi dengan Access Code, Role-based Access Control (User vs Admin).

## Struktur File
- `/public`: Folder utama untuk hosting (GitHub Pages).
  - `index.html`: Dashboard User.
  - `admin.html`: Dashboard Admin.
  - `login.html` / `register.html`: Autentikasi.
  - `js/`: Logika aplikasi (Firebase, Auth, Dashboard, Form).
  - `css/`: Styling.

## Cara Penggunaan

### 1. Persiapan Firebase
1. Buat project baru di [Firebase Console](https://console.firebase.google.com/).
2. **Authentication**: Aktifkan provider **Email/Password**.
3. **Firestore Database**: Buat database (mode production atau test).
4. **Project Settings**: Copy konfigurasi Firebase SDK (apiKey, authDomain, dll).
5. Buka `public/js/firebase.js` dan tempel konfigurasi Anda pada variabel `firebaseConfig`.

### 2. Setup Admin
- Secara default, user yang mendaftar adalah **User Biasa**.
- Untuk menjadikan user sebagai **Admin**:
  1. User mendaftar seperti biasa.
  2. Buka Firestore Console > collection `users`.
  3. Cari dokumen user tersebut, ubah field `role` dari `'user'` menjadi `'admin'`.
  4. Atau, edit `public/js/auth.js` dan tambahkan email admin ke `ADMIN_EMAILS` agar otomatis jadi admin saat register.

### 3. Password Akses Registrasi
- Kode default: `OER2024` (bisa diubah di `public/js/auth.js` variabel `ACCESS_CODE`).

### 4. Deploy ke GitHub Pages
1. Push kode ke repository GitHub.
2. Buka Settings > Pages.
3. Pilih Source: `main` (atau `master`) branch.
4. Pilih folder: `/public` (jika GitHub mendukung deploy dari subfolder selain /docs, jika tidak, pindahkan isi `/public` ke root atau gunakan `gh-pages` branch).
   - *Alternatif*: Pindahkan semua isi folder `public` ke root repository agar langsung terbaca.

## Keamanan Firebase (Firestore Rules)
Salin aturan berikut ke tab **Rules** di Firestore Console untuk keamanan data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Requests collection
    match /requests/{requestId} {
      // User can read their own, Admin can read all
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || isAdmin());
      
      // Any auth user can create
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      
      // Only Admin can update (e.g. status)
      allow update: if request.auth != null && isAdmin();
    }
  }
}
```

## Kontak
Hubungi IT Department untuk pertanyaan lebih lanjut.
