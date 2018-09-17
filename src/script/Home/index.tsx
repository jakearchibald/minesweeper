import { h, Component } from 'preact';
import { bind } from '../util';

const presets = {
  beginner: { width: 8, height: 8, mines: 10 },
  advanced: { width: 16, height: 16, mines: 40 },
  expert: { width: 24, height: 24, mines: 99 },
};

type PresetName = keyof typeof presets;

interface State {
  presetName: PresetName | 'custom';
  width: number;
  height: number;
  mines: number;
}

interface Props {
  onSelect(width: number, height: number, mines: number): void;
}

export default class Home extends Component<Props, State> {
  state: State = {
    presetName: 'beginner',
    width: presets['beginner'].width,
    height: presets['beginner'].height,
    mines: presets['beginner'].mines,
  };

  presetSelect?: HTMLSelectElement;
  widthInput?: HTMLInputElement;
  heightInput?: HTMLInputElement;
  minesInput?: HTMLInputElement;

  @bind
  onSelectChange() {
    const presetName = this.presetSelect!.value as PresetName | 'custom';

    if (presetName === 'custom') {
      this.setState({ presetName });
      return;
    }

    const preset = presets[presetName];

    this.setState({
      presetName,
      width: preset.width,
      height: preset.height,
      mines: preset.mines,
    });
  }

  @bind
  onSettingInput(event: Event) {
    // Only want to listen to the number inputs
    if (event.target === this.presetSelect) return;

    const width = this.widthInput!.valueAsNumber;
    const height = this.heightInput!.valueAsNumber;
    const mines = this.minesInput!.valueAsNumber;

    for (const [presetName, preset] of Object.entries(presets)) {
      if (width === preset.width && height === preset.height && mines === preset.mines) {
        this.setState({
          presetName: presetName as PresetName,
          width: preset.width,
          height: preset.height,
          mines: preset.mines,
        });
        return;
      }
    }

    this.setState({ width, height, mines, presetName: 'custom' });
  }

  @bind
  onSubmit(event: Event) {
    event.preventDefault();
    const { width, height, mines } = this.state;
    this.props.onSelect(width, height, mines);
  }

  render(props: Props, state: State) {
    return (
      <div>
        <h1>New game</h1>
        <form onSubmit={this.onSubmit}>
          <div>
            <label>
              Preset:
              <select
                ref={el => this.presetSelect = el}
                onChange={this.onSelectChange}
                value={state.presetName}
              >
                <option value="beginner">Beginner</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
                <option value="custom">Custom</option>
              </select>
            </label>
          </div>
          <div onInput={this.onSettingInput}>
            <div>
              <label>
                Width:
                <input
                  min="1"
                  type="number"
                  ref={el => this.widthInput = el}
                  value={state.width}
                />
              </label>
            </div>
            <div>
              <label>
                Height:
                <input
                  min="1"
                  type="number"
                  ref={el => this.heightInput = el}
                  value={state.height}
                />
              </label>
            </div>
            <div>
              <label>
                Mines:
                <input
                  min="1"
                  max={state.width * state.height - 1}
                  type="number"
                  ref={el => this.minesInput = el}
                  value={state.mines}
                />
              </label>
            </div>
          </div>
          <div>
            <button type="submit">Go!</button>
          </div>
        </form>
      </div>
    );
  }
}
