// ===== PARTICLE SYSTEM =====
class ParticleSystem {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.init();
    }

    init() {
        for (let i = 0; i < 40; i++) {
            this.createParticle();
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 3 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = x + '%';
        particle.style.top = y + '%';
        particle.style.animation = `float ${duration}s ease-in-out infinite`;
        particle.style.animationDelay = delay + 's';
        
        this.container.appendChild(particle);
        this.particles.push(particle);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize particle system
    const particlesContainer = document.getElementById('particlesContainer');
    if (particlesContainer) {
        new ParticleSystem(particlesContainer);
    }

    // Initialize SVG gradient
    initProgressGradient();

    console.log('✅ Detector page initialized');
});

function initProgressGradient() {
    const svg = document.querySelector('.score-circle');
    if (!svg) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'progressGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#7c3aed');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#06b6d4');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
}

// ===== STATE MANAGEMENT =====
let analysisHistory = [];

// ===== DOM ELEMENTS =====
const emailInput = document.getElementById('emailInput');
const fileInput = document.getElementById('fileInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const uploadBtn = document.getElementById('uploadBtn');
const resultsContainer = document.getElementById('resultsContainer');
const resultsDisplay = document.getElementById('resultsDisplay');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const emptyState = document.getElementById('emptyState');
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const charCount = document.getElementById('charCount');
const clearBtn = document.getElementById('clearBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const exportResultBtn = document.getElementById('exportResultBtn');
const analyzeAnotherBtn = document.getElementById('analyzeAnotherBtn');
const errorDismissBtn = document.getElementById('errorDismissBtn');

// ===== CHARACTER COUNT =====
if (emailInput) {
    emailInput.addEventListener('input', () => {
        charCount.textContent = emailInput.value.length;
    });
}

// ===== CLEAR BUTTON =====
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        emailInput.value = '';
        charCount.textContent = '0';
    });
}

// ===== TAB SWITCHING =====
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Load history if history tab is clicked
        if (tabName === 'history') {
            displayHistory();
        }
    });
});

// ===== ANALYZE EMAIL (TEXT INPUT) =====
analyzeBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    
    if (!email) {
        showNotification('Please paste an email to analyze', 'warning');
        return;
    }
    
    await sendAnalysisRequest({ email });
});

