import { h, Component } from 'preact';
import type { JSX } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import '../../custom-els/loading-spinner';
import largePhoto from 'url:./imgs/demos/demo-large-photo.jpg';
import artwork from 'url:./imgs/demos/demo-artwork.jpg';
import deviceScreen from 'url:./imgs/demos/demo-device-screen.png';
import largePhotoIcon from 'url:./imgs/demos/icon-demo-large-photo.jpg';
import artworkIcon from 'url:./imgs/demos/icon-demo-artwork.jpg';
import deviceScreenIcon from 'url:./imgs/demos/icon-demo-device-screen.jpg';
import smallSectionAsset from 'url:./imgs/info-content/small.svg';
import simpleSectionAsset from 'url:./imgs/info-content/simple.svg';
import secureSectionAsset from 'url:./imgs/info-content/secure.svg';
import * as style from './style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import 'shared/custom-els/snack-bar';
import { startBlobs } from './blob-anim/meta';
import SlideOnScroll from './SlideOnScroll';

const demos = [
  {
    description: 'Large photo',
    size: '2.8MB',
    filename: 'photo.jpg',
    url: largePhoto,
    iconUrl: largePhotoIcon,
  },
  {
    description: 'Artwork',
    size: '2.9MB',
    filename: 'art.jpg',
    url: artwork,
    iconUrl: artworkIcon,
  },
  {
    description: 'Device screen',
    size: '1.6MB',
    filename: 'pixel3.png',
    url: deviceScreen,
    iconUrl: deviceScreenIcon,
  },
] as const;

const blobAnimImport =
  !__PRERENDER__ && matchMedia('(prefers-reduced-motion: reduce)').matches
    ? undefined
    : import('./blob-anim');
const installButtonSource = 'introInstallButton-Purple';
const supportsClipboardAPI =
  !__PRERENDER__ && navigator.clipboard && navigator.clipboard.read;

async function getImageClipboardItem(
  items: ClipboardItem[],
): Promise<undefined | Blob> {
  for (const item of items) {
    const type = item.types.find((type) => type.startsWith('image/'));
    if (type) return item.getType(type);
  }
}

interface Props {
  onFile?: (file: File) => void;
  showSnack?: SnackBarElement['showSnackbar'];
}
interface State {
  fetchingDemoIndex?: number;
  beforeInstallEvent?: BeforeInstallPromptEvent;
  showBlobSVG: boolean;
  showColorPanel: boolean;
  bgPrimaryColor: string;
  bgSecondaryColor: string;
  accentColor: string;
  editorBgColor: string;
  updateWindowColor: string;
  editorUiColor: string;
}

export default class Intro extends Component<Props, State> {
  state: State = {
    showBlobSVG: true,
    showColorPanel: false,
    bgPrimaryColor: '#8342e0', // Фиолетовый цвет
    bgSecondaryColor: '#ff3385', // Розовый цвет
    accentColor: '#000000', // Черный цвет фона
    editorBgColor: '#2d1657', // Цвет фона редактора
    updateWindowColor: '#2d1657',
    editorUiColor: '#8342e0', // Цвет интерфейса редактора
  };
  private fileInput?: HTMLInputElement;
  private blobCanvas?: HTMLCanvasElement;
  private logoContainer?: HTMLHeadingElement;
  private installingViaButton = false;
  
  // Сохраняем ссылки на обработчики событий
  private _mouseClickHandler?: () => void;

  componentDidMount() {
    // Загружаем настройки цветов из localStorage
    this.loadColorSettings();
    
    // Добавляем эффект при клике на логотип
    if (this.logoContainer) {
      const container = this.logoContainer;
      
      // Функция для эффекта нажатия
      const handleClick = () => {
        // Добавляем класс для эффекта нажатия
        container.classList.add('logo-click-effect');
        
        // Создаем эффект разлетающихся частиц
        this.createParticleEffect(container);
        
        // Удаляем класс через небольшую задержку
        setTimeout(() => {
          container.classList.remove('logo-click-effect');
        }, 300);
      };
      
      // Добавляем обработчик события клика
      container.addEventListener('click', handleClick);
      
      // Сохраняем ссылку на функцию для удаления при размонтировании
      this._mouseClickHandler = handleClick;
    }
    
    // Listen for the beforeinstallprompt event
    window.addEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );

    // Listen for the appinstalled event, indicating Squoosh has been installed.
    window.addEventListener('appinstalled', this.onAppInstalled);

