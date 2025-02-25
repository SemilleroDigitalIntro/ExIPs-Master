const ips = []; 

document.getElementById('extract-button').addEventListener('click', function () {
    const inputFile = document.getElementById('input-file');

    if (inputFile.files.length > 0) {
        const file = inputFile.files[0];
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();
        const reader = new FileReader();

        if (fileExt === 'txt') {
            reader.onload = event => processFileContent(event.target.result, fileName);
            reader.readAsText(file);
        } else if (fileExt === 'pdf') {
            extractIPsFromPDF(file, fileName);
        } else if (fileExt === 'docx') {
            extractIPsFromDOCX(file, fileName);
        } else if (fileExt === 'xlsx') {
            extractIPsFromExcel(file, fileName);
        } else {
            alert("Formato de archivo no compatible.");
        }
    } else {
        alert("Por favor, selecciona un archivo.");
    }
});

async function extractIPsFromPDF(file, fileName) {
    const reader = new FileReader();
    reader.onload = async event => {
        const pdf = await pdfjsLib.getDocument(new Uint8Array(event.target.result)).promise;
        let textContent = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            text.items.forEach(item => textContent += item.str + ' ');
        }

        processFileContent(textContent, fileName);
    };
    reader.readAsArrayBuffer(file);
}

function extractIPsFromDOCX(file, fileName) {
    const reader = new FileReader();
    reader.onload = event => {
        mammoth.extractRawText({ arrayBuffer: event.target.result })
            .then(result => processFileContent(result.value, fileName))
            .catch(err => alert("Error al procesar el archivo DOCX: " + err));
    };
    reader.readAsArrayBuffer(file);
}

function extractIPsFromExcel(file, fileName) {
    const reader = new FileReader();
    reader.onload = event => {
        const workbook = XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
        let textContent = '';

        workbook.SheetNames.forEach(sheetName => {
            textContent += XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]) + '\n';
        });

        processFileContent(textContent, fileName);
    };
    reader.readAsArrayBuffer(file);
}

function processFileContent(content, fileName) {
    const ipRegex = /((?:\d{1,3}\.){3}\d{1,3})|([0-9a-fA-F:]+)/g;
    const foundIPs = content.match(ipRegex) || [];
    const ipv4List = foundIPs.filter(ip => ip.includes('.'));
    const ipv6List = foundIPs.filter(ip => ip.includes(':'));

    ips.push({ name: fileName, total: foundIPs.length, ipv4Count: ipv4List.length, ipv6Count: ipv6List.length });
    updateTable();

    let highlightedContent = content;

    ipv4List.forEach(ip => {
        const safeIP = ip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Evita problemas con caracteres especiales
        const regex = new RegExp(`\\b${safeIP}\\b`, 'g'); // Asegura que solo se reemplacen IPs exactas
        highlightedContent = highlightedContent.replace(regex, `<span class="highlight-v4">${ip}</span>`);
    });

    ipv6List.forEach(ip => {
        const safeIP = ip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${safeIP}\\b`, 'g');
        highlightedContent = highlightedContent.replace(regex, `<span class="highlight-v6">${ip}</span>`);
    });

    const textBox = document.getElementById('text-box');
    textBox.innerHTML = highlightedContent;
    textBox.style.display = 'block';
}

function updateTable() {
    document.getElementById('ip-table-body').innerHTML = ips.map(ip => 
        `<tr><td>${ip.name}</td><td>${ip.total} IPs encontradas</td><td>IPv4: ${ip.ipv4Count} | IPv6: ${ip.ipv6Count}</td></tr>`
    ).join('');
}

document.getElementById('remove-button').addEventListener('click', () => {
    ips.length = 0;
    document.getElementById('ip-table-body').innerHTML = '';
    document.getElementById('text-box').style.display = 'none';
});

// Código para el fondo de bolitas
const numBalls = 50; 
const balls = [];
const containerWidth = window.innerWidth;
const containerHeight = window.innerHeight;

for (let i = 0; i < numBalls; i++) {
    const ball = document.createElement('div');
    ball.className = 'ball';
    const size = Math.random() * 70 + 10;  
    ball.style.width = `${size}px`;
    ball.style.height = `${size}px`;
    ball.style.backgroundColor = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.4)`; 
    ball.style.left = `${Math.random() * (containerWidth - size)}px`;
    ball.style.top = `${Math.random() * (containerHeight - size)}px`;

    
    const speedX = (Math.random() * 2 + 0.5) * (Math.random() < 0.5 ? 1 : -1);
    const speedY = (Math.random() * 2 + 0.5) * (Math.random() < 0.5 ? 1 : -1);
    balls.push({ element: ball, speedX, speedY });

    document.body.appendChild(ball);
}

function animateBalls() {
    balls.forEach(ball => {
        const rect = ball.element.getBoundingClientRect();
        
        ball.element.style.left = `${rect.left + ball.speedX}px`;
        ball.element.style.top = `${rect.top + ball.speedY}px`;

        
        if (rect.left + ball.speedX < 0 || rect.right + ball.speedX > containerWidth) {
            ball.speedX *= -1;
        }
        if (rect.top + ball.speedY < 0 || rect.bottom + ball.speedY > containerHeight) {
            ball.speedY *= -1; 
        }
    });

    requestAnimationFrame(animateBalls); 
}

animateBalls();
