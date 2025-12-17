import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Типы для TypeScript
interface Project {
    id: string;
    title: string;
    tagline: string;
    description: string;
    image?: string;
    city: string;
    price: number;
    contact: string;
    phone?: string;
    email?: string;
    telegram?: string;
    otherContact?: string;
    createdAt: string;
}

// Настройка Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Папка для загрузки изображений
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'projects.json');

// Создаем папки если их нет
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Разрешены только изображения (jpeg, jpg, png, gif)'));
        }
    }
});

// Список российских городов
const RUSSIAN_CITIES = [
    "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
    "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону",
    "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград",
    "Краснодар", "Саратов", "Тюмень", "Тольятти", "Ижевск",
    "Барнаул", "Ульяновск", "Иркутск", "Хабаровск", "Ярославль",
    "Владивосток", "Махачкала", "Томск", "Оренбург", "Кемерово",
    "Новокузнецк", "Рязань", "Астрахань", "Набережные Челны", "Пенза",
    "Липецк", "Киров", "Чебоксары", "Тула", "Калининград",
    "Балашиха", "Курск", "Севастополь", "Сочи", "Ставрополь",
    "Улан-Удэ", "Тверь", "Магнитогорск", "Иваново", "Брянск",
    "Белгород", "Сургут", "Владимир", "Нижний Тагил", "Архангельск",
    "Чита", "Калуга", "Симферополь", "Смоленск", "Волжский",
    "Саранск", "Череповец", "Курган", "Орёл", "Вологда",
    "Якутск", "Подольск", "Стерлитамак", "Грозный", "Владикавказ",
    "Мурманск", "Тамбов", "Петрозаводск", "Кострома", "Нижневартовск",
    "Новороссийск", "Йошкар-Ола", "Химки", "Таганрог", "Комсомольск-на-Амуре",
    "Сыктывкар", "Нальчик", "Шахты", "Дзержинск", "Орск",
    "Братск", "Энгельс", "Ангарск", "Королёв", "Псков",
    "Бийск", "Прокопьевск", "Рыбинск", "Балаково", "Армавир",
    "Южно-Сахалинск", "Северодвинск", "Абакан", "Норильск", "Люберцы",
    "Мытищи", "Миасс", "Новочеркасск", "Каменск-Уральский", "Златоуст",
    "Электросталь", "Альметьевск", "Салават", "Копейск", "Пятигорск",
    "Рубцовск", "Березники", "Коломна", "Майкоп", "Одинцово",
    "Ковров", "Кисловодск", "Железнодорожный", "Новомосковск", "Серпухов",
    "Новошахтинск", "Нефтеюганск", "Первоуральск", "Дербент", "Черкесск",
    "Орехово-Зуево", "Нефтекамск", "Красногорск", "Димитровград", "Батайск",
    "Муром", "Гатчина", "Сергиев Посад", "Новотроицк", "Воскресенск",
    "Елец", "Евпатория", "Реутов", "Арзамас", "Бердск",
    "Элиста", "Ногинск", "Домодедово", "Обнинск", "Каспийск",
    "Кызыл", "Назрань", "Раменское", "Находка", "Уссурийск"
];

// Функция для генерации уникального ID
const generateId = (): string => {
    return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Вспомогательные функции для работы с данными
const readProjects = (): Project[] => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения файла проектов:', error);
        return [];
    }
};

const writeProjects = (projects: Project[]): void => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
    } catch (error) {
        console.error('Ошибка записи файла проектов:', error);
    }
};

// Функции валидации
const validateEmail = (email: string): boolean => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
};

const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    const digits = phone.replace(/\D/g, '');
    return digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'));
};

const validateTelegram = (telegram: string): boolean => {
    if (!telegram) return true;
    const re = /^@[a-zA-Z0-9_]{5,32}$/;
    return re.test(telegram);
};

const validateCity = (city: string): boolean => {
    if (!city) return false;
    return RUSSIAN_CITIES.some(russianCity => 
        russianCity.toLowerCase() === city.toLowerCase()
    );
};

const formatPhone = (phone: string): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        const code = digits.startsWith('8') ? '7' : digits.substring(0, 1);
        const rest = digits.startsWith('8') ? digits.substring(1) : digits.substring(1);
        return `+7 (${rest.substring(0, 3)}) ${rest.substring(3, 6)}-${rest.substring(6, 8)}-${rest.substring(8, 10)}`;
    }
    return phone;
};

// Статические файлы
app.use('/uploads', express.static(UPLOADS_DIR, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        }
    }
}));

