import { h, Component } from 'preact';
import { Cell, Tag } from '../../../MinesweeperGame';
import * as styles from './styles.css';
import { bind } from '../../../util';

interface State {}

interface Props {
  cell: Cell;
  onClick(action: Action): void;
}

interface ItemProps {
  cell: Cell;
  onUnrevealedClick(event: MouseEvent): void;
}

export const enum Action { Reveal, Flag, Unflag, RevealSurrounding }

// tslint:disable-next-line:variable-name
const Item = ({ cell, onUnrevealedClick }: ItemProps) => {
  if (!cell.revealed) {
    return (
      <button
        onClick={onUnrevealedClick}
        class={`${styles.button} ${cell.tag === Tag.Flag ? styles.flagged : ''}`}
      >
        {cell.tag === Tag.Flag ? 'Flagged' : 'Not revealed'}
      </button>
    );
  }
  if (cell.hasMine) {
    return <div class={styles.mine}>Mine</div>;
  }
  if (cell.touching) {
    return <div class={styles.touching}>{cell.touching}</div>;
  }

  return <div class={styles.item}/>;
};

export default class GridCell extends Component<Props, State> {
  shouldComponentUpdate(nextProps: Props) {
    return this.props.cell !== nextProps.cell;
  }

  @bind
  onUnrevealedClick(event: MouseEvent) {
    if (event.shiftKey) {
      this.props.onClick(
        this.props.cell.tag === Tag.Flag ? Action.Unflag : Action.Flag,
      );
      return;
    }

    // Don't allow clicking on flagged squares
    if (this.props.cell.tag === Tag.Flag) return;

    this.props.onClick(Action.Reveal);
  }

  render({ cell }: Props) {
    return (
      <td class={styles.cell}>
        <Item cell={cell} onUnrevealedClick={this.onUnrevealedClick} />
      </td>
    );
  }
}
