/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Move .tmp/build/static to docs/
const fs = require('fs');
const del = require('del');
const path = require('path');

// Копируем serve.json в .tmp/build/static для режима разработки
const tmpBuildStaticPath = path.join('.tmp', 'build', 'static');
if (!fs.existsSync(tmpBuildStaticPath)) {
  fs.mkdirSync(tmpBuildStaticPath, { recursive: true });
}

// Создаем index.html с редиректом если его нет
const indexPath = path.join(tmpBuildStaticPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  const indexContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Squoosh</title>
  <style>
    body {
      font-family: sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f7f7f7;
    }
    .message {
      text-align: center;
      padding: 2rem;
      max-width: 500px;
      background: white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    h1 {
      color: #ff3385;
      margin-top: 0;
    }
  </style>
</head>
<body>
  <div class="message">
    <h1>Squoosh - Разработка</h1>
    <p>Squoosh запущен в режиме разработки.</p>
    <p>Вы можете начать загружать и оптимизировать изображения прямо сейчас.</p>
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log('Created index.html in .tmp/build/static/');
}

try {
  if (fs.existsSync('serve.json')) {
    // Создаем custom конфигурацию для serve.json
    const serveConfig = {
      "rewrites": [
        { "source": "**", "destination": "/index.html" }
      ],
      "headers": [
        {
          "source": "**/*",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache"
            },
            {
              "key": "Cross-Origin-Embedder-Policy",
              "value": "require-corp"
            },
            {
              "key": "Cross-Origin-Opener-Policy",
              "value": "same-origin"
            }
          ]
        }
      ]
    };
    
    fs.writeFileSync(path.join(tmpBuildStaticPath, 'serve.json'), 
      JSON.stringify(serveConfig, null, 2), 'utf8');
    console.log('Custom serve.json created in .tmp/build/static/');
  }
} catch (error) {
  console.warn('Failed to create serve.json:', error);
}

// Удаляем существующую build директорию, если она существует
del.sync('build');

// Создадим директорию build, если она не существует
if (!fs.existsSync('build')) {
  fs.mkdirSync('build', { recursive: true });
}

// Копируем файлы вместо переименования
const sourcePath = path.join('.tmp', 'build', 'static');
if (fs.existsSync(sourcePath)) {
  // Рекурсивная функция копирования директории
  function copyDir(src, dest) {
    // Создаем директорию назначения, если она не существует
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    // Читаем содержимое исходной директории
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        // Рекурсивно копируем поддиректории
        copyDir(srcPath, destPath);
      } else {
        // Копируем файлы
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyDir(sourcePath, 'build');
  console.log('Static files copied to build/');
} else {
  console.warn('Source directory does not exist:', sourcePath);
}
