const words = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at"
];

const keyboardLayout = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"]
];

const shiftKeyboardLayout = [
    ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "{", "}"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", ":", "\""],
    ["Z", "X", "C", "V", "B", "N", "M", "<", ">", "?"]
];

let text = "";
let wordsList = [];
let currentWordIndex = 0;

let timer, startTime;
let errors = 0, totalKeys = 0, duration = 60;

let keyMistakes = {};

function randomText() {

    let arr = [];

    for (let i = 0; i < 120; i++) {
        arr.push(words[Math.floor(Math.random() * words.length)]);
    }

    return arr.join(" ");

}

function startPractice() {

    let settings = {
        mode: document.getElementById("mode").value,
        font: document.getElementById("fontSelect").value,
        time: document.getElementById("timeSelect").value,
        voice: document.getElementById("voice").checked,
        hideText: document.getElementById("hideText").checked,
        customText: document.getElementById("customText").value
    };

    localStorage.setItem("typingSettings", JSON.stringify(settings));

    window.location = "practice.html";

}

let voices = [];

speechSynthesis.onvoiceschanged = () => {
    voices = speechSynthesis.getVoices();
};

function speakWord(word) {

    const msg = new SpeechSynthesisUtterance(word);

    msg.rate = 0.6;
    msg.pitch = 1;
    msg.volume = 1;

    const voice = voices.find(v =>
        v.lang === "en-US" || v.name.includes("Google")
    );

    if (voice) msg.voice = voice;

    speechSynthesis.cancel();
    speechSynthesis.speak(msg);

}

if (document.getElementById("typingInput")) {

    const settings = JSON.parse(localStorage.getItem("typingSettings"));

    duration = parseInt(settings.time);

    if (settings.mode === "random")
        text = randomText();
    else
        text = settings.customText;

    wordsList = text.split(" ");

    const font = settings.font;

    document.getElementById("textDisplay").style.fontFamily = font;
    document.getElementById("typingInput").style.fontFamily = font;

    if (settings.hideText)
        document.getElementById("textDisplay").innerHTML = "(Hidden Text Mode)";
    else
        renderText();

    if (settings.voice)
        speakWord(wordsList[0]);

    const input = document.getElementById("typingInput");

    input.focus();

    startTime = new Date();

    timer = setInterval(updateStats, 1000);

    input.addEventListener("keydown", function (e) {

        if (e.key === "Tab") {
            e.preventDefault();
            speakWord(wordsList[currentWordIndex]);
        }

        if (e.key === " ") {
            currentWordIndex++;
            if (settings.voice && wordsList[currentWordIndex]) {
                speakWord(wordsList[currentWordIndex]);
            }
        }

    });

    input.addEventListener("input", function () {

        const typed = this.value;

        totalKeys++;

        /* HIDE TEXT MODE */

        if (settings.hideText) {

            let i = typed.length - 1;

            if (i >= 0 && typed[i] !== text[i]) {

                errors++;

                let expectedKey = text[i].toLowerCase();

                trackMistake(expectedKey);

            }

        }

        /* NORMAL MODE */

        else {

            const spans = document.querySelectorAll("#textDisplay span");

            for (let i = 0; i < spans.length; i++) {

                let char = typed[i];

                spans[i].classList.remove("current");

                if (char == null) {

                    spans[i].className = "";
                    if (i === typed.length) spans[i].classList.add("current");

                }
                else if (char === spans[i].innerText) {

                    spans[i].className = "correct";

                }
                else {

                    spans[i].className = "wrong";

                    if (!spans[i].dataset.error) {

                        errors++;

                        let expectedKey = spans[i].innerText;
                        trackMistake(expectedKey);

                        spans[i].dataset.error = "1";

                    }

                }

            }

        }

        document.getElementById("errors").textContent = errors;

    });

}

function renderText() {

    const display = document.getElementById("textDisplay");

    display.innerHTML = "";

    text.split("").forEach((char, i) => {

        let span = document.createElement("span");
        span.innerText = char;

        if (i === 0) span.classList.add("current");

        display.appendChild(span);

    });

}

