import { h, render, Component } from 'preact';
import Home from './Home';
import { bind } from './util';
import Game from './Game';

interface Props {}

interface State {
  mode: 'home' | 'game';
  width: number;
  height: number;
  mines: number;
}

class App extends Component<Props, State> {
  state: State = {
    mode: 'home',
    width: -1,
    height: -1,
    mines: -1,
  };

  @bind
  onGameSelect(width: number, height: number, mines: number) {
    this.setState({
      width, height, mines,
      mode: 'game',
    });
  }

  render(props: Props, state: State) {
    return (
      state.mode === 'home' ?
        <Home onSelect={this.onGameSelect} />
        :
        <Game />
    );
  }
}

render(<App />, document.body);
