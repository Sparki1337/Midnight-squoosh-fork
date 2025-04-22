# Midnight Squoosh Fork

Темная версия Squoosh с настраиваемыми цветами интерфейса и улучшенным UI. Этот форк основан на оригинальном [Squoosh](https://github.com/GoogleChromeLabs/squoosh) от Google Chrome Labs.

Midnight Squoosh

## Особенности

- 🌙 Темный интерфейс по умолчанию
- 🎨 Настраиваемые цвета интерфейса
- 🔄 Цвет разделяющей полоски меняется вместе с цветом интерфейса
- 🖼️ Поддержка всех кодеков из оригинального Squoosh
- 🚀 Улучшенный пользовательский интерфейс

## Установка и запуск локально

### Требования
- Node.js (версия 14 или выше)
- npm (версия 6 или выше)

### Шаги для запуска
1. Клонировать репозиторий
```bash
git clone https://github.com/Sparki1337/Midnight-squoosh-fork.git
cd Midnight-squoosh-fork
```

2. Установить зависимости
```bash
npm install
```

3. Запустить в режиме разработки
```bash
npm run dev
```

4. Открыть в браузере
```
http://localhost:5000
```

## Сборка для продакшена

Для создания оптимизированной сборки:

```bash
npm run build
```

Готовая сборка будет доступна в директории `.tmp/build/static`.

## Развертывание на GitHub Pages

1. Создайте ветку gh-pages:
```bash
git checkout -b gh-pages
```

2. Соберите проект:
```bash
npm run build
```

3. Переместите файлы из `.tmp/build/static` в корень:
```bash
cp -r .tmp/build/static/* .
```

4. Добавьте файлы, сделайте коммит и отправьте на GitHub:
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

После этого сайт будет доступен по адресу: https://sparki1337.github.io/Midnight-squoosh-fork/

## Лицензия

Apache License 2.0 - см. файл [LICENSE](LICENSE) для подробностей.

## Благодарности

- Оригинальная команда [Squoosh](https://github.com/GoogleChromeLabs/squoosh) за создание потрясающего инструмента
- Всем контрибьюторам, кто помогает улучшать Midnight Squoosh 