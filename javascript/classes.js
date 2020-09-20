class Game {
    constructor(){
        this.canv = document.getElementById("canvas");
        this.canvCtx = this.canv.getContext('2d');
        this.pixelBreite = this.canv.width*1;
        this.pixelHoehe = this.canv.height*1;

        this.spielfeld = new Spielfeld();
        this.schlangen = [];
        this.pulse = null; // Variable zum Merken der Schleife
        this.updateIntervall = 25; // Gibt an, alle wie viele Millisekunden Grafik und Logik upgedatet werden sollen.
        this.maximaleLaenge = 0; // Speichert den aktuellen Highscore (Maximale Länge der eigenen Schlange.).
    }
    starteSchleife(){
        if(!this.pulse) this.pulse = setInterval(this.gameSchleife, this.updateIntervall*1);
    }
    stoppeSchleife(){
        clearInterval(this.pulse);
        this.pulse = null;
    }
    gameSchleife(){
        spiel.schlangenUpdaten();
        spiel.spielfeld.updaten();

        //Neu zeichnen:
        spiel.canvCtx.clearRect(0,0,spiel.pixelBreite,spiel.pixelHoehe);
        // Die folgende Codezeile ist auskommentiert, da das Ozeanbild die Sichtbarkeit der Pick-Ups etwas verschlechtert.
        //spiel.canvCtx.drawImage(imageOzean,0,0,spiel.pixelBreite,spiel.pixelHoehe);
        for (let i=0; i<spiel.spielfeld.hindernisse.length; i++) {
            spiel.spielfeld.hindernisse[i].zeichnen();
        }
        for(let i=0; i<spiel.spielfeld.sammelbares.length; i++){
            spiel.spielfeld.sammelbares[i].zeichnen();
        }
        for(let i=0; i<spiel.schlangen.length; i++){
            spiel.schlangen[i].zeichnen();
        }
    }
    schlangenUpdaten(){
        for(let i=0; i<spiel.schlangen.length; i++){
            spiel.schlangen[i].updaten();
        }
    }

    erstelleNeueSchlange(){
        this.schlangen[this.schlangen.length] = new Schlange();
    }
    schlangeHinzufuegen(neueSchlangenElemente){
        this.schlangen[this.schlangen.length] = new Schlange(neueSchlangenElemente);
    }
    schlangeLoeschen(dieSchlange){
        let i = spiel.schlangen.indexOf(dieSchlange);
        spiel.schlangen.splice(i,1);
    }
    // Die folgende Funktion simuliert einen Biss an der übergebenen Position: Die Schlange, die sich an dieser Position befindet,
    // wird in zwei Teile zerteilt.
    schlangeSpalten(xPositionSpaltung,yPositionSpaltung){
        let s= spiel.schlangen;
        let indexSchlange = -1;
        let indexSchlangenbaustein = -1;
        for (let i=0; i<s.length; i++) {
            for(let j=0; j<s[i].schlangenBausteine.length; j++) {
                if ((s[i].schlangenBausteine[j].x == xPositionSpaltung) && (s[i].schlangenBausteine[j].y == yPositionSpaltung)) {
                    indexSchlange = i;
                    indexSchlangenbaustein = j;
                }
            }
        }
        if ((indexSchlange != -1) && (indexSchlangenbaustein != -1)) {
            let bausteineNeueSchlange = [];
            for(let i = s[indexSchlange].schlangenBausteine.length - 1; i > indexSchlangenbaustein; i--){
                bausteineNeueSchlange[bausteineNeueSchlange.length] = s[indexSchlange].schlangenBausteine[i];
            }
            let neueSchlange = new Schlange(bausteineNeueSchlange);
            if((!(s[indexSchlange].letztePositionDesSchwanzes === null)) && (neueSchlange.schlangenBausteine.length > 0)) {
                neueSchlange.bewRichtungX = s[indexSchlange].letztePositionDesSchwanzes.x - neueSchlange.schlangenBausteine[0].x;
                neueSchlange.bewRichtungY = s[indexSchlange].letztePositionDesSchwanzes.y - neueSchlange.schlangenBausteine[0].y;
            }
            neueSchlange.bewegungstakt = s[indexSchlange].bewegungstakt;
            neueSchlange.evil = true;

            s[indexSchlange].schlangenBausteine.splice(indexSchlangenbaustein,s[indexSchlange].schlangenBausteine.length-indexSchlangenbaustein);
            if (s[indexSchlange].schlangenBausteine.length == 0) {
                s[indexSchlange].dieCounter = 0;
            }
            if(neueSchlange.schlangenBausteine.length > 0) {
                s[s.length] = neueSchlange;
                s[indexSchlange].letztePositionDesSchwanzes = null;
            }
        }
    }
}

