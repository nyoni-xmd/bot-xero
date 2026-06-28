// script.js - XERO-MD Pairing
const phoneInput = document.getElementById('phoneInput');
const pairBtn = document.getElementById('pairBtn');
const resultBox = document.getElementById('result');
const pairingCode = document.getElementById('pairingCode');
const pairingMessage = document.getElementById('pairingMessage');
const loading = document.getElementById('loading');
const copyBtn = document.getElementById('copyBtn');

// Auto-add country code focus
phoneInput.addEventListener('focus', function() {
    if (!this.value) {
        this.placeholder = '712345678';
    }
});

// Submit on Enter
phoneInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        pairBtn.click();
    }
});

pairBtn.addEventListener('click', async () => {
    let number = phoneInput.value.trim();
    if (!number) {
        showResult('error', 'Tafadhali ingiza namba yako.', '');
        return;
    }

    // Clean number
    number = number.replace(/[^0-9]/g, '');
    if (number.length < 7) {
        showResult('error', 'Namba inaonekana fupi sana. Hakikisha ni sahihi.', '');
        return;
    }

    // Full number with country code
    const fullNumber = '255' + number; // Default Tanzania
    // If user includes country code, handle it
    if (number.startsWith('255') && number.length > 9) {
        // Already has country code
    }

    pairBtn.disabled = true;
    pairBtn.textContent = '⏳ Inasubiri...';
    loading.classList.remove('hidden');
    resultBox.classList.add('hidden');

    try {
        const response = await fetch('/pair', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: fullNumber })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showResult('success', data.message || '✅ Pairing code imepatikana!', data.code);
        } else {
            showResult('error', data.error || 'Hitilafu! Jaribu tena.', '');
        }
    } catch (error) {
        console.error(error);
        showResult('error', '❌ Server error! Hakikisha umeingia mtandao.', '');
    } finally {
        pairBtn.disabled = false;
        pairBtn.textContent = '🚀 GET PAIRING CODE';
        loading.classList.add('hidden');
    }
});

function showResult(type, message, code) {
    resultBox.classList.remove('hidden');
    pairingMessage.textContent = message;
    pairingMessage.style.color = type === 'success' ? '#00cec9' : '#ff6b6b';
    
    if (code) {
        pairingCode.textContent = code;
        pairingCode.style.display = 'block';
        copyBtn.style.display = 'inline-block';
    } else {
        pairingCode.textContent = '------';
        pairingCode.style.display = 'block';
        copyBtn.style.display = 'none';
    }
}

// Copy code to clipboard
copyBtn.addEventListener('click', () => {
    const code = pairingCode.textContent;
    if (code && code !== '------') {
        navigator.clipboard.writeText(code).then(() => {
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy Code';
            }, 2000);
        }).catch(() => {
            // Fallback
            const range = document.createRange();
            range.selectNode(pairingCode);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy Code';
            }, 2000);
        });
    }
});
