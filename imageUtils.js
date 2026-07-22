// Сжатие изображения
export function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                
                // Вычисляем новые размеры
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Конвертируем в base64
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Проверка файла (макс 20 МБ)
export function validateImage(file) {
    const maxSize = 20 * 1024 * 1024; // 20 МБ
    if (file.size > maxSize) {
        return 'Файл слишком большой (максимум 20 МБ)';
    }
    if (!file.type.startsWith('image/')) {
        return 'Это не изображение';
    }
    return null;
}
