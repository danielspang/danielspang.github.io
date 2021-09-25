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
    utterThis.rate = 0.8;
    synth.speak(utterThis);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
    word = WORDS[Math.floor((Math.random() * 1000))];
    say(word);
    await sleep(1000);
    document.querySelector('input').value = "";
}

async function correct(str) {
    say(CORRECT[Math.floor((Math.random() * CORRECT.length))]);
    await sleep(500);
    //document.querySelector('input').value = "";
    //inputTxt.blur();
    await start();
}

async function fel(str) {
    let p = document.querySelector('p');
    say(INCORRECT[Math.floor((Math.random() * INCORRECT.length))]);
    say(word);
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
    let guess = input.value.toLocaleLowerCase().trim();
    if (guess == word) {
        correct(word);
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

document.querySelector('#start').onclick = function (event) {
    document.querySelector('#t0').style.display = "none";
    document.querySelector('#t1').style.display = "initial";
    event.preventDefault();
    start();
}
