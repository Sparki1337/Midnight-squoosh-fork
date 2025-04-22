import { h, Component, Fragment } from 'preact';
import type PinchZoom from './custom-els/PinchZoom';
import type { ScaleToOpts } from './custom-els/PinchZoom';
import './custom-els/PinchZoom';
import './custom-els/TwoUp';
import * as style from './style.css';
import 'add-css:./style.css';
import { shallowEqual, isSafari } from '../../util';
import {
  ToggleAliasingIcon,
  ToggleAliasingActiveIcon,
  ToggleBackgroundIcon,
  AddIcon,
  RemoveIcon,
  ToggleBackgroundActiveIcon,
  RotateIcon,
} from '../../icons';
import { twoUpHandle } from './custom-els/TwoUp/styles.css';
import type { PreprocessorState } from '../../feature-meta';
import { cleanSet } from '../../util/clean-modify';
import type { SourceImage } from '../../Compress';
import { linkRef } from 'shared/prerendered-app/util';
import { drawDataToCanvas } from 'client/lazy-app/util/canvas';

interface Props {
  source?: SourceImage;
  preprocessorState?: PreprocessorState;
  mobileView: boolean;
  leftCompressed?: ImageData;
  rightCompressed?: ImageData;
  leftImgContain: boolean;
  rightImgContain: boolean;
  onPreprocessorChange: (newState: PreprocessorState) => void;
}

interface State {
  scale: number;
  editingScale: boolean;
  altBackground: boolean;
  aliasing: boolean;
  showColorPicker: boolean;
  editorBgColor: string;
}

const scaleToOpts: ScaleToOpts = {
  originX: '50%',
  originY: '50%',
  relativeTo: 'container',
  allowChangeEvent: true,
};

export default class Output extends Component<Props, State> {
  state: State = {
    scale: 1,
    editingScale: false,
    altBackground: false,
    aliasing: false,
    showColorPicker: false,
    editorBgColor: localStorage.getItem('editorBgColor') || '#2d1657',
  };
  canvasLeft?: HTMLCanvasElement;
  canvasRight?: HTMLCanvasElement;
  pinchZoomLeft?: PinchZoom;
  pinchZoomRight?: PinchZoom;
  scaleInput?: HTMLInputElement;
  retargetedEvents = new WeakSet<Event>();
  colorGradientCanvas?: HTMLCanvasElement;

