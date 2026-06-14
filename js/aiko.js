const Aiko = (() => {
    const storageKeys = {
        memories: "aiko.memories.v1",
        privateMode: "aiko.privateMode.v1",
        speechEnabled: "aiko.speechEnabled.v1",
    };

    const elements = {
        avatar: document.getElementById("aiko-avatar"),
        mood: document.getElementById("aiko-mood"),
        messages: document.getElementById("messages"),
        form: document.getElementById("chat-form"),
        input: document.getElementById("user-input"),
        memoryCount: document.getElementById("memory-count"),
        voiceStatus: document.getElementById("voice-status"),
        startVoice: document.getElementById("start-voice"),
        toggleSpeech: document.getElementById("toggle-speech"),
        privateMode: document.getElementById("private-mode"),
        clearChat: document.getElementById("clear-chat"),
    };

    let memories = loadJson(storageKeys.memories, []);
    let privateMode = localStorage.getItem(storageKeys.privateMode) === "true";
    let speechEnabled = localStorage.getItem(storageKeys.speechEnabled) !== "false";
    let recognition = null;

    function loadJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function saveMemories() {
        localStorage.setItem(storageKeys.memories, JSON.stringify(memories.slice(-40)));
        updateStatus();
    }

    function stripAccents(value) {
        return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function normalize(value) {
        return stripAccents(value).toLowerCase().trim();
    }

    function updateStatus() {
        const count = memories.length;
        elements.memoryCount.textContent = privateMode
            ? `Modo privado activo. ${count} recuerdos guardados.`
            : `${count} ${count === 1 ? "recuerdo" : "recuerdos"}.`;
        elements.toggleSpeech.textContent = speechEnabled ? "Voz activada" : "Voz apagada";
        elements.privateMode.textContent = privateMode ? "Salir de modo privado" : "Modo privado";
        elements.voiceStatus.textContent = speechEnabled ? "Lista para hablar." : "Respuestas por texto.";
    }

    function setMood(message, state) {
        elements.mood.textContent = `Estado: ${message}`;
        elements.avatar.classList.toggle("is-listening", state === "listening");
        elements.avatar.classList.toggle("is-speaking", state === "speaking");
    }

    function addMessage(role, text) {
        const message = document.createElement("div");
        message.className = `message ${role}`;
        message.textContent = text;
        elements.messages.appendChild(message);
        elements.messages.scrollTop = elements.messages.scrollHeight;

        if (role === "aiko") {
            speak(text);
        }
    }

    function speak(text) {
        if (!speechEnabled || !("speechSynthesis" in window)) {
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("es"));

        utterance.lang = "es-ES";
        utterance.rate = 1.03;
        utterance.pitch = 1.12;
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }

        utterance.onstart = () => setMood("hablando contigo.", "speaking");
        utterance.onend = () => setMood("esperando tu comando.", "idle");
        utterance.onerror = () => setMood("voz no disponible en este navegador.", "idle");

        window.speechSynthesis.speak(utterance);
    }

    function remember(text) {
        const cleanText = text.trim().replace(/[.?!]+$/, "");

        if (!cleanText) {
            return "Dime que quieres que recuerde. Ejemplo: recuerda que estudio a las 8.";
        }

        if (privateMode) {
            return "Estoy en modo privado, asi que no voy a guardar eso. Si quieres guardar recuerdos, dime: modo normal.";
        }

        memories.push({
            text: cleanText,
            createdAt: new Date().toISOString(),
        });
        saveMemories();

        return `Listo, lo recordare: ${cleanText}.`;
    }

    function listMemories() {
        if (memories.length === 0) {
            return "Todavia no tengo recuerdos guardados. Puedes decirme: recuerda que estudio a las 8.";
        }

        const summary = memories
            .slice(-6)
            .map((memory, index) => `${index + 1}. ${memory.text}`)
            .join(" ");

        return `Esto es lo ultimo que recuerdo: ${summary}`;
    }

    function simulatePcCommand(command) {
        if (command.includes("enciende") || command.includes("prende")) {
            return "En esta beta web no puedo encender el PC todavia. La siguiente fase seria un agente de escritorio con Wake-on-LAN o permisos locales.";
        }

        const appName = command.replace(/^(abre|abrir|inicia|ejecuta)\s+/, "").trim();
        if (!appName) {
            return "Dime que app quieres abrir. En esta beta solo puedo simularlo.";
        }

        return `Comando detectado: abrir ${appName}. En la app de escritorio esto ejecutaria la accion real con tu permiso.`;
    }

    function getResponse(input) {
        const cleanInput = input.trim();
        const simple = normalize(cleanInput);

        if (!simple) {
            return "Estoy aqui. Escribeme o usa el boton de voz.";
        }

        if (simple.startsWith("recuerda que ")) {
            return remember(cleanInput.slice(cleanInput.toLowerCase().indexOf("que") + 3));
        }

        if (simple.startsWith("recuerda:")) {
            return remember(cleanInput.slice(cleanInput.indexOf(":") + 1));
        }

        if (simple.includes("que recuerdas") || simple.includes("memoria")) {
            return listMemories();
        }

        if (simple.includes("olvida todo") || simple.includes("borra memoria") || simple.includes("limpia memoria")) {
            memories = [];
            saveMemories();
            return "Memoria local borrada. Ya no conservo recuerdos en este navegador.";
        }

        if (simple.includes("modo privado")) {
            privateMode = true;
            localStorage.setItem(storageKeys.privateMode, "true");
            updateStatus();
            return "Modo privado activado. No guardare recuerdos nuevos hasta que me digas modo normal.";
        }

        if (simple.includes("modo normal")) {
            privateMode = false;
            localStorage.setItem(storageKeys.privateMode, "false");
            updateStatus();
            return "Modo normal activado. Puedo guardar recuerdos cuando me lo pidas.";
        }

        if (simple.startsWith("abre ") || simple.startsWith("abrir ") || simple.startsWith("inicia ") || simple.startsWith("ejecuta ")) {
            return simulatePcCommand(simple);
        }

        if (simple.includes("enciende mi pc") || simple.includes("prende mi pc")) {
            return simulatePcCommand(simple);
        }

        if (simple.includes("contrasena") || simple.includes("banco") || simple.includes("finanzas")) {
            return "Puedo ayudar con una boveda cifrada en una fase futura. En esta beta no guardes contrasenas reales; solo probemos memoria no sensible.";
        }

        if (simple.includes("hola") || simple.includes("buenas")) {
            return "Hola, soy Aiko. Esta beta ya puede hablar, recordar datos simples y probar comandos locales.";
        }

        if (simple.includes("quien eres") || simple.includes("que eres")) {
            return "Soy Aiko beta: por ahora soy una interfaz local con reglas, voz y memoria. Despues podemos conectarme a un modelo IA local en tu laptop.";
        }

        if (simple.includes("ayuda") || simple.includes("comandos")) {
            return "Puedes decir: recuerda que estudio a las 8, que recuerdas, modo privado, modo normal, olvida todo o abre Discord.";
        }

        if (memories.length > 0 && !privateMode) {
            return `Te escucho. Tengo ${memories.length} recuerdos locales para personalizarme, pero esta beta aun no usa un modelo IA completo.`;
        }

        return "Te escucho. En esta beta puedo hablar, recordar cosas simples y reconocer comandos. Para inteligencia mas avanzada, la siguiente fase es conectarme a un modelo local.";
    }

    function handleInput(value) {
        const text = value.trim();
        if (!text) {
            return;
        }

        addMessage("user", text);
        elements.input.value = "";
        setMood("pensando.", "idle");

        window.setTimeout(() => {
            addMessage("aiko", getResponse(text));
        }, 220);
    }

    function configureVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            elements.startVoice.disabled = false;
            elements.startVoice.title = "Tu navegador no soporta reconocimiento de voz";
            return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = "es-ES";
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => {
            elements.startVoice.textContent = "Escuchando...";
            setMood("escuchando tu voz.", "listening");
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            handleInput(transcript);
        };

        recognition.onerror = () => {
            addMessage("aiko", "No pude escuchar bien. Prueba otra vez o escribe el comando.");
            setMood("esperando tu comando.", "idle");
        };

        recognition.onend = () => {
            elements.startVoice.textContent = "Hablar con Aiko";
            elements.avatar.classList.remove("is-listening");
        };
    }

    function bindEvents() {
        elements.form.addEventListener("submit", (event) => {
            event.preventDefault();
            handleInput(elements.input.value);
        });

        elements.startVoice.addEventListener("click", () => {
            if (!recognition) {
                addMessage("aiko", "Tu navegador no soporta reconocimiento de voz. Puedes escribir en el chat. Para privacidad total, luego usamos Whisper local en una app de escritorio.");
                return;
            }

            recognition.start();
        });

        elements.toggleSpeech.addEventListener("click", () => {
            speechEnabled = !speechEnabled;
            localStorage.setItem(storageKeys.speechEnabled, String(speechEnabled));
            updateStatus();
            addMessage("aiko", speechEnabled ? "Voz activada." : "Voz apagada. Seguire respondiendo por texto.");
        });

        elements.privateMode.addEventListener("click", () => {
            privateMode = !privateMode;
            localStorage.setItem(storageKeys.privateMode, String(privateMode));
            updateStatus();
            addMessage("aiko", privateMode ? "Modo privado activado." : "Modo normal activado.");
        });

        elements.clearChat.addEventListener("click", () => {
            elements.messages.innerHTML = "";
            addMessage("aiko", "Chat limpiado. La memoria local no se borra a menos que digas: olvida todo.");
        });
    }

    function init() {
        configureVoiceRecognition();
        bindEvents();
        updateStatus();
        addMessage(
            "aiko",
            "Hola, soy Aiko beta. Puedo hablar, recordar datos simples en este navegador y probar comandos. Dime: ayuda, para ver que puedo hacer."
        );
    }

    return { init };
})();

Aiko.init();
