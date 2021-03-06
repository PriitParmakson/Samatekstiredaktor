'use strict';

/* Teksti redigeerimisega seotud funktsioonid
*/
function seaRedaktoriKasitlejad() {
  /*
    Teksti muutvaid klahvivajutusi käsitletakse sündmuste 'keydown', 'keypress' ja 'paste' kaudu.
    Sündmus 'keydown' tekib klahvi vajutamisel esimesena.
    Seejärel tekib 'keypress'.
    Teksti navigeerivaid (caret-d muutvaid) sündmusi (vasakule,
    paremale) otseselt ei töötle, välja arvatud see, et nende toime blokeeritakse veateaterežiimis.
    Caret positsioon selgitatakse välja siis, kui kasutaja vajutab klahvi, mida töödeldakse.
  */
  $('#Tekst').on('keydown', (e) => keydownKasitleja(e));
  $('#Tekst').on('keypress', (e) => keypressKasitleja(e));
  $('#Tekst').on('paste', (e) => pasteKasitleja(e));
}

function keydownKasitleja(e) {
  /* 
  Sündmuse KEYDOWN käsitleja. Püüame kinni eriklahvide 
   vajutused, mida tahame töödelda: 8 (Backspace), 46 (Delete), 
   33 (PgUp), 34 (PgDn), 38 (Up), 40 (Down). Nende vaikimisi 
   toiming tühistatakse ja vajutusi käsitletakse spetsiifiliselt.

   Märkus. Ctrl + klahv vajutustest tekib kaks KEYDOWN sündmust - esimene keyCode = 17 (Ctrl), seejärel keyCode = klahvi kood (tõeväärtus ctrlDown on mõlemal juhul tõene).
  */
  var keyCode = e.keyCode;
  var ctrlDown = e.ctrlKey||e.metaKey // Mac-i tugi

  /*
  Kui veateade on kuvatud (kasutaja ei ole seda sulgenud), siis klahvivajutused väljas #Tekst ei oma mõju.
  */
  if (!$('#Teatepaan').hasClass('peidetud')) {
    e.preventDefault();
    return
  }

  // Logimine
  if (logimistase > 1) {
    console.log('keydown käsitleja: püüdsin kasutaja klahvivajutuse: ' + (ctrlDown ? ' Ctrl + ' : ' ') + keyCodeToHumanReadable(keyCode) + '(' + keyCode + ')');
  }

  // Kui Ctrl+c (keyCode 67) või Ctrl+v (keyCode 86), siis lase seda käsitleda vastavatel süsteemsetel sündmusekäsitlejatel
  if (ctrlDown && [67, 86].includes(keyCode)) { return }

  if ([8, 46, 33, 34, 38, 40].includes(keyCode)) {
    e.preventDefault();
    tootleEriklahv(keyCode);
  }
}

function keypressKasitleja(e) {
  /* 
    Sündmuse KEYPRESS käsitleja. Kui klahvivajutusest tekkis tärgikood, siis suunatakse tähe või punktuatsioonimärgi töötlusele. Kontroll, kas märgikood on lubatute hulgas, tehakse lisaTahtVoiPunktuatsioon-is. Vaikimisi toiming tõkestatakse.

    Sündmus KEYPRESS tekib ka Ctrl-kombinatsioonide vajutamisel.
  
    Kui Teatepaan on avatud (asetamise viga), siis ignoreeritakse.
  */
  var charCode = e.charCode;
  var ctrlDown = e.ctrlKey||e.metaKey // Mac-i tugi

  if (!$('#Teatepaan').hasClass('peidetud')) {
    // Asetamise veateade tuleb enne sulgeda
    e.preventDefault();
    return
  }

  // Võte reavahetuse (enter, keyCode 13) kinnipüüdmiseks ja töötlemiseks
  if (e.keyCode == 13) {
    charCode = 13;
  }

  // Logimine
  if (logimistase > 1) {
    if (ctrlDown) {
      console.log('keypress käsitleja: püüdsin kasutaja klahvivajutuse Ctrl'); 
    }
    else {
      console.log('keypress käsitleja: püüdsin kasutaja klahvivajutuse ' + String.fromCharCode(charCode) + ' (tärgikood: ' + charCode + ')');
    }
  }

  // Ctrl-kombinatsioone tähesisestuseks ei loe
  if (!ctrlDown && charCode != null && charCode != 0) {
    e.preventDefault();
    lisaTahtVoiPunktuatsioon(charCode);
  }
}

