LUMEN PREP — IELTS STUDY STUDIO
Jumys isteitin alğashqy iPhone PWA nusqasy (v1.0)

MAÑYZDY:
Bul App Store-dağı native iOS qosymshasy emes. Safari arqyly ashylyp,
iPhone Home Screen betine ornatyla alatyn web-app (PWA).

QOSYMSHADA NE BAR?
- Home: target band, study streak, daily sessions
- Reading: 4 test surağy, jauap pen tüsindirme
- Listening: telefondyñ English text-to-speech dauysy men 4 suraq
- Writing: Academic Task 1, Task 2; söz sanau, avtomatty draft saqtau
- Speaking: 60-second preparation + 120-second speaking timer
- Progress: statistika, songy sessiondar
- Profile: maqsat bandyn ögertu, aqparatty öshiru

BÄRI BEKERSHİ / EXTERNAL SERVER JOQ
Progress tek osy qurylğydağy brauzerdıñ localStorage arqyly saqtalady.
Aqparat basqa telefonda avtomatty türde körinbeidi.
Mini-test nätijesi IELTS resmi band score emes.

IPHONE-MEN QOSYMSHANY JARIYALAU (GITHUB PAGES):
1. iPhone-dan Safari arqyly https://github.com aşyñyz.
2. Account jasap, New repository tañdañyz.
3. Repository aty: lumen-prep, Visibility: Public.
4. Repository ishinde Add file > Upload files arqyly ZIP-tan şyğarılğan
   index.html, styles.css, app.js, manifest.webmanifest, sw.js,
   icon-192.png jäne icon-512.png faildaryn jükteñiz.
   ZIP faildyñ özın emes, ISHINDEGI faildardy jükteñiz.
5. Commit changes tañdañyz.
6. Settings > Pages > Build and deployment: Deploy from a branch.
   Branch: main; folder: /(root); Save.
7. Pages bölimi jariyalanğan sayt siltemesin körsetedi.
   Ädette: https://USERNAME.github.io/lumen-prep/
   (USERNAME ornyna öz GitHub ataýyñyz qoyylady.)
8. Sol siltemeni iPhone Safari-da ashyñyz.
9. Share > Add to Home Screen > Open as Web App > Add.
10. Endi Home Screen-da Lumen Prep ikonasy bolady.

EGER 'ADD FILE' BATYRMASY KÖRINBESE:
Safari-da Page Menu > Request Desktop Website qosyp körıñız.

IOS ESKERTPELERI:
- Audio tapsyrmasy iPhone qurylğysynda bar dauys funkcijasyn qoldanady.
- Offline režim sayt bir ret internetpen ashylğannan keiın jumys isteui mümkin.
- Safari site data tazalansa progress pen drafttar joiyluy mümkin.
- Bul demo IELTS men resmi baylanysqan emes.

FAILDAR:
index.html            — qosymşanyñ negizgi beti
styles.css            — tolýq design (iPhone responsive)
app.js                — tapsyrmalar, timer, data, navigatsiya
manifest.webmanifest  — Home Screen qosymşa parametrlery
sw.js                 — offline cache
icon-192.png, icon-512.png — ikonalar

Kod HTML / CSS / JavaScript negizinde jazyldy. Server, aqyly subscription,
API kiltter qajet emes.
