// Global variables
let currentPhotoFile = null;

// Initialize file upload
document.getElementById('photo-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        currentPhotoFile = file;
        document.querySelector('.analyze-btn').disabled = false;
        document.querySelector('.upload-text').textContent = file.name;
        document.querySelector('.upload-subtext').textContent = 'Click analyze to check safety';
        document.querySelector('.upload-box').style.borderColor = '#3498db';
        document.querySelector('.upload-box').style.background = '#f0f8ff';
    }
});

// Drag and drop functionality
const uploadBox = document.querySelector('.upload-box');
uploadBox.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = '#3498db';
    this.style.background = '#f0f8ff';
});

uploadBox.addEventListener('dragleave', function(e) {
    e.preventDefault();
    this.style.borderColor = '#bdc3c7';
    this.style.background = '#f8f9fa';
});

uploadBox.addEventListener('drop', function(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        document.getElementById('photo-file').files = e.dataTransfer.files;
        currentPhotoFile = file;
        document.querySelector('.analyze-btn').disabled = false;
        document.querySelector('.upload-text').textContent = file.name;
        document.querySelector('.upload-subtext').textContent = 'Click analyze to check safety';
        this.style.borderColor = '#3498db';
        this.style.background = '#f0f8ff';
    }
});

async function analyzePhoto() {
    if (!currentPhotoFile) {
        showResult('Please select a photo first.', 'info');
        return;
    }

    const resultDiv = document.getElementById('photo-result');
    const analyzeBtn = document.querySelector('.analyze-btn');
    
    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '🔍 Analyzing Safety...';
    showResult('Analyzing photo for safety compliance...', 'info');
    
    // Reset status
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
            
            // Update all displays
            updateSafetyDisplay(result);
            
            // Show result message
            if (result.access_granted) {
                showResult(result.message, 'success');
            } else {
                showResult(result.message, 'danger');
            }
            
        } else {
            showResult(`Error: ${result.error}`, 'danger');
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        showResult('Analysis failed. Please try again.', 'danger');
    } finally {
        // Reset button
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = 'Analyze Safety Compliance';
    }
}

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
    updateRequirement('req-hard-hat', result.requirements_met.hard_hat, 'Hard Hat');
    updateRequirement('req-vest', result.requirements_met.vest, 'Safety Vest');
    updateRequirement('req-score', result.requirements_met.minimum_score, 'Score ≥ 50%');
    
    // Update detection counts
    document.getElementById('hard-hat-count').textContent = result.detections.hard_hat;
    document.getElementById('vest-count').textContent = result.detections.vest;
    document.getElementById('no-hard-hat-count').textContent = result.detections.no_hard_hat;
    document.getElementById('no-vest-count').textContent = result.detections.no_vest;
}

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

function resetStatusDisplay() {
    // Reset to initial state
    document.getElementById('status-indicator').className = 'status-indicator pending';
    document.getElementById('status-indicator').innerHTML = '<span class="status-icon">⏳</span><span class="status-text">Analyzing...</span>';
    
    document.getElementById('safety-score').textContent = '0%';
    document.querySelector('.score-circle').style.background = 'conic-gradient(#ecf0f1 0% 100%)';
    
    // Reset requirements
    const requirements = ['req-hard-hat', 'req-vest', 'req-score'];
    requirements.forEach(req => {
        document.getElementById(req).className = 'requirement-item';
        document.getElementById(req).innerHTML = `<span class="req-icon">⏳</span><span class="req-text">${req === 'req-score' ? 'Score ≥ 50%' : req.split('-')[1].replace('_', ' ').toUpperCase()}</span>`;
    });
    
    // Reset counts
    document.getElementById('hard-hat-count').textContent = '0';
    document.getElementById('vest-count').textContent = '0';
    document.getElementById('no-hard-hat-count').textContent = '0';
    document.getElementById('no-vest-count').textContent = '0';
}

function showResult(message, type) {
    const resultDiv = document.getElementById('photo-result');
    resultDiv.innerHTML = `<div class="alert ${type}">${message}</div>`;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Construction Safety Access Control System Ready');
    console.log('Safety Rules:');
    console.log('- Hard hat REQUIRED');
    console.log('- Safety vest REQUIRED');
    console.log('- Minimum safety score: 50%');
});