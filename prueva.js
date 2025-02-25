const ips = JSON.parse(localStorage.getItem('ips')) ||  []; // Almacenará las IPs extraídas

document.getElementById('extract-button').addEventListener('click', function () {
    const inputFile = document.getElementById('input-file');
    const tableBody = document.getElementById('ip-table-body');

    if (inputFile.files.length > 0) {
        const file = inputFile.files[0];
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();

        const reader = new FileReader();

        reader.onload = function (event) {
            let content = event.target.result;

            if (fileExt === 'txt') {
                extractAndDisplayIPs(content, fileName); 
            } else if (fileExt === 'pdf') {
                extractIPsFromPDF(file, fileName); 
            } else if (fileExt === 'docx') {
                extractIPsFromDOCX(file, fileName); 
            } else if (fileExt === 'xlsx') {
                extractIPsFromXLSX(file, fileName); 
            } else if (fileExt === 'pptx') {
                extractIPsFromPPTX(file, fileName); 
            } else {
                alert("Formato de archivo no compatible.");
            }
        };

        if (fileExt === 'txt') {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file); 
        }
    } else {
        alert("Por favor, selecciona un archivo.");
    }
});

function extractAndDisplayIPs(content, fileName) {
    const ipRegex = /((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:[0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}/g;
    const foundIPs = content.match(ipRegex) || [];

    console.log('Direcciones IP encontradas:', foundIPs); // la Depuración de las ips encontradas

    const ipv4 = foundIPs.filter(ip => ip.includes('.'));
    const ipv6 = foundIPs.filter(ip => ip.includes(':'));

    // aqui Agregar a la lista de IPs
    ips.push({ name: fileName, total: foundIPs.length, ipv4: ipv4.length, ipv6: ipv6.length });

    updateTable();
}

function updateTable() {
    const tbody = document.getElementById('ip-table-body');
    tbody.innerHTML = ''; // aqui limpia tabla de extraccion ips

    ips.forEach(ip => {
        const row = `<tr>
            <td>${ip.name}</td>
            <td>${ip.total} IPs encontradas</td>
            <td>IPv4: ${ip.ipv4} IPv6: ${ip.ipv6}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

document.getElementById('remove-button').addEventListener('click', () => {
    //  aqui Eliminar la última entrada de IPs extraídas
    if (ips.length > 0) {
        ips.pop();
        updateTable();
    }
});

async function extractIPsFromPDF(file, fileName) {
    const reader = new FileReader();
    reader.onload = async function (event) {
        const typedarray = new Uint8Array(event.target.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        
        let textContent = '';
            
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            
            text.items.forEach(item => {
                textContent += item.str + ' ';
            });
        }
        console.log('Texto extraído del PDF:', textContent);  
        extractAndDisplayIPs(textContent, fileName);
    };
    reader.readAsArrayBuffer(file);
}

function extractIPsFromDOCX(file, fileName) {
    const reader = new FileReader();
    reader.onload = function (event) {
        mammoth.extractRawText({ arrayBuffer: event.target.result }).then(result => {
            extractAndDisplayIPs(result.value, fileName);
        });
    };
    reader.readAsArrayBuffer(file); 
}

function extractIPsFromXLSX(file, fileName) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let textContent = '';
        workbook.SheetNames.forEach(sheetName => {
            const sheet = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
            textContent += sheet + '\n';
        });
        extractAndDisplayIPs(textContent, fileName);
    };
    reader.readAsArrayBuffer(file); 
}

function extractIPsFromPPTX(file, fileName) {
    const reader = new FileReader();
    reader.onload = function (event) {
        let pptx = new PptxGenJS();
        pptx.load(event.target.result).then(() => {
            let textContent = '';
            pptx.slides.forEach((slide, slideIndex) => {
                console.log(`Procesando diapositiva ${slideIndex + 1}`);
                slide.items.forEach((item, itemIndex) => {
                    if (item.text) {
                        console.log(`Elemento ${itemIndex + 1}: ${item.text}`);
                        textContent += item.text + ' ';
                    }
                });
            });
            extractAndDisplayIPs(textContent, fileName);
        }).catch(err => {
            console.error('Error al procesar el archivo PPTX:', err);
        });
    };
    reader.readAsArrayBuffer(file);
}