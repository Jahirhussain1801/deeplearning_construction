// Global variables
let currentPhotoFile = null;
let isAnalyzing = false;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏗️ Construction Safety Access Control System Ready');
    console.log('Safety Rules:');
    console.log('- Hard hat REQUIRED');
    console.log('- Safety vest REQUIRED');
    console.log('- Minimum safety score: 50%');
    console.log('🎥 Live surveillance activated');

    initializeFileUpload();
    resetStatusDisplay();
});

// Initialize file upload functionality
function initializeFileUpload() {
    const fileInput = document.getElementById('photo-file');
    const uploadBox = document.getElementById('upload-box');
    const analyzeBtn = document.getElementById('analyze-btn');

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            currentPhotoFile = file;
            analyzeBtn.disabled = false;

            // Update upload box display
            const uploadText = uploadBox.querySelector('.upload-text');
            const uploadSubtext = uploadBox.querySelector('.upload-subtext');

            uploadText.textContent = file.name;
            uploadSubtext.textContent = `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`;

            uploadBox.style.borderColor = '#3498db';
            uploadBox.style.background = 'rgba(52, 152, 219, 0.05)';

            showResult('Photo ready for analysis', 'info');
        }
    });

    // Drag and drop functionality
    uploadBox.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#3498db';
        this.style.background = 'rgba(52, 152, 219, 0.1)';
    });

    uploadBox.addEventListener('dragleave', function(e) {
        e.preventDefault();
        if (!currentPhotoFile) {
            this.style.borderColor = '#bdc3c7';
            this.style.background = 'var(--bg-light)';
        }
    });

    uploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            fileInput.files = e.dataTransfer.files;
            currentPhotoFile = file;
            analyzeBtn.disabled = false;

            const uploadText = this.querySelector('.upload-text');
            const uploadSubtext = this.querySelector('.upload-subtext');

            uploadText.textContent = file.name;
            uploadSubtext.textContent = `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`;

            this.style.borderColor = '#3498db';
            this.style.background = 'rgba(52, 152, 219, 0.05)';

            showResult('Photo ready for analysis', 'info');
        }
    });
}