class Spielfeld { //Das Spielfeld zusammen mit sammelbaren Objekten darauf.
    constructor(){
        let h = document.getElementById("inputSpielfeldHoehe");
        this.breite = Math.floor(h.value * 1.5); //Anzahl der Felder des Spielfelds in der Breite (Auf ein Feld passt ein SchlangenBaustein.)
        this.hoehe = Math.floor(h.value * 1);
        this.sammelbares = [];
        this.dropTakt = 4000; // Alle this.dropTakt Millisekunden erscheint ein neues sammelbares Objekt auf dem Spielfeld.
        this.zeitSeitDrop= 0; // Speichert die seit dem letzten Erscheinen eines sammelbaren Objektes verstrichene Zeit.
        this.hindernisse = []; // Speichert die Felsen auf dem Spielfeld. Berührt eine Schlange einen Felsen, so stirbt sie.
    }
    updaten(){
        this.zeitSeitDrop += spiel.updateIntervall;
        if (this.zeitSeitDrop >= this.dropTakt) {
            this.zeitSeitDrop -= this.dropTakt;
            this.sammelbaresItemZufälligDropen();
        }
    }
    sammelbaresItemZufälligDropen(){
        this.sammelbares[this.sammelbares.length]= new Sammelbar(-1,-1,-1);
    }
    erstelleHindernisse(anzahl){ // Erstellt "anzahl" Hindernisse an zufälligen Stellen auf dem vorher leeren Spielfeld.
        let versuche = 0;
        let xNeu,yNeu;
        while ((spiel.spielfeld.hindernisse.length < anzahl) && (versuche < 100000)) {
            xNeu = Math.floor(Math.random() * spiel.spielfeld.breite);
            yNeu = Math.floor(Math.random() * spiel.spielfeld.hoehe);
            if (spiel.spielfeld.feldBelegt(xNeu,yNeu) == 0) {
                // Überprüfe noch, ob die Position zu nah an der Mitte liegt (Spieler hat sonst zu Beginn kaum eine Chance, auszuweichen.).
                let xMitte = Math.floor(spiel.spielfeld.breite/2);
                let yMitte = Math.floor(spiel.spielfeld.hoehe/2);
                if((Math.abs(xMitte-xNeu)+ Math.abs(yMitte-yNeu)) > 5) { // Verwende Manhattan-Metrik.
                    spiel.spielfeld.hindernisse[this.hindernisse.length] = new Hindernis(xNeu, yNeu);
                }
            }
            versuche++;
        }
    }
    // feldBelegt gibt 0 zurück, falls das Feld frei ist, 1 bei einer Schlange darauf, 2 bei einem Hindernis, 3 bei einem sammelbaren Objekt.
    feldBelegt(x,y){
        let rueckgabe = 0;
        let s= spiel.schlangen;
        // Schlangen prüfen:
        for (let i=0; i<s.length; i++) {
            for(let j=0; j<s[i].schlangenBausteine.length; j++) {
                if ((s[i].schlangenBausteine[j].x == x) && (s[i].schlangenBausteine[j].y == y)) {
                    rueckgabe = 1;
                }
            }
        }
        // Hindernisse prüfen:
        for (let i=0; i<spiel.spielfeld.hindernisse.length; i++) {
            if ((spiel.spielfeld.hindernisse[i].x == x) && (spiel.spielfeld.hindernisse[i].y == y)) {
                rueckgabe = 2;
            }
        }
        // Sammelbare Objekte prüfen:
        for (let i=0; i<spiel.spielfeld.sammelbares.length; i++) {
            if ((spiel.spielfeld.sammelbares[i].x == x) && (spiel.spielfeld.sammelbares[i].y == y)) {
                rueckgabe = 3;
            }
        }
        return rueckgabe;
    }
}

