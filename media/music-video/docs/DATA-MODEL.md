# Model Data (ERD) — Timeline Video

Video ini "data-driven": timeline adalah daftar entitas yang dievaluasi per frame. Model di bawah setara ERD untuk sistem render.

```mermaid
erDiagram
    TIMELINE ||--o{ SHOT : "berisi (77)"
    TIMELINE ||--|| BEAT_MAP : "disinkronkan ke"
    TIMELINE ||--o{ SUBTITLE_CUE : "menampilkan (35)"
    SHOT ||--o{ ACTOR_POSE : "menggambar per frame"
    SHOT }o--o{ PROP : "memakai"
    SHOT }o--|| BACKGROUND : "memakai"
    ACTOR_POSE }o--|| CAST : "karakter"
    ACTOR_POSE }o--|| OUTFIT : "pakaian"
    ACTOR_POSE }o--|| EXPRESSION : "ekspresi (blend 2)"
    ACTOR_POSE ||--o{ LIMB_TARGET : "4 anggota tubuh"

    TIMELINE { float duration "233.712 s" int frames "7012" int fps "30" }
    SHOT { int idx PK string name float at "waktu rencana" float start "di-snap ke beat" float end int f0 int f1 string trans "cut|zoom" fn draw "(ctx, lt, T, dur)" }
    BEAT_MAP { float tempo "161.5" float[] beats "614" int downbeat_phase float[] rms30 float[] voc30 }
    SUBTITLE_CUE { float start float end string text "maks 2 baris" }
    ACTOR_POSE { float x float y float s int flip float turn "-1..1" float lean float crouch float jump float squash float headTilt string mic "R|L (opsional)" obj look obj fx obj acc obj hold }
    LIMB_TARGET { string limb "armL|armR|legL|legR" float x float y float z "kedalaman (opsional, auto)" float pitch "kaki: + jari naik / - tumit naik" float elbowOut "opsional" string hand "open|fist|point|thumb|peace|ok|hold" }
    CAST { string id PK "main|sari|budi|maya" string skin string hair string style "shaggy(main)|long|buzz|bun" }
    OUTFIT { string id PK "hoodie|pajama|pink|orange|purple|green" string top string pants string shoe }
    EXPRESSION { string id PK string eye "normal|wide|happy|closed|squeeze|star|heart|wink" float lidTop float lidAng float browY float browAng float mOpen float smile float mW float blush float pupil }
    PROP { string id PK "phone|laptop|rocket|speedometer|shield|trophy|plant|..." }
    BACKGROUND { string id PK "bedroom|deskRoom|brandBg|stage|serverRoom|hills|sky+city" }
```

## Aturan integritas
- `SHOT.start` naik monoton; `SHOT.end = SHOT[i+1].start`; shot terakhir berakhir di `TIMELINE.duration`.
- Σ(`f1 − f0`) = `TIMELINE.frames` (7012) — diverifikasi di AUDIT.
- Karakter utama selalu `CAST=main`; outfit hanya `pajama` (adegan pagi) → `hoodie` (setelah ganti baju di 0:16).
- Lengan/kaki: panjang segmen tetap (62+58 / 50+48 + tinggi pergelangan 18); siku/lutut diselesaikan IK 3D + pole vector (ADR-005/006).
- Target kaki = titik kontak tanah di bawah pergelangan; gait jalan/lari dihitung dari jarak tempuh (slip 0).
- `SUBTITLE_CUE` tidak tumpang tindih; ≤ 2 baris; ≤ 42 karakter/baris.

## Lokasi kode
| Entitas | File |
|---|---|
| TIMELINE, frame driver | `src/timeline.js` |
| SHOT | `src/shots1.js`, `src/shots2.js` |
| ACTOR_POSE, CAST, OUTFIT, EXPRESSION | `src/character.js` |
| BACKGROUND | `src/bg.js` |
| PROP, UI layar | `src/ui.js` |
| BEAT_MAP | `analysis/beats.py` → `analysis/beats.json` |
| SUBTITLE_CUE | `src/subtitles.js` |
