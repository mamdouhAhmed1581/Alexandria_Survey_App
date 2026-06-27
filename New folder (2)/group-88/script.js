// 1. تعريف الخريطة الأساسية
// يبدأ من مستوى مصر ليكون أكثر احترافية وواقعية للبحث الأكاديمي
const map = L.map('map').setView([26.8, 30.8], 6);

const layers = {
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CartoDB' }),
    light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
};
layers.dark.addTo(map);

let animationFinished = false;
const isSection2 = window.location.pathname.includes('section2');

// حركة طيران ناعمة واحترافية - تبدأ من مستوى مصر لمنطقة الدراسة
setTimeout(() => {
    map.flyTo([31.206, 29.975], 14.5, {
        animate: true,
        duration: 3.5,
        easeLinearity: 0.25
    });
}, 800);

// بعد انتهاء الأنيميشن: إظهار السيناريو فقط في القسم الأول
setTimeout(() => {
    animationFinished = true;
    if (!isSection2) {
        if (shyakhaLayer) shyakhaLayer.addTo(map);
        if (sour1Layer)   sour1Layer.addTo(map);
        if (sour2Layer)   sour2Layer.addTo(map);
        if (universityLayer) universityLayer.addTo(map);
        if (gatesLayer)   gatesLayer.addTo(map);
    }
}, 5000);

function changeMap(type) {
    Object.values(layers).forEach(l => map.removeLayer(l));
    layers[type].addTo(map);
}

// 2. تعريف متغيرات الطبقات
let shyakhaLayer, sour1Layer, sour2Layer, suggestedPlacesLayer, top3Layer, universityLayer, servicesLayer, gatesLayer;

// --- تحميل طبقة حدود الشياخة ---
fetch('data/hagger.tiff_ToJSON.geojson').then(res => res.json()).then(data => {
    shyakhaLayer = L.geoJSON(data, {
        style: { color: 'cyan', fillOpacity: 0, weight: 2 },
        onEachFeature: (f, l) => {
            if (f.properties && f.properties.name)
                l.bindTooltip(f.properties.name, { permanent: true, direction: "center" });
        }
    });
    // لا تضيف الطبقة هنا - الـ setTimeout هو المسؤول عن الإضافة
});

// --- تحميل طبقة السور 1 ---
fetch('data/sour1_ToJSON.geojson').then(res => res.json()).then(data => {
    sour1Layer = L.geoJSON(data, { style: { color: '#ffcc00', weight: 3, fillOpacity: 0 } });
    // لا تضيف الطبقة هنا - الـ setTimeout هو المسؤول عن الإضافة
});

// --- تحميل طبقة السور 2 ---
fetch('data/sour2_ToJSON.geojson').then(res => res.json()).then(data => {
    sour2Layer = L.geoJSON(data, { style: { color: '#ffcc00', weight: 3, fillOpacity: 0, dashArray: '10, 10' } });
    // لا تضيف الطبقة هنا - الـ setTimeout هو المسؤول عن الإضافة
});

// --- تحميل طبقة الأماكن المقترحة ---

fetch('data/أفضل الاماكن الامقترحة.geojson').then(res => res.json()).then(data => {
    suggestedPlacesLayer = L.geoJSON(data, {
        pointToLayer: (f, ll) => L.circleMarker(ll, { radius: 8, fillColor: "#ff00ff", color: "#fff", weight: 2, fillOpacity: 0.8 }),
        onEachFeature: (f, l) => {
            if (f.properties && f.properties.name) l.bindTooltip("المكان المقترح: " + f.properties.name);
            
            // عند النقر على المكان المقترح
            l.on('click', () => {
                // إحداثيات الجامعة الأهلية
                const uniLat = 31.21403;
                const uniLng = 29.97660;
                
                // استخراج الإحداثيات الصحيحة (سواء كانت النقطة Marker أو Polygon)
                const center = l.getBounds ? l.getBounds().getCenter() : l.getLatLng();
                
                // حساب المسافة
                const distKm = getDistance(center.lat, center.lng, uniLat, uniLng);
                const timeWalkingMins = (distKm / 5) * 60; // مشي 5 كم/س
                const timeCarMins = (distKm / 40) * 60; // سيارة 40 كم/س
                
                let popupContent = `<b>المكان المقترح: ${f.properties.name || 'بدون اسم'}</b><br><hr>`;
                popupContent += `المسافة للجامعة: <b>${distKm.toFixed(2)} كم</b><br>`;
                popupContent += `الوقت مشياً 🚶: <b>~${Math.round(timeWalkingMins)} دقيقة</b><br>`;
                popupContent += `الوقت بالسيارة 🚗: <b>~${Math.round(timeCarMins)} دقيقة</b>`;
                
                l.bindPopup(popupContent).openPopup();
                
                // تشغيل تحليل أقرب الخدمات حول المكان (نمرر المركز)
                analyzeBestService(center);
            });
        }
    });
});

