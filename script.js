// ===== ОТКРЫТИЕ КАРТЫ =====
function openMap() {
    showScreen('map-screen');
    setActiveNav(1);
    
    // Ждём, пока DOM обновится, затем инициализируем карту
    setTimeout(function() {
        if (!map) {
            initMap();
        } else {
            map.container.fitToViewport();
        }
    }, 300);
}

function initMap() {
    // Проверяем, загрузился ли Яндекс.Карты
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
    
    // Проверяем, есть ли уже карта
    if (map) {
        map.container.fitToViewport();
        return;
    }
    
    // Получаем геолокацию
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                userLocation = [pos.coords.latitude, pos.coords.longitude];
                createMap();
            },
            function() {
                // Если геолокация недоступна — используем центр Минска
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
            
            // Добавляем метки стоянок
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
            
            // Метка пользователя
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