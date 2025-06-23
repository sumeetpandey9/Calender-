const monthYear = document.getElementById("monthYear");
const calendarDates = document.getElementById("calendarDates");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const bdayNameInput = document.getElementById("bdayName");
const bdayDateInput = document.getElementById("bdayDate");
const addBdayBtn = document.getElementById("addBirthday");
const birthdayList = document.getElementById("birthdayList");

const eventNameInput = document.getElementById("eventName");
const eventDateInput = document.getElementById("eventDate");
const addEventBtn = document.getElementById("addEvent");
const eventList = document.getElementById("eventList");

const allMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

let currentDate = new Date();
const API_KEY = "rhxPramrLxAO7BGThJ3sAsLiOv4BVRTD";
let holidayMap = new Map();
let birthdayMap = new Map();
let eventMap = new Map();

// === Load Birthdays ===
function loadBirthdays() {
  const stored = JSON.parse(localStorage.getItem("birthdays") || "[]");
  birthdayMap.clear();
  birthdayList.innerHTML = "";

  stored.forEach((entry, idx) => {
    const date = new Date(entry.date);
    const key = `${date.getMonth()}-${date.getDate()}`;
    if (!birthdayMap.has(key)) birthdayMap.set(key, []);
    birthdayMap.get(key).push(entry.name);

    const div = document.createElement("div");
    div.innerHTML = `<span>🎂 ${entry.name} — ${entry.date}</span>
      <button class="delete-btn" onclick="deleteBirthday(${idx})">Delete</button>`;
    birthdayList.appendChild(div);
  });
}

// === Save Birthday ===
function saveBirthday() {
  const name = bdayNameInput.value.trim();
  const date = bdayDateInput.value;
  if (!name || !date) return alert("Enter name and date.");

  const all = JSON.parse(localStorage.getItem("birthdays") || "[]");
  all.push({ name, date });
  localStorage.setItem("birthdays", JSON.stringify(all));

  bdayNameInput.value = "";
  bdayDateInput.value = "";
  loadBirthdays();
  renderCalendar(currentDate);
}

window.deleteBirthday = function(index) {
  const all = JSON.parse(localStorage.getItem("birthdays") || "[]");
  all.splice(index, 1);
  localStorage.setItem("birthdays", JSON.stringify(all));
  loadBirthdays();
  renderCalendar(currentDate);
};

// === Load Events ===
function loadEvents() {
  const stored = JSON.parse(localStorage.getItem("events") || "[]");
  eventMap.clear();
  eventList.innerHTML = "";

  const today = new Date();

  const filtered = stored.filter((entry) => {
    const date = new Date(entry.date);
    return date >= today; // Keep only future or today
  });

  filtered.forEach((entry, idx) => {
    const date = new Date(entry.date);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    eventMap.set(key, entry.name);

    const div = document.createElement("div");
    div.innerHTML = `<span>📌 ${entry.name} — ${entry.date}</span>
      <button class="delete-btn" onclick="deleteEvent(${idx})">Delete</button>`;
    eventList.appendChild(div);
  });

  localStorage.setItem("events", JSON.stringify(filtered)); // Save cleaned
}

// === Save Event ===
function saveEvent() {
  const name = eventNameInput.value.trim();
  const date = eventDateInput.value;
  if (!name || !date) return alert("Enter event name and date.");

  const all = JSON.parse(localStorage.getItem("events") || "[]");
  all.push({ name, date });
  localStorage.setItem("events", JSON.stringify(all));

  eventNameInput.value = "";
  eventDateInput.value = "";
  loadEvents();
  renderCalendar(currentDate);
}

window.deleteEvent = function(index) {
  const all = JSON.parse(localStorage.getItem("events") || "[]");
  all.splice(index, 1);
  localStorage.setItem("events", JSON.stringify(all));
  loadEvents();
  renderCalendar(currentDate);
};

// === Holidays from API ===
function fetchHolidays(year, month) {
  const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=IN&year=${year}&type=national,religious`;

  return fetch(url)
    .then(res => res.json())
    .then(data => {
      holidayMap.clear();
      if (data?.response?.holidays) {
        data.response.holidays.forEach(holiday => {
          const date = new Date(holiday.date.iso);
          if (date.getFullYear() === year && date.getMonth() === month) {
            holidayMap.set(date.getDate(), holiday.name);
          }
        });
      }
    })
    .catch(err => console.error("Error fetching holidays:", err));
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  monthYear.innerHTML = `${allMonths[month]} ${year}`;
  calendarDates.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("div");
    calendarDates.appendChild(blank);
  }

  for (let i = 1; i <= lastDate; i++) {
    const dateObj = new Date(year, month, i);
    const day = document.createElement("div");
    day.innerText = i;

    const bdayKey = `${month}-${i}`;
    const eventKey = `${year}-${month}-${i}`;

    if (
      i === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      day.classList.add("today");
    }

    if (isWeekend(dateObj)) {
      day.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      day.style.color = "#aaa";
    }

    //  Birthday
    if (birthdayMap.has(bdayKey)) {
      day.classList.add("birthday");
      const names = birthdayMap.get(bdayKey).join(", ");
      day.addEventListener("mousemove", (e) =>
        showTooltip(e, `🎂 ${names}'s Birthday`)
      );
      day.addEventListener("mouseleave", hideTooltip);
    }

    //  Event
    else if (eventMap.has(eventKey)) {
      day.classList.add("event");
      day.addEventListener("mousemove", (e) =>
        showTooltip(e, `📌 ${eventMap.get(eventKey)}`)
      );
      day.addEventListener("mouseleave", hideTooltip);
    }

    //  Holiday
    else if (holidayMap.has(i)) {
      day.classList.add("holiday");
      day.addEventListener("mousemove", (e) =>
        showTooltip(e, holidayMap.get(i))
      );
      day.addEventListener("mouseleave", hideTooltip);
    }

    calendarDates.appendChild(day);
  }
}

async function updateCalendar() {
  loadBirthdays();
  loadEvents();
  await fetchHolidays(currentDate.getFullYear(), currentDate.getMonth());
  renderCalendar(currentDate);
}

prevBtn.addEventListener("click", async () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  await updateCalendar();
});

nextBtn.addEventListener("click", async () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  await updateCalendar();
});

addBdayBtn.addEventListener("click", saveBirthday);
addEventBtn?.addEventListener("click", saveEvent);

const tooltip = document.createElement("div");
tooltip.className = "custom-tooltip";
document.body.appendChild(tooltip);

function showTooltip(e, text) {
  tooltip.innerText = text;
  tooltip.style.display = "block";
  tooltip.style.left = e.pageX + 10 + "px";
  tooltip.style.top = e.pageY + 10 + "px";
}

function hideTooltip() {
  tooltip.style.display = "none";
}

updateCalendar();