  componentDidMount() {
    const leftDraw = this.leftDrawable();
    const rightDraw = this.rightDrawable();

    // Reset the pinch zoom, which may have an position set from the previous view, after pressing
    // the back button.
    this.pinchZoomLeft!.setTransform({
      allowChangeEvent: true,
      x: 0,
      y: 0,
      scale: 1,
    });

    if (this.canvasLeft && leftDraw) {
      drawDataToCanvas(this.canvasLeft, leftDraw);
    }
    if (this.canvasRight && rightDraw) {
      drawDataToCanvas(this.canvasRight, rightDraw);
    }

    // Применяем цвет фона к документу
    document.documentElement.style.setProperty('--editor-bg-color', this.state.editorBgColor);
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const prevLeftDraw = this.leftDrawable(prevProps);
    const prevRightDraw = this.rightDrawable(prevProps);
    const leftDraw = this.leftDrawable();
    const rightDraw = this.rightDrawable();
    const sourceFileChanged =
      // Has the value become (un)defined?
      !!this.props.source !== !!prevProps.source ||
      // Or has the file changed?
      (this.props.source &&
        prevProps.source &&
        this.props.source.file !== prevProps.source.file);

    const oldSourceData = prevProps.source && prevProps.source.preprocessed;
    const newSourceData = this.props.source && this.props.source.preprocessed;
    const pinchZoom = this.pinchZoomLeft!;

    if (sourceFileChanged) {
      // New image? Reset the pinch-zoom.
      pinchZoom.setTransform({
        allowChangeEvent: true,
        x: 0,
        y: 0,
        scale: 1,
      });
    } else if (
      oldSourceData &&
      newSourceData &&
      oldSourceData !== newSourceData
    ) {
      // Since the pinch zoom transform origin is the top-left of the content, we need to flip
      // things around a bit when the content size changes, so the new content appears as if it were
      // central to the previous content.
      const scaleChange = 1 - pinchZoom.scale;
      const oldXScaleOffset = (oldSourceData.width / 2) * scaleChange;
      const oldYScaleOffset = (oldSourceData.height / 2) * scaleChange;

      pinchZoom.setTransform({
        allowChangeEvent: true,
        x: pinchZoom.x - oldXScaleOffset + oldYScaleOffset,
        y: pinchZoom.y - oldYScaleOffset + oldXScaleOffset,
      });
    }

    if (leftDraw && leftDraw !== prevLeftDraw && this.canvasLeft) {
      drawDataToCanvas(this.canvasLeft, leftDraw);
    }
    if (rightDraw && rightDraw !== prevRightDraw && this.canvasRight) {
      drawDataToCanvas(this.canvasRight, rightDraw);
    }

    // Если открыт выбор цвета и есть canvas элемент или если только что открыли выбор цвета
    if (this.state.showColorPicker && this.colorGradientCanvas && 
        (!prevState.showColorPicker || this.state.showColorPicker !== prevState.showColorPicker)) {
      this.drawColorGradient(this.colorGradientCanvas);
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return (
      !shallowEqual(this.props, nextProps) ||
      !shallowEqual(this.state, nextState)
    );
  }

  private leftDrawable(props: Props = this.props): ImageData | undefined {
    return props.leftCompressed || (props.source && props.source.preprocessed);
  }

  private rightDrawable(props: Props = this.props): ImageData | undefined {
    return props.rightCompressed || (props.source && props.source.preprocessed);
  }

  private toggleAliasing = () => {
    this.setState((state) => ({
      aliasing: !state.aliasing,
    }));
  };

  private toggleBackground = () => {
    this.setState({
      altBackground: !this.state.altBackground,
    });
  };

  private zoomIn = () => {
    if (!this.pinchZoomLeft) throw Error('Missing pinch-zoom element');
    this.pinchZoomLeft.scaleTo(this.state.scale * 1.25, scaleToOpts);
  };

  private zoomOut = () => {
    if (!this.pinchZoomLeft) throw Error('Missing pinch-zoom element');
    this.pinchZoomLeft.scaleTo(this.state.scale / 1.25, scaleToOpts);
  };

  private onRotateClick = () => {
    const { preprocessorState: inputProcessorState } = this.props;
    if (!inputProcessorState) return;

    const newState = cleanSet(
      inputProcessorState,
      'rotate.rotate',
      (inputProcessorState.rotate.rotate + 90) % 360,
    );

    this.props.onPreprocessorChange(newState);
  };

  private onScaleValueFocus = () => {
    this.setState({ editingScale: true }, () => {
      if (this.scaleInput) {
        // Firefox unfocuses the input straight away unless I force a style
        // calculation here. I have no idea why, but it's late and I'm quite
        // tired.
        getComputedStyle(this.scaleInput).transform;
        this.scaleInput.focus();
      }
    });
  };

  private onScaleInputBlur = () => {
    this.setState({ editingScale: false });
  };

  private onScaleInputChanged = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const percent = parseFloat(target.value);
    if (isNaN(percent)) return;
    if (!this.pinchZoomLeft) throw Error('Missing pinch-zoom element');

    this.pinchZoomLeft.scaleTo(percent / 100, scaleToOpts);
  };

  private onPinchZoomLeftChange = (event: Event) => {
    if (!this.pinchZoomRight || !this.pinchZoomLeft) {
      throw Error('Missing pinch-zoom element');
    }
    this.setState({
      scale: this.pinchZoomLeft.scale,
    });
    this.pinchZoomRight.setTransform({
      scale: this.pinchZoomLeft.scale,
      x: this.pinchZoomLeft.x,
      y: this.pinchZoomLeft.y,
    });
  };

