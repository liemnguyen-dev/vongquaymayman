const spinSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
const clapSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

let quizData = [], usedQuestions = [], activeStudents = [], currentQuestion = null;
let selectedAnswer = null, questionsToAnswer = 0, timerInterval, startAngle = 0;

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const nameDisplay = document.getElementById('student-name');

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
    document.getElementById('remaining-info').innerText = `Học sinh: ${activeStudents.length} | Câu hỏi: ${quizData.length - usedQuestions.length}`;
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
        ctx.fillText(name.substring(0,12), 175, 5);
        ctx.restore();
    });
}

document.getElementById('spin-btn').onclick = () => {
    if (!activeStudents.length || !quizData.length) return alert("Vui lòng kiểm tra danh sách HS và Câu hỏi!");
    document.getElementById('quiz-container').classList.add('hidden');
    nameDisplay.classList.remove('highlight-name');
    nameDisplay.innerText = "🌀 Đang quay...";
    spinSound.currentTime = 0;
    spinSound.play().catch(() => {});

    let spinTime = 0, totalTime = Math.random() * 2000 + 4000;
    const animate = () => {
        spinTime += 30;
        if (spinTime >= totalTime) { spinSound.pause(); stopWheel(); return; }
        startAngle += ((totalTime - spinTime) / totalTime) * 0.45;
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

    // Tự động chỉnh cột: 2 đáp án (Đúng/Sai) -> 1 cột to, 4 đáp án -> 2 cột
    grid.style.gridTemplateColumns = currentQuestion.a.length <= 2 ? "1fr" : "1fr 1fr";

    currentQuestion.a.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => {
            document.querySelectorAll('.option-btn').forEach(b => {b.style.background="white"; b.style.color="#2c3e50";});
            btn.style.background = "#3498db";
            btn.style.color = "white";
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

document.getElementById('check-btn').onclick = () => {
    if (selectedAnswer === null) return alert("Chọn đáp án!");
    clearInterval(timerInterval);
    const btns = document.querySelectorAll('.option-btn');
    const correctIdx = currentQuestion.correct;
    const feedback = document.getElementById('feedback');

    if (selectedAnswer === correctIdx) {
        feedback.innerText = "CHÍNH XÁC! 🎉";
        feedback.style.color = "#27ae60";
        clapSound.currentTime = 0;
        clapSound.play().catch(() => {});
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        questionsToAnswer--;
        if (questionsToAnswer > 0) setTimeout(showQuestion, 2500);
    } else {
        const txt = currentQuestion.a[correctIdx];
        feedback.innerHTML = `SAI RỒI! ❌ <br>Đáp án đúng là: <b style="color:#2c3e50">${txt}</b>`;
        feedback.style.color = "#e74c3c";
        btns[correctIdx].style.background = "#2ecc71";
        btns[correctIdx].style.color = "white";
        btns[selectedAnswer].style.background = "#e74c3c";
        btns[selectedAnswer].style.color = "white";
        questionsToAnswer = 0;
    }
    btns.forEach(b => b.disabled = true);
};

function importData() {
    try {
        quizData = JSON.parse(document.getElementById('json-input').value);
        localStorage.setItem('quizData', JSON.stringify(quizData));
        refreshStudents();
        alert("Dữ liệu đã được cập nhật!");
    } catch(e) { alert("Lỗi JSON: Hãy kiểm tra định dạng ngoặc và dấu phẩy!"); }
}

function exportSample() {
    const sample = [
        {"q":"Lập kế hoạch chi tiêu giúp ta chủ động tài chính. Đúng hay Sai?","a":["Đúng","Sai"],"correct":0},
        {"q":"Khoản nào là nhu cầu thiết yếu?","a":["Đồ chơi","Tiền điện nước","Xem phim","Kẹo"],"correct":1}
    ];
    document.getElementById('json-input').value = JSON.stringify(sample, null, 2);
}

function resetSystem() { if(confirm("Xóa toàn bộ dữ liệu hiện tại?")) { localStorage.clear(); location.reload(); } }
