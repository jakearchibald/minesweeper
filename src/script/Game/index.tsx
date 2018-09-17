import { h, Component } from 'preact';
import MinesweeperGame, { State as GameState, Cell, Tag } from '../MinesweeperGame';
import * as styles from './styles.css';
import Row from './Row';
import { Action } from './Row/Cell';

interface State {
  grid: Cell[][];
  flags: number;
}

interface Props {
  width: number;
  height: number;
  mines: number;
}

export default class Game extends Component<Props, State> {
  state: State;
  game: MinesweeperGame;

  constructor(props: Props) {
    super();
    const { width, height, mines } = props;
    this.game = new MinesweeperGame(width, height, mines);
    this.state = {
      grid: this.game.grid,
      flags: this.game.flags,
    };
  }

  onItemClick(x: number, y: number, action: Action) {
    switch (action) {
      case Action.Flag:
        this.game.tag(x, y, Tag.Flag);
        break;
      case Action.Unflag:
        this.game.tag(x, y, Tag.None);
        break;
      case Action.Reveal:
        this.game.reveal(x, y);
        break;
    }

    this.setState({
      grid: this.game.grid,
      flags: this.game.flags,
    });
  }

  render(props: Props, state: State) {
    return (
      <div>
        <h1>Game</h1>
        <p>To flag: {props.mines - state.flags}</p>
        <table class={styles.grid}>
          {this.game.grid.map((row, i) =>
            // tslint:disable-next-line:jsx-no-lambda
            <Row key={i} row={row} onClick={(x, action) => this.onItemClick(x, i, action)}  />,
          )}
        </table>
        <p>
          {
            this.game.state === GameState.Pending ? 'Pending' :
            this.game.state === GameState.Playing ? 'Playing' :
            this.game.state === GameState.Won ? 'Won' :
            'Lost'
          }
        </p>
      </div>
    );
  }
}
