export const enum State { Pending, Playing, Lost, Won }

export const enum Tag { None, Flag, Mark }

export interface Cell {
  hasMine: boolean;
  tag: Tag;
  revealed: boolean;
  touching: number;
}

function newCell(): Cell {
  return {
    hasMine: false,
    tag: Tag.None,
    revealed: false,
    touching: -1,
  };
}

export default class MinesweeperGame {
  grid: Cell[][];
  startTime = 0;
  endTime = 0;
  private _state = State.Pending;
  private _toReveal = 0;
  private _flags = 0;

  constructor(private _width: number, private _height: number, private _mines: number) {
    if (_mines < 1) {
      throw Error('Invalid number of mines');
    }
    if (_width < 1 || _height < 1) {
      throw Error('Invalid dimensions');
    }
    if (_mines >= _width * _height) {
      throw Error('Number of mines cannot fit in grid');
    }

    this._toReveal = _width * _height - _mines;

    this.grid = Array(_height).fill(undefined).map(() =>
      Array(_width).fill(undefined).map(() => newCell()),
    );
  }

  get state() {
    return this._state;
  }

  get flags() {
    return this._flags;
  }

  private _endGame(state: State.Won | State.Lost) {
    this._state = state;
    this.endTime = Date.now();
  }

  private _placeMines(avoidX: number, avoidY: number) {
    const cells: Cell[] = this.grid.reduce(
      (cells, row) => {
        cells.push(...row);
        return cells;
      },
      [],
    );

    // Remove the cell played.
    cells.splice(avoidY * this._width + avoidX, 1);

    // Place mines in remaining squares
    let minesToPlace = this._mines;

    while (minesToPlace) {
      const index = Math.floor(Math.random() * cells.length);
      const cell = cells[index];
      cells.splice(index, 1);
      cell.hasMine = true;
      minesToPlace -= 1;
    }

    this._state = State.Playing;
  }

  /**
   * This 'avoids' mutating the grid property, so it's easier to identify changes in Preact etc.
   *
   * @param x
   * @param y
   * @param objsCloned Objects that don't need cloning again.
   */
  private _cloneUpwards(x: number, y: number, objsCloned: WeakSet<any>) {
    // Grid
    if (!objsCloned.has(this.grid)) {
      this.grid = this.grid.slice();
      objsCloned.add(this.grid);
    }
    // Row
    if (!objsCloned.has(this.grid[y])) {
      this.grid[y] = this.grid[y].slice();
      objsCloned.add(this.grid[y]);
    }
    // Cell
    if (!objsCloned.has(this.grid[y][x])) {
      this.grid[y][x] = ({ ...this.grid[y][x] });
      objsCloned.add(this.grid[y][x]);
    }
  }

  private *_iterateSurrounding(x: number, y: number): IterableIterator<[number, number]> {
    for (const nextY of [y - 1, y, y + 1]) {
      if (nextY < 0) continue;
      if (nextY >= this._height) continue;

      for (const nextX of [x - 1, x, x + 1]) {
        if (nextX < 0) continue;
        if (nextX >= this._width) continue;
        if (x === nextX && y === nextY) continue;

        yield [nextX, nextY];
      }
    }
  }

  /**
   * @param x
   * @param y
   * @param objsCloned A weakmap to track which objects have already been cloned.
   */
  private _reveal(x: number, y: number) {
    // Cloning the objects, but then just mutating from there on, so this.grid
    // appears to be immutable from the outside.
    // Yeah, bit of a cheat.
    const objsCloned = new WeakSet();

    // The set contains the cell position as if it were a single flat array.
    const revealSet = new Set<number>([x + y * this._width]);

    for (const value of revealSet) {
      const x = value % this._width;
      const y = (value - x) / this._width;

      this._cloneUpwards(x, y, objsCloned);
      const cell = this.grid[y][x];

      if (cell.revealed) throw Error('Cell already revealed');
      cell.revealed = true;

      if (cell.hasMine) {
        this._endGame(State.Lost);
        return;
      }

      this._toReveal -= 1;

      if (this._toReveal === 0) {
        this._endGame(State.Won);
        // Although the game is over, we still continue to calculate the touching value.
      }

      let touching = 0;
      const maybeReveal: number[] = [];

      // Go around the surrounding squares
      for (const [nextX, nextY] of this._iterateSurrounding(x, y)) {
        const nextCell = this.grid[nextY][nextX];

        if (nextCell.hasMine) touching += 1;
        if (nextCell.tag === Tag.Flag) continue;
        maybeReveal.push(nextX + nextY * this._width);
      }

      cell.touching = touching;

      // Don't reveal the surrounding squares if this is touching a mine.
      if (touching !== 0) continue;

      for (const num of maybeReveal) revealSet.add(num);
    }
  }

  reveal(x: number, y: number) {
    if (this._state === State.Pending) {
      this._placeMines(x, y);
      this.startTime = Date.now();
    } else if (this._state !== State.Playing) {
      throw Error('Game is not in a playable state');
    }

    const cell = this.grid[y][x];

    if (cell.tag === Tag.Flag) throw Error('Cell flagged');

    this._reveal(x, y);
  }

  tag(x: number, y: number, tag: Tag) {
    const oldCell = this.grid[y][x];
    if (oldCell.revealed) throw Error('Revealed cell cannot be tagged');
    if (oldCell.tag === tag) return;

    this._cloneUpwards(x, y, new WeakSet());
    const cell = this.grid[y][x];
    cell.tag = tag;

    if (tag === Tag.Flag) {
      this._flags += 1;
    } else if (oldCell.tag === Tag.Flag) {
      this._flags -= 1;
    }
  }

  /**
   * Reveal squares around the point. Returns true if successful.
   */
  attemptSurroundingReveal(x: number, y: number): boolean {
    const cell = this.grid[y][x];
    const maybeReveal: [number, number][] = [];

    if (!cell.revealed) return false;
    if (cell.touching === 0) return false;

    let flagged = 0;

    for (const [nextX, nextY] of this._iterateSurrounding(x, y)) {
      const nextCell = this.grid[nextY][nextX];
      if (nextCell.tag === Tag.Flag) {
        flagged += 1;
        continue;
      }
      maybeReveal.push([nextX, nextY]);
    }

    if (flagged < cell.touching) return false;
    if (maybeReveal.length === 0) return false;

    for (const [nextX, nextY] of maybeReveal) {
      const nextCell = this.grid[nextY][nextX];
      if (nextCell.revealed) continue;
      this._reveal(nextX, nextY);
    }

    return true;
  }
}
