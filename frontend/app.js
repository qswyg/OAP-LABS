const STORAGE_KEY = "student_notes_var10";
let items = [];
const API_URL = "http://localhost:3001/api";

let filterTerm = "";

const categoryNames = {
    1: "Спец. мат. методи",
    2: "Архітектура КС",
    3: "Мат. основи",
    4: "Програмування"
};

const form = document.getElementById("createForm");
const tbody = document.getElementById("itemsTableBody");
const searchInput = document.getElementById("searchInput");
const sortBtn = document.getElementById("sortBtn");

form.addEventListener("submit", handleFormSubmit);
document.getElementById("resetBtn").addEventListener("click", resetForm);

document.addEventListener("DOMContentLoaded", () => {
    loadFromServer();
    
    searchInput.addEventListener("input", (e) => { 
        filterTerm = e.target.value; 
        renderTable(); 
    });  
    
    sortBtn.addEventListener("click", sortItems);

    const userForm = document.getElementById("user-form");
    if (userForm) {
        userForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById("userName");
            const emailInput = document.getElementById("userEmail");
            const nameError = document.getElementById("userName-error");
            const emailError = document.getElementById("userEmail-error");

            nameInput.classList.remove("invalid");
            emailInput.classList.remove("invalid");
            if(nameError) nameError.innerText = "";
            if(emailError) emailError.innerText = "";

            const userData = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                createdAt: new Date().toISOString()
            };

            let hasError = false;
            if (userData.name.length < 2) {
                nameInput.classList.add("invalid");
                if(nameError) nameError.innerText = "Ім'я занадто коротке";
                hasError = true;
            }
            if (!userData.email.includes("@")) {
                emailInput.classList.add("invalid"); 
                if(emailError) emailError.innerText = "Некоректний Email";
                hasError = true;
            }

            if (hasError) return; 

            try {
                const response = await fetch(`${API_URL}/users`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userData)
                });

                if (response.ok) {
                    const statusDiv = document.getElementById("user-status");
                 
                    statusDiv.innerHTML = `<div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin-top: 15px; border: 1px solid #c3e6cb;">
                        ✅ Вітаємо, ${userData.name}! Реєстрація успішна. Тепер ви можете додавати нотатки нижче.
                    </div>`;
                    userForm.style.display = "none";
                } else {
                    document.getElementById("user-status").innerText = "Помилка реєстрації";
                }
            } catch (error) {
                console.error("Сервер не працює", error);
                document.getElementById("user-status").innerText = "Помилка з'єднання";
            }
        });
    }
});

tbody.addEventListener("click", (e) => {
    const id = Number(e.target.dataset.id);
    if (e.target.classList.contains("delete-btn")) deleteItem(id);
    if (e.target.classList.contains("edit-btn")) startEdit(id);
});

async function loadFromServer() {
    try {
        const response = await fetch(`${API_URL}/notes`);
        const data = await response.json();
        items = data.data || data.items || data || []; 
        renderTable();
    } catch (error) {
        console.error("Помилка завантаження:", error);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault(); 

    const idField = document.getElementById("edit-id");
    const id = idField ? idField.value : null;

    const dto = {
        userId: 1, 
        categoryId: Number(document.getElementById("courseSelect").value), 
        course: document.getElementById("courseSelect").value, 
        title: document.getElementById("titleInput").value.trim(),
        content: document.getElementById("noteText").value.trim(), 
        createdAt: new Date().toISOString()
    };

    if (!validate(dto)) return;

    try {
        const method = id ? "PUT" : "POST";
        const url = id ? `${API_URL}/notes/${id}` : `${API_URL}/notes`;

        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto)
        });

        if (response.ok) {
            loadFromServer();
            resetForm();
        } else {
            alert("Помилка при збереженні на сервері");
        }
    } catch (error) {
        console.error("Помилка збереження:", error);
    }
}

async function deleteItem(id) {
    if (!confirm("Видалити нотатку?")) return;
    try {
        await fetch(`${API_URL}/notes/${id}`, { method: "DELETE" });
        loadFromServer();
    } catch (error) {
        console.error("Помилка видалення:", error);
    }
}

function startEdit(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const idField = document.getElementById("edit-id");
    if (idField) idField.value = item.id;
    
    document.getElementById("courseSelect").value = item.categoryId || "";
    document.getElementById("titleInput").value = item.title;
    document.getElementById("noteText").value = item.content || "";
    
    document.getElementById("form-title").innerText = "Редагувати нотатку";
    document.getElementById("submitBtn").innerText = "Оновити";
}

function sortItems() {
    items.sort((a, b) => a.title.localeCompare(b.title));  
    renderTable();
}

function validate(dto) {
    clearErrors();
    let valid = true;
    if (!dto.categoryId) { showError("courseSelect", "courseError", "Оберіть дисципліну"); valid = false; }
    if (dto.title.length < 3) { showError("titleInput", "titleError", "Мінімум 3 символи"); valid = false; }
    if (dto.content.length < 4) { showError("noteText", "noteError", "Мінімум 4 символи"); valid = false; }
    
    return valid;
}

function renderTable() {
    const filtered = items.filter(i => i.title.toLowerCase().includes(filterTerm.toLowerCase()));
    
    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>${categoryNames[item.categoryId] || "Інше"}</td>
            <td>${item.title}</td>
            <td>${item.content || ""}</td>
            <td>
                <button class="edit-btn" data-id="${item.id}">Ред.</button>
                <button class="delete-btn" data-id="${item.id}">Вид.</button>
            </td>
        </tr>
    `).join("");
}

function resetForm() {
    form.reset();
    const idField = document.getElementById("edit-id");
    if(idField) idField.value = "";
    document.getElementById("form-title").innerText = "Додати нотатку";
    document.getElementById("submitBtn").innerText = "Зберегти";
    clearErrors();
}

function showError(inputId, errorId, msg) {
    document.getElementById(inputId).classList.add("invalid");
    const errEl = document.getElementById(errorId);
    if(errEl) errEl.innerText = msg;
}

function clearErrors() {
    ["courseSelect", "titleInput","noteText"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("invalid");
    });
    ["courseError", "titleError","noteError"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = "";
    });
}