class Schlange {
    constructor(neueSchlangenBausteine=0){
        if(neueSchlangenBausteine === 0){ //Es wurde kein Array von Schlangenbausteinen übergeben, also erstellen wir eine neue Schlange.
            this.schlangenBausteine = [];
            this.schlangenBausteine[0] = new SchlangenBaustein(Math.floor(spiel.spielfeld.breite/2),Math.floor(spiel.spielfeld.hoehe/2));
        } else {
            this.schlangenBausteine = neueSchlangenBausteine;
        }
        this.bewRichtungX = 1; // Speichert aktuelle Bewegungsrichtung der Schlange in X-Richtung (-1 oder 0 oder 1).
        this.bewRichtungY = 0; // Speichert aktuelle Bewegungsrichtung der Schlange in Y-Richtung (-1 oder 0 oder 1).
        this.bewegungstakt = Math.floor(200 * (100/document.getElementById("inputGeschwindigkeit").value));
        // Die Schlange soll sich alle this.bewegungstakt Millisekunden um ein Feld bewegen.
        this.zeitSeitBewegung = 0; // Speichert die seit der letzten Bewegung verstrichene Zeit in Millisekunden.
        this.ausstehendesWachstum = 0; // Speichert, wie viele Schlangenbausteine die Schlange noch wachsen soll.
        this.letztePositionDesSchwanzes = null; // Wird nur gespeichert, um sich bei Richtungswechsel nicht sofort in ein Hindernis zu bewegen.
        this.evil = false; // Ist eine Schlange evil, so wird sie rot dargestellt und der Spieler kann sie nicht steuern.
        this.dieCounter = -1000; // Zählt die Millisekunden bis zum Tod der Schlange herunter, wenn sie gerade am Sterben ist.
        // Ein Wert < -500 bedeutet deaktivierter Counter, das heißt die Schlange ist lebendig.
    }
    zeichnen(){
        for(let i=0;i<this.schlangenBausteine.length; i++){
            this.schlangenBausteine[i].zeichnen(!i,this.evil,this); // Der Kopf ist bei Index 0;
        }
    }
    updaten(){
        if ((this.evil == false) && (this.schlangenBausteine.length > spiel.maximaleLaenge)) {
            spiel.maximaleLaenge = this.schlangenBausteine.length;
        }
        this.zeitSeitBewegung += spiel.updateIntervall;
        if (this.zeitSeitBewegung >= this.bewegungstakt){
            this.zeitSeitBewegung -= this.bewegungstakt;
            this.bewegen();
        }

        if(this.dieCounter >= -500) {
            this.dieCounter -= spiel.updateIntervall;
            if(this.dieCounter < 0) {
                spiel.schlangeLoeschen(this);
                if (this.evil == false) {
                    // Die Schlange des Nutzers ist tod und damit das Spiel beendet.
                    spielBeendet(spiel.maximaleLaenge);
                }
            }
        }
    }
    bewegen(){
        if (this.dieCounter >= -500) {
            // Die Schlange ist tod, wird nur noch für den Nutzer grafisch angezeigt und bewegt sich nicht mehr.
            return;
        }
        if(this.evil){
            this.bewegungsRichtungMitKIwaehlen();
        } else {
            // Eventuell Nutzerwunsch berücksichtigen und Bewegungsrichtung ändern:
            let beachteNutzerEingabe = false;
            if(this.schlangenBausteine.length <= 1) {
                beachteNutzerEingabe = true;
            } else {
                // Wir überprüfen, ob wir gemäß der Nutzereingabe den eigenen Schlangenkörper treffen würden:
                let posNeuerKopfXGewuenscht = mod(this.schlangenBausteine[0].x + keyboardX,spiel.spielfeld.breite);
                let posNeuerKopfYGewuenscht = mod(this.schlangenBausteine[0].y + keyboardY,spiel.spielfeld.hoehe);
                if (!((posNeuerKopfXGewuenscht == this.schlangenBausteine[1].x)&&(posNeuerKopfYGewuenscht == this.schlangenBausteine[1].y))) {
                    beachteNutzerEingabe = true;
                }
            }
            if (beachteNutzerEingabe) {
                this.bewRichtungX = keyboardX;
                this.bewRichtungY = keyboardY;
            }
        }

        // Wir bewegen die Schlange, indem wir einen neuen "Kopf" erstellen und vorne einfügen und den "Schwanz" löschen.
        // Wir können die Schlange nur bewegen, wenn sie nicht die Länge 0 hat (Kommt normalerweise nicht vor.).
        if(this.schlangenBausteine.length >= 1) {
            let neuerKopfX = mod(this.schlangenBausteine[0].x + this.bewRichtungX,spiel.spielfeld.breite);
            let neuerKopfY = mod(this.schlangenBausteine[0].y + this.bewRichtungY,spiel.spielfeld.hoehe);
            let neuerKopf = new SchlangenBaustein(neuerKopfX,neuerKopfY);
            // Kollisionsabfrage:
            let kollision = spiel.spielfeld.feldBelegt(neuerKopfX,neuerKopfY);
            switch(kollision) {
                case 0: // Feld ist frei
                    this.schlangenBausteine.unshift(neuerKopf);
                    break;
                case 1: // Kollision mit einer Schlange
                    spiel.schlangeSpalten(neuerKopfX,neuerKopfY);
                    this.schlangenBausteine.unshift(neuerKopf);
                    break;
                case 2: // Hindernis
                    this.dieCounter = 1000;
                    return; // Die Schlange ist nun tod, sie wird nur noch kurzfristig grafisch angezeigt und deshalb noch nicht aus der Grafik gelöscht.
                    break;
                case 3: // sammelbares Objekt
                    this.schlangenBausteine.unshift(neuerKopf);
                    let art = 0;
                    for (let i=0; i<spiel.spielfeld.sammelbares.length; i++) {
                        if ((spiel.spielfeld.sammelbares[i].x == neuerKopfX) && (spiel.spielfeld.sammelbares[i].y == neuerKopfY)) {
                            art = spiel.spielfeld.sammelbares[i].art;
                            spiel.spielfeld.sammelbares.splice(i,1);
                            break;
                        }
                    }
                    this.sammelbaresObjektAufgehoben(art);
                    break;
            }

            if (this.ausstehendesWachstum > 0) {
                this.ausstehendesWachstum -= 1;
            } else {
                this.letztePositionDesSchwanzes = this.schlangenBausteine[this.schlangenBausteine.length-1];
                this.schlangenBausteine.pop(); // "Schwanz" löschen.
            }
        }
    }
    bewegungsRichtungMitKIwaehlen() {
        let moeglicheBewegungsrichtungen = [];
        moeglicheBewegungsrichtungen.push({},{},{},{}); // oben, unten, links, rechts
        moeglicheBewegungsrichtungen[0].x = 0;
        moeglicheBewegungsrichtungen[0].y = -1;
        moeglicheBewegungsrichtungen[1].x = 0;
        moeglicheBewegungsrichtungen[1].y = 1;
        moeglicheBewegungsrichtungen[2].x = -1;
        moeglicheBewegungsrichtungen[2].y = 0;
        moeglicheBewegungsrichtungen[3].x = 1;
        moeglicheBewegungsrichtungen[3].y = 0;
        let bevorzugteBewegungsrichtungen = [];
        if (this.schlangenBausteine.length > 0) {
            for (let i = 0; i < moeglicheBewegungsrichtungen.length; i++) {
                let neuerKopfX = mod(this.schlangenBausteine[0].x + moeglicheBewegungsrichtungen[i].x, spiel.spielfeld.breite);
                let neuerKopfY = mod(this.schlangenBausteine[0].y + moeglicheBewegungsrichtungen[i].y, spiel.spielfeld.hoehe);
                switch (spiel.spielfeld.feldBelegt(neuerKopfX, neuerKopfY)) {
                    case 0:
                    case 3:
                        // Das Feld ist frei oder ein sammelbares Objekt, also nicht durch eine Schlange oder einen Felsen blockiert und
                        // damit für die KI eine gute Option.
                        bevorzugteBewegungsrichtungen.push(moeglicheBewegungsrichtungen[i]);
                        break;
                }
            }
            // Jetzt zufällig aus den bevorzugten Bewegungsrichtungen auswählen:
            if (bevorzugteBewegungsrichtungen.length > 0) {
                let gewaehlterIndex = Math.floor(Math.random() * bevorzugteBewegungsrichtungen.length);
                this.bewRichtungX = bevorzugteBewegungsrichtungen[gewaehlterIndex].x;
                this.bewRichtungY = bevorzugteBewegungsrichtungen[gewaehlterIndex].y;
            }
        }
    }
    sammelbaresObjektAufgehoben(art) {
        switch (art){
            case 1:
                this.ausstehendesWachstum += 3;
                break;
            case 2:
                this.ausstehendesWachstum += 5;
                break;
            case 3:
                this.ausstehendesWachstum += 10;
                break;
            case 4:
                this.richtungUmkehren();
                break;
            case 5:
                this.bewegungstakt *= 10/11;
                break;
        }
    }
    richtungUmkehren(){
        this.schlangenBausteine.reverse();
        if((!(this.letztePositionDesSchwanzes === null)) && (this.schlangenBausteine.length > 0)) {
            // Bewegungsrichtung so anpassen, dass die Schlange nicht sofort irgendwo dagegen läuft.
            this.bewRichtungX = this.letztePositionDesSchwanzes.x - this.schlangenBausteine[0].x;
            this.bewRichtungY = this.letztePositionDesSchwanzes.y - this.schlangenBausteine[0].y;
        }
    }
}