  /**
   * We're using two pinch zoom elements, but we want them to stay in sync. When one moves, we
   * update the position of the other. However, this is tricky when it comes to multi-touch, when
   * one finger is on one pinch-zoom, and the other finger is on the other. To overcome this, we
   * redirect all relevant pointer/touch/mouse events to the first pinch zoom element.
   *
   * @param event Event to redirect
   */
  private onRetargetableEvent = (event: Event) => {
    const targetEl = event.target as HTMLElement;
    if (!this.pinchZoomLeft) throw Error('Missing pinch-zoom element');
    // If the event is on the handle of the two-up, let it through,
    // unless it's a wheel event, in which case always let it through.
    if (event.type !== 'wheel' && targetEl.closest(`.${twoUpHandle}`)) return;
    // If we've already retargeted this event, let it through.
    if (this.retargetedEvents.has(event)) return;
    // Stop the event in its tracks.
    event.stopImmediatePropagation();
    event.preventDefault();
    // Clone the event & dispatch
    // Some TypeScript trickery needed due to https://github.com/Microsoft/TypeScript/issues/3841
    const clonedEvent = new (event.constructor as typeof Event)(
      event.type,
      event,
    );
    this.retargetedEvents.add(clonedEvent);
    this.pinchZoomLeft.dispatchEvent(clonedEvent);

    // Unfocus any active element on touchend. This fixes an issue on (at least) Android Chrome,
    // where the software keyboard is hidden, but the input remains focused, then after interaction
    // with this element the keyboard reappears for NO GOOD REASON. Thanks Android.
    if (
      event.type === 'touchend' &&
      document.activeElement &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }
  };

  private toggleColorPicker = () => {
    this.setState(prevState => ({
      showColorPicker: !prevState.showColorPicker
    }));
    // Добавим лог для отладки
    console.log('Color picker toggled:', !this.state.showColorPicker);
  };
  
  private updateEditorColor = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const newColor = input.value;
    
