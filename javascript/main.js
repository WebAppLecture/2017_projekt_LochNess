    let divBoxen= $('div');
    let spiel;
    let keyboardX=1; // Speichert die vom Nutzer durch Tastatur gewünschte x-Richtung.
    let keyboardY=0; // Speichert die vom Nutzer durch Tastatur gewünschte y-Richtung.

    let imageSchlangenKopf;
    let imageSchlangenKopfEvil;
    let imageOzean;
    let imageSchiff1;
    let imageSchiff2;
    let imageSchiff3;
    let imageReverse;
    let imageSpeed;
    let imageBerg;

    $(document).ready(function(){
    $('#bStart').click(spielStarten);
    $('#bNeustart').click(neuesSpiel);
    $('#inputSpielfeldHoehe').on('input',aktualisiereAnzeigeHoehe);
    $(document).keydown(keyDownHandler);

    imageSchlangenKopf = document.createElement('img');
    imageSchlangenKopf.onload = function() {};
    imageSchlangenKopf.src = "graphics/schlangenKopf.png";
    imageSchlangenKopfEvil = document.createElement('img');
    imageSchlangenKopfEvil.onload = function() {};
    imageSchlangenKopfEvil.src = "graphics/schlangenKopfEvil.png";
    imageOzean = document.createElement('img');
    imageOzean.onload = function() {};
    imageOzean.src = "graphics/ozean2.jpg";
    imageSchiff1 = document.createElement('img');
    imageSchiff1.onload = function() {};
    imageSchiff1.src = "graphics/schiff1.png";
    imageSchiff2 = document.createElement('img');
    imageSchiff2.onload = function() {};
    imageSchiff2.src = "graphics/schiff2.png";
    imageSchiff3 = document.createElement('img');
    imageSchiff3.onload = function() {};
    imageSchiff3.src = "graphics/schiff3.png";
    imageReverse = document.createElement('img');
    imageReverse.onload = function() {};
    imageReverse.src = "graphics/reverse.png";
    imageSpeed = document.createElement('img');
    imageSpeed.onload = function() {};
    imageSpeed.src = "graphics/speed.png";
    imageBerg = document.createElement('img');
    imageBerg.onload = function() {};
    imageBerg.src = "graphics/berg.png";

    neuesSpiel();
    });

    function neuesSpiel() {
        if(!document.getElementById("aud3").paused) {
            document.getElementById("aud3").pause();
            document.getElementById("aud3").currentTime = 0;
        }

        aktualisiereAnzeigeHoehe(); // Aktualisieren der angezeigten Höhe in der Eingabemaske für den Nutzer.
        zeigeDivBox(0); // Zeigt den Startbildschirm mit den Spieleinstellungen.
        document.getElementById("aud1").play();
    }

    function spielStarten() {
        document.getElementById("aud1").pause();
        document.getElementById("aud1").currentTime = 0;

        spiel = new Game();
        spiel.erstelleNeueSchlange(); // Erstellt eine Schlange der Länge eins in der Mitte des Spielfelds.
        spiel.schlangen[0].ausstehendesWachstum = 1; // Damit die Schlange schon einmal Länge zwei hat (sieht schöner aus :-)).
        let schwierigkeit = document.getElementById("inputSchwierigkeit").value * 1;
        let anzahlFelder = spiel.spielfeld.breite * spiel.spielfeld.hoehe;
        spiel.spielfeld.erstelleHindernisse(Math.floor((schwierigkeit/100) * anzahlFelder));
        spiel.starteSchleife();

        zeigeDivBox(1); // Zeigt den Gamebildschirm.
        document.getElementById("aud2").play();
    }

    function spielBeendet(maximaleLaenge) {
        document.getElementById("aud2").pause();
        document.getElementById("aud2").currentTime = 0;
        spiel.stoppeSchleife();

        document.getElementById("spErg").innerHTML = maximaleLaenge;
        zeigeDivBox(2); // Zeigt den Endbildschirm.
        document.getElementById("aud3").play();
    }

    function keyDownHandler(e) {
        let Key = {
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            W: 87,
            A: 65,
            S: 83,
            D: 68
        };
        let x = e.which || e.keyCode;
        switch (x) {
            case Key.UP:
            case Key.W:
                keyboardX = 0;
                keyboardY = -1;
                break;
            case Key.DOWN:
            case Key.S:
                keyboardX = 0;
                keyboardY = 1;
                break;
            case Key.LEFT:
            case Key.A:
                keyboardX = -1;
                keyboardY = 0;
                break;
            case Key.RIGHT:
            case Key.D:
                keyboardX = 1;
                keyboardY = 0;
                break;
        }
    }

    function zeigeDivBox(index) {
        divBoxen.each(function (i,v) {
            if(index*1===i*1){
                $(v).show();
            } else {
                $(v).hide();
            }
        });
    }

    // Die Funktion aktualisiert die angezeigte Höhe des Spielfelds gemäß der vom Nutzer gewählten Spielfeldbreite,
    // sodass ein Verhältnis von Höhe:Breite = 2:3 gegeben ist. Die Funktion stellt außerdem sicher, dass der Nutzer nur Werte
    // im gewünschten Bereich angibt.
    function aktualisiereAnzeigeHoehe() {
        let b= document.getElementById("spanInputSpielfeldBreite");
        let h= document.getElementById("inputSpielfeldHoehe");
        if((h.value*1<= h.max) && (h.value*1>= h.min)) {
            b.innerHTML = Math.floor(h.value * 1.5);
        } else
        {
            // Der Nutzer hat einen ungültigen Wert angegeben. Wir setzen die Anzeige auf Standardwerte zurück.
            h.value=(h.max*1+h.min*1)*0.5;
            aktualisiereAnzeigeHoehe();
        }
    }
    // Rechnet modulo, so wie ich es brauche:
    function mod(n, m) {
        return ((n % m) + m) % m;
    }