const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatHistory = document.getElementById("chat-history");
const micBtn = document.getElementById("mic-btn");
const sendBtn = document.getElementById("send-btn");

let currentLang = localStorage.getItem("nyxchat-lang") || "id";
let sessionHistory = [
  {
    role: "user",
    parts: [
      {
        text: currentLang === "id"
          ? "Kamu adalah Nyxelia, AI cewek buatan Munchy. Santai dan akrab. jangan menggunakan * untuk memberi daftar, ganti pake >, seperti > pisang."
          : "You're Nyxelia, a casual and friendly female AI created by Munchy. Keep it relaxed. don't use * to give a list, replace it with >, like > banana.",
      },
    ],
  },
];

const systemPrompt = currentLang === "id"
  ? "Kamu adalah Nyxelia, AI cewek buatan Munchy. Santai dan akrab."
  : "You're Nyxelia, a casual and friendly female AI created by Munchy. Keep it relaxed.";
sessionHistory[0].parts[0].text = systemPrompt;

const apiKey = "AIzaSyAUCTTbok3mioNO3Ja3e4Kiwn7ylzbOdRY"; // ganti kalau perlu

async function callGeminiAPI(message) {
  const messages = sessionHistory.concat([{ role: "user", parts: [{ text: message }] }]);
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: messages }),
    }
  );
  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nyxelia tidak merespon 😔";
  sessionHistory.push({ role: "user", parts: [{ text: message }] });
  sessionHistory.push({ role: "model", parts: [{ text: reply }] });
  return reply;
}

function handleLocalCommand(message) {
  const cmd = message.trim().toLowerCase();
  if (cmd === "/clear") chatHistory.innerHTML = "";
  if (cmd === "/time") return `🕒 Sekarang jam ${new Date().toLocaleTimeString()}`;
  if (cmd === "/help") return ` List Command:\n> /clear → hapus chat\n> /time → jam sekarang\n> /theme [warna] → ganti tema`;
  if (cmd.startsWith("/theme ")) {
    const color = cmd.split(" ")[1];
    document.documentElement.style.setProperty("--user-bubble", color);
    return `🎨 Tema diubah ke ${color}`;
  }
  return null;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  const localResult = handleLocalCommand(message);
  if (localResult) {
    appendMessage("user", message);
    appendMessage("ai", localResult);
    input.value = "";
    
    return;
  }

  appendMessage("user", message);
  input.value = "Follow DaMunchy On Github";
  input.disabled = true;

  setStatus("Typing...");
  const reply = await callGeminiAPI(message);
  appendMessage("ai", reply);
  setStatus("● Online");
  input.value = "";
input.dispatchEvent(new Event("input"));
input.disabled = false;

});

async function appendMessage(sender, text) {
  const container = document.createElement("div");
  container.className = `flex ${sender === "user" ? "justify-end" : "justify-start"}`;

  const bubble = document.createElement("div");
  bubble.className = `${
    sender === "user"
      ? "bubble-user bg-[#005C4B] text-white px-4 py-3 rounded-xl rounded-br-none max-w-[80%] text-right ml-auto relative"
      : "bubble-ai bg-[#202C33] text-white px-4 py-3 rounded-xl rounded-bl-none max-w-[80%] text-left relative"
  }`.replace(/\s+/g, " ").trim();

  bubble.innerHTML = formatMessage(text);
  container.appendChild(bubble);
  chatHistory.appendChild(container);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function formatMessage(message) {
  return message
    .replace(/```([\s\S]*?)```/g, '<pre class="whitespace-pre-wrap break-words bg-gray-800 text-green-300 p-2 rounded-lg overflow-x-auto text-sm">$1</pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 rounded text-green-400 text-sm font-mono">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '<em class="italic text-purple-300">$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-500 pl-4 italic text-gray-300">$1</blockquote>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="underline text-cyan-300 hover:text-cyan-400">$1</a>')
    .replace(/^-{3,}$/gm, '<hr class="my-2 border-gray-600">');
}

function setStatus(text) {
  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = text;
}

// Mic → Text input (SpeechRecognition)
let recognition;
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = currentLang === "id" ? "id-ID" : "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener("click", () => {
    recognition.start();
    setStatus("listening...");
  });

  recognition.onresult = (event) => {
    const voiceText = event.results[0][0].transcript;
    input.value = voiceText;
    input.dispatchEvent(new Event("input")); 
    form.dispatchEvent(new Event("submit"));
    setStatus("● Online");
  };

  recognition.onerror = (e) => {
    setStatus("please speak");
    console.error(e);
  };
} else {
  micBtn.disabled = true;
  micBtn.textContent = "🎤❌";
}
input.addEventListener("input", () => {
  const hasText = input.value.trim().length > 0;
  if (hasText) {
    sendBtn.classList.remove("hidden");
    micBtn.classList.add("hidden");
  } else {
    sendBtn.classList.add("hidden");
    micBtn.classList.remove("hidden");
  }
});

const langBtn = document.getElementById("lang-button");
const langMenu = document.getElementById("lang-menu");

if (langBtn) {
  langBtn.textContent = currentLang === "id" ? "🇮🇩 Indonesia" : "🇬🇧 English";
}

langBtn.addEventListener("click", () => {
  langMenu.classList.toggle("hidden");
});

langMenu?.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentLang = btn.dataset.lang;
    localStorage.setItem("nyxchat-lang", currentLang);
    sessionHistory[0].parts[0].text =
      currentLang === "id"
        ? "Kamu adalah Nyxelia, AI cewek buatan Munchy. Santai dan akrab."
        : "You're Nyxelia, a casual and friendly female AI created by Munchy. Keep it relaxed.";

    langBtn.textContent = currentLang === "id" ? "🇮🇩 Indonesia" : "🇬🇧 English";
    langMenu.classList.add("hidden");
  });
});