// Capture and analyze from live surveillance
async function captureAndAnalyze() {
    if (isAnalyzing) return;

    const captureBtn = document.getElementById('capture-btn');
    const resultDiv = document.getElementById('photo-result');

    // Show analyzing state
    isAnalyzing = true;
    captureBtn.disabled = true;
    captureBtn.innerHTML = '📸 CAPTURING & ANALYZING...';
    captureBtn.classList.add('analyzing');

    showResult('Capturing photo from live surveillance and analyzing safety compliance...', 'info');
    resetStatusDisplay();

    // Update status to analyzing
    const statusIndicator = document.getElementById('status-indicator');
    statusIndicator.className = 'status-indicator pending';
    statusIndicator.innerHTML = '<span class="status-icon">🔍</span><span class="status-text">ANALYZING SAFETY...</span>';

    try {
        const response = await fetch('/capture_photo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();

        if (result.success) {
            // Update analyzed image
            const imageContainer = document.getElementById('analyzed-image-container');
            const analyzedImage = document.getElementById('analyzed-image');
            analyzedImage.src = result.analyzed_image_url;
            imageContainer.style.display = 'block';

            // Scroll to results smoothly
            imageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Update all displays
            updateSafetyDisplay(result);

            // Show result message
            if (result.access_granted) {
                showResult(`✅ ${result.message}`, 'success');
            } else {
                showResult(`❌ ${result.message}`, 'danger');
            }

        } else {
            showResult(`Error: ${result.error}`, 'danger');
        }

    } catch (error) {
        console.error('Capture error:', error);
        showResult('❌ Capture failed. Please check camera connection and try again.', 'danger');
    } finally {
        // Reset button
        isAnalyzing = false;
        captureBtn.disabled = false;
        captureBtn.innerHTML = '📸 CAPTURE & ANALYZE SAFETY';
        captureBtn.classList.remove('analyzing');
    }
}

// Analyze uploaded photo
async function analyzeUploadedPhoto() {
    if (!currentPhotoFile || isAnalyzing) return;

    const analyzeBtn = document.getElementById('analyze-btn');
    const resultDiv = document.getElementById('photo-result');

    // Show loading state
    isAnalyzing = true;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '🔍 ANALYZING PHOTO...';
    showResult('Analyzing uploaded photo for safety compliance...', 'info');
    resetStatusDisplay();

    const formData = new FormData();
    formData.append('photo', currentPhotoFile);

    try {
        const response = await fetch('/upload_photo', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            // Update analyzed image
            const imageContainer = document.getElementById('analyzed-image-container');
            const analyzedImage = document.getElementById('analyzed-image');
            analyzedImage.src = result.analyzed_image_url;
            imageContainer.style.display = 'block';

            // Scroll to results
            imageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Update all displays
            updateSafetyDisplay(result);

            // Show result message
            if (result.access_granted) {
                showResult(`✅ ${result.message}`, 'success');
            } else {
                showResult(`❌ ${result.message}`, 'danger');
            }

        } else {
            showResult(`❌ Error: ${result.error}`, 'danger');
        }

    } catch (error) {
        console.error('Analysis error:', error);
        showResult('❌ Analysis failed. Please try again with a different photo.', 'danger');
    } finally {
        // Reset button
        isAnalyzing = false;
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '🔍 ANALYZE UPLOADED PHOTO';
    }
}

// Update safety display with results
function updateSafetyDisplay(result) {
    // Update safety score
    const scoreElement = document.getElementById('safety-score');
    const scoreCircle = document.querySelector('.score-circle');
    scoreElement.textContent = result.safety_score + '%';

    // Update score circle color and gradient
    let color;
    if (result.access_granted) {
        color = 'var(--success)';
    } else {
        color = 'var(--danger)';
    }
    scoreCircle.style.background = `conic-gradient(${color} 0% ${result.safety_score}%, #ecf0f1 ${result.safety_score}% 100%)`;

    // Update access status
    const statusIndicator = document.getElementById('status-indicator');
    if (result.access_granted) {
        statusIndicator.className = 'status-indicator allowed';
        statusIndicator.innerHTML = '<span class="status-icon">✅</span><span class="status-text">ACCESS GRANTED</span>';
    } else {
        statusIndicator.className = 'status-indicator denied';
        statusIndicator.innerHTML = '<span class="status-icon">🚫</span><span class="status-text">ACCESS DENIED</span>';
    }

    // Update requirements
    updateRequirement('req-hard-hat', result.requirements_met.hard_hat, 'Hard Hat Detection');
    updateRequirement('req-vest', result.requirements_met.vest, 'Safety Vest Detection');
    updateRequirement('req-score', result.requirements_met.minimum_score, 'Minimum Score: 50%');

    // Update detection counts
    document.getElementById('hard-hat-count').textContent = result.detections.hard_hat;
    document.getElementById('vest-count').textContent = result.detections.vest;
    document.getElementById('no-hard-hat-count').textContent = result.detections.no_hard_hat;
    document.getElementById('no-vest-count').textContent = result.detections.no_vest;
}

// Update individual requirement status
function updateRequirement(elementId, isMet, text) {
    const element = document.getElementById(elementId);
    if (isMet) {
        element.className = 'requirement-item met';
        element.innerHTML = `<span class="req-icon">✅</span><span class="req-text">${text}</span>`;
    } else {
        element.className = 'requirement-item not-met';
        element.innerHTML = `<span class="req-icon">❌</span><span class="req-text">${text}</span>`;
    }
}

// Reset status display to initial state
function resetStatusDisplay() {
    // Reset requirements to pending state
    const requirements = ['req-hard-hat', 'req-vest', 'req-score'];
    requirements.forEach(req => {
        const element = document.getElementById(req);
        element.className = 'requirement-item';
        element.innerHTML = `<span class="req-icon">⏳</span><span class="req-text">${req === 'req-score' ? 'Minimum Score: 50%' : req.split('-')[1].replace('_', ' ').toUpperCase() + ' Detection'}</span>`;
    });

    // Reset counts
    document.getElementById('hard-hat-count').textContent = '0';
    document.getElementById('vest-count').textContent = '0';
    document.getElementById('no-hard-hat-count').textContent = '0';
    document.getElementById('no-vest-count').textContent = '0';

    // Reset score
    document.getElementById('safety-score').textContent = '0%';
    document.querySelector('.score-circle').style.background = 'conic-gradient(#ecf0f1 0% 100%)';
}

// Show result message
function showResult(message, type) {
    const resultDiv = document.getElementById('photo-result');
    resultDiv.innerHTML = `<div class="alert ${type}">${message}</div>`;
}

// Add keyboard shortcut for capture (Spacebar)
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && !isAnalyzing) {
        e.preventDefault();
        captureAndAnalyze();
    }
});