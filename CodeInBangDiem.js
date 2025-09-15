// Function to apply all custom UI modifications
function applyCustomizations() {
    console.log('Applying custom UI modifications...');

    // --- THÊM MỚI: Biến để lưu trữ bản sao lưu của bảng điểm ---
    let pristineTableBackup = null;

    // --- THÊM MỚI: XÓA ICON CÀI ĐẶT ---
    /**
     * Tìm và xóa biểu tượng bánh răng cài đặt (config tool cog) không cần thiết.
     */
    const configCog = document.getElementById('config-tool-cog');
    if (configCog) {
        configCog.remove();
        console.log('Đã xóa thành công element icon cài đặt (config-tool-cog).');
    }
    // --- KẾT THÚC ---


    // --- Part 0: Function to remove empty columns ---
    /**
     * Quét bảng điểm, tìm và xóa các cột hoàn toàn trống.
     * Cột "Ghi chú", "TBQT" và "Đạt" sẽ không bị xóa.
     * @returns {number} Số lượng cột còn lại sau khi đã xóa.
     */
    function removeEmptyColumns() {
        const table = document.getElementById('xemDiem_aaa');
        if (!table) {
            console.error("Lỗi: Không tìm thấy bảng điểm với id 'xemDiem_aaa'.");
            return 0;
        }

        const dataRows = Array.from(table.querySelectorAll('tbody tr:not(:has([colspan]))'));
        if (dataRows.length === 0) {
            console.log("Không có dữ liệu điểm để phân tích.");
            const firstHeaderRow = table.querySelector('thead tr');
            return firstHeaderRow ? firstHeaderRow.cells.length : 0;
        }

        const numCols = dataRows[0].cells.length;
        const keepIndices = new Set(); // Tập hợp các chỉ số cột cần giữ lại
        const deleteIndices = []; // Mảng các chỉ số cột cần xóa

        // --- Bước 1: Xác định các cột cần xóa ---
        const firstDataRowCells = dataRows[0].cells;
        for (let i = 0; i < numCols; i++) {
            const cell = firstDataRowCells[i];
            const title = cell.getAttribute('title');
            if (title === 'GhiChu' || title === 'DiemTBQuaTrinh') {
                keepIndices.add(i);
            }
            if (cell.querySelector('div.check, div.no-check')) {
                keepIndices.add(i);
            }
        }

        for (let i = 0; i < numCols; i++) {
            if (keepIndices.has(i)) {
                continue;
            }

            let isColumnEmpty = true;
            for (const row of dataRows) {
                if (row.cells[i] && row.cells[i].textContent.trim() !== '') {
                    isColumnEmpty = false;
                    break;
                }
            }

            if (isColumnEmpty) {
                deleteIndices.push(i);
            }
        }

        if (deleteIndices.length === 0) {
            console.log("Không tìm thấy cột nào trống để xóa.");
            return numCols;
        }

        console.log('Các cột được giữ lại (theo tiêu đề/nội dung): "Ghi chú", "TBQT", "Đạt"');
        console.log('Các chỉ số cột trống sẽ bị xóa:', deleteIndices);

        // --- Bước 2: Xóa các ô trong phần thân bảng (tbody) ---
        for (let i = deleteIndices.length - 1; i >= 0; i--) {
            const colIndex = deleteIndices[i];
            for (const row of dataRows) {
                if (row.cells[colIndex]) {
                    row.cells[colIndex].remove();
                }
            }
        }

        // --- Bước 3: Xử lý phần đầu bảng (thead) ---
        const grid = [];
        const theadRows = Array.from(table.querySelectorAll('thead tr'));
        theadRows.forEach((row, r) => {
            if (!grid[r]) grid[r] = [];
            let c = 0;
            Array.from(row.cells).forEach(th => {
                while (grid[r][c]) c++;
                const rowspan = th.rowSpan;
                const colspan = th.colSpan;
                for (let ri = r; ri < r + rowspan; ri++) {
                    if (!grid[ri]) grid[ri] = [];
                    for (let ci = c; ci < c + colspan; ci++) {
                        grid[ri][ci] = th;
                    }
                }
                c += colspan;
            });
        });

        const thCoverage = new Map();
        grid.forEach(row => {
            row.forEach((th, c) => {
                if (!th) return;
                if (!thCoverage.has(th)) thCoverage.set(th, new Set());
                thCoverage.get(th).add(c);
            });
        });

        const deleteIndicesSet = new Set(deleteIndices);
        thCoverage.forEach((coveredIndices, th) => {
            const numToDelete = [...coveredIndices].filter(c => deleteIndicesSet.has(c)).length;
            if (numToDelete > 0) {
                if (numToDelete === th.colSpan) {
                    th.remove();
                } else {
                    th.colSpan -= numToDelete;
                }
            }
        });

        const finalColumnCount = numCols - deleteIndices.length;
        console.log(`Đã xóa thành công ${deleteIndices.length} cột. Số cột còn lại: ${finalColumnCount}.`);
        return finalColumnCount;
    }


    // --- Part 1: Modify Header and add Student Info Input ---

    const headerContent = document.querySelector('.header-content');
    const logoLink = document.querySelector('.logo a');

    if (headerContent && logoLink) {
        logoLink.removeAttribute('href');
        console.log('Logo href attribute removed.');

        const logo = logoLink.parentElement;

        Array.from(headerContent.children).forEach(child => {
            if (child !== logo) {
                child.remove();
            }
        });

        const studentInfoDiv = document.createElement('div');
        studentInfoDiv.id = 'headerStudentInfo';
        studentInfoDiv.style.cssText = `
            display: flex;
            align-items: center;
            font-weight: bold;
            font-size: 1.2em;
            color: #0E5777;
            cursor: pointer;
            height: 100%;
        `;
        studentInfoDiv.innerHTML = `<span id="studentNameDisplay">Đang tải thông tin sinh viên...</span>`;
        headerContent.appendChild(studentInfoDiv);
        
        const removeColsButton = document.createElement('button');
        removeColsButton.id = 'removeEmptyColsBtn';
        removeColsButton.innerText = 'Xóa Cột Trống';
        removeColsButton.style.cssText = `
            background-color: #c82333;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-left: 20px;
        `;
        headerContent.appendChild(removeColsButton);

        const restoreColsButton = document.createElement('button');
        restoreColsButton.id = 'restoreColsBtn';
        restoreColsButton.innerText = 'Khôi phục cột';
        restoreColsButton.style.cssText = `
            background-color: #28a745;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: not-allowed;
            font-weight: bold;
            margin-left: 10px;
            opacity: 0.5;
        `;
        restoreColsButton.disabled = true;
        headerContent.appendChild(restoreColsButton);

        const printButton = document.createElement('button');
        printButton.id = 'printButton';
        printButton.innerText = 'In Bảng Điểm';
        printButton.style.cssText = `
            background-color: #0E5777;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-left: 10px;
        `;
        headerContent.appendChild(printButton);

        const formatSummaryButton = document.createElement('button');
        formatSummaryButton.id = 'formatSummaryBtn';
        formatSummaryButton.innerText = 'Định Dạng Dòng Tổng Kết';
        formatSummaryButton.style.cssText = `
            background-color: #ffc107;
            color: black;
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-left: 10px;
        `;
        headerContent.appendChild(formatSummaryButton);

        const prepareAndPrint = () => {
            console.log('Preparing to print by removing @page rules...');
            for (const sheet of Array.from(document.styleSheets)) {
                try {
                    const rules = sheet.cssRules;
                    if (!rules) continue;
                    for (let i = rules.length - 1; i >= 0; i--) {
                        const r = rules[i];
                        if (r.type === CSSRule.PAGE_RULE) {
                            try { sheet.deleteRule(i); } catch (e) { /* ignore */ }
                        }
                    }
                } catch (err) { /* ignore */ }
            }
            console.log('Attempted to remove @page rules. Opening print dialog.');
            window.print();
        };

        printButton.addEventListener('click', prepareAndPrint);

        headerContent.style.display = 'flex';
        headerContent.style.alignItems = 'center';
        headerContent.style.height = '100%';
        headerContent.style.gap = '20px';

        const headerElement = document.querySelector('header.header');
        if (headerElement) {
            headerElement.style.height = '60px';
            headerElement.style.display = 'flex';
            headerElement.style.alignItems = 'center';
            const headerContainer = headerElement.querySelector('.container');
            if (headerContainer) {
                headerContainer.style.width = '100%';
                headerContainer.style.height = '100%';
                headerContainer.style.display = 'flex';
                headerContainer.style.justifyContent = 'space-between';
                headerContainer.style.alignItems = 'center';
            }
        }

        console.log('Header modified, vertically centered, and student info placeholder added.');
    } else {
        console.error('Header, Logo link, or Logo div not found for modification.');
    }

    // Modal HTML and Logic
    const modalHtml = `
        <div id="inputFormModal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); justify-content: center; align-items: center;">
            <div class="modal-content" style="background-color: #fefefe; margin: auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 500px; box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19); border-radius: 8px; animation-name: animatetop; animation-duration: 0.4s;">
                <h3 style="text-align: center; margin-bottom: 20px; color: #0E5777;">Nhập thông tin sinh viên</h3>
                <label for="fullNameInput" style="display: block; margin-bottom: 5px; font-weight: bold;">Họ và tên:</label>
                <input type="text" id="fullNameInput" style="width: calc(100% - 20px); padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;" value="">
                <label for="mssvInput" style="display: block; margin-bottom: 5px; font-weight: bold;">MSSV:</label>
                <input type="text" id="mssvInput" style="width: calc(100% - 20px); padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;" value="">
                <label for="studentClassInput" style="display: block; margin-bottom: 5px; font-weight: bold;">Lớp:</label>
                <input type="text" id="studentClassInput" style="width: calc(100% - 20px); padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;" value="">
                <button id="saveStudentInfoBtn" style="background-color: #0E5777; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; float: right;">Nhập</button>
                <style> @keyframes animatetop { from {top: -300px; opacity: 0} to {top: 0; opacity: 1} } </style>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

     fetch('/dashboard.html', { credentials: 'include' })
      .then(resp => {
        if (!resp.ok) throw new Error('Fetch lỗi: ' + resp.status);
        return resp.text();
      })
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const mssv = doc.querySelector('span[lang="sv-mssv"]')?.closest('label.col-xs-6')?.querySelector('span.bold')?.textContent?.trim() ?? 'Không tìm thấy';
        const hoTen = doc.querySelector('span[lang="sv-hoten"]')?.closest('label.col-xs-6')?.querySelector('span.bold')?.textContent?.trim() ?? 'Không tìm thấy';
        const lopHoc = doc.querySelector('span[lang="sv-lophoc"]')?.closest('label.col-xs-6')?.querySelector('span.bold')?.textContent?.trim() ?? 'Không tìm thấy';
        console.log(`Fetched Info - MSSV: ${mssv}, Họ tên: ${hoTen}, Lớp: ${lopHoc}`);
        const studentNameDisplay = document.getElementById('studentNameDisplay');
        if (studentNameDisplay) {
            studentNameDisplay.innerText = `Họ và tên: ${hoTen} (MSSV: ${mssv} - Lớp: ${lopHoc})`;
        }
        document.getElementById('fullNameInput').value = hoTen;
        document.getElementById('mssvInput').value = mssv;
        document.getElementById('studentClassInput').value = lopHoc;
      })
      .catch(err => {
        console.error('Lỗi khi fetch thông tin sinh viên:', err);
        const studentNameDisplay = document.getElementById('studentNameDisplay');
        if (studentNameDisplay) {
            studentNameDisplay.innerText = 'Lỗi tải thông tin. Click để nhập tay.';
        }
      });

    window.showInputForm = function() {
        document.getElementById('inputFormModal').style.display = 'flex';
    };

    window.saveStudentInfo = function() {
        const fullName = document.getElementById('fullNameInput').value;
        const mssv = document.getElementById('mssvInput').value;
        const studentClass = document.getElementById('studentClassInput').value;
        document.getElementById('studentNameDisplay').innerText = `Họ và tên: ${fullName} (MSSV: ${mssv} - Lớp: ${studentClass})`;
        document.getElementById('inputFormModal').style.display = 'none';
        console.log('Student info updated.');
    };

    document.getElementById('headerStudentInfo')?.addEventListener('click', window.showInputForm);
    document.getElementById('saveStudentInfoBtn')?.addEventListener('click', window.saveStudentInfo);
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('inputFormModal');
        if (modal && event.target === modal) {
            modal.style.display = 'none';
        }
    });

    console.log('Modal for student info added and functions defined.');

    // --- Part 2: Customize Score Table and Print Behavior ---
    const tableStyle = document.createElement('style');
    tableStyle.innerHTML = `
        #xemDiem_aaa { border-collapse: collapse !important; border: 2px solid black !important; background-color: transparent !important; table-layout: auto; width: 100% !important; }
        #xemDiem_aaa thead, #xemDiem_aaa tbody, #xemDiem_aaa tr { background-color: transparent !important; }
        #xemDiem_aaa thead { position: relative; z-index: 10; }
        #xemDiem_aaa thead::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background-color: black; z-index: 12; }
        #xemDiem_aaa th, #xemDiem_aaa td { font-weight: bold !important; color: black !important; border: 1px solid black !important; background-color: transparent !important; padding: 8px 5px; vertical-align: top; text-align: center; }
        #xemDiem_aaa td.text-left div { text-align: left !important; }
        #xemDiem_aaa .cl-red { color: black !important; }
        #xemDiem_aaa .sticky-col { position: static !important; left: auto !important; background-color: transparent !important; width: auto !important; min-width: auto !important; }
        #xemDiem_aaa thead.header-sticky { position: static !important; top: auto !important; background: transparent !important; }
        #xemDiem_aaa th[style*="width"], #xemDiem_aaa td[style*="width"] { width: auto !important; min-width: auto !important; }
        #xemDiem_aaa tbody tr.row-head td { border-top: 2px solid black !important; border-bottom: 1px solid black !important; border-left: 2px solid black !important; border-right: 2px solid black !important; text-align: left !important; }
        
        .summary-row-grid { display: flex !important; align-items: center !important; }
        .summary-label { flex-shrink: 0; padding-right: 15px !important; white-space: nowrap !important; }
        .summary-separator { color: #888 !important; margin: 0 10px !important; }
        
        /* --- BẮT ĐẦU CSS CHO CHECKBOX MỚI --- */
        .custom-checkbox-container {
            display: flex;
            align-items: center;
        }
        .custom-checkbox-container input[type="checkbox"] {
            opacity: 0;
            position: absolute;
            width: 0;
            height: 0;
        }
        .custom-checkbox-container label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 1em;
            font-weight: normal;
            margin: 0;
            user-select: none;
        }
        .custom-checkbox-container .custom-checkbox {
            width: 18px;
            height: 18px;
            border: 2px solid #0E5777;
            border-radius: 3px;
            margin-right: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: background-color 0.2s, border-color 0.2s;
        }
        .custom-checkbox-container .custom-checkbox::after {
            content: '\\2714';
            font-size: 12px;
            color: white;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .custom-checkbox-container input[type="checkbox"]:checked + label .custom-checkbox {
            background-color: #0E5777;
            border-color: #0E5777;
        }
        .custom-checkbox-container input[type="checkbox"]:checked + label .custom-checkbox::after {
            opacity: 1;
        }
        /* --- KẾT THÚC CSS CHO CHECKBOX MỚI --- */

        @media print {
            /* --- SỬA ĐỔI PHẦN LOGIC IN THỜI GIAN --- */
            
            /* Luôn ẩn checkbox và nút bấm khi in */
            #printButton, #removeEmptyColsBtn, #restoreColsBtn, #formatSummaryBtn, #timeControlWrapper .custom-checkbox-container { 
                display: none !important; 
            }
            
            /* Đảm bảo div thời gian được hiển thị (trừ khi có lớp ẩn) */
            #printTimeContainer { 
                display: block !important; 
                font-size: 10pt !important; 
                color: black !important; 
            }
            
            /* Đây là quy tắc quan trọng: nếu người dùng bỏ tick, lớp này sẽ được thêm vào và dòng thời gian sẽ bị ẩn KHI IN */
            #timeControlWrapper.hide-time-on-print #printTimeContainer {
                display: none !important;
            }

            /* --- KẾT THÚC SỬA ĐỔI --- */
            
            header.header { position: static !important; height: 15mm !important; border-bottom: 1px solid #ccc; margin-bottom: 5mm; }
            body { padding-top: 0 !important; }
            .logo a::after { content: none !important; }
            .logo img { height: 10mm !important; width: auto !important; max-height: none !important; }
            #studentNameDisplay { font-size: 12pt !important; }
            #xemDiem_aaa thead::after { display: none !important; }
            #xemDiem_aaa thead tr:last-of-type th, #xemDiem_aaa thead tr:first-of-type th[rowspan="3"], #xemDiem_aaa thead tr:nth-of-type(2) th[rowspan="2"] { border-bottom: 2px solid black !important; }
            .tbl-scrollable { overflow: visible !important; max-height: none !important; height: auto !important; white-space: normal !important; }
            body::-webkit-scrollbar, .tbl-scrollable::-webkit-scrollbar { display: none !important; }
            body { -ms-overflow-style: none !important; scrollbar-width: none !important; }
            #xemDiem_aaa { width: 100% !important; table-layout: auto !important; }
            #xemDiem_aaa th, #xemDiem_aaa td { width: auto !important; min-width: 0 !important; white-space: normal !important; word-break: normal !important; overflow-wrap: break-word; padding: 5px 3px !important; font-size: 0.8em !important; }
            .header-content, .main-content .container, .main-wrapper, .box-df, .portlet, .portlet-body { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
        }
    `;
    document.head.appendChild(tableStyle);

    // --- BẮT ĐẦU PHẦN CHỈNH SỬA TÍNH NĂNG THỜI GIAN ---

    let timeUpdateInterval = null;
    let tickingInterval = null; 
    let localTimeObject = null;

    function startTicking(targetDiv, dateStr) {
        if (tickingInterval) {
            clearInterval(tickingInterval);
        }

        tickingInterval = setInterval(() => {
            if (localTimeObject) {
                localTimeObject.setSeconds(localTimeObject.getSeconds() + 1);
                const hours = localTimeObject.getHours().toString().padStart(2, '0');
                const minutes = localTimeObject.getMinutes().toString().padStart(2, '0');
                const seconds = localTimeObject.getSeconds().toString().padStart(2, '0');
                const newTimeStr = `${hours}:${minutes}:${seconds}`;
                targetDiv.innerHTML = `<b>In lúc:</b>&nbsp;${dateStr} - ${newTimeStr}`;
            }
        }, 1000);
    }

    async function updateAndDisplayTime(targetDiv) {
        if (!targetDiv) return;
        targetDiv.innerHTML = '<b>In lúc:</b>&nbsp;Đang tải thời gian...';
        try {
            const proxy = 'https://api.allorigins.win/raw?url=';
            const target = encodeURIComponent('https://time.is/vi/Vietnam');
            const url = proxy + target;

            const r = await fetch(url, { method: 'GET' });
            if (!r.ok) throw new Error('Proxy fetch failed: ' + r.status);

            const html = await r.text();

            const timeMatch = html.match(/(\d{1,2}:\d{2}:\d{2})/);
            const dateMatch = html.match(/id="dd"[^>]*>([^<]+)<\/div>/);

            const timeStr = timeMatch ? timeMatch[0] : null;
            const dateStr = dateMatch ? dateMatch[1].trim().replace(/, tuần \d+$/, '') : 'Không lấy được ngày';
            
            if (timeStr) {
                console.log(`Thời gian gốc từ server: ${dateStr} - ${timeStr}`);
                const timeParts = timeStr.split(':');
                if (timeParts.length === 3) {
                    localTimeObject = new Date();
                    localTimeObject.setHours(parseInt(timeParts[0], 10));
                    localTimeObject.setMinutes(parseInt(timeParts[1], 10));
                    localTimeObject.setSeconds(parseInt(timeParts[2], 10));
                    startTicking(targetDiv, dateStr);
                }
            } else {
                 throw new Error("Không thể phân tích chuỗi thời gian từ HTML.");
            }

        } catch (err) {
            console.error('Lỗi khi fetch thời gian từ time.is:', err);
            targetDiv.innerHTML = '<b>In lúc:</b>&nbsp;Lỗi tải thời gian';
            if(tickingInterval) clearInterval(tickingInterval);
            localTimeObject = null;
        }
    }
    
    // --- SỬA ĐỔI: Đơn giản hóa hàm quản lý ---
    // Hàm này bây giờ chỉ có nhiệm vụ khởi động bộ đếm thời gian.
    function startTimeSystem(targetDiv) {
        updateAndDisplayTime(targetDiv);
        if (timeUpdateInterval) clearInterval(timeUpdateInterval);
        timeUpdateInterval = setInterval(() => updateAndDisplayTime(targetDiv), 10000);
    }

    const portletTitle = document.querySelector('.portlet-title');
    if (portletTitle) {
        portletTitle.style.display = 'flex';
        portletTitle.style.justifyContent = 'space-between';
        portletTitle.style.alignItems = 'center';
        portletTitle.style.width = '100%';

        const timeControlWrapper = document.createElement('div');
        timeControlWrapper.id = 'timeControlWrapper';
        timeControlWrapper.style.cssText = `
            display: flex;
            align-items: center;
            gap: 15px;
            white-space: nowrap;
        `;

        const printTimeDiv = document.createElement('div');
        printTimeDiv.id = 'printTimeContainer';
        printTimeDiv.style.cssText = 'font-weight: normal; font-size: 1.5em; color: #333;';
        timeControlWrapper.appendChild(printTimeDiv);

        const timeToggleContainer = document.createElement('div');
        timeToggleContainer.className = 'custom-checkbox-container';
        
        const timeCheckbox = document.createElement('input');
        timeCheckbox.type = 'checkbox';
        timeCheckbox.id = 'showTimeCheckbox';
        timeCheckbox.checked = true;

        const timeLabel = document.createElement('label');
        timeLabel.htmlFor = 'showTimeCheckbox';
        timeLabel.title = 'Hiển thị thời gian (lấy từ web https://time.is/vi/Vietnam)';
        timeLabel.innerHTML = `
            <span class="custom-checkbox"></span>
            <span class="checkbox-label">Hiện thời gian (lấy từ web https://time.is/vi/Vietnam)</span>
        `;
        
        timeToggleContainer.appendChild(timeCheckbox);
        timeToggleContainer.appendChild(timeLabel);
        timeControlWrapper.appendChild(timeToggleContainer);
        
        portletTitle.appendChild(timeControlWrapper);

        // --- SỬA ĐỔI: Logic của checkbox CHỈ còn là thêm/xóa class ---
        timeCheckbox.addEventListener('change', () => {
            if (timeCheckbox.checked) {
                // Nếu được tick, xóa class để hiện khi in
                timeControlWrapper.classList.remove('hide-time-on-print');
                console.log('Thời gian sẽ được hiển thị khi in.');
            } else {
                // Nếu không tick, thêm class để ẩn khi in
                timeControlWrapper.classList.add('hide-time-on-print');
                 console.log('Thời gian sẽ được ẩn khi in.');
            }
        });

        // Bắt đầu chạy hệ thống thời gian ngay lập tức và chỉ một lần
        startTimeSystem(printTimeDiv);
        
    } else {
        console.error('Không tìm thấy .portlet-title để thêm điều khiển thời gian.');
    }

    // --- KẾT THÚC PHẦN CHỈNH SỬA TÍNH NĂNG THỜI GIAN ---


    console.log('Table styling updated: bold borders, text, removed sticky, print adjustments.');

    function normalizeText(s) {
        if (!s) return '';
        return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

    function buildColgroupAndFixLayout(newTotalColumns) {
        const table = document.getElementById('xemDiem_aaa');
        if (!table || newTotalColumns <= 0) return;
        const existing = table.querySelector('colgroup');
        if (existing) existing.remove();
        const headerRow = table.querySelector('thead tr:last-of-type') || table.querySelector('thead tr');
        const headerCells = headerRow ? Array.from(headerRow.cells) : [];
        let maIndex = -1;
        headerCells.forEach((th, idx) => {
            const txt = normalizeText(th.textContent || '');
            if (txt.includes('ma hoc phan') || txt.includes('ma hoc') || txt.includes('ma hp') || txt.includes('ma hocphan') || txt.includes('ma')) {
                if (txt.includes('ma') && (txt.includes('hoc') || txt.includes('phan') || txt.includes('hoc phan') || txt.includes('hocphan') || txt.includes('hocphan'))) {
                    maIndex = idx;
                } else if (txt.includes('ma hoc phan') || txt.includes('ma hocphan') || txt.includes('ma hoc')) {
                    maIndex = idx;
                }
            }
            if (normalizeText(th.textContent || '') === 'mã học phần' || normalizeText(th.textContent || '') === 'ma hoc phan') {
                maIndex = idx;
            }
        });

        const colgroup = document.createElement('colgroup');
        for (let i = 0; i < newTotalColumns; i++) {
            const col = document.createElement('col');
            if (i === maIndex) {
                col.style.width = '130px';
                col.className = 'col-mahocphan';
            } else {
                if (maIndex >= 0) {
                    const remainingCols = Math.max(1, newTotalColumns - 1);
                    const pct = Math.floor(100 / remainingCols);
                    col.style.width = `${pct}%`;
                }
            }
            colgroup.appendChild(col);
        }
        table.insertBefore(colgroup, table.firstChild);
        table.style.tableLayout = 'fixed';
        table.querySelectorAll('th, td').forEach(cell => {
            cell.style.whiteSpace = 'nowrap';
            cell.style.overflow = 'hidden';
            cell.style.textOverflow = 'ellipsis';
        });
        console.log('Đã tạo colgroup và ép table-layout: fixed (buildColgroupAndFixLayout). maIndex=', maIndex);
    }

    function normalizeColumnWidthsFallback(newTotalColumns) {
        const table = document.getElementById('xemDiem_aaa');
        if (!table) return;

        table.querySelectorAll('th[style], td[style]').forEach(el => {
            el.style.width = '';
            el.style.minWidth = '';
            el.style.maxWidth = '';
        });

        table.style.tableLayout = 'auto';

        const headerRow = table.querySelector('thead tr:last-of-type') || table.querySelector('thead tr');
        if (!headerRow) return;
        const headerCells = Array.from(headerRow.cells);
        const maIndex = headerCells.findIndex(th => normalizeText(th.textContent || '').includes('ma hoc phan'));

        if (maIndex >= 0) {
            table.querySelectorAll('tbody tr:not(:has([colspan]))').forEach(row => {
                const cell = row.cells[maIndex];
                if (cell) {
                    cell.style.maxWidth = '140px';
                    cell.style.whiteSpace = 'nowrap';
                    cell.style.overflow = 'hidden';
                    cell.style.textOverflow = 'ellipsis';
                }
            });
            const h = headerCells[maIndex];
            if (h) {
                h.style.maxWidth = '140px';
                h.style.whiteSpace = 'nowrap';
                h.style.overflow = 'hidden';
                h.style.textOverflow = 'ellipsis';
            }
        }
        table.querySelectorAll('th, td').forEach(cell => {
            cell.style.wordBreak = 'break-word';
            cell.style.whiteSpace = 'normal';
        });
        console.log('Đã chuẩn hoá chiều rộng cột (normalizeColumnWidthsFallback).');
    }

    function formatSummaryRows() {
        if (!pristineTableBackup) {
            const table = document.getElementById('xemDiem_aaa');
            if (table) {
                pristineTableBackup = table.cloneNode(true);
                console.log("Đã tạo bản sao lưu đầu tiên của bảng điểm gốc (từ Định dạng dòng).");
            }
        }

        const table = document.getElementById('xemDiem_aaa');
        if (!table) return;

        const allRows = Array.from(table.querySelectorAll('tbody > tr'));
        
        let globalMaxWidth = 0;
        const tempSpan = document.createElement('span');
        tempSpan.style.cssText = 'position: absolute; visibility: hidden; white-space: nowrap; font-weight: bold; font-size: 1em;';
        document.body.appendChild(tempSpan);

        const targetPrefixes = ['Điểm trung bình học kỳ hệ 10:', 'Điểm trung bình tích lũy:', 'Tổng số tín chỉ đã đăng ký:', 'Tổng số tín chỉ đạt:', 'Xếp loại học lực tích lũy:'];
        const allSummaryRows = allRows.filter(row => {
            const firstCell = row.querySelector('td');
            return firstCell && targetPrefixes.some(prefix => firstCell.innerText.trim().startsWith(prefix));
        });
        
        allSummaryRows.forEach(row => {
             if (!row.querySelector('.summary-row-grid')) {
                const text = row.cells[0].innerText.trim();
                tempSpan.innerText = text;
                globalMaxWidth = Math.max(globalMaxWidth, tempSpan.getBoundingClientRect().width);
             }
        });

        document.body.removeChild(tempSpan);
        const finalWidth = globalMaxWidth + 15;

        allSummaryRows.forEach(currentRow => {
            if (currentRow.querySelector('.summary-row-grid')) return;
            const cells = currentRow.getElementsByTagName('td');
            if (cells.length < 2) return;
            const content1 = cells[0].innerText.trim();
            const content2 = cells[1].innerText.trim();
            while (currentRow.firstChild) currentRow.removeChild(currentRow.firstChild);
            const newCell = document.createElement('td');
            const currentDataCols = document.querySelector('#xemDiem_aaa tbody tr:not(:has([colspan]))')?.cells.length || 27;
            newCell.setAttribute('colspan', currentDataCols);
            newCell.style.cssText = 'text-align: left; font-weight: bold; padding: 8px 15px;';
            newCell.innerHTML = `
                <div class="summary-row-grid">
                    <div class="summary-label" style="width: ${finalWidth}px;">${content1}</div>
                    <div class="summary-separator">|</div>
                    <div class="summary-value">${content2}</div>
                </div>`;
            currentRow.appendChild(newCell);
        });

        if(allSummaryRows.length > 0) {
             console.log(`Đã định dạng và căn chỉnh các hàng tóm tắt. Độ rộng label chung: ${finalWidth}px.`);
             
             // --- SỬA ĐỔI: Chỉ vô hiệu hóa chính nó và bật nút khôi phục ---
             const restoreButton = document.getElementById('restoreColsBtn');
             if(restoreButton){
                 restoreButton.disabled = false;
                 restoreButton.style.opacity = '1';
                 restoreButton.style.cursor = 'pointer';
                 console.log("Nút 'Khôi phục cột' đã được kích hoạt.");
             }
             
             const formatButton = document.getElementById('formatSummaryBtn');
             if (formatButton) {
                formatButton.disabled = true;
                formatButton.style.opacity = '0.5';
                formatButton.style.cursor = 'not-allowed';
                console.log("Nút 'Định dạng dòng tổng kết' đã bị vô hiệu hóa.");
             }
             // --- KẾT THÚC SỬA ĐỔI ---

        } else {
             console.log("Không tìm thấy hàng tóm tắt nào để định dạng.");
        }
    }

    const handleRemoveAndAdjustColumns = () => {
        const table = document.getElementById('xemDiem_aaa');
        if (table && !pristineTableBackup) {
            pristineTableBackup = table.cloneNode(true);
            console.log("Đã tạo bản sao lưu của bảng điểm gốc (từ Xóa cột).");
        }

        console.log("Nút 'Xóa Cột Trống' đã được nhấn. Bắt đầu xử lý...");
        const originalColumnCount = document.querySelector('#xemDiem_aaa tbody tr:not(:has([colspan]))')?.cells.length || 0;
        const newTotalColumns = removeEmptyColumns();

        if (newTotalColumns > 0 && newTotalColumns < originalColumnCount) {
            document.querySelectorAll('#xemDiem_aaa tbody tr.row-head').forEach(row => {
                const firstTd = row.querySelector('td');
                if (firstTd) {
                    firstTd.setAttribute('colspan', newTotalColumns);
                    firstTd.style.fontWeight = 'bold';
                    firstTd.style.color = 'black';
                }
                Array.from(row.children).slice(1).forEach(child => child.remove());
            });

            document.querySelectorAll('#xemDiem_aaa tbody tr').forEach(row => {
                const isSummaryRow = row.querySelector('[lang^="kqht-tkhk-"]');
                if (isSummaryRow && !row.classList.contains('row-head')) {
                    const children = Array.from(row.children);
                    if (children.length >= 2) {
                        const occupiedCols = 4;
                        for (let i = children.length - 1; i >= 2; i--) {
                            children[i].remove();
                        }
                        const newEmptyTd = document.createElement('td');
                        const remainingCols = newTotalColumns - occupiedCols;
                        if (remainingCols > 0) {
                            newEmptyTd.setAttribute('colspan', remainingCols);
                            newEmptyTd.style.fontWeight = 'bold';
                            newEmptyTd.style.color = 'black';
                            newEmptyTd.innerHTML = '';
                            row.appendChild(newEmptyTd);
                        }
                    }
                }
            });
            console.log('Colspan values and summary row structures adjusted based on new column count.');

            // --- SỬA ĐỔI: Chỉ vô hiệu hóa chính nó và bật nút khôi phục ---
            const removeButton = document.getElementById('removeEmptyColsBtn');
            if (removeButton) {
                removeButton.disabled = true;
                removeButton.style.opacity = '0.5';
                removeButton.style.cursor = 'not-allowed';
                console.log("Nút 'Xóa Cột Trống' đã bị vô hiệu hóa.");
            }

            const restoreButton = document.getElementById('restoreColsBtn');
            if(restoreButton){
                restoreButton.disabled = false;
                restoreButton.style.opacity = '1';
                restoreButton.style.cursor = 'pointer';
                console.log("Nút 'Khôi phục cột' đã được kích hoạt.");
            }
            // --- KẾT THÚC SỬA ĐỔI ---

            try {
                buildColgroupAndFixLayout(newTotalColumns);
            } catch (e) {
                console.error('Lỗi khi gọi buildColgroupAndFixLayout:', e);
                try { normalizeColumnWidthsFallback(newTotalColumns); } catch (e2) { console.error('Fallback cũng lỗi:', e2); }
            }
        }
    };

    const handleRestoreColumns = () => {
        const currentTable = document.getElementById('xemDiem_aaa');
        if (currentTable && pristineTableBackup) {
            currentTable.parentNode.replaceChild(pristineTableBackup.cloneNode(true), currentTable);
            pristineTableBackup = null; // Xóa bản sao lưu sau khi đã khôi phục
            console.log("Bảng điểm đã được khôi phục thành công. Bản sao lưu đã được xóa.");
            
            convertCheckMarksToText();

            // Kích hoạt lại cả hai nút chỉnh sửa
            const removeButton = document.getElementById('removeEmptyColsBtn');
            if (removeButton) {
                removeButton.disabled = false;
                removeButton.style.opacity = '1';
                removeButton.style.cursor = 'pointer';
            }

            const formatButton = document.getElementById('formatSummaryBtn');
            if (formatButton) {
                formatButton.disabled = false;
                formatButton.style.opacity = '1';
                formatButton.style.cursor = 'pointer';
            }

            // Vô hiệu hóa lại nút khôi phục
            const restoreButton = document.getElementById('restoreColsBtn');
            if (restoreButton) {
                restoreButton.disabled = true;
                restoreButton.style.opacity = '0.5';
                restoreButton.style.cursor = 'not-allowed';
            }

        } else {
            console.error("Không tìm thấy bản sao lưu hoặc bảng điểm hiện tại để khôi phục.");
        }
    };

    document.getElementById('removeEmptyColsBtn').addEventListener('click', handleRemoveAndAdjustColumns);
    document.getElementById('restoreColsBtn').addEventListener('click', handleRestoreColumns);
    document.getElementById('formatSummaryBtn').addEventListener('click', formatSummaryRows);


    const convertCheckMarksToText = () => {
        document.querySelectorAll('#xemDiem_aaa div.check').forEach(div => {
            div.parentElement.innerHTML = '<b>Đạt</b>';
        });
        document.querySelectorAll('#xemDiem_aaa div.no-check').forEach(div => {
            div.parentElement.innerHTML = '<b>Không Đạt</b>';
        });
        console.log('Converted checkmark divs to "Đạt"/"Không Đạt" text.');
    };
    convertCheckMarksToText();

    const removeStickyClasses = () => {
        document.querySelectorAll('.sticky-col, thead.header-sticky').forEach(el => {
            el.className = el.className.replace(/\bsticky-col\b/g, '').replace(/\bheader-sticky\b/g, '');
            el.style.position = 'static';
            el.style.left = 'auto';
            el.style.top = 'auto';
            el.style.backgroundColor = 'transparent';
            el.style.width = 'auto';
            el.style.minWidth = 'auto';
        });
    };
    removeStickyClasses();

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                removeStickyClasses();
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

    console.log('DOM observer set up to prevent sticky columns.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCustomizations);
} else {
    applyCustomizations();
}