    this.setState({ editorBgColor: newColor }, () => {
      // Сохраняем цвет в localStorage
      localStorage.setItem('editorBgColor', newColor);
      
      // Применяем новый цвет к документу
      document.documentElement.style.setProperty('--editor-bg-color', newColor);
    });
  };

  // Обработчик для клика по градиенту
  private handleGradientClick = (event: MouseEvent) => {
    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Получаем цвет из координат клика
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    
    // Преобразуем в hex
    const hexColor = '#' + 
      r.toString(16).padStart(2, '0') + 
      g.toString(16).padStart(2, '0') + 
      b.toString(16).padStart(2, '0');
    
    this.setState({ editorBgColor: hexColor }, () => {
      localStorage.setItem('editorBgColor', hexColor);
      document.documentElement.style.setProperty('--editor-bg-color', hexColor);
    });
  };

  // Метод для отрисовки градиента
  private drawColorGradient = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Получаем текущий цвет
    const hexColor = this.state.editorBgColor;
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const currentColor = `rgb(${r}, ${g}, ${b})`;
    
    // Создаем градиент оттенков (rainbow)
    const rainbowGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    rainbowGradient.addColorStop(0, 'rgb(255, 0, 0)');      // Красный
    rainbowGradient.addColorStop(1/6, 'rgb(255, 255, 0)');  // Желтый
    rainbowGradient.addColorStop(2/6, 'rgb(0, 255, 0)');    // Зеленый
    rainbowGradient.addColorStop(3/6, 'rgb(0, 255, 255)');  // Голубой
    rainbowGradient.addColorStop(4/6, 'rgb(0, 0, 255)');    // Синий
    rainbowGradient.addColorStop(5/6, 'rgb(255, 0, 255)');  // Фиолетовый
    rainbowGradient.addColorStop(1, 'rgb(255, 0, 0)');      // Красный

    // Отрисовываем радужный градиент
    ctx.fillStyle = rainbowGradient;
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    // Градиент от черного до выбранного цвета
    const blackToColorGradient = ctx.createLinearGradient(0, 0, 0, canvas.height - 20);
    blackToColorGradient.addColorStop(0, '#000');
    blackToColorGradient.addColorStop(1, currentColor);
    
    // Градиент от прозрачного белого к белому
    const transparentToWhiteGradient = ctx.createLinearGradient(canvas.width, 0, 0, 0);
    transparentToWhiteGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    transparentToWhiteGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Рисуем градиент от черного к цвету
    ctx.fillStyle = blackToColorGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height - 20);
    
    // Рисуем градиент от прозрачного к белому
    ctx.fillStyle = transparentToWhiteGradient;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillRect(0, 0, canvas.width, canvas.height - 20);
    ctx.globalCompositeOperation = 'source-over';
  };

  private updateRGBValue = (event: Event, channel: 'r' | 'g' | 'b') => {
    const input = event.target as HTMLInputElement;
    let value = parseInt(input.value);
    
    // Проверка валидности значения
    if (isNaN(value)) value = 0;
    if (value < 0) value = 0;
    if (value > 255) value = 255;
    
    // Получить текущие RGB значения
    const hexColor = this.state.editorBgColor;
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Обновить соответствующий канал
    let newR = r, newG = g, newB = b;
    if (channel === 'r') newR = value;
    if (channel === 'g') newG = value;
    if (channel === 'b') newB = value;
    
    // Преобразовать обратно в hex формат
    const newColor = '#' + 
      newR.toString(16).padStart(2, '0') + 
      newG.toString(16).padStart(2, '0') + 
      newB.toString(16).padStart(2, '0');
    
    this.setState({ editorBgColor: newColor }, () => {
      localStorage.setItem('editorBgColor', newColor);
      document.documentElement.style.setProperty('--editor-bg-color', newColor);
    });
  };

  // Обработчик для клика по полоске радужного спектра
  private handleSpectrumClick = (event: MouseEvent) => {
    const target = event.target as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const ratio = x / rect.width;
    
    // Получаем цвет из спектра
    let r, g, b;
    if (ratio <= 1/6) {
      // красный -> желтый
      r = 255;
      g = Math.round(255 * 6 * ratio);
      b = 0;
    } else if (ratio <= 2/6) {
      // желтый -> зеленый
      r = Math.round(255 * (2 - 6 * ratio));
      g = 255;
      b = 0;
    } else if (ratio <= 3/6) {
      // зеленый -> голубой
      r = 0;
      g = 255;
      b = Math.round(255 * (6 * ratio - 2));
    } else if (ratio <= 4/6) {
      // голубой -> синий
      r = 0;
      g = Math.round(255 * (4 - 6 * ratio));
      b = 255;
    } else if (ratio <= 5/6) {
      // синий -> фиолетовый
      r = Math.round(255 * (6 * ratio - 4));
      g = 0;
      b = 255;
    } else {
      // фиолетовый -> красный
      r = 255;
      g = 0;
      b = Math.round(255 * (6 - 6 * ratio));
    }
    
    // Преобразуем в hex
    const hexColor = '#' + 
      r.toString(16).padStart(2, '0') + 
      g.toString(16).padStart(2, '0') + 
      b.toString(16).padStart(2, '0');
    
    this.setState({ editorBgColor: hexColor }, () => {
      localStorage.setItem('editorBgColor', hexColor);
      document.documentElement.style.setProperty('--editor-bg-color', hexColor);
      
      // Перерисовываем градиент основной палитры
      if (this.colorGradientCanvas) {
        this.drawColorGradient(this.colorGradientCanvas);
      }
    });
  };

  render(
    { mobileView, leftImgContain, rightImgContain, source }: Props,
    { scale, editingScale, altBackground, aliasing, showColorPicker, editorBgColor }: State,
  ) {
    const leftDraw = this.leftDrawable();
    const rightDraw = this.rightDrawable();
    // To keep position stable, the output is put in a square using the longest dimension.
    const originalImage = source && source.preprocessed;

    return (
      <Fragment>
        <div
          class={`${style.output} ${altBackground ? style.altBackground : ''}`}
          style={{ '--editor-bg-color': editorBgColor } as any}
        >
          <two-up
            legacy-clip-compat
            class={style.twoUp}
            orientation={mobileView ? 'vertical' : 'horizontal'}
            // Event redirecting. See onRetargetableEvent.
            onTouchStartCapture={this.onRetargetableEvent}
            onTouchEndCapture={this.onRetargetableEvent}
            onTouchMoveCapture={this.onRetargetableEvent}
            onPointerDownCapture={
              // We avoid pointer events in our PinchZoom due to a Safari bug.
              // That means we also need to avoid them here too, else we end up preventing the fallback mouse events.
              isSafari ? undefined : this.onRetargetableEvent
            }
            onMouseDownCapture={this.onRetargetableEvent}
            onWheelCapture={this.onRetargetableEvent}
          >
            <pinch-zoom
              class={style.pinchZoom}
              onChange={this.onPinchZoomLeftChange}
              ref={linkRef(this, 'pinchZoomLeft')}
            >
              <canvas
                class={`${style.pinchTarget} ${
                  aliasing ? style.pixelated : ''
                }`}
                ref={linkRef(this, 'canvasLeft')}
                width={leftDraw && leftDraw.width}
                height={leftDraw && leftDraw.height}
                style={{
                  width: originalImage ? originalImage.width : '',
                  height: originalImage ? originalImage.height : '',
                  objectFit: leftImgContain ? 'contain' : '',
                }}
              />
            </pinch-zoom>
            <pinch-zoom
              class={style.pinchZoom}
              ref={linkRef(this, 'pinchZoomRight')}
            >
              <canvas
                class={`${style.pinchTarget} ${
                  aliasing ? style.pixelated : ''
                }`}
                ref={linkRef(this, 'canvasRight')}
                width={rightDraw && rightDraw.width}
                height={rightDraw && rightDraw.height}
                style={{
                  width: originalImage ? originalImage.width : '',
                  height: originalImage ? originalImage.height : '',
                  objectFit: rightImgContain ? 'contain' : '',
                }}
              />
            </pinch-zoom>
          </two-up>
        </div>
        <div class={style.controls}>
          <div class={style.buttonGroup}>
            <button class={style.firstButton} onClick={this.zoomOut}>
              <RemoveIcon />
            </button>
            {editingScale ? (
              <input
                type="number"
                step="1"
                min="1"
                max="1000000"
                ref={linkRef(this, 'scaleInput')}
                class={style.zoom}
                value={Math.round(scale * 100)}
                onInput={this.onScaleInputChanged}
                onBlur={this.onScaleInputBlur}
              />
            ) : (
              <span
                class={style.zoom}
                tabIndex={0}
                onFocus={this.onScaleValueFocus}
              >
                <span class={style.zoomValue}>{Math.round(scale * 100)}</span>%
              </span>
            )}
            <button class={style.lastButton} onClick={this.zoomIn}>
              <AddIcon />
            </button>
          </div>
          <div class={style.buttonGroup}>
            <button
              class={style.firstButton}
              onClick={this.onRotateClick}
              title="Повернуть"
            >
              <RotateIcon />
            </button>
            {!isSafari && (
              <button
                class={style.button}
                onClick={this.toggleAliasing}
                title="Переключить сглаживание"
              >
                {aliasing ? (
                  <ToggleAliasingActiveIcon />
                ) : (
                  <ToggleAliasingIcon />
                )}
              </button>
            )}
            <button
              class={style.lastButton}
              onClick={this.toggleBackground}
              title="Переключить фон"
            >
              {altBackground ? (
                <ToggleBackgroundActiveIcon />
              ) : (
                <ToggleBackgroundIcon />
              )}
            </button>
          </div>
        </div>
      </Fragment>
    );
  }
}
