fetch('/components/header.html')
.then(res => res.text())
.then(html => {
document.getElementById('header').innerHTML = html;

const logoutBtn = document.getElementById("logoutBtn");
const loginBtn = document.getElementById("loginBtn");
const name = localStorage.getItem("stu_name");
const nameEl = document.getElementById("studentName");

if (name) {
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (loginBtn) loginBtn.style.display = "none";
    if (nameEl) nameEl.textContent = name;
} else {
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("stu_name");
    window.location.href = "/login.html";
    });
}
});

fetch('/components/offcanvas.html')
.then(res => res.text())
.then(html => {
document.getElementById('offcanvas-container').innerHTML = html;

const logoutBtn = document.getElementById("logoutBtnMobile");
const loginBtn = document.getElementById("loginBtnMobile");
const name = localStorage.getItem("stu_name");
const nameEl = document.getElementById("studentName");

if (name) {
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (loginBtn) loginBtn.style.display = "none";
    if (nameEl) nameEl.textContent = name;
} else {
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("stu_name");
    window.location.href = "/login.html";
    });
}
});

fetch('/components/footer.html')
.then(res => res.text())
.then(html => {
    document.getElementById('footer').innerHTML = html;
});