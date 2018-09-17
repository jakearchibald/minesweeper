import { h, Component } from 'preact';
import { Cell } from '../../MinesweeperGame';
import GridCell, { Action } from './Cell';

interface State {}

interface Props {
  row: Cell[];
  onClick(x: number, action: Action): void;
}

export default class Row extends Component<Props, State> {
  shouldComponentUpdate(nextProps: Props) {
    return this.props.row !== nextProps.row;
  }

  render({ row, onClick }: Props) {
    return (
      <tr>
        {row.map((cell, i) =>
          <GridCell
            key={i}
            onClick={onClick.bind(this, i)}
            cell={cell}
          />,
        )}
      </tr>
    );
  }
}
