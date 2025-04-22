# Руководство по развертыванию

В этом документе содержатся инструкции по развертыванию Midnight Squoosh на различных платформах.

## Содержание
- [GitHub Pages](#github-pages)
- [Netlify](#netlify)
- [Vercel](#vercel)
- [Firebase Hosting](#firebase-hosting)
- [Docker](#docker)

## GitHub Pages

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

После этого сайт будет доступен по адресу: https://ваш-юзернейм.github.io/Midnight-squoosh-fork/

## Netlify

1. Создайте аккаунт на [Netlify](https://www.netlify.com/)
2. Создайте новый сайт из Git
3. Выберите репозиторий с Midnight Squoosh
4. Настройте параметры сборки:
   - Build command: `npm run build`
   - Publish directory: `.tmp/build/static`
5. Нажмите "Deploy site"

## Vercel

1. Создайте аккаунт на [Vercel](https://vercel.com/)
2. Импортируйте проект из GitHub
3. Настройте параметры сборки:
   - Build Command: `npm run build`
   - Output Directory: `.tmp/build/static`
4. Нажмите "Deploy"

## Firebase Hosting

1. Установите Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Войдите в аккаунт Firebase:
```bash
firebase login
```

3. Инициализируйте Firebase в вашем проекте:
```bash
firebase init hosting
```

4. При настройке укажите:
   - Публичную директорию: `.tmp/build/static`
   - Настройте для SPA: Yes
   - Автоматическая сборка: No

5. Соберите проект:
```bash
npm run build
```

6. Разверните на Firebase:
```bash
firebase deploy --only hosting
```

## Docker

1. Создайте файл `Dockerfile` в корне проекта:
```Dockerfile
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/.tmp/build/static /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Соберите Docker образ:
```bash
docker build -t midnight-squoosh .
```

3. Запустите контейнер:
```bash
docker run -p 80:80 midnight-squoosh
```

Ваш сайт будет доступен по адресу http://localhost. 