function pasteKasitleja(e) {
  /* Ctrl-V (Paste) töötleja
     Tavaline sirvija -> e.originalEvent.clipboardData
     Ebatavaline sirvija -> window.clipboardData
  */

  if (!$('#Teatepaan').hasClass('peidetud')) {
    // Asetamise veateade tuleb enne sulgeda
    e.preventDefault();
    return
  }    

  var clipboardData = e.clipboardData || e.originalEvent.clipboardData || window.clipboardData;
  var LisatavTekst = clipboardData.getData('text');
  /* Lasta vaikereaktsioonil toimuda. 
     Selleks:
     1) seada taimer, vt          https://stackoverflow.com/questions/4532473/is-there-an-event-that-occurs-after-paste.
     2) puhastada sisend kõrvalistest tärkidest. Eriti on vaja kõrvaldada &#8203; (Zero-Width Space)
     3) Kontrollida, kas asetamise tulemusena tekkinud tekst on samatekst.
     4) Kui ei ole, siis anda veateade ja sisendit mitte aktsepteerida.
     5) Oodata, kuni kasutaja vajutab veateatepaani sulgemisnupule.
     Taastada siseesituse põhjal toimingueelne tekst.
     Mittesamateksti puhul kuvada rõhutatult otstest vaadates esimene tähepaar, mis rikub peegeldust.
  */
  setTimeout(function() {
    var asetatudTekst = $('#Tekst').text();
    console.log('paste käsitleja: asetatud tekst: ' + asetatudTekst);
    var puhastatudTekst = puhastaTekst(asetatudTekst);
    var samasuseKontrolliTulemus = samatekst(puhastatudTekst);
    if (samasuseKontrolliTulemus.on) {
      /* Moodusta siseesitus.  samuti lisa sisekursor (algusesse)
      */
      var siseEsituses = tekstistSiseesitusse(puhastatudTekst);
      t = siseEsituses.tekst;
      kuvaKesktahtYhekordselt = siseEsituses.kuvaKesktahtYhekordselt;
      kuvaTekst();
      aktiveeriTekstinupud();
    }
    else {
      var p1 = samasuseKontrolliTulemus.mittepeegelpaar[0];
      var p2 = samasuseKontrolliTulemus.mittepeegelpaar[1];
      var teatetekst = 'Asetatud tekst ei ole samatekst.<br><br>';
      teatetekst = teatetekst + 
        puhastatudTekst.substring(0, p1) +
        '<span class="kesk">' + 
        puhastatudTekst.substring(p1, p1 + 1) +
        '</span>' +
        puhastatudTekst.substring(p1 + 1, p2) +
        '<span class="kesk">' + 
        puhastatudTekst.substring(p2, p2 + 1) +
        '</span>' + 
        puhastatudTekst.substring(p2 + 1);
      kuvaTeade(teatetekst, 'NOK');
    }
  }, 50);
}

function tootleEriklahv(keyCode) {
  /*
    Töötleb 'keydown' kaudu kinnipüütud huvipakkuvaid klahvivajutusi.
  */

  tuvastaCaretJaSeaSisekursor();

  switch (keyCode) {
    case 8: // Backspace
      t = tootleBackspace(t);
      break;
    case 46: // Delete
      t = tootleDelete(t);
      break;
    case 33: // PgUp
      kuvaKesktahtYhekordselt = true;
      break;
    case 34: // PgDn
      kuvaKesktahtYhekordselt = false;
      break;
    case 38: // Up
      t = suurtaheks(t);
      break;
    case 40: // Down
      t = vaiketaheks(t);
      break;
  }
  aktiveeriTekstinupud(); // Kontrollib, kas tekkis tühitekst ja seab vastavalt nupud 
  kuvaTekst();
}