// --- تحميل طبقة أكبر 3 مساحات ---
fetch('data/أكبر 3 من حيث المساحة .geojson').then(res => res.json()).then(data => {
    const sorted = data.features.sort((a, b) => b.properties.area - a.properties.area).slice(0, 3);
    top3Layer = L.geoJSON({ type: "FeatureCollection", features: sorted }, {
        style: { color: '#00ff00', weight: 4, fillOpacity: 0.2 },
        onEachFeature: (f, l) => l.bindPopup("مساحة: " + f.properties.name)
    });
});

// --- تحميل طبقة موقع الجامعة ---
fetch('data/Uni_Point_ToJSON.geojson').then(res => res.json()).then(data => {
    universityLayer = L.geoJSON(data, {
        pointToLayer: (f, ll) => L.marker(ll).bindPopup("<b>الجامعة الأهلية</b>")
    });
    // لا تضيف الطبقة هنا - الـ setTimeout هو المسؤول عن الإضافة
});

// --- TASK 1: تحميل طبقة بوابات الجامعة (points_JSON.geojson) وإظهارها تلقائياً ---
fetch('data/points_JSON.geojson').then(res => res.json()).then(data => {
    gatesLayer = L.geoJSON(data, {
        pointToLayer: (f, ll) => L.circleMarker(ll, {
            radius: 10,
            fillColor: "#ff8c00",
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9
        }),
        onEachFeature: (f, l) => {
            const name = (f.properties && f.properties.name) ? f.properties.name : "بوابة";
            l.bindPopup("<b>بوابة: " + name + "</b>");
        }
    });
    // البوابات تظهر فقط في القسم الأول بعد الأنيميشن (يتحكم فيها الـ setTimeout)
    // في القسم الثاني: المستخدم يتحكم يدوياً
}).catch(err => console.error('خطأ في تحميل ملف البوابات:', err));

// --- تحميل طبقة جميع الخدمات ---
fetch('data/All_Services.geojson.json').then(res => res.json()).then(data => {
    const colors = { 'Restaurants': '#ff4757', 'Cafes': '#ffa502', 'Pharmacies': '#2ed573', 'Libraries': '#1e90ff' };

    servicesLayer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
                radius: 7,
                fillColor: colors[feature.properties.Type] || '#747d8c',
                color: "#fff", weight: 1, fillOpacity: 0.9
            }).bindPopup(`<b>${feature.properties.Name}</b><br>النوع: ${feature.properties.Type}`);
        }
    });
});

// دالة التحكم في طبقات الخدمات حسب النوع
function toggleServiceLayer(type) {
    if (!servicesLayer) return;
    servicesLayer.eachLayer(layer => {
        if (layer.feature.properties.Type === type) {
            map.hasLayer(layer) ? map.removeLayer(layer) : layer.addTo(map);
        }
    });
}

// --- ربط الأزرار (مع ?. لتجنب الخطأ في section2.html) ---

// أزرار الخدمات (موجودة فقط في index.html)
document.getElementById('toggle-restaurants')?.addEventListener('click', () => toggleServiceLayer('Restaurants'));
document.getElementById('toggle-cafes')?.addEventListener('click', () => toggleServiceLayer('Cafes'));
document.getElementById('toggle-pharmacies')?.addEventListener('click', () => toggleServiceLayer('Pharmacies'));
document.getElementById('toggle-libraries')?.addEventListener('click', () => toggleServiceLayer('Libraries'));

