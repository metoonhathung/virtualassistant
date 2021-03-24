const speakButton = document.querySelector("#speakButton");
const executeButton = document.querySelector("#executeButton");
const textInput = document.querySelector("#textInput");
const youIntent = document.querySelector("#youIntent");
const youQuery = document.querySelector("#youQuery");
const botAnswer = document.querySelector("#botAnswer");
const embeddedDiv = document.querySelector("#embeddedDiv");
let supported = false;
let start = false;
let recognition, synth, utter;

if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  supported = true;
  speakButton.classList.remove("disabled");
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  synth = window.speechSynthesis;
  utter = new SpeechSynthesisUtterance();

  recognition.onresult = (e) => {
    let interimTranscript = "";
    let finalTranscript = "";
    for (let i = 0; i < e.results.length; ++i) {
      interimTranscript += e.results[i][0].transcript;
      if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
    }
    youQuery.innerText = interimTranscript;
    if (finalTranscript) {
      let transcript = finalTranscript.trim().toLowerCase();
      handle(transcript);
    }
  };

  recognition.onend = () => {
    start = false;
    speakButton.style.background = "deepskyblue";
    speakButton.style.boxShadow = "2px 5px 30px skyblue";
  };

  speakButton.onclick = () => {
    clear();
    start = !start;
    if (!start) {
      recognition.abort();
      return;
    }
    speakButton.style.background = "red";
    speakButton.style.boxShadow = "2px 5px 30px orangered";
    recognition.start();
  };
}

textInput.addEventListener("keyup", (event) => {
  clear();
  if (event.keyCode === 13) {
    event.preventDefault();
    executeButton.click();
  }
});

executeButton.onclick = () => {
  clear();
  let transcript = textInput.value.toLowerCase().trim();
  textInput.value = "";
  handle(transcript);
};