app.use(express.static(path.join(__dirname, '../client')));

//  API ENDPOINTS

// Получить все проекты
app.get('/api/projects', (req: Request, res: Response) => {
    try {
        const projects = readProjects();
        res.json(projects);
    } catch (error) {
        console.error('Ошибка получения проектов:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении проектов' });
    }
});

// Получить проект по ID
app.get('/api/projects/:id', (req: Request, res: Response) => {
    try {
        const projects = readProjects();
        const project = projects.find(p => p.id === req.params.id);
        
        if (!project) {
            return res.status(404).json({ error: 'Проект не найден' });
        }
        
        res.json(project);
    } catch (error) {
        console.error('Ошибка получения проекта:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении проекта' });
    }
});

// Создать новый проект
app.post('/api/projects', upload.single('image'), (req: Request, res: Response) => {
    try {
        const { 
            title, 
            tagline, 
            description, 
            city, 
            price, 
            contact 
        } = req.body;

        // Валидация обязательных полей
        const missingFields = [];
        if (!title || !title.trim()) missingFields.push('Название проекта');
        if (!tagline || !tagline.trim()) missingFields.push('Краткое описание');
        if (!description || !description.trim()) missingFields.push('Подробное описание');
        if (!city || !city.trim()) missingFields.push('Город');
        if (!price) missingFields.push('Стоимость');
        if (!contact) missingFields.push('Контактная информация');
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                error: `Не заполнены обязательные поля: ${missingFields.join(', ')}` 
            });
        }

        // Валидация города
        if (!validateCity(city.trim())) {
            return res.status(400).json({ 
                error: 'Указанный город не найден в списке российских городов' 
            });
        }

        // Парсим контакты
        let contacts;
        try {
            contacts = JSON.parse(contact);
        } catch (parseError) {
            return res.status(400).json({ 
                error: 'Некорректный формат контактной информации' 
            });
        }

        // Проверяем, что хотя бы один контакт указан
        const { phone: rawPhone, email, telegram, otherContact } = contacts;
        if (!rawPhone && !email && !telegram && !otherContact) {
            return res.status(400).json({ 
                error: 'Укажите хотя бы один способ связи' 
            });
        }

        // Форматируем и валидируем телефон
        let phone = rawPhone;
        if (phone) {
            phone = formatPhone(phone);
            if (!validatePhone(phone)) {
                return res.status(400).json({ 
                    error: 'Некорректный номер телефона. Используйте формат: +7 XXX XXX-XX-XX' 
                });
            }
        }

        // Валидация email
        if (email && !validateEmail(email)) {
            return res.status(400).json({ 
                error: 'Некорректный email адрес' 
            });
        }

        // Валидация Telegram
        if (telegram && !validateTelegram(telegram)) {
            return res.status(400).json({ 
                error: 'Некорректный Telegram username. Формат: @username (5-32 символа)' 
            });
        }

        // Проверяем валидность цены
        const priceNum = Number(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            return res.status(400).json({ 
                error: 'Стоимость должна быть положительным числом' 
            });
        }

        const projects = readProjects();
        
        // Создаем новый проект
        const newProject: Project = {
            id: generateId(),
            title: title.trim(),
            tagline: tagline.trim(),
            description: description.trim(),
            city: city.trim(),
            price: priceNum,
            contact: JSON.stringify({
                phone: phone || '',
                email: email || '',
                telegram: telegram || '',
                otherContact: otherContact || ''
            }),
            phone: phone || undefined,
            email: email || undefined,
            telegram: telegram || undefined,
            otherContact: otherContact || undefined,
            createdAt: new Date().toISOString()
        };

        // Добавляем изображение если есть
        if (req.file) {
            newProject.image = `uploads/${req.file.filename}`;
        }

        // Добавляем проект в массив
        projects.push(newProject);
        
        // Сохраняем в файл
        writeProjects(projects);
        
        res.status(201).json(newProject);
    } catch (error) {
        console.error('Ошибка создания проекта:', error);
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Внутренняя ошибка сервера' 
        });
    }
});

