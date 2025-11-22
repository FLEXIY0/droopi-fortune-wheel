// Данные приложения
let items = [];
let isSpinning = false;

// DOM элементы
const itemInput = document.getElementById('itemInput');
const addButton = document.getElementById('addButton');
const itemsList = document.getElementById('itemsList');
const clearButton = document.getElementById('clearButton');
const spinButton = document.getElementById('spinButton');
const wheel = document.getElementById('wheel');
const result = document.getElementById('result');
const resultText = document.getElementById('resultText');


// Яркая цветовая гамма для сегментов (как на изображении)
const colors = [
    '#FF0000', // Красный (p) - яркий красный
    '#800080', // Фиолетовый (c) - глубокий фиолетовый
    '#000080', // Темно-синий (b) - темный синий
    '#0000FF', // Средний синий (g) - яркий синий
    '#00FFFF', // Бирюзовый/Циан (i) - яркий циан
    '#90EE90', // Светло-зеленый (d) - светлый зеленый
    '#ADFF2F', // Желто-зеленый (a) - зеленовато-желтый
    '#DAA520', // Желто-оранжевый (k) - золотистый
    '#FFA500', // Оранжевый (j) - яркий оранжевый
    '#FF4500', // Красно-оранжевый (r) - красно-оранжевый
    // Дополнительные цвета на случай большего количества сегментов
    '#FF6347', // Томатный
    '#FF1493', // Глубокий розовый
    '#8B008B', // Темно-пурпурный
    '#4169E1', // Королевский синий
    '#00CED1', // Темный бирюзовый
    '#32CD32', // Лайм зеленый
    '#FFD700', // Золотой
    '#FF8C00', // Темно-оранжевый
    '#DC143C', // Малиновый
    '#9932CC', // Темно-фиолетовый
    '#1E90FF', // Доджер синий
    '#00FA9A', // Морской зеленый
    '#FFD700', // Золотой
    '#FF69B4'  // Горячий розовый
];

// Функции для работы с cookie
function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    // Устанавливаем SameSite=None для работы с сервером и Secure для HTTPS
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
}

function getCookie(name) {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// Загрузка данных из cookie (с fallback на localStorage для совместимости)
function loadItems() {
    let savedItems = getCookie('wheelItems');
    
    // Если в cookie нет, пробуем загрузить из localStorage (для существующих пользователей)
    if (!savedItems) {
        savedItems = localStorage.getItem('wheelItems');
        // Если нашли в localStorage, мигрируем в cookie
        if (savedItems) {
            setCookie('wheelItems', savedItems);
            localStorage.removeItem('wheelItems'); // Удаляем из localStorage после миграции
        }
    }
    
    if (savedItems) {
        try {
            items = JSON.parse(savedItems);
            renderItemsList();
            updateWheel();
        } catch (e) {
            console.error('Ошибка при загрузке данных:', e);
            items = [];
        }
    }
}

// Сохранение данных в cookie
function saveItems() {
    try {
        const itemsJson = JSON.stringify(items);
        setCookie('wheelItems', itemsJson);
        // Также сохраняем в localStorage для резервной копии
        localStorage.setItem('wheelItems', itemsJson);
    } catch (e) {
        console.error('Ошибка при сохранении данных:', e);
    }
}

// Добавление нового пункта
function addItem() {
    const text = itemInput.value.trim();
    if (text && !isSpinning) {
        const t = translations[currentLang] || translations.ru;
        if (items.length >= 12) {
            alert(t.maxItems);
            return;
        }

        items.push(text);
        itemInput.value = '';
        saveItems();
        renderItemsList();
        updateWheel();
    }
}

// Удаление пункта
function deleteItem(index) {
    if (!isSpinning) {
        items.splice(index, 1);
        saveItems();
        renderItemsList();
        updateWheel();
    }
}

// Начать редактирование пункта
function startEditing(index, textElement) {
    if (isSpinning) return;

    // Получаем текущий текст для отображения
    let currentItem = items[index];
    let displayText = currentItem;

    try {
        const parsed = JSON.parse(currentItem);
        displayText = parsed.name || currentItem;
    } catch (e) {
        // Это обычный текст
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'item-input';
    input.value = displayText;
    input.maxLength = 30;

    // Заменяем текст на input
    textElement.parentNode.replaceChild(input, textElement);
    input.focus();
    input.select();

    // Обработчики событий
    const finishEditing = () => {
        const newText = input.value.trim();
        if (newText && newText !== displayText) {
            try {
                // Если это была игра, обновляем только имя
                const parsed = JSON.parse(currentItem);
                if (parsed.type === 'game') {
                    parsed.name = newText;
                    items[index] = JSON.stringify(parsed);
                } else {
                    items[index] = newText;
                }
            } catch (e) {
                // Это обычный текст
                items[index] = newText;
            }
            saveItems();
            renderItemsList();
            updateWheel();
        }
        // Возвращаем текст
        input.parentNode.replaceChild(textElement, input);
        textElement.textContent = displayText; // Временно, renderItemsList обновит правильно
        textElement.classList.remove('editing');
    };

    input.addEventListener('blur', finishEditing);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditing();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            // Отмена редактирования
            input.parentNode.replaceChild(textElement, input);
            textElement.classList.remove('editing');
        }
    });

    textElement.classList.add('editing');
}