    if (blobAnimImport) {
      blobAnimImport.then((module) => {
        this.setState(
          {
            showBlobSVG: false,
          },
          () => module.startBlobAnim(this.blobCanvas!),
        );
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );
    window.removeEventListener('appinstalled', this.onAppInstalled);
    
    // Удаляем обработчик клика при размонтировании
    if (this.logoContainer && this._mouseClickHandler) {
      this.logoContainer.removeEventListener('click', this._mouseClickHandler);
    }
  }

  // Загрузка настроек цветов из localStorage
  private loadColorSettings = () => {
    if (typeof localStorage !== 'undefined') {
      const bgPrimaryColor = localStorage.getItem('bgPrimaryColor');
      const bgSecondaryColor = localStorage.getItem('bgSecondaryColor');
      const accentColor = localStorage.getItem('accentColor');
      const editorBgColor = localStorage.getItem('editorBgColor');
      const updateWindowColor = localStorage.getItem('updateWindowColor');
      const editorUiColor = localStorage.getItem('editorUiColor');
      
      this.setState({
        bgPrimaryColor: bgPrimaryColor || '#8342e0',
        bgSecondaryColor: bgSecondaryColor || '#ff3385',
        accentColor: accentColor || '#000000',
        editorBgColor: editorBgColor || '#2d1657',
        updateWindowColor: updateWindowColor || '#2d1657',
        editorUiColor: editorUiColor || '#8342e0',
      }, () => {
        document.documentElement.style.setProperty('--editor-bg-color', this.state.editorBgColor);
        document.documentElement.style.setProperty('--update-window-color', this.state.updateWindowColor);
        document.documentElement.style.setProperty('--editor-ui-color', this.state.editorUiColor);
        // Также применяем выбранный цвет как theme для редактора
        document.documentElement.style.setProperty('--main-theme-color', this.state.editorUiColor);
        document.documentElement.style.setProperty('--purple', this.state.editorUiColor);
        document.documentElement.style.setProperty('--deep-purple', this.state.editorUiColor);
        document.documentElement.style.setProperty('--light-purple', this.state.editorUiColor);
        document.documentElement.style.setProperty('--bright-purple', this.state.editorUiColor);
        document.documentElement.style.setProperty('--hot-theme-color', this.state.editorUiColor);
      });
    }
  };
  
  // Сохранение настроек цветов в localStorage
  private saveColorSettings = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bgPrimaryColor', this.state.bgPrimaryColor);
      localStorage.setItem('bgSecondaryColor', this.state.bgSecondaryColor);
      localStorage.setItem('accentColor', this.state.accentColor);
      localStorage.setItem('editorBgColor', this.state.editorBgColor);
      localStorage.setItem('updateWindowColor', this.state.updateWindowColor);
      localStorage.setItem('editorUiColor', this.state.editorUiColor);
      
      document.documentElement.style.setProperty('--editor-bg-color', this.state.editorBgColor);
      document.documentElement.style.setProperty('--update-window-color', this.state.updateWindowColor);
      document.documentElement.style.setProperty('--editor-ui-color', this.state.editorUiColor);
      // Также применяем выбранный цвет как theme для редактора
      document.documentElement.style.setProperty('--main-theme-color', this.state.editorUiColor);
      document.documentElement.style.setProperty('--purple', this.state.editorUiColor);
      document.documentElement.style.setProperty('--deep-purple', this.state.editorUiColor);
      document.documentElement.style.setProperty('--light-purple', this.state.editorUiColor);
      document.documentElement.style.setProperty('--bright-purple', this.state.editorUiColor);
      document.documentElement.style.setProperty('--hot-theme-color', this.state.editorUiColor);
    }
  };
  
  // Переключение отображения панели цветов
  private toggleColorPanel = () => {
    this.setState(prevState => ({
      showColorPanel: !prevState.showColorPanel
    }));
  };
  
  // Обновление первичного цвета фона
  private updatePrimaryColor = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.setState({ bgPrimaryColor: input.value }, this.saveColorSettings);
  };
  
  // Обновление вторичного цвета фона
  private updateSecondaryColor = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.setState({ bgSecondaryColor: input.value }, this.saveColorSettings);
  };
  
  // Обновление цвета акцента
  private updateAccentColor = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.setState({ accentColor: input.value }, this.saveColorSettings);
  };

  // Обновление цвета редактора
  private updateEditorColor = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.setState({ editorBgColor: input.value }, this.saveColorSettings);
  };

  // Обновление цвета окна обновления
  private updateWindowColor = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.setState({ updateWindowColor: input.value }, this.saveColorSettings);
  };

  // Обновление цвета интерфейса редактора
  private updateEditorUiColor = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.setState({ editorUiColor: input.value }, this.saveColorSettings);
  };

  private onFileChange = (event: Event): void => {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    this.fileInput!.value = '';
    this.props.onFile!(file);
  };

  private onOpenClick = () => {
    this.fileInput!.click();
  };

  private onDemoClick = async (index: number, event: Event) => {
    try {
      this.setState({ fetchingDemoIndex: index });
      const demo = demos[index];
      const blob = await fetch(demo.url).then((r) => r.blob());
      const file = new File([blob], demo.filename, { type: blob.type });
      this.props.onFile!(file);
    } catch (err) {
      this.setState({ fetchingDemoIndex: undefined });
      this.props.showSnack!("Couldn't fetch demo image");
    }
  };

  private onBeforeInstallPromptEvent = (event: BeforeInstallPromptEvent) => {
    // Don't show the mini-infobar on mobile
    event.preventDefault();

    // Save the beforeinstallprompt event so it can be called later.
    this.setState({ beforeInstallEvent: event });

    // Log the event.
    const gaEventInfo = {
      eventCategory: 'pwa-install',
      eventAction: 'promo-shown',
      nonInteraction: true,
    };
    ga('send', 'event', gaEventInfo);
  };

  private onInstallClick = async (event: Event) => {
    // Get the deferred beforeinstallprompt event
    const beforeInstallEvent = this.state.beforeInstallEvent;
    // If there's no deferred prompt, bail.
    if (!beforeInstallEvent) return;

    this.installingViaButton = true;

    // Show the browser install prompt
    beforeInstallEvent.prompt();

    // Wait for the user to accept or dismiss the install prompt
    const { outcome } = await beforeInstallEvent.userChoice;
    // Send the analytics data
    const gaEventInfo = {
      eventCategory: 'pwa-install',
      eventAction: 'promo-clicked',
      eventLabel: installButtonSource,
      eventValue: outcome === 'accepted' ? 1 : 0,
    };
    ga('send', 'event', gaEventInfo);

    // If the prompt was dismissed, we aren't going to install via the button.
    if (outcome === 'dismissed') {
      this.installingViaButton = false;
    }
  };

  private onAppInstalled = () => {
    // We don't need the install button, if it's shown
    this.setState({ beforeInstallEvent: undefined });

    // Don't log analytics if page is not visible
    if (document.hidden) return;

    // Try to get the install, if it's not set, use 'browser'
    const source = this.installingViaButton ? installButtonSource : 'browser';
    ga('send', 'event', 'pwa-install', 'installed', source);

    // Clear the install method property
    this.installingViaButton = false;
  };

  private onPasteClick = async () => {
    let clipboardItems: ClipboardItem[];

    try {
      clipboardItems = await navigator.clipboard.read();
    } catch (err) {
      this.props.showSnack!(`No permission to access clipboard`);
      return;
    }

    const blob = await getImageClipboardItem(clipboardItems);

    if (!blob) {
      this.props.showSnack!(`No image found in the clipboard`);
      return;
    }

    this.props.onFile!(new File([blob], 'image.unknown'));
  };

  // Создаем эффект разлетающихся частиц
  private createParticleEffect(container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Количество частиц
    const particles = 20;
    
    for (let i = 0; i < particles; i++) {
      // Создаем элемент частицы
      const particle = document.createElement('div');
      document.body.appendChild(particle);
      
      // Стилизуем частицу
      particle.style.position = 'fixed';
      particle.style.width = `${Math.random() * 10 + 5}px`;
      particle.style.height = particle.style.width;
      particle.style.background = i % 2 === 0 
                                ? 'radial-gradient(circle, rgba(131, 66, 224, 0.8), transparent 70%)' 
                                : 'radial-gradient(circle, rgba(255, 51, 133, 0.8), transparent 70%)';
      particle.style.borderRadius = '50%';
      particle.style.zIndex = '1000';
      particle.style.pointerEvents = 'none';
      
      // Начальное положение в центре логотипа
      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;
      
      // Задаем случайное направление и скорость
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 5 + 3;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      // Анимируем частицу
      let posX = centerX;
      let posY = centerY;
      let opacity = 1;
      let scale = 1;
      
      const animate = () => {
        if (opacity <= 0) {
          particle.remove();
          return;
        }
        
        posX += vx;
        posY += vy;
        opacity -= 0.02;
        scale += 0.03;
        
        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        particle.style.opacity = `${opacity}`;
        particle.style.transform = `scale(${scale})`;
        
        requestAnimationFrame(animate);
      };
      
      requestAnimationFrame(animate);
    }
  }

  render(
    {}: Props,
    { fetchingDemoIndex, beforeInstallEvent, showBlobSVG, showColorPanel, bgPrimaryColor, bgSecondaryColor, accentColor, editorBgColor, updateWindowColor, editorUiColor }: State,
  ) {
    // Создаем динамические стили для фона
    const dynamicStyles = {
      '--primary-color': bgPrimaryColor,
      '--secondary-color': bgSecondaryColor,
      '--accent-color': accentColor,
      '--editor-ui-color': editorUiColor,
    };
    
    return (
      <div class={style.intro} style={dynamicStyles}>
        <input
          class={style.hide}
          ref={linkRef(this, 'fileInput')}
          type="file"
          onChange={this.onFileChange}
        />
        <div class={style.main}>
          {!__PRERENDER__ && (
            <canvas
              ref={linkRef(this, 'blobCanvas')}
              class={style.blobCanvas}
            />
          )}
          <h1 class={style.logoContainer} ref={linkRef(this, 'logoContainer')}>
            <div class={style.logo}>Midnight</div>
          </h1>
          <div class={style.loadImg}>
            {showBlobSVG && (
              <svg
                class={style.blobSvg}
                viewBox="-1.25 -1.25 2.5 2.5"
                preserveAspectRatio="xMidYMid slice"
              >
                {startBlobs.map((points) => (
                  <path
                    d={points
                      .map((point, i) => {
                        const nextI = i === points.length - 1 ? 0 : i + 1;
                        let d = '';
                        if (i === 0) {
                          d += `M${point[2]} ${point[3]}`;
                        }
                        return (
                          d +
                          `C${point[4]} ${point[5]} ${points[nextI][0]} ${points[nextI][1]} ${points[nextI][2]} ${points[nextI][3]}`
                        );
                      })
                      .join('')}
                  />
                ))}
              </svg>
            )}
            <div
              class={style.loadImgContent}
              style={{ visibility: __PRERENDER__ ? 'hidden' : '' }}
            >
              <button class={style.loadBtn} onClick={this.onOpenClick}>
                <svg viewBox="0 0 24 24" class={style.loadIcon}>
                  <path d="M19 7v3h-2V7h-3V5h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5a2 2 0 00-2 2v12c0 1.1.9 2 2 2h12a2 2 0 002-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z" />
                </svg>
                <span>Выбрать изображения</span>
              </button>
              <div class={style.dropText}>
                или перетащите изображения сюда
              </div>
            </div>
            
            <div class={style.floatingOrb1}></div>
            <div class={style.floatingOrb2}></div>
            <div class={style.floatingOrb3}></div>
          </div>
        </div>
        
        {/* Кнопка настройки цветов */}
        <button class={style.colorSettingsBtn} onClick={this.toggleColorPanel}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        </button>
        
        {/* Панель настройки цветов */}
        <div class={`${style.colorPanel} ${showColorPanel ? style.colorPanelOpen : style.colorPanelClosed}`}>
          <div class={style.colorPanelHeader}>
            <h3>Настройка цветов</h3>
            <button class={style.closeBtn} onClick={this.toggleColorPanel}>×</button>
          </div>
          <div class={style.colorControls}>
            <div class={style.colorControl}>
              <label>Основной цвет:</label>
              <div class={style.colorInputGroup}>
                <input 
                  type="color" 
                  value={bgPrimaryColor} 
                  onChange={this.updatePrimaryColor} 
                />
                <input 
                  type="text" 
                  value={bgPrimaryColor} 
                  onChange={this.updatePrimaryColor} 
                />
              </div>
            </div>
            <div class={style.colorControl}>
              <label>Дополнительный цвет:</label>
              <div class={style.colorInputGroup}>
                <input 
                  type="color" 
                  value={bgSecondaryColor} 
                  onChange={this.updateSecondaryColor} 
                />
                <input 
                  type="text" 
                  value={bgSecondaryColor} 
                  onChange={this.updateSecondaryColor} 
                />
              </div>
            </div>
            <div class={style.colorControl}>
              <label>Цвет фона:</label>
              <div class={style.colorInputGroup}>
                <input 
                  type="color" 
                  value={accentColor} 
                  onChange={this.updateAccentColor} 
                />
                <input 
                  type="text" 
                  value={accentColor} 
                  onChange={this.updateAccentColor} 
                />
              </div>
            </div>
            <div class={style.colorControl}>
              <label>Цвет фона редактора:</label>
              <div class={style.colorInputGroup}>
                <input
                  type="color"
                  value={editorBgColor}
                  onChange={this.updateEditorColor}
                />
                <input
                  type="text"
                  value={editorBgColor}
                  onChange={this.updateEditorColor}
                />
              </div>
            </div>
            <div class={style.colorControl}>
              <label>Цвет окна обновления:</label>
              <div class={style.colorInputGroup}>
                <input
                  type="color"
                  value={updateWindowColor}
                  onChange={this.updateWindowColor}
                />
                <input
                  type="text"
                  value={updateWindowColor}
                  onChange={this.updateWindowColor}
                />
              </div>
            </div>
            <div class={style.colorControl}>
              <label>Цвет интерфейса редактора:</label>
              <div class={style.colorInputGroup}>
                <input type="color" value={editorUiColor} onChange={this.updateEditorUiColor} />
                <input type="text" value={editorUiColor} onChange={this.updateEditorUiColor} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Новая надпись внизу страницы */}
        <div class={style.midnightLabel}>
          Midnight plugin v5 image scaling
        </div>
      </div>
    );
  }
}