function lisaTahtVoiPunktuatsioon(charCode) {
  /*
   Lisa kasutaja sisestatud täht või kirjavahemärk
  */
   
  // Kontrollib, kas märgikood on lubatute hulgas
  if (!(taht(charCode) || kirjavmKood(charCode))) {
    return
  }

  tuvastaCaretJaSeaSisekursor();

  // Enter vajutus asenda siseesituses tärgiga '/'.
  var charTyped = charCode == 13 ? '/' : String.fromCharCode(charCode);

  // Standardne logimine
  if (logimistase > 1) {
    console.log('tootleEriklahv: töötlen eriklahvi: ' + charTyped);
  }

  // Sisestatud tärgi lisamine siseesitusse
  var osad = t.split("|");
  var tekstEnne = osad[0]; // Tekst enne joont
  var tekstParast = osad[1]; // Tekst pärast joont
  var tE = tahti(tekstEnne); // Tähti enne osas
  var tP = tahti(tekstParast); // Tähti pärast osas
  var acc = ""; // Akumulaator
  var taheloendur = 0;

  // Mitut tühikut järjest mitte lubada, sest nende kuvamine vajaks teistsugust lahendust
  if (charCode == 32 && tE > 0 && tekstEnne.charCodeAt(tekstEnne.length - 1) == 32) {
    return
  }

  if (kirjavmKood(charCode)) {
    t = tekstEnne + charTyped + "|" + tekstParast;
  }
  // Tähe puhul lisada ka peegeltäht
  else if (tE == tP) {
    // Lisa peegelsümbol kohe joone taha
    t = tekstEnne + charTyped + "|" + charTyped + tekstParast;
  }
  else if (tE < tP) {
    // Lisa peegeltäht tekstParast-sse
    // tähe tP - tE järele
    for (var i = 0; i < tekstParast.length; i++) {
      acc = acc + tekstParast[i];
      // Kui on täht..
      if (!kirjavm(tekstParast[i])) {
        taheloendur++;
        // Lisada peegeltäht?
        if (taheloendur == tP - tE) {
          acc = acc + charTyped;
        }
      }
    }
    t = tekstEnne + charTyped + "|" + acc;
  }
  else if (tE > tP) {
    // Lisa peegeltäht tekstEnne-sse tähe tP + 1 ette
    for (var i = 0; i < tekstEnne.length; i++) {
      // Kui on täht..
      if (!kirjavm(tekstEnne[i])) {
        taheloendur++;
        // Lisada peegeltäht?
        if (taheloendur == tP + 1) {
          acc = acc + charTyped;
        }
      }
      acc = acc + tekstEnne[i];
    }
    t = acc + charTyped + "|" + tekstParast;
  }

  aktiveeriTekstinupud();
  t = eemaldaLiigsedTyhikud(t, kuvaKesktahtYhekordselt);
  kuvaTekst();
}

function tuvastaCaretJaSeaSisekursor() {
  /*
   Selgita välja caret positsioon, sest kasutaja võib olnud seda muutnud ja sea vastavalt sisemine kursor.
   Tühja teksti puhul NO OP.
   Arvesta ka, et tühja teksti puhul on esimeses span-elemendis 0-pikkusega tühik (et hoida div-elemendi mõõtmeid).
  */
  if (t.length == 1) {
    return
  }

  // Leia span element, kus valik algab ja valiku alguspositsioon selles elemendis
  var r = document.getSelection().getRangeAt(0);
  var algusSpan = r.startContainer.parentNode.id;
  var algusPos = r.startOffset;  
  if (logimistase > 1) {
    console.log('tuvastaCaretJaSeaSisekursor:' + ' sirvija teatab, et caret on tipus ' + algusSpan.toString() + ', positsioonis ' + algusPos.toString());
  }

  // Leia siseesituses positsioon, kuhu sisemine kursor (|) liigutada.
  var tipuIDd = ['A', 'K1', 'Kt', 'K2', 'B'];
  var kum = 0; // Kumulatiivne positsioon
  for (var i = 0; i < tipuIDd.length; i++) {
    if (tipuIDd[i] == algusSpan) {
      kum += algusPos;
      break
    }
    else {
      kum += $('#' + tipuIDd[i]).text().length;
    }
  }
  if (algusSpan == 'B' && kuvaKesktahtYhekordselt) {
    kum += 1; // Sest siseesituses on kesktäht alati kahekordselt
  }

  // Aseta sisemine kursor positsioonile kum
  t = t.replace('|', '');
  if (kum == 0) {
    t = '|' + t;
  }
  else {
    t = t.replace(new RegExp('.{' + kum + '}'), '$&' + '|');
  }

  // Tagasta teade logimise tarbeks
  if (logimistase > 1) {
    console.log('tuvastaCaretJaSeaSisekursor: ' + ' seatud sisekursor: ' + t);
  }
}