function process(data) {
  const googleKey = "AIzaSyCjDZySq6BsssKXH55PIzZC8IIWz29mFEM";
  let { intent, query } = data;
  if (intent === "answer") {
    if (query) {
      $.ajax({
        type: "GET",
        url: `https://api.wolframalpha.com/v2/query`,
        dataType: "jsonp",
        data: {
          appid: "PUETJ7-7TLY5HG6U3",
          input: query,
          output: "json",
        },
        success: (response) => {
          let output = "Sorry, no answer for that.";
          let queryresult = response.queryresult;
          if (queryresult.success) {
            output = queryresult.pods[1].subpods[0].plaintext;
          }
          reply(output);
        },
        error: (error) => {
          reply("Request failed.");
        },
      });
      return "Please wait.";
    }
  }
  if (intent === "article") {
    if (query) {
      $.ajax({
        type: "GET",
        url: `https://en.wikipedia.org/w/api.php`,
        dataType: "jsonp",
        data: {
          action: "query",
          prop: "extracts",
          origin: "*",
          format: "json",
          generator: "search",
          gsrsearch: query,
          gsrnamespace: 0,
          gsrlimit: 1,
          explaintext: true,
          exsentences: 1,
        },
        success: (response) => {
          let pages = response.query.pages;
          let output = pages[Object.keys(pages)[0]].extract;
          reply(output);
        },
        error: (error) => {
          reply("Request failed.");
        },
      });
      return;
    }
  }
  if (intent === "weather") {
    if (query) {
      $.ajax({
        type: "GET",
        url: `https://api.openweathermap.org/data/2.5/weather`,
        dataType: "jsonp",
        data: {
          appid: "8a040940c2f2dbdbf149a1e9b1ba7438",
          q: query,
          units: "metric",
        },
        success: (response) => {
          let description = response.weather[0].description;
          let temp = response.main.temp;
          let output = `Weather in ${query} is ${description}. Temperature is ${temp}°C.`;
          reply(output);
        },
        error: (error) => {
          reply("Request failed.");
        },
      });
      return;
    }
  }
  if (intent === "video") {
    if (query) {
      $.ajax({
        type: "GET",
        url: `https://www.googleapis.com/youtube/v3/search`,
        dataType: "jsonp",
        data: {
          key: googleKey,
          q: query,
          part: "snippet",
          maxResults: 1,
          type: "video",
        },
        success: (response) => {
          let video = response.items[0];
          let videoId = video.id.videoId;
          embeddedDiv.classList.remove("disabled");
          embeddedDiv.innerHTML = `<iframe class="embed-responsive-item" loading="lazy" allowfullscreen 
          src="https://www.youtube.com/embed/${videoId}?rel=0&hd=1" style="border:0"></iframe>`;
          let output = video.snippet.title;
          reply(output);
        },
        error: (error) => {
          reply("Request failed.");
        },
      });
      return;
    }
  }
  if (intent === "map") {
    if (query) {
      embeddedDiv.classList.remove("disabled");
      embeddedDiv.innerHTML = `<iframe class="embed-responsive-item" loading="lazy" allowfullscreen 
      src="https://www.google.com/maps/embed/v1/place?key=${googleKey}&q=${query}"></iframe>`;
      return `Showing ${query}`;
    }
  }
  if (intent === "translate") {
    if (query) {
      let obj = destructure(query);
      $.ajax({
        type: "GET",
        url: `https://www.googleapis.com/language/translate/v2`,
        dataType: "jsonp",
        data: {
          key: googleKey,
          target: obj.intent,
          q: obj.query,
        },
        success: (response) => {
          let output = response.data.translations[0].translatedText;
          reply(output);
        },
        error: (error) => {
          reply("Request failed.");
        },
      });
      return;
    }
  }
  if (intent === "search") {
    if (query) {
      window.open(`https://www.google.com/search?q=${query}`);
      return `Searching ${query}`;
    }
  }
  if (intent === "dictionary") {
    if (query) {
      $.ajax({
        type: "GET",
        url: `https://api.dictionaryapi.dev/api/v2/entries/en_US/${query}`,
        dataType: "json",
        success: (response) => {
          let output = response[0].meanings[0].definitions[0].definition;
          reply(output);
        },
        error: (error) => {
          reply("Request failed.");
        },
      });
      return;
    }
  }
  if (intent === "joke") {
    $.ajax({
      type: "GET",
      url: `https://official-joke-api.appspot.com/jokes/random`,
      dataType: "json",
      success: (response) => {
        let output = `${response.setup} ${response.punchline}`;
        reply(output);
      },
      error: (error) => {
        reply("Request failed.");
      },
    });
    return;
  }
  if (intent === "location") {
    if (!navigator.geolocation) return "Geolocation not supported by browser.";
    navigator.geolocation.getCurrentPosition((position) => {
      $.ajax({
        type: "GET",
        url: `https://open.mapquestapi.com/geocoding/v1/reverse`,
        dataType: "jsonp",
        data: {
          key: "XEf0JKRGAN6eTybaXxFM2GoxZrfmqdaH",
          location: `${position.coords.latitude},${position.coords.longitude}`,
        },
        success: (response) => {
          let location = response.results[0].locations[0];
          let output = `${location.street}, ${location.adminArea6}, ${location.adminArea5}, ${location.adminArea4}, ${location.adminArea3}, ${location.adminArea1}`;
          reply(output);
        },
        error: (error) => {
          reply("Request failed.");
        },
      });
    });
    return "Please wait.";
  }
  if (intent === "time") return new Date().toLocaleTimeString();
  if (intent === "date") return new Date().toDateString();
  return "Wrong syntax.";
}

function destructure(transcript) {
  let data = {};
  let [intent, ...rest] = transcript.split(" ");
  data.intent = intent;
  data.query = rest.join(" ");
  return data;
}

function handle(transcript) {
  let data = destructure(transcript);
  youIntent.innerText = data.intent;
  youQuery.innerText = data.query;
  let output = process(data);
  reply(output);
}

function reply(output) {
  if (!output) return;
  botAnswer.innerText = output;
  if (!supported) return;
  utter.text = output;
  synth.speak(utter);
  utter.text = "";
}

function clear() {
  youIntent.innerText = "";
  youQuery.innerText = "";
  botAnswer.innerText = "";
  embeddedDiv.innerHTML = "";
  embeddedDiv.classList.add("disabled");
}
