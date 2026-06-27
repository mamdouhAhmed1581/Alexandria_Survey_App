// 1. تعريف الأيقونات
const tunnelIcon = L.icon({
    iconUrl: 'img/logo.jpeg',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

const trainIcon = L.icon({
    iconUrl: 'img/logo.jpeg',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

// 2. تعريف الطبقات
let roadLayer;
const tunnelMarker = L.marker([31.21276, 29.97315], { icon: tunnelIcon }).bindPopup("هنا يوجد نفق");
const trainMarker = L.marker([31.20659, 29.97470], { icon: trainIcon }).bindPopup("هنا توجد سكة حديد");

// FIX: استبدال loadLayer() غير الموجودة بـ fetch() الصحيحة
fetch('data/roads_seniro_ToJSON.geojson')
    .then(res => {
        if (!res.ok) throw new Error('HTTP error: ' + res.status);
        return res.json();
    })
    .then(data => {
        roadLayer = L.geoJSON(data, {
            style: function(feature) {
                // تلوين المسارين بألوان مختلفة (يمين وشمال)
                if (feature.id === 0 || feature.properties.FID === 0) {
                    return { color: '#ff3300', weight: 5, opacity: 0.9 }; // لون الطريق الأول (أحمر)
                } else {
                    return { color: '#00ccff', weight: 5, opacity: 0.9 }; // لون الطريق الثاني (أزرق سماوي)
                }
            },
            onEachFeature: function(feature, layer) {
                // إضافة معلومات ذكية عند الضغط على المسار
                if (feature.id === 0 || feature.properties.FID === 0) {
                    layer.bindPopup("<div style='text-align:right;'><b>المسار الأيمن</b><br>الطول: ~1.8 كم<br>الوقت بالسيارة: 4 دقائق<br><i style='color:#ff3300;'>يتميز بوجود نفق للعبور</i></div>");
                } else {
                    layer.bindPopup("<div style='text-align:right;'><b>المسار الأيسر</b><br>الطول: ~2.1 كم<br>الوقت بالسيارة: 5 دقائق<br><i style='color:#00ccff;'>يتقاطع مع خط سكة حديد</i></div>");
                }
            }
        });
        console.log('تم تحميل طبقات الطريق بنجاح (يمين وشمال)');
    })
    .catch(err => console.error('خطأ في تحميل ملف الطريق:', err));

// 3. التحكم في زر الطريق (المسار + النفق + سكة الحديد معاً)
document.getElementById('toggle-road')?.addEventListener('click', () => {
    if (roadLayer) {
        if (map.hasLayer(roadLayer)) {
            map.removeLayer(roadLayer);
            map.removeLayer(tunnelMarker);
            map.removeLayer(trainMarker);
        } else {
            roadLayer.addTo(map);
            tunnelMarker.addTo(map);
            trainMarker.addTo(map);
        }
    } else {
        alert("جاري تحميل الطريق، يرجى الانتظار...");
    }
});