function tootleBackspace(t) {
  /*
    Eemaldab siseesituses kursori ees oleva tärgi.
    Kui eemaldamise tulemus tekkis korduv tühik, siis eemaldab ka selle.
  */
  var uusTekst;

  // Teksti alguses mõju ei ole
  if (t[0] == '|') {
    uusTekst = t;
    return uusTekst;
  }

  // Kui eemaldatav tärk on kirjavahemärk, siis peegeltähe eemaldamist pole
  if (kirjavm(t[t.indexOf('|') - 1])) {
    uusTekst = t.substring(0, t.indexOf('|') - 1) + t.substring(t.indexOf('|'));
  }
  else if (taht(t.charCodeAt(t.indexOf('|') - 1))) {
    var eemaldatavTaht = tahti(t.split('|')[0]); // Numeratsioon 1-st
    var eemaldatavPeegeltaht = tahti(t) - eemaldatavTaht + 1;
    var acc = ""; // Akumulaator
    var taheloendur = 0;
    
    // Läbides teksti, eemaldan tähe koos selle peegeltähega
    for (var i = 0; i < t.length; i++) {
      if (taht(t.charCodeAt(i))) {
        taheloendur++;
        if (taheloendur == eemaldatavTaht ||
          taheloendur == eemaldatavPeegeltaht) {
          // Jätta vahele
        }
        else {
          acc += t[i];
        }
      }
      else {
        acc += t[i];
      }
    }

    uusTekst = acc;
  }
  else { // Ei täht ega kirjavahemärk
    console.log('tootleBackspace: tekst sisaldab tärki, mis pole lubatud täht ega kirjavahemärk.')
  }

  uusTekst = eemaldaLiigsedTyhikud(uusTekst, kuvaKesktahtYhekordselt);
  return uusTekst;
}

function tootleDelete(t) {
  /*
    Eemaldab siseesituses kursori järel oleva tärgi.
    Kui eemaldamise tulemus tekkis korduv tühik, siis eemaldab ka selle.
  */
  var uusTekst;

  // Teksti lopus mõju ei ole
  if (t.indexOf('|') == t.length) {
    uusTekst = t;
    return uusTekst;
  }

  // Kui eemaldatav tärk on kirjavahemärk, siis peegeltähe eemaldamist pole
  if (kirjavm(t[t.indexOf('|') + 1])) {
    uusTekst = t.substring(0, t.indexOf('|') + 1) + t.substring(t.indexOf('|') + 2);
  }
  else if (taht(t.charCodeAt(t.indexOf('|') + 1))) {
    var eemaldatavTaht = tahti(t.split('|')[0] + 1); // Numeratsioon 1-st
    var eemaldatavPeegeltaht = tahti(t) - eemaldatavTaht + 1;
    var acc = ""; // Akumulaator
    var taheloendur = 0;
    
    // Läbides teksti, eemaldan tähe koos selle peegeltähega
    for (var i = 0; i < t.length; i++) {
      if (taht(t.charCodeAt(i))) {
        taheloendur++;
        if (taheloendur == eemaldatavTaht ||
          taheloendur == eemaldatavPeegeltaht) {
          // Jätta vahele
        }
        else {
          acc += t[i];
        }
      }
      else {
        acc += t[i];
      }
    }

    uusTekst = acc;
  }
  else { // Ei täht ega kirjavahemärk
    console.log('tootleBackspace: tekst sisaldab tärki, mis pole lubatud täht ega kirjavahemärk.')
  }

  uusTekst = eemaldaLiigsedTyhikud(uusTekst, kuvaKesktahtYhekordselt);
  return uusTekst;
}