// Очистка всех пунктов
function clearAllItems() {
    const t = translations[currentLang] || translations.ru;
    if (!isSpinning && confirm(t.clearConfirm)) {
        items = [];
        // Сохраняем пустой массив
        saveItems();
        // Также явно очищаем cookie и localStorage
        deleteCookie('wheelItems');
        localStorage.removeItem('wheelItems');
        renderItemsList();
        updateWheel();
    }
}

// Отрисовка списка пунктов
function renderItemsList() {
    itemsList.innerHTML = '';

    if (items.length === 0) {
        const t = translations[currentLang] || translations.ru;
        itemsList.innerHTML = `<p style="text-align: center; color: rgba(232, 232, 232, 0.6); font-style: italic; padding: 20px;">${t.noItems}</p>`;
        spinButton.disabled = true;
        return;
    }

    items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';

        // Проверяем, является ли элемент игрой с изображением
        let itemData;
        let isGame = false;
        try {
            itemData = JSON.parse(item);
            if (itemData.type === 'game') {
                isGame = true;
            }
        } catch (e) {
            itemData = { name: item, type: 'text' };
        }

        // Устанавливаем цвет левой обводки элемента на основе индекса
        const itemColor = colors[index % colors.length];
        itemElement.style.borderLeftColor = itemColor;
        itemElement.title = `Цвет сегмента: ${getColorName(itemColor)}`;

        const itemText = document.createElement('span');
        itemText.className = 'item-text';
        itemText.textContent = itemData.name || item;
        itemText.onclick = () => startEditing(index, itemText);
        itemText.title = (translations[currentLang] || translations.ru).editTitle;

        // Если это игра, добавляем иконку игры
        const textContainer = document.createElement('div');
        textContainer.style.display = 'flex';
        textContainer.style.alignItems = 'center';
        textContainer.style.flex = '1';

        if (isGame) {
            const gameIcon = document.createElement('span');
            gameIcon.textContent = '🎮';
            gameIcon.style.marginRight = '8px';
            gameIcon.title = 'Игра с изображением';
            textContainer.appendChild(gameIcon);
        }

        textContainer.appendChild(itemText);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = () => deleteItem(index);
        deleteBtn.title = (translations[currentLang] || translations.ru).deleteTitle;

        itemElement.appendChild(textContainer);
        itemElement.appendChild(deleteBtn);

        itemsList.appendChild(itemElement);
    });

    spinButton.disabled = false;
}

