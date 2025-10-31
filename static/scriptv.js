let updateInterval;

function startDetection() {
    updateInterval = setInterval(updateDetectionData, 1000);
    showNotification('Safety analysis started', 'success');
}

function stopDetection() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    showNotification('Safety analysis stopped', 'info');
}

async function uploadVideo() {
    const fileInput = document.getElementById('video-file');
    const statusDiv = document.getElementById('upload-status');

    if (!fileInput.files[0]) {
        statusDiv.innerHTML = '<span style="color: var(--danger)">Please select a video file</span>';
        return;
    }

    const formData = new FormData();
    formData.append('video', fileInput.files[0]);

    try {
        statusDiv.innerHTML = '<span style="color: var(--warning)">Uploading and processing video...</span>';

        const response = await fetch('/upload_video', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            statusDiv.innerHTML = '<span style="color: var(--success)">Video uploaded successfully! Analysis started.</span>';
            document.getElementById('current-mode').textContent = 'Video Analysis';
            startDetection();
        } else {
            statusDiv.innerHTML = `<span style="color: var(--danger)">Error: ${result.error}</span>`;
        }
    } catch (error) {
        statusDiv.innerHTML = '<span style="color: var(--danger)">Upload failed. Please try again.</span>';
        console.error('Upload error:', error);
    }
}

async function switchToWebcam() {
    try {
        const response = await fetch('/switch_to_webcam');
        const result = await response.json();

        if (result.success) {
            document.getElementById('current-mode').textContent = 'Webcam';
            document.getElementById('upload-status').innerHTML = '';
            document.getElementById('video-file').value = '';
            showNotification('Switched to webcam mode', 'info');
            startDetection();
        }
    } catch (error) {
        console.error('Switch error:', error);
    }
}

async function updateDetectionData() {
    try {
        const response = await fetch('/detection_data');
        const data = await response.json();

        // Update safety score with dynamic circle
        document.getElementById('safety-score').textContent = data.safety_score + '%';
        const scoreCircle = document.querySelector('.score-circle');

        // Update circle gradient based on score
        let color;
        if (data.safety_score >= 80) {
            color = 'var(--success)';
        } else if (data.safety_score >= 60) {
            color = 'var(--warning)';
        } else {
            color = 'var(--danger)';
        }

        scoreCircle.style.background = `conic-gradient(${color} 0% ${data.safety_score}%, #ecf0f1 ${data.safety_score}% 100%)`;

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
            message: `🚨 ${data['no-hard-hat']} personnel without hard hat protection`,
            type: 'danger'
        });
    }

    if (data['no-vest'] > 0) {
        alerts.push({
            message: `⚠️ ${data['no-vest']} personnel without safety vest`,
            type: 'danger'
        });
    }

    if (data['no-glasses'] > 0) {
        alerts.push({
            message: `⚠️ ${data['no-glasses']} personnel without safety glasses`,
            type: 'warning'
        });
    }

    if (alerts.length === 0) {
        alertsContainer.innerHTML = '<div class="alert safe">✅ All safety protocols compliant</div>';
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
    // Could be enhanced with toast notifications
    console.log(`${type}: ${message}`);
}

// Start detection when page loads
document.addEventListener('DOMContentLoaded', function() {
    startDetection();
});