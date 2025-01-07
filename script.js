const videoElement = document.getElementById('webcam');
const cameraSelect = document.getElementById('cameraSelect');
const audioInputSelect = document.getElementById('audioInputSelect');
const fullScreenButton = document.getElementById('fullScreenButton');
const themeToggleButton = document.getElementById('themeToggleButton');
const languageToggleButton = document.getElementById('languageToggleButton');
const volumeControl = document.getElementById('volumeControl');

let audioContext;
let audioSource;
let audioElement;
let currentLanguage = 'es';

const translations = {
    es: {
        title: 'USB VIDEO CAPTURE VIEWER (By DmonOw)',
        cameraLabel: 'Seleccionar Cámara:',
        audioInputLabel: 'Seleccionar entrada de audio:',
        volumeLabel: 'Control de Volumen:',
        fullScreenButton: 'Pantalla Completa',
        themeToggleButton: 'Modo Oscuro',
        languageToggleButton: 'English'
    },
    en: {
        title: 'USB VIDEO CAPTURE VIEWER (By DmonOw)',
        cameraLabel: 'Select Camera:',
        audioInputLabel: 'Select Audio Input:',
        volumeLabel: 'Volume Control:',
        fullScreenButton: 'Full Screen',
        themeToggleButton: 'Dark Mode',
        languageToggleButton: 'Español'
    }
};

function updateLanguage() {
    const elements = document.querySelectorAll('[id]');
    elements.forEach(element => {
        const translationKey = element.id;
        if (translations[currentLanguage][translationKey]) {
            element.textContent = translations[currentLanguage][translationKey];
        }
    });
}

async function initCamera(deviceId = null, audioDeviceId = null) {
    // Detener streams anteriores si existen
    if (videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
    }
    if (audioElement && audioElement.srcObject) {
        const tracks = audioElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
    }

    const constraints = {
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            aspectRatio: { ideal: 1.7777777778 }
        },
        audio: audioDeviceId ? {
            deviceId: { exact: audioDeviceId },
            sampleRate: 96000,
            latency: 0 // Solicitar la menor latencia posible
        } : false
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
        videoElement.muted = true;
        videoElement.controls = false;

        if (audioDeviceId) {
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
                if (audioContext) {
                    await audioContext.close();
                }
                audioContext = new AudioContext({ 
                    sampleRate: 96000,
                    latencyHint: 'interactive' // Optimizar para baja latencia
                });
                
                if (audioElement) {
                    audioElement.pause();
                    audioElement.srcObject = null;
                }

                audioElement = new Audio();
                audioElement.srcObject = stream;
                audioElement.volume = volumeControl.value;
                
                // Esperar a que el audio esté listo antes de reproducir
                await new Promise(resolve => {
                    audioElement.oncanplaythrough = resolve;
                });
                
                await audioElement.play();
            }
        }
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

async function getDevices() {
    try {
        // Solicitar permisos de manera más específica
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: true 
        });
        
        // Liberar el stream inicial
        stream.getTracks().forEach(track => track.stop());
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');

        // Limpiar selectores
        cameraSelect.innerHTML = '';
        audioInputSelect.innerHTML = '';

        // Agregar opción por defecto para audio
        const defaultAudioOption = document.createElement('option');
        defaultAudioOption.value = '';
        defaultAudioOption.text = 'Seleccionar entrada de audio';
        audioInputSelect.appendChild(defaultAudioOption);

        // Agregar dispositivos de video
        videoDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Cámara ${cameraSelect.length + 1}`;
            cameraSelect.appendChild(option);
        });

        // Agregar dispositivos de audio
        audioInputDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Micrófono ${audioInputSelect.length}`;
            audioInputSelect.appendChild(option);
        });

        if (audioInputDevices.length === 0) {
            console.warn('No se encontraron dispositivos de audio.');
            alert('No se detectaron dispositivos de audio.');
        }
    } catch (error) {
        console.error('Error al acceder a los dispositivos:', error);
        alert('Por favor, permite el acceso a la cámara y al micrófono para usar esta aplicación. Si el problema persiste, asegúrate de estar usando HTTPS.');
    }
}

async function changeCamera() {
    const selectedDeviceId = cameraSelect.value;
    const selectedAudioInputId = audioInputSelect.value;
    await initCamera(selectedDeviceId, selectedAudioInputId);
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        videoElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        themeToggleButton.textContent = translations[currentLanguage].themeToggleButton.replace('Modo Oscuro', 'Modo Claro').replace('Dark Mode', 'Light Mode');
    } else {
        themeToggleButton.textContent = translations[currentLanguage].themeToggleButton;
    }
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'es' ? 'en' : 'es';
    updateLanguage();
}

function updateVolume() {
    if (audioElement) {
        audioElement.volume = volumeControl.value;
    }
}

function handleFullScreenChange() {
    if (document.fullscreenElement) {
        videoElement.controls = false; // Asegurarse de que los controles estén deshabilitados en pantalla completa
    } else {
        videoElement.controls = false; // Asegurarse de que los controles estén deshabilitados fuera de pantalla completa
    }
}

cameraSelect.addEventListener('change', changeCamera);
audioInputSelect.addEventListener('change', changeCamera);
fullScreenButton.addEventListener('click', toggleFullScreen);
themeToggleButton.addEventListener('click', toggleTheme);
languageToggleButton.addEventListener('click', toggleLanguage);
volumeControl.addEventListener('input', updateVolume);
document.addEventListener('fullscreenchange', handleFullScreenChange);

window.onload = async () => {
    await getDevices();
    await initCamera();
    updateLanguage();
};