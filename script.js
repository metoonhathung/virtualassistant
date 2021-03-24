const speak = document.querySelector("#speak");
const you = document.querySelector("#you");
const bot = document.querySelector("#bot");

const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

const synth = window.speechSynthesis;

speak.onclick = () => {
  recognition.start();
};

const utter = new SpeechSynthesisUtterance();

recognition.onresult = (e) => {
  const transcript = e.results[e.results.length - 1][0].transcript.trim();
  you.innerText = transcript;
  utter.text = reply(transcript.toLowerCase());
  bot.innerText = utter.text;
  synth.speak(utter);
};

function reply(transcript) {
  if (transcript.includes("hello")) return "Hello sir.";
  if (transcript.includes("bye")) return "Goodbye sir.";
  if (transcript.includes("date")) {
    const event = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return event.toLocaleDateString(undefined, options);
  }
  if (transcript.includes("time")) {
    const event = new Date();
    return event.getHours() + ":" + event.getMinutes();
  }
  if (transcript.includes("search")) {
    let query = transcript.replace("search", "");
    window.open(`https://www.google.com/search?q=${query}`);
    return `Searching ${query}`;
  }
  if (transcript.includes("wikipedia")) {
    let query = transcript.replace("wikipedia", "").trim();
    let link = `https://en.wikipedia.org/w/api.php?gsrsearch=${query}&action=query&prop=extracts&origin=*&format=json&generator=search&gsrnamespace=0&gsrlimit=1&exsentences=1&explaintext`;
    $.ajax({
      url: link,
      dataType: "jsonp",
      success: (response) => {
        let pages = response.query.pages;
        let result = pages[Object.keys(pages)[0]].extract;
        utter.text = result;
        bot.innerText = utter.text;
        synth.speak(utter);
      },
    });
    return;
  }
  if (transcript.includes("weather")) {
    let query = transcript.replace("weather", "").trim();
    let link = `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=8a040940c2f2dbdbf149a1e9b1ba7438`;
    $.ajax({
      url: link,
      dataType: "jsonp",
      success: (response) => {
        let description = response.weather[0].description;
        let temp = response.main.temp;
        let result = `Weather in ${query} is ${description}. Temperature is ${temp} degree Celsius.`;
        utter.text = result;
        bot.innerText = utter.text;
        synth.speak(utter);
      },
    });
    return;
  }
  return "I don't understand.";
}