// ===== UPLOAD FILE =====
uploadBtn.addEventListener('click', async () => {
    if (!fileInput.files.length) {
        showNotification('Please select a file to upload', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Validate file type
    const allowedExtensions = ['txt', 'eml', 'msg'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
        showNotification(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`, 'warning');
        return;
    }
    
    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('File is too large. Maximum size: 100MB', 'warning');
        return;
    }
    
    // Show file info
    const fileSize = (file.size / 1024).toFixed(2);
    console.log(`📁 Uploading: ${file.name} (${fileSize} KB)`);
    
    await analyzeFile(file);
});

// ===== ANALYZE FILE =====
async function analyzeFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    loadingIndicator.classList.remove('hidden');
    
    try {
        console.log('🔍 Analyzing file...');
        
        const response = await fetch('/api/analyze-file', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Analysis failed');
        }
        
        const result = await response.json();
        console.log('✅ Analysis complete:', result);
        
        displayResults(result);
        showNotification(`File analyzed successfully: ${file.name}`, 'info');
        
        // Clear file input after successful analysis
        fileInput.value = '';
        updateFileInputLabel();
    } catch (error) {
        console.error('❌ Analysis error:', error);
        showNotification(`Error: ${error.message}`, 'danger');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// ===== FILE INPUT DRAG & DROP =====
const fileLabel = document.querySelector('.file-label');
const uploadArea = document.querySelector('.upload-area');

// Drag over label
if (fileLabel) {
    fileLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.classList.add('drag-over');
    });
    
    fileLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.classList.remove('drag-over');
    });
    
    fileLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });
}

// Drag over upload area
if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });
}

// File input change handler
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
    }
});

// ===== HANDLE FILE SELECTION =====
function handleFileSelection(file) {
    // Validate file type
    const allowedExtensions = ['txt', 'eml', 'msg'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
        showNotification(`❌ Invalid file type. Allowed: ${allowedExtensions.join(', ')}`, 'danger');
        fileInput.value = '';
        return;
    }
    
    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('❌ File is too large. Maximum size: 100MB', 'danger');
        fileInput.value = '';
        return;
    }
    
    // Set file input and update label
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    
    updateFileInputLabel();
    showFileInfo(file);
    showNotification(`✅ File selected: ${file.name}`, 'success');
}

// ===== UPDATE FILE INPUT LABEL =====
function updateFileInputLabel() {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileSize = (file.size / 1024).toFixed(2);
        fileLabel.textContent = `📄 ${file.name} (${fileSize} KB)`;
        fileLabel.style.color = 'var(--secondary)';
    } else {
        fileLabel.textContent = '📁 Choose Email File';
        fileLabel.style.color = 'var(--primary)';
    }
}

// ===== FILE INPUT CHANGE EVENT =====
if (fileInput) {
    fileInput.addEventListener('change', () => {
        updateFileInputLabel();
        if (fileInput.files.length > 0) {
            showNotification(`File selected: ${fileInput.files[0].name}`, 'info');
        }
    });
}

// ===== SEND ANALYSIS REQUEST =====
async function sendAnalysisRequest(data) {
    loadingIndicator.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Analysis failed');
        }
        
        const result = await response.json();
        analysisHistory.unshift(result);
        displayResults(result);
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'danger');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// ===== DISPLAY RESULTS =====
function displayResults(result) {
    // Update score circle
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreNumber = document.getElementById('scoreNumber');
    const riskLevel = document.getElementById('riskLevel');
    const riskDescription = document.getElementById('riskDescription');
    
    scoreNumber.textContent = result.score;
    riskLevel.textContent = result.risk_level;
    
    // Remove all risk level classes
    scoreCircle.classList.remove('safe', 'low', 'medium', 'high', 'critical');
    
    // Add appropriate risk level class
    const riskClass = result.risk_level.toLowerCase();
    scoreCircle.classList.add(riskClass);
    
    // Update risk description
    const descriptions = {
        'SAFE': '✅ No phishing indicators detected',
        'LOW': '⚠️ Minor phishing indicators detected',
        'MEDIUM': '🔴 Moderate phishing indicators present',
        'HIGH': '🔴 Strong phishing indicators detected',
        'CRITICAL': '🚨 Critical phishing threat detected'
    };
    riskDescription.textContent = descriptions[result.risk_level] || '';
    
    // Update email details
    document.getElementById('fromValue').textContent = result.from || '-';
    document.getElementById('subjectValue').textContent = result.subject || '-';
    
    // Update reasons
    const reasonsList = document.getElementById('reasonsList');
    if (result.reasons.length > 0) {
        reasonsList.innerHTML = result.reasons.map(reason => `<li>${reason}</li>`).join('');
    } else {
        reasonsList.innerHTML = '<li>✅ No suspicious indicators found</li>';
    }
    
    // Update URLs
    const urlsSection = document.getElementById('urlsSection');
    const urlsList = document.getElementById('urlsList');
    
    if (result.suspicious_urls && result.suspicious_urls.length > 0) {
        urlsSection.classList.remove('hidden');
        urlsList.innerHTML = result.suspicious_urls.map(url => `
            <div class="url-item">
                <strong>🔗 ${url.url}</strong><br>
                <small>Issues: ${url.issues.join(', ')}</small>
            </div>
        `).join('');
    } else {
        urlsSection.classList.add('hidden');
    }
    
    // Update all URLs
    const allUrlsSection = document.getElementById('allUrlsSection');
    const allUrlsList = document.getElementById('allUrlsList');
    
    if (result.urls && result.urls.length > 0) {
        allUrlsSection.classList.remove('hidden');
        allUrlsList.innerHTML = result.urls.map(url => `
            <div class="url-item-safe">
                🔗 ${url}
            </div>
        `).join('');
    } else {
        allUrlsSection.classList.add('hidden');
    }
    
    // Show results section with animation
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Add animation
    resultsSection.style.animation = 'fadeInUp 0.6s ease';
}

// ===== DISPLAY HISTORY =====
function displayHistory() {
    const historyList = document.getElementById('historyList');
    
    if (analysisHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No analyses yet. Analyze an email to get started!</p>';
        return;
    }
    
    historyList.innerHTML = analysisHistory.map((item, index) => {
        const timestamp = new Date(item.timestamp).toLocaleString();
        return `
            <div class="history-item" onclick="restoreHistoryItem(${index})">
                <div class="history-item-header">
                    <span class="history-item-from">${item.from || 'Unknown Sender'}</span>
                    <span class="history-item-score">${item.score}/100</span>
                </div>
                <div class="history-item-subject">${item.subject || 'No Subject'}</div>
                <div class="history-item-time">${timestamp}</div>
            </div>
        `;
    }).join('');
}

// ===== RESTORE HISTORY ITEM =====
function restoreHistoryItem(index) {
    displayResults(analysisHistory[index]);
}

// ===== CLOSE RESULTS =====
closeResultsBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
});

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    // Create a simple notification (can be enhanced with a toast library)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'danger' ? '#ff1744' : type === 'warning' ? '#f59e0b' : '#00ff88'};
        color: ${type === 'danger' ? 'white' : type === 'warning' ? '#000' : '#000'};
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== ADD ANIMATIONS TO STYLESHEET =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== PARTICLE ANIMATION BACKGROUND =====
function createParticles() {
    const container = document.body;
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            pointer-events: none;
            width: ${Math.random() * 3 + 1}px;
            height: ${Math.random() * 3 + 1}px;
            background: rgba(0, 255, 136, ${Math.random() * 0.5 + 0.3});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 10 + 5}s ease-in-out infinite;
            z-index: 1;
        `;
        container.appendChild(particle);
    }
}

// Initialize particles on load
window.addEventListener('load', () => {
    createParticles();
    
    // Add some interactive effects
    document.addEventListener('mousemove', (e) => {
        // Optional: Add parallax or other mouse tracking effects
    });
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to analyze
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement === emailInput) {
            analyzeBtn.click();
        }
    }
});

// ===== LOCALSTORAGE PERSISTENCE =====
function saveHistory() {
    localStorage.setItem('phishingHistory', JSON.stringify(analysisHistory.slice(0, 50)));
}

function loadHistoryFromStorage() {
    const stored = localStorage.getItem('phishingHistory');
    if (stored) {
        try {
            analysisHistory = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }
}

// Save history when analysis is added
const originalAnalyze = sendAnalysisRequest;
sendAnalysisRequest = async function(data) {
    await originalAnalyze(data);
    saveHistory();
};

// Load history on startup
window.addEventListener('load', () => {
    loadHistoryFromStorage();
});

// ===== EXPORT ANALYSIS =====
function exportAnalysisAsJSON(result) {
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phishing-analysis-${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// ===== ADD EXPORT BUTTON FUNCTIONALITY =====
window.addEventListener('load', () => {
    const resultsHeader = document.querySelector('.results-header');
    if (resultsHeader && !document.getElementById('exportBtn')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'exportBtn';
        exportBtn.className = 'btn-close';
        exportBtn.innerHTML = '📥';
        exportBtn.style.marginRight = '15px';
        exportBtn.title = 'Export Analysis';
        exportBtn.addEventListener('click', () => {
            const scoreNumber = document.getElementById('scoreNumber').textContent;
            if (scoreNumber) {
                exportAnalysisAsJSON({
                    score: scoreNumber,
                    riskLevel: document.getElementById('riskLevel').textContent,
                    from: document.getElementById('fromValue').textContent,
                    subject: document.getElementById('subjectValue').textContent,
                    timestamp: new Date().toISOString()
                });
                showNotification('Analysis exported successfully!', 'info');
            }
        });
        resultsHeader.insertBefore(exportBtn, closeResultsBtn);
    }
});

console.log('🛡️ Phishing Shield loaded successfully!');
