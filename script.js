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

// ===== НАВИГАЦИЯ С АНИМАЦИЕЙ =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    screen.classList.add('active');
    screen.style.animation = 'fadeIn 0.3s ease';
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
    // Получаем геолокацию
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
                    <div style="padding:12px;font-family:system-ui;">
                        <b style="font-size:16px;">${park.name}</b><br>
                        📍 ${park.address}<br>
                        📞 <a href="tel:${park.phone}" style="color:#007aff;text-decoration:none;">${park.phone}</a>
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

// ===== ИНСТРУКЦИЯ =====
function showInstruction() {
    showScreen('instruction-screen');
}

// ===== ЭКСТРЕННЫЙ ВЫЗОВ =====
function emergencyCall() {
    tg.sendData(JSON.stringify({ action: 'emergency_call' }));
    // Прямой звонок
    window.location.href = 'tel:102';
}

// ===== НАПОМИНАНИЕ О ПАРКОВКЕ =====
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
                    message: 'Включи GPS для определения места парковки',
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

// ===== ЗАГЛУШКИ =====
// ===== ПРОВЕРКА ШТРАФОВ через e-Pasluga =====
function checkFines() {
    const input = document.getElementById('carNumber');
    const resultDiv = document.getElementById('fines-result');
    const link = document.getElementById('finesLink');
    
    let carNumber = input.value.trim().toUpperCase();
    
    // Проверяем, что номер введен
    if (!carNumber) {
        tg.showPopup({
            title: '❌ Введите номер',
            message: 'Пожалуйста, введите номер автомобиля',
            buttons: [{ type: 'ok' }]
        });
        input.focus();
        return;
    }
    
    // Форматируем номер (убираем лишние пробелы, оставляем только буквы и цифры)
    carNumber = carNumber.replace(/\s/g, '');
    
    // Проверяем формат (простая проверка)
    if (carNumber.length < 5) {
        tg.showPopup({
            title: '❌ Неверный формат',
            message: 'Введите номер в формате: А123ВС-7',
            buttons: [{ type: 'ok' }]
        });
        return;
    }
    
    // Показываем результат
    resultDiv.style.display = 'block';
    
    // Формируем ссылку на e-Pasluga
    // Прямая ссылка на услугу проверки штрафов (для примера)
    const baseUrl = 'https://e-pasluga.by/';
    // В реальности ссылка может быть другой, но мы используем поиск
    const searchUrl = `https://www.google.com/search?q=проверка+штрафов+ГАИ+Беларусь+${encodeURIComponent(carNumber)}`;
    
    // Рекомендуемый вариант: отправляем пользователя на официальный сайт
    // с пояснением, что нужно делать
    link.href = `https://e-pasluga.by/`;
    link.textContent = `🔐 Перейти на e-pasluga.by`;
    
    tg.showPopup({
        title: '✅ Номер принят',
        message: `Вы будете перенаправлены на e-pasluga.by для проверки штрафов по номеру ${carNumber}`,
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