// Обновление круга
function updateWheel() {
    wheel.innerHTML = '';

    if (items.length === 0) {
        return;
    }

    // Адаптивные размеры
    const svgSize = window.innerWidth <= 768 ? 320 : 550;
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    const radius = window.innerWidth <= 768 ? 140 : 250;

    // Обновляем viewBox и размеры SVG
    wheel.setAttribute('width', svgSize);
    wheel.setAttribute('height', svgSize);
    wheel.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`);
    const angleStep = (2 * Math.PI) / items.length;

    // 1. Создаем все сегменты
    items.forEach((item, index) => {
        const startAngle = index * angleStep - Math.PI / 2;
        const endAngle = (index + 1) * angleStep - Math.PI / 2;

        // Проверяем, есть ли у элемента изображение игры
        let itemData;
        let gameImageUrl = null;
        try {
            itemData = JSON.parse(item);
            if (itemData.type === 'game') {
                gameImageUrl = itemData.image;
            }
        } catch (e) {
            itemData = { name: item, type: 'text' };
        }

        const pathData = createSectorPath(centerX, centerY, 0, radius, startAngle, endAngle);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);

        // Если есть изображение игры, используем его как фон сегмента
        if (gameImageUrl) {
            // Создаем паттерн с изображением для заливки сегмента
            const patternId = `pattern-${index}`;
            const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
            pattern.setAttribute('id', patternId);
            pattern.setAttribute('patternUnits', 'objectBoundingBox');
            pattern.setAttribute('width', '1');
            pattern.setAttribute('height', '1');

            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttribute('href', gameImageUrl);
            image.setAttribute('x', '0');
            image.setAttribute('y', '0');
            image.setAttribute('width', '1');
            image.setAttribute('height', '1');
            image.setAttribute('preserveAspectRatio', 'xMidYMid slice');

            pattern.appendChild(image);
            
            // Добавляем паттерн в defs
            let defs = wheel.querySelector('defs');
            if (!defs) {
                defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                wheel.appendChild(defs);
            }
            defs.appendChild(pattern);

            // Используем паттерн как заливку с полупрозрачностью
            path.style.fill = `url(#${patternId})`;
            path.style.opacity = '0.8';
        } else {
            // Если нет изображения, используем обычный цвет
            const segmentColor = colors[index % colors.length];
            path.style.fill = segmentColor;
        }

        path.style.stroke = '#000000';
        path.style.strokeWidth = '0.5px';
        path.classList.add('segment-path');

        wheel.appendChild(path);
    });

    // 2. Добавляем затемнение поверх изображений для лучшей читаемости текста
    items.forEach((item, index) => {
        let itemData;
        let gameImageUrl = null;
        try {
            itemData = JSON.parse(item);
            if (itemData.type === 'game') {
                gameImageUrl = itemData.image;
            }
        } catch (e) {
            return; // Не игра, пропускаем
        }

        if (gameImageUrl) {
            const startAngle = index * angleStep - Math.PI / 2;
            const endAngle = (index + 1) * angleStep - Math.PI / 2;

            // Добавляем полупрозрачное затемнение поверх изображения
            const pathData = createSectorPath(centerX, centerY, 0, radius, startAngle, endAngle);
            const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            overlay.setAttribute('d', pathData);
            overlay.style.fill = 'rgba(0, 0, 0, 0.3)';
            overlay.style.stroke = 'none';
            overlay.classList.add('segment-overlay');

            wheel.appendChild(overlay);
        }
    });

    // 3. Создаем весь текст
    items.forEach((item, index) => {
        const startAngle = index * angleStep - Math.PI / 2;
        const textAngle = startAngle + angleStep / 2;
        const textRadius = radius * 0.75;
        const textX = centerX + Math.cos(textAngle) * textRadius;
        const textY = centerY + Math.sin(textAngle) * textRadius;

        let itemData;
        let isGame = false;
        let hasImage = false;
        try {
            itemData = JSON.parse(item);
            if (itemData.type === 'game') {
                isGame = true;
                hasImage = !!itemData.image;
            }
        } catch (e) {
            itemData = { name: item, type: 'text' };
        }

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textX);
        text.setAttribute('y', textY);
        text.setAttribute('transform', `rotate(${(textAngle * 180 / Math.PI) + 90}, ${textX}, ${textY})`);
        text.classList.add('segment-text');

        const displayText = itemData.name || item;
        const lines = wrapText(displayText, 10);

        lines.forEach((line, lineIndex) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.setAttribute('x', textX);
            tspan.setAttribute('dy', lineIndex === 0 ? '0' : '1.0em');
            tspan.textContent = line;
            text.appendChild(tspan);
        });

        wheel.appendChild(text);
    });
}

// Функция для создания пути сектора
function createSectorPath(cx, cy, r1, r2, startAngle, endAngle) {
    const x1 = cx + r2 * Math.cos(startAngle);
    const y1 = cy + r2 * Math.sin(startAngle);
    const x2 = cx + r2 * Math.cos(endAngle);
    const y2 = cy + r2 * Math.sin(endAngle);

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    // Создаем сектор от центра к внешней дуге
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r2} ${r2} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

// Функция для получения цвета
function getColorFromGradient(color) {
    return color;
}


