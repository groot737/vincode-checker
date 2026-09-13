const mockData = {
  "success": true,
  "input": {
    "key": "API_KEY",
    "vin": "WBAFR7C57CC811956"
  },
  "attributes": {
    "year": "2012",
    "make": "BMW",
    "model": "5-Series",
    "trim": "535i",
    "style": "SEDAN 4-DR",
    "made_in": "GERMANY",
    "fuel_capacity": "18.50 gallon",
    "city_mileage": "19 - 21 miles/gallon",
    "highway_mileage": "29 - 31 miles/gallon",
    "engine": "3.0L L6 DOHC 24V",
    "transmission": "6-Speed Manual | 8-Speed Automatic",
    "drivetrain": "RWD",
    "anti_brake_system": "4-Wheel ABS",
    "steering_type": "R&P",
    "curb_weight": "4090 lbs",
    "overall_height": "57.60 in.",
    "overall_length": "193.10 in.",
    "overall_width": "73.20 in.",
    "wheelbase_length": "116.90 in.",
    "standard_seating": "5",
    "invoice_price": "$48,480 USD",
    "delivery_charges": "$895 USD",
    "manufacturer_suggested_retail_price": "$52,500 USD",
    "production_seq_number": "811956",
    "front_brake_type": "Disc",
    "rear_brake_type": "Disc",
    "front_suspension": "Ind",
    "rear_suspension": "Ind",
    "tires": "245/45R18"
  },
  "warranties": [
    {
      "type": "Basic",
      "miles": "50,000 mile",
      "months": "48 month"
    },
    {
      "type": "Powertrain",
      "miles": "50,000 mile",
      "months": "48 month"
    },
    {
      "type": "Rust",
      "months": "144 month",
      "miles": "Unlimited mile"
    }
  ],
  "timestamp": "2026-09-10T21:41:01.255Z"
};

document.addEventListener('DOMContentLoaded', () => {
    const checkBtn = document.getElementById('checkBtn');
    const vinInput = document.getElementById('vinInput');
    const resultsSection = document.getElementById('resultsSection');
    const errorMsg = document.getElementById('errorMsg');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const loadingSubText = document.getElementById('loadingSubText');

    function showLoading(title, subtitle) {
        loadingText.textContent = title;
        loadingSubText.textContent = subtitle;
        loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }

    checkBtn.addEventListener('click', () => {
        const vin = vinInput.value.trim().toUpperCase();

        if (vin.length !== 17) {
            errorMsg.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            return;
        }

        errorMsg.classList.add('hidden');
        resultsSection.classList.add('hidden');
        document.getElementById('aiResultsSection').classList.add('hidden');

        // Show loading screen with animated steps
        showLoading('Decoding VIN...', 'Connecting to vehicle database');
        checkBtn.disabled = true;

        setTimeout(() => {
            loadingSubText.textContent = 'Fetching vehicle specifications';
        }, 600);

        fetch(`/api/vin/${vin}`)
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.error) {
                    errorMsg.textContent = data.error;
                    errorMsg.classList.remove('hidden');
                } else {
                    window.currentVinData = data;
                    populateData(data);
                    resultsSection.classList.remove('hidden');
                    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                checkBtn.disabled = false;
            })
            .catch(err => {
                hideLoading();
                errorMsg.textContent = 'Server error connecting to API.';
                errorMsg.classList.remove('hidden');
                checkBtn.disabled = false;
            });
    });

    downloadPdfBtn.addEventListener('click', () => {
        if (!window.currentVinData) return;
        downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        setTimeout(() => {
            generateTextPdf(window.currentVinData);
            downloadPdfBtn.innerHTML = '<i class="fas fa-arrow-down-to-line"></i> Download PDF';
        }, 200);
    });

    // AI Analyzer
    document.getElementById('aiAnalyzerBtn').addEventListener('click', () => {
        const aiBtn = document.getElementById('aiAnalyzerBtn');
        const aiResults = document.getElementById('aiResultsSection');

        // If already visible, hide it (toggle)
        if (!aiResults.classList.contains('hidden')) {
            aiResults.classList.add('hidden');
            return;
        }

        showLoading('Running AI Analysis...', 'Scanning market data');
        aiBtn.disabled = true;
        document.getElementById('aiPriceValue').textContent = 'Loading...';
        aiResults.classList.remove('hidden');

        fetch(`/api/vin/${vinInput.value.trim().toUpperCase()}/price`)
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.error) {
                    alert('Error calculating price: ' + data.error);
                    aiResults.classList.add('hidden');
                } else {
                    document.getElementById('aiPriceValue').textContent = '$' + (data.price_usd || 0).toLocaleString();
                    aiResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                aiBtn.disabled = false;
            })
            .catch(err => {
                hideLoading();
                alert('Server error connecting to AI.');
                aiResults.classList.add('hidden');
                aiBtn.disabled = false;
            });
    });
});

