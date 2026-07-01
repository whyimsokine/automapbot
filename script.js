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

// ===== НАВИГАЦИЯ =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        screen.style.animation = 'fade .3s ease';
    }
    setActiveNav(0);
}

function backToMain() {
    showScreen('main-screen');
}

function closeApp() {
    tg.close();
}

// ===== НИЖНЕЕ МЕНЮ =====
function setActiveNav(index) {
    const items = document.querySelectorAll('.nav-item');
    items.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

// ===== ОТКРЫТИЕ КАРТЫ =====
function openMap() {
    showScreen('map-screen');
    setActiveNav(1);
    
    setTimeout(function() {
        if (!map) {
            initMap();
        } else {
            map.container.fitToViewport();
        }
    }, 400);
}

function initMap() {
    if (typeof ymaps === 'undefined') {
        console.log("⏳ Ждём загрузки Яндекс.Карт...");
        setTimeout(initMap, 500);
        return;
    }
    
    const container = document.getElementById('map-container');
    if (!container) {
        console.log("❌ Контейнер карты не найден");
        return;
    }
    
    if (map) {
        map.container.fitToViewport();
        return;
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                userLocation = [pos.coords.latitude, pos.coords.longitude];
                createMap();
            },
            function() {
                userLocation = [53.9045, 27.5615];
                createMap();
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        userLocation = [53.9045, 27.5615];
        createMap();
    }
}

function createMap() {
    const container = document.getElementById('map-container');
    if (!container) return;
    
    if (map) {
        map.container.fitToViewport();
        return;
    }
    
    const center = userLocation || [53.9045, 27.5615];
    
    try {
        ymaps.ready(function() {
            map = new ymaps.Map('map-container', {
                center: center,
                zoom: 13,
                controls: ['zoomControl', 'fullscreenControl']
            });
            
            parks.forEach(function(park) {
                var placemark = new ymaps.Placemark(park.coords, {
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
                var userPlacemark = new ymaps.Placemark(userLocation, {
                    hintContent: 'Вы здесь'
                }, {
                    preset: 'islands#blueCircleIcon'
                });
                map.geoObjects.add(userPlacemark);
            }
            
            map.container.fitToViewport();
            console.log("✅ Карта создана");
        });
    } catch (e) {
        console.log("❌ Ошибка создания карты:", e);
    }
}

// ===== ОСТАЛЬНЫЕ ФУНКЦИИ =====
function showInstruction() {
    showScreen('instruction-screen');
    setActiveNav(0);
}

function emergencyCall() {
    tg.sendData(JSON.stringify({ action: 'emergency_call' }));
    window.location.href = 'tel:102';
}

function startParkingReminder() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(pos) {
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
            function() {
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
        message: 'Проверка штрафов на e-pasluga.by',
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