// Функция для переноса текста
function wrapText(text, maxCharsPerLine) {
    if (text.length <= maxCharsPerLine) {
        return [text];
    }

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        // Если слово само по себе длиннее лимита, разбиваем его
        if (word.length > maxCharsPerLine) {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = '';
            }
            // Разбиваем длинное слово
            for (let i = 0; i < word.length; i += maxCharsPerLine) {
                const chunk = word.substring(i, i + maxCharsPerLine);
                if (lines.length < 2) {
                    lines.push(chunk);
                }
            }
        } else if (currentLine && (currentLine + ' ' + word).length <= maxCharsPerLine) {
            currentLine += ' ' + word;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
        }
    }

    if (currentLine && lines.length < 2) {
        lines.push(currentLine);
    }

    // Ограничиваем до 2 строк максимум
    if (lines.length > 2) {
        lines.splice(2);
        lines[1] = lines[1].substring(0, maxCharsPerLine - 1) + '…';
    }

    return lines;
}

// Функция для получения названия цвета
function getColorName(color) {
    const colorNames = {
        '#FF6B6B': 'Красный',
        '#4ECDC4': 'Бирюзовый',
        '#45B7D1': 'Синий',
        '#F7DC6F': 'Желтый',
        '#BB8FCE': 'Фиолетовый',
        '#85C1E9': 'Голубой',
        '#82E0AA': 'Зеленый',
        '#F8C471': 'Оранжевый',
        '#F1948A': 'Розовый',
        '#A8E6CF': 'Мятный',
        '#FFD3A5': 'Персиковый',
        '#A29BFE': 'Лиловый',
        '#FD79A8': 'Нежно-розовый',
        '#00CEC9': 'Аквамарин',
        '#0984E3': 'Темно-синий',
        '#FDCB6E': 'Золотистый',
        '#E17055': 'Коралловый',
        '#00B894': 'Изумрудный',
        '#6C5CE7': 'Индиго',
        '#FDCB6E': 'Шафрановый',
        '#E84393': 'Малиновый',
        '#00A8CC': 'Циан',
        '#F39C12': 'Морковный',
        '#8E44AD': 'Темно-фиолетовый'
    };
    return colorNames[color] || 'Цвет';
}

// Физическая модель вращения колеса с инерцией и трением
let currentRotation = 0;
let angularVelocity = 0;
let animationFrameId = null;
let lastSegmentIndex = -1;

// Простое воспроизведение звука через HTML5 Audio
function playTickSound(velocity) {
    try {
        // Создаем новый Audio элемент для каждого воспроизведения
        const audio = new Audio('sound.wav');
        
        // Громкость может зависеть от скорости
        const speedFactor = Math.min(velocity / 50, 1);
        const volume = 0.6 + (speedFactor * 0.2); // 0.6-0.8 в зависимости от скорости
        audio.volume = Math.min(volume, 1.0);
        
        // Воспроизводим звук
        audio.play().catch(error => {
            // Игнорируем ошибки автовоспроизведения (браузеры требуют взаимодействие пользователя)
            console.log('Audio play error (may need user interaction):', error);
        });
    } catch (e) {
        console.error('Audio playback error:', e);
    }
}

// Функция для создания приятного звука при выводе результата
function playWinSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;
        
        // Создаем мелодичную последовательность нот (мажорное трезвучие)
        const frequencies = [523.25, 659.25, 783.99]; // До-Ми-Соль (C5, E5, G5)
        
        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine'; // Чистый тон для приятного звука
            oscillator.frequency.value = freq;
            
            // Создаем приятную обертку (envelope) для звука
            const startTime = now + (index * 0.1); // Небольшая задержка между нотами
            const duration = 0.3;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    } catch (e) {
        // Игнорируем ошибки аудио
        console.log('Audio not available:', e);
    }
}