function trackMistake(key) {

    if (!key) return;

    if (keyMistakes[key]) {
        keyMistakes[key]++;
    }
    else {
        keyMistakes[key] = 1;
    }

}

function updateStats() {

    const elapsed = (new Date() - startTime) / 1000;

    document.getElementById("time").textContent = Math.floor(elapsed);

    let minutes = elapsed / 60;

    let kpm = Math.round(totalKeys / minutes);

    document.getElementById("kpm").textContent = isFinite(kpm) ? kpm : 0;

    let wordsTyped = document.getElementById("typingInput").value.trim().split(/\s+/).length;

    let wpm = Math.round(wordsTyped / minutes);

    document.getElementById("wpm").textContent = isFinite(wpm) ? wpm : 0;

    if (elapsed >= duration) {
        finishTest();
    }

}

function finishTest() {

    clearInterval(timer);

    let typed = document.getElementById("typingInput").value;

    let correct = 0;

    for (let i = 0; i < typed.length; i++) {
        if (typed[i] === text[i]) correct++;
    }

    let accuracy = ((correct / typed.length) * 100 || 0).toFixed(2);

    let resultData = {
        accuracy,
        errors,
        keyMistakes
    };

    localStorage.setItem("typingResult", JSON.stringify(resultData));

    let history = JSON.parse(localStorage.getItem("typingHistory")) || [];

    history.push({
        date: new Date().toLocaleString(),
        accuracy: accuracy,
        errors: errors,
        wpm: document.getElementById("wpm").textContent,
        kpm: document.getElementById("kpm").textContent
    });

    if (history.length > 20) {
        history.shift();
    }

    localStorage.setItem("typingHistory", JSON.stringify(history));

    window.location = "result.html";

}

/* HEATMAP */

if (document.getElementById("heatmap")) {

    const data = JSON.parse(localStorage.getItem("typingResult"));

    document.getElementById("result").innerText =
        "Accuracy: " + data.accuracy + "% | Errors: " + data.errors;

    const map = document.getElementById("heatmap");
    map.innerHTML = "";

    keyboardLayout.forEach(row => {

        const rowDiv = document.createElement("div");
        rowDiv.className = "keyboardRow";

        row.forEach(key => {

            const div = document.createElement("div");
            div.className = "key";
            div.textContent = key;

            let val = data.keyMistakes[key] || 0;

            if (val > 5) div.classList.add("hot");
            else if (val > 2) div.classList.add("mid");
            else if (val > 0) div.classList.add("low");

            rowDiv.appendChild(div);

        });

        map.appendChild(rowDiv);

    });

}

/* SHIFT HEATMAP */

if (document.getElementById("shiftHeatmap")) {

    const data = JSON.parse(localStorage.getItem("typingResult"));

    const map = document.getElementById("shiftHeatmap");
    map.innerHTML = "";

    shiftKeyboardLayout.forEach(row => {

        const rowDiv = document.createElement("div");
        rowDiv.className = "keyboardRow";

        row.forEach(key => {

            const div = document.createElement("div");
            div.className = "key";
            div.textContent = key;

            let val = data.keyMistakes[key] || 0;

            if (val > 5) div.classList.add("hot");
            else if (val > 2) div.classList.add("mid");
            else if (val > 0) div.classList.add("low");

            rowDiv.appendChild(div);

        });

        map.appendChild(rowDiv);

    });

}

/* HISTORY */

if (document.getElementById("history")) {

    const history = JSON.parse(localStorage.getItem("typingHistory")) || [];

    const container = document.getElementById("history");

    history.slice().reverse().forEach(h => {

        let div = document.createElement("div");

        div.className = "historyItem";

        div.innerHTML =
            h.date + " | WPM:" + h.wpm + " | Accuracy:" + h.accuracy + "% | Errors:" + h.errors;

        container.appendChild(div);

    });

}