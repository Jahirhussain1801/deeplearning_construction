let updateInterval;

function startDetection() {
    // Start updating stats
    updateInterval = setInterval(updateDetectionData, 1000);
    fetch('/start_detection');
    showNotification('Detection started', 'success');
}

function stopDetection() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    fetch('/stop_detection');
    showNotification('Detection stopped', 'info');
}

async function updateDetectionData() {
    try {
        const response = await fetch('/detection_data');
        const data = await response.json();

        // Update safety score
        document.getElementById('safety-score').textContent = data.safety_score + '%';
        const scoreCircle = document.querySelector('.score-circle');

        // Change color based on score
        if (data.safety_score >= 80) {
            scoreCircle.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        } else if (data.safety_score >= 60) {
            scoreCircle.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
        } else {
            scoreCircle.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
        }

        // Update detection counts
        document.getElementById('hard-hat').textContent = data['hard-hat'];
        document.getElementById('vest').textContent = data.vest;
        document.getElementById('glasses').textContent = data.glasses;
        document.getElementById('no-hard-hat').textContent = data['no-hard-hat'];
        document.getElementById('no-vest').textContent = data['no-vest'];
        document.getElementById('no-glasses').textContent = data['no-glasses'];

        // Update alerts
        updateAlerts(data);

    } catch (error) {
        console.error('Error updating detection data:', error);
    }
}

function updateAlerts(data) {
    const alertsContainer = document.getElementById('alerts-container');
    alertsContainer.innerHTML = '';

    const alerts = [];

    if (data['no-hard-hat'] > 0) {
        alerts.push({
            message: `⚠️ ${data['no-hard-hat']} person(s) without hard hat`,
            type: 'danger'
        });
    }

    if (data['no-vest'] > 0) {
        alerts.push({
            message: `⚠️ ${data['no-vest']} person(s) without safety vest`,
            type: 'danger'
        });
    }

    if (data['no-glasses'] > 0) {
        alerts.push({
            message: `⚠️ ${data['no-glasses']} person(s) without safety glasses`,
            type: 'warning'
        });
    }

    if (alerts.length === 0) {
        alertsContainer.innerHTML = '<div class="alert safe">✅ All safety equipment detected</div>';
    } else {
        alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert ${alert.type}`;
            alertElement.textContent = alert.message;
            alertsContainer.appendChild(alertElement);
        });
    }
}

function showNotification(message, type) {
    // Simple notification - you can enhance this with a proper notification library
    console.log(`${type}: ${message}`);
}

// Start detection when page loads
document.addEventListener('DOMContentLoaded', function() {
    startDetection();
});