function spinWheel() {
    if (isSpinning || items.length < 2) return;

    isSpinning = true;
    spinButton.disabled = true;

    // Скрываем предыдущий результат
    result.classList.remove('show');
    const wheelOverlay = document.getElementById('wheelOverlay');
    if (wheelOverlay) {
        wheelOverlay.classList.remove('show');
    }

    // Скрываем UI и увеличиваем колесо
    hideUIForSpin();

    // Останавливаем предыдущую анимацию если есть
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    // Физические параметры
    const spins = Math.random() * 10 + 25; // 25-45 оборотов - всегда сильные вращения
    const randomAngle = Math.random() * 360;
    const targetRotation = spins * 360 + randomAngle;
    
    // Начальная угловая скорость (сильный старт, варьируется для разнообразия)
    const initialVelocity = 10   + Math.random() * 7; // 18-25 градусов за кадр при 60fps
    angularVelocity = initialVelocity;
    
    // Коэффициент трения (очень маленький, варьируется для разного времени вращения)
    // Меньшее значение = дольше вращение
    const frictionCoefficient = 0.001 + Math.random() * 0.007; // 0.0008-0.0015
    
    // Сохраняем начальное положение
    const currentTransform = wheel.style.transform;
    const match = currentTransform.match(/rotate\(([-\d.]+)deg\)/);
    currentRotation = match ? parseFloat(match[1]) % 360 : 0;
    
    // Сбрасываем отслеживание секторов
    lastSegmentIndex = -1;
    
    // Время для расчета
    let startTime = performance.now();
    let lastTime = startTime;
    
    // Функция анимации с физикой
    function animate(currentTime) {
        const deltaTime = (currentTime - lastTime) / 16.67; // Нормализация к 60fps
        if (deltaTime > 0 && deltaTime < 10) { // Предотвращаем скачки при долгих паузах
            lastTime = currentTime;
            
            // Применяем трение (экспоненциальное затухание)
            // Угловая скорость уменьшается из-за трения
            let effectiveFriction;
            
            // Если скорость очень медленная (меньше 1 градуса/кадр), увеличиваем трение для быстрой остановки
            if (angularVelocity < 1.0) {
                // Увеличиваем трение пропорционально замедлению скорости
                const slowDownFactor = 1.0 - angularVelocity; // 0 при скорости 1, увеличивается при замедлении
                effectiveFriction = frictionCoefficient * (1.0 + slowDownFactor * 5); // В 6 раз больше трения на очень медленной скорости
            } else {
                // На высокой скорости трение меньше (более реалистично)
                const speedFactor = Math.max(0.3, angularVelocity / initialVelocity);
                effectiveFriction = frictionCoefficient * (0.5 + 0.5 * speedFactor);
            }
            
            angularVelocity *= Math.pow(1 - effectiveFriction, deltaTime);
            
            // Обновляем угол поворота
            currentRotation += angularVelocity * deltaTime;
            
            // Отслеживаем смену секторов для звука
            if (items.length > 0) {
                const segmentAngle = 360 / items.length;
                // Нормализуем угол (0-360, где 0 - верх)
                const normalizedAngle = (360 - (currentRotation % 360)) % 360;
                const currentSegmentIndex = Math.floor(normalizedAngle / segmentAngle);
                
                // Если сектор изменился, воспроизводим звук (даже на медленной скорости)
                if (currentSegmentIndex !== lastSegmentIndex && lastSegmentIndex !== -1) {
                    // Используем минимальную скорость 1 для расчета звука, чтобы он был слышен даже при медленном вращении
                    const soundVelocity = Math.max(angularVelocity, 1);
                    playTickSound(soundVelocity);
                }
                lastSegmentIndex = currentSegmentIndex;
            }

    // Применяем вращение
            wheel.style.transform = `rotate(${currentRotation}deg)`;
        }
        
        // Проверяем, остановилось ли колесо (скорость очень маленькая)
        // Убрали фиксированное время - только физика!
        if (angularVelocity > 0.005) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            // Колесо остановилось, определяем результат
            const normalizedAngle = (360 - (currentRotation % 360)) % 360;
        const segmentAngle = 360 / items.length;
            let winningIndex = Math.floor(normalizedAngle / segmentAngle);
            
            // Обеспечиваем правильный индекс
            if (winningIndex >= items.length) {
                winningIndex = items.length - 1;
            }
            if (winningIndex < 0) {
                winningIndex = 0;
            }

            let winningItem = items[winningIndex];
            // Если это игра с JSON, извлекаем имя
            try {
                const parsed = JSON.parse(winningItem);
                if (parsed.type === 'game' && parsed.name) {
                    winningItem = parsed.name;
                }
            } catch (e) {
                // Это обычный текст
            }
            
            resultText.textContent = winningItem;
        result.classList.add('show');
            if (wheelOverlay) {
                wheelOverlay.classList.add('show');
            }
            
            // Воспроизводим приятный звук при выводе результата
            playWinSound();

            // Показываем UI обратно через 3 секунды после показа результата
            setTimeout(() => {
                showUIAfterSpin();
            }, 3000);

        isSpinning = false;
        spinButton.disabled = false;
            animationFrameId = null;
        }
    }
    
    // Запускаем анимацию
    animationFrameId = requestAnimationFrame(animate);
}

