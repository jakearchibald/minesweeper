import { h, Component } from 'preact';

interface State {}

interface Props {}

export default class Game extends Component<Props, State> {
  state: State = {};

  render(props: Props, state: State) {
    return (
      <div>
        <h1>Game</h1>
      </div>
    );
  }
}
