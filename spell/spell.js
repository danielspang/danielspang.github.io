var synth = window.speechSynthesis;
var voices = synth.getVoices();

for (var i = 0; i < voices.length; i++) {
    if (voices[i].lang == 'sv-SE') {
        var voice = voices[i];
        break;
    }
}

async function say(what) {
    var synth = window.speechSynthesis;
    var utterThis = new SpeechSynthesisUtterance(what);
    utterThis.voice = voice;
    synth.speak(utterThis);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function start() {
    word = WORDS[Math.floor((Math.random() * 1000))];
    say(word);
}

async function fel(str) {
    let p = document.querySelector('p');
    say("Fel. Försök igen.");
    p.innerText = "\u00a0";
    for (c of word) {
        await sleep(500);
        p.innerText += c;
    }
    await sleep(2000);
    let input = document.querySelector('input');
    input.value = '';
    p.innerText = "\u00a0"
    input.focus();
}

var inputForm = document.querySelector('form');
inputForm.onsubmit = function (event) {
    var input = document.querySelector('input');
    input = input.toString().toLocaleLowerCase().trim();
    if (input.value == word) {
        say("Rätt");
        input.value = "";
        //inputTxt.blur();
        start();
    } else {
        fel(word);

    }
    event.preventDefault();
}

document.querySelector('#skip_word').onclick = function (event) {
    document.querySelector('p').innerText = "\u00a0"
    document.querySelector('input').focus();
    start();
    event.preventDefault();
}

start()
