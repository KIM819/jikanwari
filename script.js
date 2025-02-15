const API_URL = "https://script.google.com/macros/s/AKfycbyUTs6Awz07gBWrojfBprJX45ZoPNOEATkExSaas4IkdURA1Qh76v2olJVrE_-FM-SXiA/exec"; 

let scheduleData = null;
let displayMode = 0;

async function fetchSchedule() {
    try {
        console.log("API URL:", API_URL);
        const response = await fetch(API_URL);

        if (!response.ok) { 
            throw new Error(`HTTPエラー! ステータス: ${response.status}`);
        }

        const data = await response.json();
        console.log("取得したデータ:", data);

        if (data.error) {
            throw new Error(`スプレッドシートエラー: ${data.error}`);
        }

        const today = new Date().toISOString().split('T')[0];
        const todaySchedule = data.find(schedule => schedule.date === today);

        if (!todaySchedule) {
            throw new Error("今日の日付のスケジュールが見つかりません");
        }

        return todaySchedule;
    } catch (error) {
        console.error("データ取得エラー:", error);
        return null;
    }
}

function displayCurrentTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = `現在時刻: ${now.toLocaleTimeString()}`;
}

function formatScheduleTimes(schedule) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;

    return schedule.schedule.map(period => ({
        name: period.name,
        subject: period.subject || "",
        start: new Date(`${currentDate}T${period.start}:00`), 
        end: new Date(`${currentDate}T${period.end}:00`)
    }));
}

function getCurrentClass(schedule) {
    const now = new Date();
    const formattedSchedule = formatScheduleTimes(schedule);

    for (const period of formattedSchedule) {
        if (now >= period.start && now <= period.end) {
            return period;
        }
    }
    return null; 
}

function getNextClass(schedule) {
    const now = new Date();
    const formattedSchedule = formatScheduleTimes(schedule);

    for (const period of formattedSchedule) {
        if (now < period.start) {
            return period;
        }
    }
    return null; 
}

// **次の授業までのカウントダウンを表示**
function displayCountdown(schedule) {
    const nextClass = getNextClass(schedule);
    if (!nextClass) {
        document.getElementById('countdown').textContent = "本日の授業は終了しました";
        return;
    }

    const now = new Date();
    const timeDiff = nextClass.start - now;
    
    if (timeDiff > 0) {
        const minutes = Math.floor(timeDiff / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        document.getElementById('countdown').textContent = `次の開始まで: ${minutes}分${seconds}秒`;
    } else {
        document.getElementById('countdown').textContent = "";
    }
}

function displayDaySchedule(schedule) {
    const formattedSchedule = formatScheduleTimes(schedule);
    let scheduleHtml = `<h3>1日の予定</h3>
                        <table id="dayScheduleTable">
                        <tr><th>科目</th><th>教科</th><th>時間</th></tr>`;
    formattedSchedule.forEach(period => {
        scheduleHtml += `<tr>
                            <td>${period.name}</td>
                            <td>${period.subject || "ー"}</td>
                            <td>${period.start.toLocaleTimeString()} ~ ${period.end.toLocaleTimeString()}</td>
                         </tr>`;
    });
    scheduleHtml += `</table>`;
    return scheduleHtml;
}

function displayCurrentClass(schedule) {
    const currentClass = getCurrentClass(schedule);
    if (currentClass) {
        return `<h3 class="currentClass">現在の時間</h3>
                <div class="currentClass">${currentClass.name} - ${currentClass.subject} 
                <br> (${currentClass.start.toLocaleTimeString()} ~ ${currentClass.end.toLocaleTimeString()})</div>`;
    }
    return `<h3 class="currentClass">現在の時間</h3><div class="currentClass">授業外</div>`;
}

function displayNextClass(schedule) {
    const nextClass = getNextClass(schedule);
    if (nextClass) {
        return `<h3 class="nextClass">次の予定</h3>
                <div class="nextClass">${nextClass.name} - ${nextClass.subject} 
                <br> (${nextClass.start.toLocaleTimeString()} ~ ${nextClass.end.toLocaleTimeString()})</div>`;
    } else {
        return `<h3>本日の授業は終了しました</h3>`;
    }
}

// **画面の表示を順番に切り替える**
function cycleDisplay() {
    if (!scheduleData) return;

    if (displayMode === 0) {
        document.getElementById('displayArea').innerHTML = displayDaySchedule(scheduleData);
    } else if (displayMode === 1) {
        document.getElementById('displayArea').innerHTML = displayCurrentClass(scheduleData);
    } else {
        document.getElementById('displayArea').innerHTML = displayNextClass(scheduleData);
    }

    displayMode = (displayMode + 1) % 3;
}

// **スケジュールを取得し、画面を更新**
async function updateSchedule() {
    scheduleData = await fetchSchedule();
    displayCountdown(scheduleData);
}

// **初期化**
async function init() {
    await updateSchedule();
    cycleDisplay();
}

// **1秒ごとに時刻とカウントダウンを更新**
setInterval(displayCurrentTime, 1000);
setInterval(() => displayCountdown(scheduleData), 1000);

// **1分ごとにスケジュールを更新**
setInterval(updateSchedule, 60000);

// **5秒ごとに表示を切り替える**
setInterval(cycleDisplay, 5000);

init();