// أزرار الطبقات المشتركة (موجودة في index.html و section2.html)
document.getElementById('toggle-university')?.addEventListener('click', () => {
    if (universityLayer) { map.hasLayer(universityLayer) ? map.removeLayer(universityLayer) : universityLayer.addTo(map); }
});
document.getElementById('toggle-top3')?.addEventListener('click', () => {
    if (top3Layer) { map.hasLayer(top3Layer) ? map.removeLayer(top3Layer) : top3Layer.addTo(map); }
});
document.getElementById('toggle-shyakha')?.addEventListener('click', () => {
    if (shyakhaLayer) { map.hasLayer(shyakhaLayer) ? map.removeLayer(shyakhaLayer) : shyakhaLayer.addTo(map); }
});
document.getElementById('toggle-sour1')?.addEventListener('click', () => {
    if (sour1Layer) { map.hasLayer(sour1Layer) ? map.removeLayer(sour1Layer) : sour1Layer.addTo(map); }
});
document.getElementById('toggle-sour2')?.addEventListener('click', () => {
    if (sour2Layer) { map.hasLayer(sour2Layer) ? map.removeLayer(sour2Layer) : sour2Layer.addTo(map); }
});
document.getElementById('toggle-suggested')?.addEventListener('click', () => {
    if (suggestedPlacesLayer) { map.hasLayer(suggestedPlacesLayer) ? map.removeLayer(suggestedPlacesLayer) : suggestedPlacesLayer.addTo(map); }
});

// زر البوابات (البوابات - موجود في كلا الصفحتين)
document.getElementById('toggle-services')?.addEventListener('click', () => {
    if (gatesLayer) { map.hasLayer(gatesLayer) ? map.removeLayer(gatesLayer) : gatesLayer.addTo(map); }
});

// --- دالة المسافة ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- دالة التحليل الذكي للخدمات ---
let allConnectionLines = L.layerGroup();

function analyzeBestService(targetLatLng) {
    if (!servicesLayer) { alert("يرجى انتظار تحميل بيانات الخدمات أولاً"); return; }

    allConnectionLines.clearLayers();
    map.addLayer(allConnectionLines);

    const types = ['Restaurants', 'Cafes', 'Pharmacies', 'Libraries'];

    let analysisResults = [];
    const listDiv = document.getElementById('closest-services-list');
    if (listDiv) listDiv.innerHTML = '<h3>تحليل المنطقة:</h3>';

    types.forEach(type => {
        let closest = null;
        let minDistance = Infinity;

        servicesLayer.eachLayer(layer => {
            if (layer.feature.properties.Type === type) {
                const layerLatLng = layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng();
                const dist = getDistance(targetLatLng.lat, targetLatLng.lng, layerLatLng.lat, layerLatLng.lng);
                if (dist < minDistance) { minDistance = dist; closest = layer; }
            }
        });

        if (closest) {
            analysisResults.push({ type, distance: minDistance, name: closest.feature.properties.Name });
            
            const closestLatLng = closest.getBounds ? closest.getBounds().getCenter() : closest.getLatLng();
            const strokeColor = (type === 'Restaurants' ? '#ff4757' : type === 'Cafes' ? '#ffa502' : type === 'Pharmacies' ? '#2ed573' : '#1e90ff');
            
            // إضافة خط التوصيل
            L.polyline([targetLatLng, closestLatLng], {
                color: strokeColor,
                weight: 3,
                dashArray: '5, 5'
            }).addTo(allConnectionLines);
            
            // إضافة أيقونة الخدمة في نهاية الخط بشكل احترافي
            const faIcons = { 'Restaurants': '<i class="fas fa-utensils"></i>', 'Cafes': '<i class="fas fa-coffee"></i>', 'Pharmacies': '<i class="fas fa-pills"></i>', 'Libraries': '<i class="fas fa-book"></i>' };
            const iconHtml = `<div style="font-size: 14px; background: white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.5); border: 2px solid ${strokeColor}; color: ${strokeColor};">${faIcons[type] || '<i class="fas fa-map-marker-alt"></i>'}</div>`;
            
            L.marker(closestLatLng, {
                icon: L.divIcon({
                    className: 'custom-div-icon',
                    html: iconHtml,
                    iconSize: [26, 26],
                    iconAnchor: [13, 13]
                })
            }).bindTooltip(closest.feature.properties.Name).addTo(allConnectionLines);

            if (listDiv) listDiv.innerHTML += `<p>أقرب ${type}: <b>${minDistance.toFixed(2)} كم</b></p>`;
        }
    });

    if (analysisResults.length > 0 && listDiv) {
        const bestService = analysisResults.reduce((prev, current) => (prev.distance > current.distance) ? prev : current);
        listDiv.innerHTML += `
            <div style="background:#2ecc71; color: white; padding:10px; margin-top:10px; border-radius:5px;">
                <strong>الاقتراح:</strong> أفضل خدمة يحتاجها هذا الحي هي <b>${bestService.type}</b>
                (أبعد نقطة حالياً: ${bestService.distance.toFixed(2)} كم).
            </div>`;
    }
}
