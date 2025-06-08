const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatHistory = document.getElementById("chat-history");

let sessionHistory = [
  {
    role: "user",
    parts: [{
      text: "Kamu adalah Nyxelia, AI cewek yang dibuat sama Munchy. Kamu santai, nggak kaku, jawab dengan gaya cewek yang akrab dan nggak terlalu formal. Jangan terlalu sering sebut nama sendiri. jika ada yang menggunakan bahasa inggris kamu harus pake bahasa inggris juga tanpa campur indo."
    }]
  }
];


const apiKey = "AIzaSyAUCTTbok3mioNO3Ja3e4Kiwn7ylzbOdRY";

async function callGeminiAPI(message) {
  const messages = sessionHistory.concat([{ role: "user", parts: [{ text: message }] }]);

  const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: messages })
  });

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nyxelia tidak merespon 😔";

  sessionHistory.push({ role: "user", parts: [{ text: message }] });
  sessionHistory.push({ role: "model", parts: [{ text: reply }] });

  return reply;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "Follow DaMunchy On Github";
  input.disabled = true;

  // 🚀 Set status to typing...
  setStatus("Typing...");

  const reply = await callGeminiAPI(message);
  appendMessage("ai", reply);

  // ✅ Back to online after response
  setStatus("Online");

  input.value = "";
  input.disabled = false;
});


function appendMessage(sender, text) {
  const container = document.createElement("div");
  container.className = `flex ${sender === "user" ? "justify-end" : "justify-start"}`;

  const bubble = document.createElement("div");
  bubble.className = `
    max-w-[80%] px-5 py-3 text-white rounded-lg whitespace-pre-wrap
    ${sender === "user" 
      ? "bg-gray-800 border border-white/30 shadow-md backdrop-blur-sm ml-auto text-right"
      : "bg-gray-800 border border-white/30 shadow-md backdrop-blur-sm text-left"
    }
  `.replace(/\s+/g, ' ').trim();

  bubble.innerHTML = formatMessage(text); // apply formatting here
  container.appendChild(bubble);
  chatHistory.appendChild(container);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}


function formatMessage(message) {
  return message
    .replace(/```(.*?)```/gs, '<pre class="whitespace-pre-wrap break-words bg-gray-800 text-green-300 p-2 rounded-lg overflow-x-auto text-sm">$1</pre>')

    .replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-black-400">$1</span>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-blue-300">$1</em>');
}

function setStatus(text) {
  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = text;
}

