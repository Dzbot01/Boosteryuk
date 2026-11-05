# Gambar OTP dinamis & testimoni channel

Saat OTP pertama diterima (Server 1 maupun 2), bot:
1. **User**: tetap menerima pesan kode `🔑 Kode OTP …` + tombol 📋 Salin (tidak berubah).
2. **Admin**: log `INCOME: NOMOR OTP` + pesan sukses.
3. **Channel testimoni**: pesan sukses yang sama sebagai testimoni.

Pesan sukses = **foto dinamis** (kode OTP digambar di template `gambar-otp`) + caption blockquote
(judul, garis pembatas, User, Lay
lanan, Nomor tersensor `+62812********`, OTP) + tombol
**📋 Salin Kode OTP** dan **🛒 Beli OTP Murah** (`https://t.me/PanelKitaLegalbot`).
Gambar dibuat sekali per order lalu dipakai untuk admin & channel.

Cadangan: canvas belum terpasang / kode di luar pola `^[0-9A-Za-z-]{3,12}$` / kirim foto gagal →
rich message (judul + `<hr/>` + tabel) → teks. OTP tidak pernah hilang.

## ID channel (hardcode)
`bot/bot/index.js`:
```js
let OTP_TESTI_CHANNEL_ID = "-1003992898454";
```
Saat ini: `-1003992898454`. Kosong = testimoni channel tidak dikirim. Bot **harus admin** di channel tersebut.
Cara cari ID: teruskan satu postingan channel ke @userinfobot / @RawDataBot, atau lihat log bot saat bot dimasukkan ke channel.

## Pemasangan di server
```bash
cd /root/bot/bot
npm install @napi-rs/canvas@^1.1.0     # sudah tercantum di package.json; atau: npm install
node -e "require('./gambar-otp').buatGambarOtp('123456').then(r=>console.log('OK', r.buffer.length))"
node --check index.js && pm2 restart boosteryuk
```
- Folder `bot/bot/gambar-otp/` wajib ikut di-upload (template `templates/otp/latar.png`, font `fonts/Inter-ExtraBold.otf`, `lib/`).
- `@napi-rs/canvas` memakai biner jadi (Linux x64/arm64, Node ≥ 18), tanpa paket sistem.
- Ganti gambar / posisi angka: lihat `bot/bot/gambar-otp/README.md` (bagian "Ganti gambar / atur posisi").

## Validasi
- Library: 20/20 tes bawaan; render nyata dari salinan di bot: `123456`, `G-482791` (font mengecil), `7788 99` (spasi dibuang) OK; `12` & 13 karakter ditolak → cadangan.
- Bot: `bot/test/batch10.test.cjs` 31/31 (foto dinamis ke admin + channel, cadangan rich, channel kosong).
