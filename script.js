// ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM =====
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ===== ДАННЫЕ =====
const parks = [
    { name: "Штрафстоянка №1", address: "ул. Тимирязева, 65А", phone: "+375 17 123-45-67", coords: [53.9045, 27.5615] },
    { name: "Штрафстоянка №2", address: "ул. Машиностроителей, 24", phone: "+375 17 234-56-78", coords: [53.8900, 27.5800] },
    { name: "Штрафстоянка №3", address: "ул. Ванеева, 34", phone: "+375 17 345-67-89", coords: [53.8800, 27.5400] }
];

let map = null;
let userLocation = null;

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    screen.classList.add('active');
    screen.style.animation = 'fade .3s ease';
}

function backToMain() {
    showScreen('main-screen');
}

function closeApp() {
    tg.close();
}

// ===== ОТКРЫТИЕ КАРТЫ =====
function openMap() {
    showScreen('map-screen');
    if (!map) initMap();
}

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                userLocation = [pos.coords.latitude, pos.coords.longitude];
                if (map) map.setCenter(userLocation, 14);
            },
            () => {},
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }
    
    const center = userLocation || [53.9045, 27.5615];
    
    ymaps.ready(() => {
        map = new ymaps.Map('map-container', {
            center: center,
            zoom: 13,
            controls: ['zoomControl', 'fullscreenControl']
        });
        
        parks.forEach(park => {
            const placemark = new ymaps.Placemark(park.coords, {
                balloonContent: `
                    <div style="padding:12px;font-family:system-ui;background:#1a1a1a;color:#fff;border-radius:12px;">
                        <b style="font-size:16px;color:#fff;">${park.name}</b><br>
                        📍 ${park.address}<br>
                        📞 <a href="tel:${park.phone}" style="color:#4a4a4a;text-decoration:none;">${park.phone}</a>
                    </div>
                `,
                hintContent: park.name
            }, {
                preset: 'islands#redDotIcon',
                balloonMaxWidth: 300
            });
            map.geoObjects.add(placemark);
        });
        
        if (userLocation) {
            const userPlacemark = new ymaps.Placemark(userLocation, {
                hintContent: 'Вы здесь'
            }, {
                preset: 'islands#blueCircleIcon'
            });
            map.geoObjects.add(userPlacemark);
        }
        
        map.container.fitToViewport();
    });
}

function showInstruction() {
    showScreen('instruction-screen');
}

function emergencyCall() {
    tg.sendData(JSON.stringify({ action: 'emergency_call' }));
    window.location.href = 'tel:102';
}

function startParkingReminder() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                tg.sendData(JSON.stringify({
                    action: 'parking_reminder',
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                }));
                tg.showPopup({
                    title: '✅ Напоминание включено!',
                    message: 'Я напомню через 30 минут',
                    buttons: [{ type: 'ok' }]
                });
            },
            () => {
                tg.showPopup({
                    title: '❌ Ошибка',
                    message: 'Включи GPS',
                    buttons: [{ type: 'ok' }]
                });
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        tg.showPopup({
            title: '❌ Ошибка',
            message: 'Браузер не поддерживает геолокацию',
            buttons: [{ type: 'ok' }]
        });
    }
}

function checkFines() {
    const input = document.getElementById('carNumber');
    const resultDiv = document.getElementById('fines-result');
    const link = document.getElementById('finesLink');
    
    let carNumber = input.value.trim().toUpperCase();
    
    if (!carNumber) {
        tg.showPopup({
            title: '❌ Введите номер',
            message: 'Пожалуйста, введите номер автомобиля',
            buttons: [{ type: 'ok' }]
        });
        input.focus();
        return;
    }
    
    carNumber = carNumber.replace(/\s/g, '');
    
    if (carNumber.length < 5) {
        tg.showPopup({
            title: '❌ Неверный формат',
            message: 'Введите номер в формате: А123ВС-7',
            buttons: [{ type: 'ok' }]
        });
        return;
    }
    
    resultDiv.style.display = 'block';
    link.href = 'https://e-pasluga.by/';
    link.textContent = 'Перейти на e-pasluga.by →';
    
    tg.showPopup({
        title: '✅ Номер принят',
        message: `Проверка штрафов для ${carNumber}`,
        buttons: [{ type: 'ok' }]
    });
}

function showSettings() {
    tg.showPopup({
        title: '⚙️ Настройки',
        message: 'Раздел в разработке',
        buttons: [{ type: 'ok' }]
    });
}

// ===== НИЖНЕЕ МЕНЮ =====
function setActiveNav(activeIndex) {
    const items = document.querySelectorAll('.nav-item');
    items.forEach((item, index) => {
        item.classList.toggle('active', index === activeIndex);
    });
}

// Обновляем при открытии главного экрана
const originalShowScreen = showScreen;
showScreen = function(screenId) {
    originalShowScreen(screenId);
    if (screenId === 'main-screen') {
        setActiveNav(0);
    }
};

// При открытии карты через меню
const originalOpenMap = openMap;
openMap = function() {
    originalOpenMap();
    setActiveNav(1);
};