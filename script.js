const words = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at"
];

let text = "";
let wordsList = [];
let currentWordIndex = 0;

let timer, startTime;
let errors = 0, totalKeys = 0, duration = 60;

let keyMistakes = {};

const keyboard = "abcdefghijklmnopqrstuvwxyz".split("");

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

if (document.getElementById("typingInput")) {

    const settings = JSON.parse(localStorage.getItem("typingSettings"));

    duration = parseInt(settings.time);

    if (settings.mode === "random")
        text = randomText();
    else
        text = settings.customText;

    wordsList = text.split(" ");

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

        if (settings.hideText) return;

        const spans = document.querySelectorAll("#textDisplay span");

        for (let i = 0; i < spans.length; i++) {

            let char = typed[i];

            if (char == null) {

                spans[i].className = "";
                if (i === typed.length) spans[i].classList.add("current");

            }
            else if (char === spans[i].innerText) {

                spans[i].className = "correct";

            }
            else {

                if (!spans[i].classList.contains("wrong")) {
                    errors++;
                    trackMistake(char);
                }

                spans[i].className = "wrong";

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

function speakWord(word) {

    const msg = new SpeechSynthesisUtterance(word);

    msg.rate = 0.7;

    speechSynthesis.cancel();

    speechSynthesis.speak(msg);

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

    window.location = "result.html";

}

function trackMistake(char) {

    char = char?.toLowerCase();

    if (!keyboard.includes(char)) return;

    keyMistakes[char] = (keyMistakes[char] || 0) + 1;

}

if (document.getElementById("heatmap")) {

    const data = JSON.parse(localStorage.getItem("typingResult"));

    document.getElementById("result").innerText = "Accuracy: " + data.accuracy + "% | Errors: " + data.errors;

    const map = document.getElementById("heatmap");

    keyboard.forEach(k => {

        let div = document.createElement("div");

        div.className = "key";

        div.textContent = k;

        let val = data.keyMistakes[k] || 0;

        if (val > 5) div.classList.add("hot");
        else if (val > 2) div.classList.add("mid");
        else if (val > 0) div.classList.add("low");

        map.appendChild(div);

    });

}