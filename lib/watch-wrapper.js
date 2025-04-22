/**
 * Copyright 2023 Squoosh. All Rights Reserved.
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

// Перехватчик process.exit для безопасного выхода из rollup watch
const originalExit = process.exit;

process.exit = function(code) {
  // Проверяем тип аргумента, чтобы избежать ошибки "The code argument must be of type number"
  if (typeof code !== 'number') {
    console.error('Warning: Attempted to call process.exit with non-number argument:', code);
    // Вызываем exit с числовым значением
    return originalExit.call(process, 1);
  }
  return originalExit.call(process, code);
};

// Запускаем rollup в режиме командной строки с флагами -cw (config, watch)
const { spawnSync } = require('child_process');
const path = require('path');

// Находим путь к исполняемому файлу rollup
const rollupBinPath = path.join(__dirname, '..', 'node_modules', '.bin', 'rollup');

// Запускаем rollup с параметрами командной строки
console.log('Starting rollup watch with error handling...');
const result = spawnSync(rollupBinPath, ['-cw'], { 
  stdio: 'inherit',
  shell: true
});

if (result.error) {
  console.error('Error running rollup watch:', result.error);
  process.exit(1);
} 