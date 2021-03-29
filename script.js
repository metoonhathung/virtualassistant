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
let video, interval;

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

textInput.onkeyup = (e) => {
  clear();
  if (e.keyCode === 13) {
    e.preventDefault();
    executeButton.click();
  }
};

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
          reply(`${error.status} ${error.statusText}`);
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
          reply(`${error.status} ${error.statusText}`);
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
          reply(`${error.status} ${error.statusText}`);
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
          embeddedDiv.classList.add("responsive-iframe");
          embeddedDiv.innerHTML = `<iframe frameborder="0" loading="lazy" allowfullscreen 
          src="https://www.youtube.com/embed/${videoId}?rel=0&hd=1" style="border:0"></iframe>`;
          let output = video.snippet.title;
          reply(output);
        },
        error: (error) => {
          reply(`${error.status} ${error.statusText}`);
        },
      });
      return;
    }
  }
  if (intent === "map") {
    if (query) {
      embeddedDiv.classList.remove("disabled");
      embeddedDiv.classList.add("responsive-iframe");
      embeddedDiv.innerHTML = `<iframe frameborder="0" loading="lazy" allowfullscreen 
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
          reply(`${error.status} ${error.statusText}`);
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
          reply(`${error.status} ${error.statusText}`);
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
        reply(`${error.status} ${error.statusText}`);
      },
    });
    return;
  }
  if (intent === "location") {
    let showPosition = (position) => {
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
          reply(`${error.status} ${error.statusText}`);
        },
      });
    };
    navigator.geolocation.getCurrentPosition(showPosition);
    return "Please wait.";
  }
  if (intent === "webcam") {
    embeddedDiv.classList.remove("disabled");
    embeddedDiv.innerHTML = `<video id="video" autoplay muted webkit-playsinline playsinline></video>`;
    video = document.querySelector("#video");
    let startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
        })
        .then((stream) => {
          let settings = stream.getTracks()[0].getSettings();
          video.width = settings.width;
          video.height = settings.height;
          video.srcObject = stream;
          video.onloadedmetadata = function (e) {
            video.play();
          };
        })
        .catch((err) => reply(`${err.name} ${err.message}`));
    };

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri("./models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
      faceapi.nets.faceExpressionNet.loadFromUri("./models"),
      faceapi.nets.ageGenderNet.loadFromUri("./models"),
    ]).then(startVideo);

    video.onplaying = () => {
      const canvas = faceapi.createCanvasFromMedia(video);
      embeddedDiv.append(canvas);
      const displaySize = {
        width: video.clientWidth,
        height: video.clientHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);
      interval = setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          .withFaceExpressions()
          .withAgeAndGender();
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        if (resizedDetections[0]) {
          const age = resizedDetections[0].age;
          const gender = resizedDetections[0].gender;
          new faceapi.draw.DrawTextField(
            [`${faceapi.utils.round(age, 0)} years, ${gender}`],
            {
              x: resizedDetections[0].detection.box.topLeft.x,
              y: resizedDetections[0].detection.box.topLeft.y,
            }
          ).draw(canvas);
        }
      }, 100);
    };
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
  embeddedDiv.classList.remove("responsive-iframe");
  stopStream();
}

function stopStream() {
  if (!video) return;
  const stream = video.srcObject;
  const tracks = stream.getTracks();
  tracks.forEach(function (track) {
    track.stop();
  });
  video.srcObject = null;
  clearInterval(interval);
  video = null;
  interval = null;
}