// Обработчики событий
addButton.addEventListener('click', addItem);
itemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && itemInput.value.trim()) {
        addItem();
    }
});
clearButton.addEventListener('click', clearAllItems);
spinButton.addEventListener('click', spinWheel);

// Обработчик изменения размера окна
window.addEventListener('resize', updateWheel);

// Функция для скрытия результата
function hideResult() {
    result.classList.remove('show');
    const wheelOverlay = document.getElementById('wheelOverlay');
    if (wheelOverlay) {
        wheelOverlay.classList.remove('show');
    }
}

// Обработчик клика вне круга для скрытия результата
document.addEventListener('click', (e) => {
    const wheelContainer = document.querySelector('.wheel-container');
    const resultElement = document.getElementById('result');
    
    // Проверяем, что клик был вне wheel-container и результат показан
    if (result.classList.contains('show') && 
        wheelContainer && 
        !wheelContainer.contains(e.target) &&
        !resultElement.contains(e.target)) {
        hideResult();
    }
});

// Функция для скрытия UI при вращении
function hideUIForSpin() {
    const sidebar = document.querySelector('.sidebar');
    const controls = document.querySelector('.controls');
    const container = document.querySelector('.container');
    const footer = document.querySelector('.footer');
    const langSwitcher = document.querySelector('.language-switcher');
    
    // Все анимации запускаются одновременно для синхронизации
    if (container) container.classList.add('fullscreen-wheel');
    if (sidebar) sidebar.classList.add('hidden-ui');
    if (controls) controls.classList.add('hidden-ui');
    if (footer) footer.classList.add('hidden-ui');
    if (langSwitcher) langSwitcher.classList.add('hidden-ui');
}

// Функция для показа UI после остановки
function showUIAfterSpin() {
    const sidebar = document.querySelector('.sidebar');
    const controls = document.querySelector('.controls');
    const container = document.querySelector('.container');
    const footer = document.querySelector('.footer');
    const langSwitcher = document.querySelector('.language-switcher');
    
    // Все анимации запускаются одновременно для синхронизации
    if (container) container.classList.remove('fullscreen-wheel');
    if (sidebar) sidebar.classList.remove('hidden-ui');
    if (controls) controls.classList.remove('hidden-ui');
    if (footer) footer.classList.remove('hidden-ui');
    if (langSwitcher) langSwitcher.classList.remove('hidden-ui');
}

// Переключение языка
let currentLang = 'ru';
const translations = {
    ru: {
        title: 'Круг Фортуны',
        addItems: 'Добавить пункты',
        placeholder: 'Введите название...',
        add: 'Добавить',
        clear: 'Очистить все',
        spin: 'Крутить!',
        copyright: '© 2024 Все права защищены',
        noItems: 'Нет пунктов. Добавьте первый!',
        editTitle: 'Клик для редактирования',
        deleteTitle: 'Удалить',
        clearConfirm: 'Вы уверены, что хотите удалить все пункты?',
        maxItems: 'Максимум 12 пунктов!'
    },
    en: {
        title: 'Wheel of Fortune',
        addItems: 'Add Items',
        placeholder: 'Enter name...',
        add: 'Add',
        clear: 'Clear All',
        spin: 'Spin!',
        copyright: '© 2024 All rights reserved',
        noItems: 'No items. Add the first one!',
        editTitle: 'Click to edit',
        deleteTitle: 'Delete',
        clearConfirm: 'Are you sure you want to delete all items?',
        maxItems: 'Maximum 12 items!'
    }
};

function switchLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    // Обновляем текст на странице
    document.querySelector('.sidebar h2').textContent = t.addItems;
    document.getElementById('itemInput').placeholder = t.placeholder;
    document.getElementById('addButton').textContent = t.add;
    document.getElementById('clearButton').textContent = t.clear;
    document.getElementById('spinButton').textContent = t.spin;
    document.querySelector('.copyright').textContent = t.copyright;
    
    // Обновляем активную кнопку языка
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
    
    // Обновляем сообщения в списке
        renderItemsList();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    
    // Обработчики для переключателя языков
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            switchLanguage(lang);
        });
    });
});
