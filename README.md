# Wyszukiwarka firm ze strony panoramafirm.pl

## Setup

### Setup node

-   wciśnij klawisze `Win + R`, wpisz `cmd` i wciśnij `Enter`
-   wpisz `winget install OpenJS.NodeJS.LTS` i poczekaj aż się zainstaluje
-   zamknij okno cmd
-   otwórz cmd (krok 1.)
-   wpisz `node -v` - jeśli się pojawi numer wersji to znaczy, że node został zainstalowany popranie
-   zrób tak samo z `npm -v`

### Setup projektu

-   pobierz [to](https://github.com/Adasieqk/wyszukiwarka-firm/) repozytorium (kliknij przycisk `Code` a następnie `Download ZIP`)
-   wypakuj folder
-   otwórz cmd
-   wpisz `cd "sciezka\do\folderu"` i wciśnij `Enter` (ścieżkę znajdziesz klikając prawym przyciskiem myszy na folder, a następnie `Kopiuj jako ścieżkę`)
-   wpisz `npm install` i poczekaj aż się zainstaluje
-   wpisz `node server.js` => komunikat `Serwer działa na porcie 3000` znaczy, że wszystko działa

### Uruchom stronę

-   otwórz przeglądarkę internetową i wpisz `http://localhost:3000`
-   wypełnij pola formularza i kliknij `Szukaj`
-   po chwili plik z danymi pobierze się do folderu PLIKI w katalogu projektu
