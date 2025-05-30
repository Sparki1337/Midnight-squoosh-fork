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
import { fork } from 'child_process';

export default function runScript(path) {
  return {
    name: 'run-script',
    writeBundle() {
      return new Promise((resolve) => {
        try {
          const proc = fork(path, {
            stdio: 'inherit',
          });

          proc.on('exit', (code) => {
            if (code !== 0) {
              console.error(`Static build failed with code ${code}`);
              resolve();
              return;
            }
            resolve();
          });
        } catch (error) {
          console.error('Error running script:', error);
          resolve();
        }
      });
    },
  };
}