// Удалить проект
app.delete('/api/projects/:id', (req: Request, res: Response) => {
    try {
        const projects = readProjects();
        const projectIndex = projects.findIndex(p => p.id === req.params.id);
        
        if (projectIndex === -1) {
            return res.status(404).json({ error: 'Проект не найден' });
        }
        
        // Удаляем изображение если есть
        const project = projects[projectIndex];
        if (project.image && project.image.startsWith('uploads/')) {
            const imagePath = path.join(__dirname, project.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Удаляем проект из массива
        projects.splice(projectIndex, 1);
        writeProjects(projects);
        
        res.json({ 
            message: 'Проект успешно удален',
            deletedId: req.params.id
        });
    } catch (error) {
        console.error('Ошибка удаления проекта:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении проекта' });
    }
});

// Получить список городов с умным поиском
app.get('/api/cities', (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        let cities = RUSSIAN_CITIES;
        
        if (query && query.toString().trim()) {
            const searchTerm = query.toString().toLowerCase().trim();
            
            // 1. Точные совпадения с начала
            const exactMatches = cities.filter(city => 
                city.toLowerCase().startsWith(searchTerm)
            );
            
            // 2. Если мало точных совпадений, ищем в отдельных словах
            let results = exactMatches;
            if (exactMatches.length < 10) {
                const wordMatches = cities.filter(city => {
                    if (exactMatches.includes(city)) return false;
                    
                    // Ищем в отдельных словах города (через пробел или дефис)
                    const words = city.toLowerCase().split(/[-\s]+/);
                    return words.some(word => word.startsWith(searchTerm));
                });
                
                results = [...exactMatches, ...wordMatches];
            }
            
            cities = results.slice(0, 15);
        } else {
            // При пустом запросе возвращаем пустой массив
            cities = [];
        }
        
        res.json(cities);
    } catch (error) {
        console.error('Ошибка получения городов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить популярные города (при пустом поле)
app.get('/api/cities/popular', (req: Request, res: Response) => {
    try {
        const popularCities = [
            "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
            "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону",
            "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград"
        ];
        
        res.json(popularCities);
    } catch (error) {
        console.error('Ошибка получения популярных городов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Валидация города
app.get('/api/cities/validate/:city', (req: Request, res: Response) => {
    try {
        const city = req.params.city;
        const isValid = validateCity(city);
        
        // Находим похожий город если текущий невалидный
        let suggestion = null;
        if (!isValid) {
            const input = city.toLowerCase();
            // Ищем город, начинающийся с тех же букв
            for (const russianCity of RUSSIAN_CITIES) {
                if (russianCity.toLowerCase().startsWith(input)) {
                    suggestion = russianCity;
                    break;
                }
            }
            // Если не нашли с начала, ищем частичное совпадение
            if (!suggestion) {
                for (const russianCity of RUSSIAN_CITIES) {
                    if (russianCity.toLowerCase().includes(input)) {
                        suggestion = russianCity;
                        break;
                    }
                }
            }
        }
        
        res.json({
            city,
            isValid,
            suggestion
        });
    } catch (error) {
        console.error('Ошибка валидации города:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить проекты за дату
app.get('/api/projects/date/:date', (req: Request, res: Response) => {
    try {
        const date = req.params.date;
        const projects = readProjects();
        
        const filteredProjects = projects.filter(project => {
            const projectDate = new Date(project.createdAt).toISOString().split('T')[0];
            return projectDate === date;
        });
        
        res.json(filteredProjects);
    } catch (error) {
        console.error('Ошибка фильтрации по дате:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Экспорт в CSV
app.get('/api/export/csv', (req: Request, res: Response) => {
    try {
        const projects = readProjects();
        
        let csv = 'ID,Название,Описание,Город,Стоимость,Телефон,Email,Telegram,Дата\n';
        
        projects.forEach(project => {
            const contacts = JSON.parse(project.contact);
            const row = [
                project.id,
                `"${project.title.replace(/"/g, '""')}"`,
                `"${project.tagline.replace(/"/g, '""')}"`,
                `"${project.city}"`,
                project.price,
                `"${contacts.phone || ''}"`,
                `"${contacts.email || ''}"`,
                `"${contacts.telegram || ''}"`,
                project.createdAt
            ].join(',');
            
            csv += row + '\n';
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=projects.csv');
        res.send(csv);
    } catch (error) {
        console.error('Ошибка экспорта в CSV:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршруты для HTML страниц
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/create', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../client/create.html'));
});

app.get('/project', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../client/project.html'));
});

// Обработка ошибок
app.use((err: Error, req: Request, res: Response, next: Function) => {
    console.error('Ошибка сервера:', err.stack);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'Файл слишком большой. Максимальный размер 5MB' 
            });
        }
        return res.status(400).json({ 
            error: `Ошибка загрузки файла: ${err.message}` 
        });
    }
    
    res.status(500).json({ 
        error: 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.' 
    });
});

// Обработка 404
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(` Сервер запущен на порту ${PORT}`);
    console.log(` Главная страница: http://localhost:${PORT}`);
});