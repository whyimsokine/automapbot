const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let map;

const parks = [
    { name: "Штрафстоянка №1", coords: [53.9045, 27.5615], phone: "+375 17 123-45-67" },
    { name: "Штрафстоянка №2", coords: [53.8900, 27.5800], phone: "+375 17 234-56-78" },
    { name: "Штрафстоянка №3", coords: [53.8800, 27.5400], phone: "+375 17 345-67-89" }
];

function openMap() {
    document.getElementById('app').style.display = 'none';
    document.getElementById('map-view').style.display = 'block';
    if (!map) initMap();
}

function backToMenu() {
    document.getElementById('app').style.display = 'block';
    document.getElementById('map-view').style.display = 'none';
    document.getElementById('instruction-view').style.display = 'none';
}

function showInstruction() {
    document.getElementById('app').style.display = 'none';
    document.getElementById('instruction-view').style.display = 'block';
}

function emergencyCall() {
    tg.sendData(JSON.stringify({ action: 'emergency_call' }));
}

function startParkingReminder() {
    navigator.geolocation.getCurrentPosition(pos => {
        tg.sendData(JSON.stringify({
            action: 'parking_reminder',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        }));
        tg.showPopup({ title: '✅ Напоминание включено!' });
    }, () => tg.showPopup({ title: '❌ Включи GPS' }));
}

function initMap() {
    ymaps.ready(() => {
        map = new ymaps.Map('map', {
            center: [53.9045, 27.5615],
            zoom: 12
        });
        parks.forEach(p => {
            map.geoObjects.add(new ymaps.Placemark(p.coords, {
                balloonContent: `${p.name}<br>📞 ${p.phone}`
            }));
        });
    });
}