class SchlangenBaustein {
    constructor(x,y){
        this.x = x; // Nullbasierte x-Koordinate des Bausteins im Spielfeld
        this.y = y; // Nullbasierte y-Koordinate des Bausteins im Spielfeld
    }
    zeichnen(istKopf,evil,schlange){
        if((schlange.dieCounter >= 0) && (schlange.dieCounter <= 1000)) {
            // Schlange stirbt gerade.
            spiel.canvCtx.globalAlpha = schlange.dieCounter / 1000;
        }
        let xKoord = Math.floor((this.x/spiel.spielfeld.breite)* spiel.pixelBreite+1); //+1 wegen Rahmen
        let yKoord = Math.floor((this.y/spiel.spielfeld.hoehe)* spiel.pixelHoehe+1); //+1 wegen Rahmen
        let breite = Math.floor(spiel.pixelBreite/ spiel.spielfeld.breite-2); //-2 wegen Rahmen
        let hoehe = Math.floor(spiel.pixelHoehe/ spiel.spielfeld.hoehe-2); //-2 wegen Rahmen
        switch (evil) {
            case false:
                if(istKopf){
                    xKoord -= 4;
                    yKoord -= 4;
                    breite += 8;
                    hoehe += 8;
                    spiel.canvCtx.save();
                    spiel.canvCtx.translate(xKoord+(breite/2),yKoord+(hoehe/2));
                    spiel.canvCtx.rotate(this.drehWinkelBestimmen(schlange.bewRichtungX,schlange.bewRichtungY));
                    spiel.canvCtx.drawImage(imageSchlangenKopf,-breite/2,-hoehe/2,breite,hoehe);
                    spiel.canvCtx.restore();
                } else {
                    spiel.canvCtx.fillStyle = "#558800";
                    spiel.canvCtx.fillRect(xKoord,yKoord,breite,hoehe);
                }
                break;
            case true:
                if(istKopf){
                    xKoord -= 4;
                    yKoord -= 4;
                    breite += 8;
                    hoehe += 8;
                    spiel.canvCtx.save();
                    spiel.canvCtx.translate(xKoord+(breite/2),yKoord+(hoehe/2));
                    spiel.canvCtx.rotate(this.drehWinkelBestimmen(schlange.bewRichtungX,schlange.bewRichtungY));
                    spiel.canvCtx.drawImage(imageSchlangenKopfEvil,-breite/2,-hoehe/2,breite,hoehe);
                    spiel.canvCtx.restore();
                } else {
                    spiel.canvCtx.fillStyle = "#ff0000";
                    spiel.canvCtx.fillRect(xKoord,yKoord,breite,hoehe);
                }
                break;
        }
        if((schlange.dieCounter >= 0) && (schlange.dieCounter <= 1000)) {
            // Alpha wieder zurücksetzen.
            spiel.canvCtx.globalAlpha = 1;
        }
    }
    drehWinkelBestimmen(xRichtung, yRichtung) {
        if (xRichtung == 1) {
            return 0;
        } else if (xRichtung == -1) {
            return Math.PI;
        } else if (yRichtung == 1) {
            return Math.PI / 2;
        } else {
            return Math.PI * 3/2;
        }
    }

}

