// 1. CẤU HÌNH ÂM THANH
// Sử dụng các link âm thanh dự phòng chất lượng cao
const spinSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
const clapSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

let quizData = [], usedQuestions = [], activeStudents = [], currentQuestion = null;
let selectedAnswer = null, questionsToAnswer = 0, timerInterval, startAngle = 0;

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const nameDisplay = document.getElementById('student-name');

// Đảm bảo âm thanh sẵn sàng
spinSound.load();
clapSound.load();

window.onload = () => {
    const saved = localStorage.getItem('quizData');
    if (saved) {
        quizData = JSON.parse(saved);
        document.getElementById('json-input').value = JSON.stringify(quizData, null, 2);
    }
    refreshStudents();
};

function refreshStudents() {
    const input = document.getElementById('student-list-input').value;
    activeStudents = input.split(',').map(s => s.trim()).filter(s => s !== "");
    updateStatus();
    drawWheel();
}

function updateStatus() {
    document.getElementById('remaining-info').innerText = `HS còn lại: ${activeStudents.length} | Câu còn lại: ${quizData.length - usedQuestions.length}`;
}

function drawWheel() {
    const num = activeStudents.length;
    if (num === 0) { ctx.clearRect(0,0,400,400); return; }
    const arc = Math.PI * 2 / num;
    ctx.clearRect(0,0,400,400);
    activeStudents.forEach((name, i) => {
        ctx.fillStyle = `hsl(${i * (360/num)}, 70%, 60%)`;
        ctx.beginPath();
        ctx.moveTo(200,200);
        ctx.arc(200,200,190, startAngle + i*arc, startAngle + (i+1)*arc);
        ctx.fill();
        ctx.stroke();
        ctx.save();
        ctx.translate(200,200);
        ctx.rotate(startAngle + i*arc + arc/2);
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "right";
        ctx.fillText(name.substring(0,10), 170, 5);
        ctx.restore();
    });
}

// 2. LOGIC QUAY VÀ ÂM THANH QUAY
document.getElementById('spin-btn').onclick = () => {
    if (!activeStudents.length || !quizData.length) return alert("Kiểm tra lại HS hoặc Câu hỏi!");
    
    document.getElementById('quiz-container').classList.add('hidden');
    nameDisplay.classList.remove('highlight-name');
    nameDisplay.innerText = "Đang quay...";

    // PHÁT ÂM THANH QUAY
    spinSound.currentTime = 0;
    spinSound.play().catch(e => console.log("Trình duyệt chặn âm thanh tự động: ", e));
    
    let spinTime = 0, totalTime = Math.random() * 3000 + 4000;
    const animate = () => {
        spinTime += 30;
        if (spinTime >= totalTime) { 
            spinSound.pause(); // Dừng âm thanh khi vòng quay dừng
            stopWheel(); 
            return; 
        }
        startAngle += ((totalTime - spinTime) / totalTime) * 0.4;
        drawWheel();
        requestAnimationFrame(animate);
    };
    animate();
};

function stopWheel() {
    const num = activeStudents.length;
    const arc = Math.PI * 2 / num;
    const degrees = (startAngle * 180 / Math.PI) + 90;
    const index = Math.floor((360 - (degrees % 360)) / (arc * 180 / Math.PI)) % num;
    const winner = activeStudents[index];

    nameDisplay.innerText = `🎯 ${winner} 🎯`;
    nameDisplay.classList.add('highlight-name');

    setTimeout(() => {
        if (document.getElementById('remove-student').checked) {
            activeStudents.splice(index, 1);
            drawWheel();
        }
        questionsToAnswer = parseInt(document.querySelector('input[name="q-count"]:checked').value);
        showQuestion();
    }, 2000);
}

function showQuestion() {
    const noRepeat = document.getElementById('no-repeat-q').checked;
    let available = quizData.filter((_, i) => !noRepeat || !usedQuestions.includes(i));
    if (!available.length) return alert("Hết câu hỏi!");

    currentQuestion = available[Math.floor(Math.random() * available.length)];
    if (noRepeat) usedQuestions.push(quizData.indexOf(currentQuestion));

    document.getElementById('question-text').innerText = currentQuestion.q;
    const grid = document.getElementById('options-grid');
    grid.innerHTML = "";
    selectedAnswer = null;

    currentQuestion.a.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => {
            document.querySelectorAll('.option-btn').forEach(b => b.style.background = "white");
            btn.style.background = "#3498db";
            selectedAnswer = i;
        };
        grid.appendChild(btn);
    });
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('feedback').innerText = "";
    startTimer();
    updateStatus();
}

function startTimer() {
    let timeLeft = 15;
    const tBox = document.getElementById('timer');
    tBox.classList.remove('hidden');
    tBox.innerText = "15s";
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        tBox.innerText = timeLeft + "s";
        if (timeLeft <= 0) { 
            clearInterval(timerInterval); 
            document.getElementById('feedback').innerText = "HẾT GIỜ! ⏰"; 
            document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        }
    }, 1000);
}

// 3. KIỂM TRA & ÂM THANH VỖ TAY
document.getElementById('check-btn').onclick = () => {
    if (selectedAnswer === null) return alert("Chọn đáp án!");
    clearInterval(timerInterval);
    const btns = document.querySelectorAll('.option-btn');
    const correctIdx = currentQuestion.correct;

    if (selectedAnswer === correctIdx) {
        document.getElementById('feedback').innerText = "ĐÚNG RỒI! 🎉";
        document.getElementById('feedback').style.color = "green";
        
        // PHÁT ÂM THANH VỖ TAY
        clapSound.currentTime = 0;
        clapSound.play().catch(e => console.log("Lỗi âm thanh: ", e));
        
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        
        questionsToAnswer--;
        if (questionsToAnswer > 0) {
            setTimeout(() => {
                alert("Mời bạn trả lời câu tiếp theo!");
                showQuestion();
            }, 2000);
        }
    } else {
        const correctText = currentQuestion.a[correctIdx];
        document.getElementById('feedback').innerHTML = `SAI! ❌ <br>Đáp án đúng là: <b>${correctText}</b>`;
        document.getElementById('feedback').style.color = "red";
        btns[correctIdx].style.background = "#2ecc71";
        btns[correctIdx].style.color = "white";
        btns[selectedAnswer].style.background = "#e74c3c";
        btns[selectedAnswer].style.color = "white";
        questionsToAnswer = 0;
    }
    btns.forEach(b => b.disabled = true);
};

// CÁC HÀM TIỆN ÍCH GIỮ NGUYÊN
function importData() {
    try {
        quizData = JSON.parse(document.getElementById('json-input').value);
        localStorage.setItem('quizData', JSON.stringify(quizData));
        refreshStudents();
        alert("Đã cập nhật!");
    } catch(e) { alert("Lỗi JSON!"); }
}

function exportSample() {
    document.getElementById('json-input').value = JSON.stringify([{"q":"Khoản chi nào là thiết yếu?","a":["Xem phim","Đồ chơi","Tiền học phí","Đi du lịch"],"correct":2}], null, 2);
}

function resetSystem() { if(confirm("Xóa hết dữ liệu?")) { localStorage.clear(); location.reload(); } }