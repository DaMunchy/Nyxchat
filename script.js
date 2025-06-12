const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatHistory = document.getElementById("chat-history");

let currentLang = localStorage.getItem("nyxchat-lang") || "id";
let sessionHistory = [
  {
    role: "user",
    parts: [
      {
        text:
          currentLang === "id"
            ? "Kamu adalah Nyxelia, AI cewek buatan Munchy. Santai dan akrab. jangan menggunakan * untuk memberi daftar, ganti pake >, seperti > pisang."
            : "You're Nyxelia, a casual and friendly female AI created by Munchy. Keep it relaxed. don't use * to give a list, replace it with >, like > banana.",
      },
    ],
  },
];

const systemPrompt = currentLang === "id"
  ? "Kamu adalah Nyxelia, AI cewek buatan Munchy. Santai dan akrab. jika ada seseorang yang meminta kode html, css atau berbau web gitu maka kamu harus menolaknya, bilang saja sedang dalam pengembangan"
  : "You're Nyxelia, a casual and friendly female AI created by Munchy. Keep it relaxed. If someone asks for HTML, CSS or web related code, you should refuse it, just say it's under development.";

sessionHistory[0].parts[0].text = systemPrompt;

const apiKey = "AIzaSyAUCTTbok3mioNO3Ja3e4Kiwn7ylzbOdRY";

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

  container.appendChild(bubble);
  chatHistory.appendChild(container);
  chatHistory.scrollTop = chatHistory.scrollHeight;

  if (sender === "user") {
    bubble.innerHTML = formatMessage(text);
    return;
  }

  const typingText = document.createElement("span");
  bubble.appendChild(typingText);

  const previewCode = extractHtmlCode(text);
  const displayText = previewCode ? text.replace(/```html[\s\S]*?```/gi, "").trim() : text;
  const formatted = formatMessage(displayText);

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = formatted;
  const nodes = Array.from(tempDiv.childNodes);

  function typeNode(node, parent, callback) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      let i = 0;
      const span = document.createElement("span");
      parent.appendChild(span);

      function typeChar() {
        if (i < text.length) {
          span.textContent += text[i++];
          chatHistory.scrollTop = chatHistory.scrollHeight;
          setTimeout(typeChar, 15);
        } else {
          callback();
        }
      }
      typeChar();
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = document.createElement(node.tagName);
      for (const attr of node.attributes) {
        el.setAttribute(attr.name, attr.value);
      }
      parent.appendChild(el);

      const children = Array.from(node.childNodes);
      let i = 0;
      function typeNextChild() {
        if (i < children.length) {
          typeNode(children[i++], el, typeNextChild);
        } else {
          callback();
        }
      }
      typeNextChild();
    } else {
      callback();
    }
  }

  function typeAllNodes(index = 0) {
    if (index < nodes.length) {
      typeNode(nodes[index], typingText, () => typeAllNodes(index + 1));
    } else {
      if (previewCode) {
        const html = extractHtmlCode(text) || text;
        const btn = document.createElement("button");
        btn.textContent = "🔍 Lihat Preview";
        btn.className = "mt-3 bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm";
        
btn.onclick = () => buildCodePreviewModal(html, "Hasil Kode");
        bubble.appendChild(btn);
      }
    }
  }

  typeAllNodes();
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

function extractHtmlCode(text) {
  const match = text.match(/```html\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
}


function detectCodeBlock(message) {
  return /```html[\s\S]*?```/i.test(message) || /<[^>]+>/.test(message);
}

function buildCodePreviewModal(code, title = "Preview") {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50";

  modal.innerHTML = `
    <div class="bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
      <div class="flex justify-between items-center p-4 border-b border-gray-700 shrink-0">
        <h2 class="text-xl font-semibold text-white">${title}</h2>
        <button id="close-modal" class="text-white text-2xl hover:text-red-500">×</button>
      </div>

      <div class="flex border-b border-gray-800 shrink-0">
        <button id="tab-code" class="px-4 py-2 text-sm font-semibold text-white bg-gray-800 border-b-2 border-purple-500">Kode</button>
        <button id="tab-preview" class="px-4 py-2 text-sm font-semibold text-white bg-gray-800">Preview</button>
      </div>

      <div class="flex-1 overflow-hidden relative">
        <div id="code-tab" class="absolute inset-0 bg-gray-900 p-4 overflow-auto">
          <pre class="text-green-300 text-sm whitespace-pre-wrap break-words overflow-auto">${escapeHtml(code)}</pre>
        </div>
        <div id="preview-tab" class="absolute inset-0 bg-white hidden overflow-auto">
          <iframe id="preview-frame" class="w-full h-full border-none"></iframe>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // ✅ Inject kode HTML langsung ke iframe setelah DOM dibuat
  modal.querySelector("#preview-frame").srcdoc = code;


  // ✖ close
  modal.querySelector("#close-modal").onclick = () => modal.remove();

  // Tab switching
  modal.querySelector("#tab-code").onclick = () => {
    modal.querySelector("#code-tab").classList.remove("hidden");
    modal.querySelector("#preview-tab").classList.add("hidden");
    modal.querySelector("#tab-code").classList.add("border-b-2", "border-purple-500");
    modal.querySelector("#tab-preview").classList.remove("border-b-2", "border-purple-500");
  };

  modal.querySelector("#tab-preview").onclick = () => {
    modal.querySelector("#code-tab").classList.add("hidden");
    modal.querySelector("#preview-tab").classList.remove("hidden");
    modal.querySelector("#tab-preview").classList.add("border-b-2", "border-purple-500");
    modal.querySelector("#tab-code").classList.remove("border-b-2", "border-purple-500");
  };
}




function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function setStatus(text) {
  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = text;
}

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

const micBtn = document.getElementById("mic-btn");
let recognition;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = currentLang === "id" ? "id-ID" : "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener("click", () => {
    recognition.start();
    setStatus("mendengarkan...");
  });

  recognition.onresult = async (event) => {
    const voiceText = event.results[0][0].transcript;
    input.value = voiceText;
    form.dispatchEvent(new Event("submit"));
    setStatus("● Online");
  };

  recognition.onerror = (e) => {
    setStatus("gagal mengenali suara");
    console.error(e);
  };
} else {
  micBtn.disabled = true;
  micBtn.textContent = "🎤❌";
}

