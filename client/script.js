// Базовый URL API
const API_BASE_URL = 'http://localhost:3000/api';

// ============ API ФУНКЦИИ ============

// Получить все проекты
async function loadProjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/projects`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки проектов');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        throw error;
    }
}

// Создать проект
async function createProject(projectData) {
    try {
        const formData = new FormData();
        
        formData.append('title', projectData.title);
        formData.append('tagline', projectData.tagline);
        formData.append('description', projectData.description);
        formData.append('city', projectData.city);
        formData.append('price', projectData.price);
        formData.append('contact', JSON.stringify(projectData.contacts));
        
        if (projectData.image) {
            formData.append('image', projectData.image);
        }
        
        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания проекта');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        throw error;
    }
}

// Получить проект по ID
async function getProjectById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${id}`);
        if (!response.ok) {
            throw new Error('Проект не найден');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        throw error;
    }
}

// Получить города по запросу
async function searchCities(query = '') {
    try {
        const url = query 
            ? `${API_BASE_URL}/cities?query=${encodeURIComponent(query)}`
            : `${API_BASE_URL}/cities`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка поиска городов');
        return await response.json();
    } catch (error) {
        console.error('Ошибка поиска городов:', error);
        return [];
    }
}

// Получить популярные города
async function getPopularCities() {
    try {
        const response = await fetch(`${API_BASE_URL}/cities/popular`);
        if (!response.ok) throw new Error('Ошибка загрузки городов');
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки популярных городов:', error);
        return [];
    }
}

// Валидировать город
async function validateCity(city) {
    try {
        const response = await fetch(`${API_BASE_URL}/cities/validate/${encodeURIComponent(city)}`);
        if (!response.ok) throw new Error('Ошибка валидации города');
        return await response.json();
    } catch (error) {
        console.error('Ошибка валидации города:', error);
        return { isValid: false, suggestion: null };
    }
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

// Получить URL изображения
function getImageUrl(imagePath) {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    return `http://localhost:3000/${imagePath}`;
}

// Форматировать дату
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Парсить контакты
function parseContacts(contactString) {
    try {
        return JSON.parse(contactString);
    } catch {
        return { otherContact: contactString };
    }
}

// ВАЛИДАЦИЯ

// Валидация email
function validateEmail(email) {
    if (!email) return true;
    
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Валидация Telegram
function validateTelegram(username) {
    if (!username) return true;
    
    const re = /^@[a-zA-Z0-9_]{5,32}$/;
    return re.test(username);
}

// Форматирование телефона
function formatPhone(phone) {
    if (!phone) return '';
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        const code = digits.startsWith('8') ? '7' : digits.substring(0, 1);
        const rest = digits.startsWith('8') ? digits.substring(1) : digits.substring(1);
        return `+7 (${rest.substring(0, 3)}) ${rest.substring(3, 6)}-${rest.substring(6, 8)}-${rest.substring(8, 10)}`;
    }
    
    return phone;
}

// Валидация всех контактов
function validateContacts(contacts) {
    const { phone, email, telegram, otherContact } = contacts;
    
    if (!phone && !email && !telegram && !otherContact) {
        return 'Укажите хотя бы один способ связи';
    }
    
    if (email && !validateEmail(email)) {
        return 'Некорректный email адрес';
    }
    
    if (telegram && !validateTelegram(telegram)) {
        return 'Некорректный Telegram username (формат: @username, 5-32 символа)';
    }
    
    return null;
}

// Валидация формы проекта
function validateProjectForm(formData) {
    const errors = [];
    
    if (!formData.title || !formData.title.trim()) {
        errors.push('Введите название проекта');
    }
    
    if (!formData.tagline || !formData.tagline.trim()) {
        errors.push('Введите краткое описание');
    }
    
    if (!formData.description || !formData.description.trim()) {
        errors.push('Введите подробное описание');
    }
    
    if (!formData.city || !formData.city.trim()) {
        errors.push('Введите город');
    }
    
    if (!formData.price || Number(formData.price) <= 0) {
        errors.push('Введите корректную стоимость');
    }
    
    const contactError = validateContacts(formData.contacts);
    if (contactError) {
        errors.push(contactError);
    }
    
    return errors;
}

// ОТОБРАЖЕНИЕ

// Показать контакты
function showContact(contactJson) {
    try {
        const contactString = decodeURIComponent(contactJson);
        const contacts = parseContacts(contactString);
        
        let message = '📞 Контактная информация:\n\n';
        
        if (contacts.phone) {
            message += `📱 Телефон: ${contacts.phone}\n`;
        }
        
        if (contacts.email) {
            message += `📧 Email: ${contacts.email}\n`;
        }
        
        if (contacts.telegram) {
            message += `✈️ Telegram: ${contacts.telegram}\n`;
        }
        
        if (contacts.otherContact) {
            message += `📝 Другие контакты: ${contacts.otherContact}\n`;
        }
        
        alert(message);
        
    } catch (error) {
        console.error('Ошибка при отображении контактов:', error);
        alert('Ошибка при загрузке контактной информации');
    }
}

// Собрать данные формы
function collectProjectFormData() {
    const phone = document.getElementById('project-phone')?.value.trim() || '';
    const email = document.getElementById('project-email')?.value.trim() || '';
    const telegram = document.getElementById('project-telegram')?.value.trim() || '';
    const otherContact = document.getElementById('project-other')?.value.trim() || '';
    
    const formattedPhone = phone ? formatPhone(phone) : '';
    
    return {
        title: document.getElementById('project-name')?.value.trim() || '',
        tagline: document.getElementById('project-tagline')?.value.trim() || '',
        description: document.getElementById('project-description')?.value.trim() || '',
        city: document.getElementById('project-city')?.value.trim() || '',
        price: document.getElementById('project-price')?.value || '',
        contacts: {
            phone: formattedPhone,
            email,
            telegram,
            otherContact
        },
        image: document.getElementById('project-image')?.files[0]
    };
}

// Инициализация маски для телефона
function initPhoneMask() {
    if (typeof Inputmask === 'undefined') return;
    
    const phoneInputs = document.querySelectorAll('.phone-input');
    
    phoneInputs.forEach(input => {
        Inputmask({
            mask: '+7 (999) 999-99-99',
            placeholder: '_',
            clearIncomplete: true,
            showMaskOnHover: false,
            greedy: false
        }).mask(input);
    });
}

// Показать ошибку
function showError(element, message) {
    if (element) {
        element.style.display = 'block';
        element.textContent = message;
    }
}

// Скрыть ошибку
function hideError(element) {
    if (element) {
        element.style.display = 'none';
    }
}

// Обновить список городов в datalist
function updateCitiesDatalist(cities, datalistId = 'cities-list') {
    const datalist = document.getElementById(datalistId);
    if (!datalist) return;
    
    datalist.innerHTML = '';
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        datalist.appendChild(option);
    });
}