class Sammelbar {
    constructor(xNeu=0,yNeu=0,artNeu=0){
        if ((xNeu== -1) || (yNeu==-1)) { // Ist einer der Koordinaten -1, so wählen wir eine zufällige freie Position auf dem Spielfeld.
            for (let versuch=0; versuch < 1000; versuch++) {
                this.x = Math.floor(Math.random() * spiel.spielfeld.breite);
                this.y = Math.floor(Math.random() * spiel.spielfeld.hoehe);
                if (spiel.spielfeld.feldBelegt(this.x, this.y)==0) {
                    // Das Feld ist frei.
                    break;
                }
            }
        } else {
            this.x = xNeu;
            this.y = yNeu;
        }
        /*
        *  Es existieren folgende Arten von sammelbaren Objekten:
        *   - Art Nr. 1: Wachstum um 3 Schlangenbausteine
        *   - Art Nr. 2: Wachstum um 5 Schlangenbausteine
        *   - Art Nr. 3: Wachstum um 10 Schlangenbausteine
        *   - Art Nr. 4: Richtungsänderung
        *   - Art Nr. 5: Geschwindigkeitserhöhung
        */
        if(artNeu == -1) { // -1 heißt zufaellig.
            let zufallszahl = Math.random()*100;
            switch(true){
                case (zufallszahl<=50):
                    this.art = 1;
                    break;
                case (zufallszahl<=65):
                    this.art = 2;
                    break;
                case (zufallszahl<=75):
                    this.art = 3;
                    break;
                case (zufallszahl<=85):
                    this.art = 4;
                    break;
                case (zufallszahl<=100):
                    this.art = 5;
                    break;
            }
        } else {
            this.art = artNeu;
        }
    }
    zeichnen(){
        let xKoord = Math.floor((this.x/spiel.spielfeld.breite)* spiel.pixelBreite)-4;
        let yKoord = Math.floor((this.y/spiel.spielfeld.hoehe)* spiel.pixelHoehe)-4;
        let breite = Math.floor(spiel.pixelBreite/ spiel.spielfeld.breite)+8;
        let hoehe = Math.floor(spiel.pixelHoehe/ spiel.spielfeld.hoehe)+8;
        switch (this.art){
            case 1:
                spiel.canvCtx.drawImage(imageSchiff1,xKoord,yKoord,breite,hoehe);
                break;
            case 2:
                spiel.canvCtx.drawImage(imageSchiff2,xKoord,yKoord,breite,hoehe);
                break;
            case 3:
                spiel.canvCtx.drawImage(imageSchiff3,xKoord,yKoord,breite,hoehe);
                break;
            case 4:
                spiel.canvCtx.drawImage(imageReverse,xKoord,yKoord,breite,hoehe);
                break;
            case 5:
                spiel.canvCtx.drawImage(imageSpeed,xKoord,yKoord,breite,hoehe);
                break;
        }
    }
}
class Hindernis {
    constructor(xNeu=0,yNeu=0){
        this.x = xNeu;
        this.y = yNeu;
    }
    zeichnen(){
        let xKoord = Math.floor((this.x/spiel.spielfeld.breite)* spiel.pixelBreite);
        let yKoord = Math.floor((this.y/spiel.spielfeld.hoehe)* spiel.pixelHoehe);
        let breite = Math.floor(spiel.pixelBreite/ spiel.spielfeld.breite);
        let hoehe = Math.floor(spiel.pixelHoehe/ spiel.spielfeld.hoehe);
        spiel.canvCtx.drawImage(imageBerg,xKoord,yKoord,breite,hoehe);
    }
}