function populateData(data) {
    const attr = data.attributes;

    // Header
    document.getElementById('vehicleTitle').textContent = `${attr.year} ${attr.make} ${attr.model} ${attr.trim}`;
    document.getElementById('displayVin').textContent = data.input.vin;
    document.getElementById('reportTitle').textContent = `${attr.year} ${attr.make} ${attr.model} ${attr.trim}`;
    document.getElementById('reportDate').textContent = `Report generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    document.getElementById('reportMsrp').textContent = attr.manufacturer_suggested_retail_price || 'N/A';

    // Quick Stats
    const stats = [
        { label: 'Engine', value: attr.engine || '-', icon: 'fa-engine', color: 'blue' },
        { label: 'Drivetrain', value: attr.drivetrain || '-', icon: 'fa-tire', color: 'emerald' },
        { label: 'Body Style', value: attr.style || '-', icon: 'fa-car-side', color: 'violet' },
        { label: 'Origin', value: attr.made_in || '-', icon: 'fa-globe', color: 'amber' }
    ];
    const colorMap = {
        blue: 'bg-blue-50 border-blue-100 text-blue-600',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        violet: 'bg-violet-50 border-violet-100 text-violet-600',
        amber: 'bg-amber-50 border-amber-100 text-amber-600'
    };
    document.getElementById('quickStats').innerHTML = stats.map(s => `
        <div class="stat-card ${colorMap[s.color]} border rounded-xl p-5">
            <div class="text-[10px] font-bold uppercase tracking-[0.15em] opacity-70 mb-2">${s.label}</div>
            <div class="text-sm font-bold text-gray-900 leading-snug">${s.value}</div>
        </div>
    `).join('');

    // Helper: render spec rows
    function renderRows(items) {
        return items.filter(i => i.value).map(item => `
            <div class="spec-row flex justify-between items-center py-3 px-3 -mx-3 rounded-lg border-b border-gray-50 last:border-0">
                <span class="text-sm text-gray-400 font-medium">${item.label}</span>
                <span class="text-sm font-semibold text-gray-800 text-right">${item.value}</span>
            </div>
        `).join('');
    }

    // Tech Specs
    document.getElementById('techSpecs').innerHTML = renderRows([
        { label: 'Transmission', value: attr.transmission },
        { label: 'Fuel Capacity', value: attr.fuel_capacity },
        { label: 'City Mileage', value: attr.city_mileage },
        { label: 'Highway Mileage', value: attr.highway_mileage },
        { label: 'Anti-Brake System', value: attr.anti_brake_system },
        { label: 'Front Brakes', value: attr.front_brake_type },
        { label: 'Rear Brakes', value: attr.rear_brake_type },
        { label: 'Steering Type', value: attr.steering_type },
        { label: 'Front Suspension', value: attr.front_suspension },
        { label: 'Rear Suspension', value: attr.rear_suspension },
        { label: 'Tires', value: attr.tires },
        { label: 'Production Seq. Number', value: attr.production_seq_number }
    ]);

    // Dimensions
    document.getElementById('dimSpecs').innerHTML = renderRows([
        { label: 'Overall Length', value: attr.overall_length },
        { label: 'Overall Width', value: attr.overall_width },
        { label: 'Overall Height', value: attr.overall_height },
        { label: 'Wheelbase', value: attr.wheelbase_length },
        { label: 'Curb Weight', value: attr.curb_weight },
        { label: 'Seating Capacity', value: attr.standard_seating }
    ]);

    // Pricing
    document.getElementById('pricingSpecs').innerHTML = renderRows([
        { label: 'Invoice Price', value: attr.invoice_price },
        { label: 'Delivery Charges', value: attr.delivery_charges },
        { label: 'Base MSRP', value: attr.manufacturer_suggested_retail_price }
    ]);

    // Warranties
    const wIcons = { Basic: 'fa-shield-check', Powertrain: 'fa-gears', Rust: 'fa-droplet' };
    const wColors = { Basic: 'blue', Powertrain: 'emerald', Rust: 'violet' };
    document.getElementById('warrantiesList').innerHTML = (data.warranties || []).map(w => {
        const c = wColors[w.type] || 'blue';
        return `
            <div class="warranty-card bg-gradient-to-br from-${c}-50 to-white border border-${c}-100 rounded-xl p-5">
                <div class="flex items-center gap-2.5 mb-3">
                    <div class="w-8 h-8 bg-${c}-100 rounded-lg flex items-center justify-center">
                        <i class="fas ${wIcons[w.type] || 'fa-shield'} text-${c}-600 text-xs"></i>
                    </div>
                    <span class="font-bold text-gray-900 text-sm">${w.type}</span>
                </div>
                <div class="space-y-1.5 text-sm text-gray-600">
                    <div class="flex justify-between"><span>Duration</span><span class="font-semibold text-gray-800">${w.months}</span></div>
                    <div class="flex justify-between"><span>Mileage</span><span class="font-semibold text-gray-800">${w.miles}</span></div>
                </div>
            </div>
        `;
    }).join('') || '<p class="text-gray-400 text-sm">No warranty information available.</p>';

    // Equipment and Colors (Optional sections depending on VIN data)
    let extraHtml = '';

    if (data.equipment && Object.keys(data.equipment).length > 0) {
        const eqList = Object.entries(data.equipment)
            .filter(([_, val]) => val === 'Std.')
            .map(([key, _]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        
        if (eqList.length > 0) {
            extraHtml += `
            <div class="mt-12">
                <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <span class="w-1 h-5 bg-amber-500 rounded-full"></span> Standard Equipment
                </h4>
                <div class="flex flex-wrap gap-2">
                    ${eqList.map(eq => `<span class="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">${eq}</span>`).join('')}
                </div>
            </div>`;
        }
    }

    if (data.colors && data.colors.length > 0) {
        extraHtml += `
        <div class="mt-12">
            <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                <span class="w-1 h-5 bg-pink-500 rounded-full"></span> Factory Colors
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${data.colors.map(c => `
                    <div class="p-4 border rounded-xl bg-gray-50 flex justify-between items-center">
                        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">${c.category}</span>
                        <span class="font-semibold text-gray-900">${c.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    // Append extra sections if any
    let extraContainer = document.getElementById('extraDataContainer');
    if (!extraContainer) {
        extraContainer = document.createElement('div');
        extraContainer.id = 'extraDataContainer';
        let warrantiesContainer = document.getElementById('warrantiesList').parentElement;
        warrantiesContainer.insertAdjacentElement('afterend', extraContainer);
    }
    extraContainer.innerHTML = extraHtml;
}

function generateTextPdf(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const attr = data.attributes;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // --- Header Banner ---
    doc.setFillColor(17, 24, 39); // gray-900
    doc.rect(0, 0, pageWidth, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`${attr.year} ${attr.make} ${attr.model} ${attr.trim}`, margin, 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text(`VIN: ${data.input.vin}  |  Generated: ${new Date().toLocaleDateString()}`, margin, 24);

    // MSRP on the right
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('MSRP', pageWidth - margin, 14, { align: 'right' });
    doc.setFontSize(16);
    doc.setTextColor(74, 222, 128); // green-400
    doc.setFont('helvetica', 'bold');
    doc.text(attr.manufacturer_suggested_retail_price || 'N/A', pageWidth - margin, 24, { align: 'right' });

    y = 46;

    // --- Quick Stats Row ---
    const statsData = [
        { label: 'ENGINE', value: attr.engine || '-' },
        { label: 'DRIVETRAIN', value: attr.drivetrain || '-' },
        { label: 'BODY STYLE', value: attr.style || '-' },
        { label: 'MADE IN', value: attr.made_in || '-' }
    ];
    const statBoxWidth = contentWidth / 4;
    statsData.forEach((stat, i) => {
        const x = margin + i * statBoxWidth;
        doc.setFillColor(249, 250, 251); // gray-50
        doc.roundedRect(x + 1, y, statBoxWidth - 2, 18, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text(stat.label, x + 4, y + 6);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        // Truncate long values
        const val = stat.value.length > 20 ? stat.value.substring(0, 18) + '...' : stat.value;
        doc.text(val, x + 4, y + 14);
    });

    y += 26;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- Helper: draw a section table ---
    function drawTable(title, rows, startY) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(title, margin, startY);
        startY += 2;

        doc.autoTable({
            startY: startY,
            margin: { left: margin, right: margin },
            head: [],
            body: rows,
            theme: 'plain',
            styles: {
                fontSize: 9,
                cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
                textColor: [17, 24, 39],
                lineColor: [243, 244, 246],
                lineWidth: 0.3
            },
            columnStyles: {
                0: { fontStyle: 'normal', textColor: [107, 114, 128], cellWidth: contentWidth * 0.45 },
                1: { fontStyle: 'bold', halign: 'right' }
            },
            didDrawPage: () => {}
        });

        return doc.lastAutoTable.finalY + 8;
    }

    // --- Technical Specifications ---
    const techRows = [
        ['Transmission', attr.transmission],
        ['Fuel Capacity', attr.fuel_capacity],
        ['City Mileage', attr.city_mileage],
        ['Highway Mileage', attr.highway_mileage],
        ['Anti-Brake System', attr.anti_brake_system],
        ['Steering Type', attr.steering_type],
        ['Front Brakes', attr.front_brake_type],
        ['Rear Brakes', attr.rear_brake_type],
        ['Front Suspension', attr.front_suspension],
        ['Rear Suspension', attr.rear_suspension],
        ['Tires', attr.tires]
    ].filter(r => r[1]);

    y = drawTable('Technical Specifications', techRows, y);

    // --- Dimensions & Weight ---
    const dimRows = [
        ['Overall Length', attr.overall_length],
        ['Overall Width', attr.overall_width],
        ['Overall Height', attr.overall_height],
        ['Wheelbase', attr.wheelbase_length],
        ['Curb Weight', attr.curb_weight],
        ['Standard Seating', attr.standard_seating]
    ].filter(r => r[1]);

    y = drawTable('Dimensions & Weight', dimRows, y);

    // --- Pricing Information ---
    const pricingRows = [
        ['Invoice Price', attr.invoice_price],
        ['Delivery Charges', attr.delivery_charges],
        ['Base MSRP', attr.manufacturer_suggested_retail_price]
    ].filter(r => r[1]);

    y = drawTable('Pricing Information', pricingRows, y);

    // --- Warranty Information ---
    if (data.warranties && data.warranties.length) {
        // Check if we need a new page
        if (y > 250) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text('Warranty Information', margin, y);
        y += 2;

        doc.autoTable({
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Type', 'Duration', 'Mileage']],
            body: data.warranties.map(w => [w.type, w.months, w.miles]),
            theme: 'grid',
            headStyles: {
                fillColor: [238, 242, 255], // indigo-50
                textColor: [55, 48, 163],   // indigo-800
                fontStyle: 'bold',
                fontSize: 9
            },
            styles: {
                fontSize: 9,
                cellPadding: 4,
                textColor: [17, 24, 39],
                lineColor: [229, 231, 235],
                lineWidth: 0.3
            }
        });
        
        y = doc.lastAutoTable.finalY + 8;
    }

    // --- Standard Equipment ---
    if (data.equipment && Object.keys(data.equipment).length > 0) {
        const eqList = Object.entries(data.equipment)
            .filter(([_, val]) => val === 'Std.')
            .map(([key, _]) => [key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())]);
        
        if (eqList.length > 0) {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('Standard Equipment', margin, y);
            y += 2;

            doc.autoTable({
                startY: y,
                margin: { left: margin, right: margin },
                head: [],
                body: eqList,
                theme: 'plain',
                styles: {
                    fontSize: 9,
                    cellPadding: 2,
                    textColor: [17, 24, 39],
                    lineColor: [243, 244, 246],
                    lineWidth: 0.3
                },
                columnStyles: {
                    0: { fontStyle: 'normal' }
                }
            });
            
            y = doc.lastAutoTable.finalY + 8;
        }
    }

    // --- Factory Colors ---
    if (data.colors && data.colors.length > 0) {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text('Factory Colors', margin, y);
        y += 2;

        doc.autoTable({
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Category', 'Color Name']],
            body: data.colors.map(c => [c.category, c.name]),
            theme: 'grid',
            headStyles: {
                fillColor: [253, 242, 248], // pink-50
                textColor: [157, 23, 77],   // pink-800
                fontStyle: 'bold',
                fontSize: 9
            },
            styles: {
                fontSize: 9,
                cellPadding: 4,
                textColor: [17, 24, 39],
                lineColor: [229, 231, 235],
                lineWidth: 0.3
            }
        });
        
        y = doc.lastAutoTable.finalY + 8;
    }

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(156, 163, 175);
        doc.text(
            `VIN Decoder Pro  |  Page ${i} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: 'center' }
        );
    }

    doc.save(`VIN_Report_${data.input.vin}.pdf`);
}
