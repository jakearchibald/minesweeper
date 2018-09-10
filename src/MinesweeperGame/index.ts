const enum State { Pending, Playing, Lost, Won }

const enum Tag { None, Flag, Mark }

interface Cell {
  hasBomb: boolean;
  tag: Tag;
  revealed: boolean;
  touching: number;
}

function newCell(): Cell {
  return {
    hasBomb: false,
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

  constructor(private _width: number, private _height: number, private _bombs: number) {
    if (_bombs < 1) {
      throw Error(`Invalid number of bombs`);
    }
    if (_width < 1 || _height < 1) {
      throw Error(`Invalid dimensions`);
    }
    if (_bombs >= _width * _height) {
      throw Error(`Number of bombs cannot fit in grid`);
    }

    this._toReveal = _width * _height - _bombs;

    this.grid = Array(_height).fill(undefined).map(() =>
      Array(_width).fill(undefined).map(() => newCell())
    );
  }

  private _endGame(state: State.Won | State.Lost) {
    this._state = state;
    this.endTime = Date.now();
  }

  private _placeBombs(avoidX: number, avoidY: number) {
    const cells: Cell[] = this.grid.reduce((cells, row) => {
      cells.push(...row);
      return cells;
    }, []);

    // Remove the cell played.
    cells.splice(avoidY * this._width + avoidX, 1);

    // Place bombs in remaining squares
    let bombsToPlace = this._bombs;

    while (bombsToPlace--) {
      const index = Math.floor(Math.random() * cells.length);
      const cell = cells[index];
      cells.splice(index, 1);
      cell.hasBomb = true;
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
      this.grid[y][x] = { ...this.grid[y][x] };
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
  private _reveal(x: number, y: number, objsCloned: WeakSet<any>) {
    // Cloning the objects, but then just mutating from there on, so this.grid
    // appears to be immutable from the outside.
    // Yeah, bit of a hack.
    this._cloneUpwards(x, y, objsCloned);
    const cell = this.grid[y][x];

    cell.revealed = true;

    if (cell.hasBomb) {
      this._endGame(State.Lost);
      return;
    }

    this._toReveal--;

    if (this._toReveal === 0) {
      this._endGame(State.Won);
      // Although the game is over, we still continue to calculate the touching value.
    }

    let touching = 0;
    const maybeReveal: [number, number][] = [];

    // Go around the surrounding squares
    for (const [nextX, nextY] of this._iterateSurrounding(x, y)) {
      const nextCell = this.grid[nextY][nextX];

      if (nextCell.hasBomb) touching++;
      if (nextCell.tag === Tag.Flag || nextCell.revealed) continue;
      maybeReveal.push([nextX, nextY]);
    }

    cell.touching = touching;

    // Don't reveal the surrounding squares if this is touching a bomb.
    if (touching !== 0) return;

    // Reveal the surrounding squares
    for (const [nextX, nextY] of maybeReveal) {
      this._reveal(nextX, nextY, objsCloned);
    }
  }

  reveal(x: number, y: number) {
    if (this._state === State.Pending) {
      this._placeBombs(x, y);
      this.startTime = Date.now();
    } else if (this._state !== State.Playing) {
      throw Error(`Game is not in a playable state`);
    }

    const cell = this.grid[y][x];

    if (cell.revealed) throw Error(`Cell already revealed`);
    if (cell.tag === Tag.Flag) throw Error(`Cell flagged`);

    this._reveal(x, y, new WeakSet());
  }

  tag(x: number, y: number, tag: Tag) {
    const oldCell = this.grid[y][x];
    if (oldCell.revealed) throw Error(`Revealed cell cannot be tagged`);
    if (oldCell.tag === tag) return;

    this._cloneUpwards(x, y, new WeakSet());
    const cell = this.grid[y][x];
    cell.tag = tag;

    if (tag === Tag.Flag) {
      this._flags++;
    } else if (oldCell.tag === Tag.Flag) {
      this._flags--;
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
      if (nextCell.revealed) continue;
      if (nextCell.tag === Tag.Flag) {
        flagged++;
        return;
      }
      maybeReveal.push([nextX, nextY]);
    }

    if (flagged < cell.touching) return false;
    if (maybeReveal.length === 0) return false;

    const objsCloned = new WeakSet();
    for (const [nextX, nextY] of maybeReveal) {
      this._reveal(nextX, nextY, objsCloned);
    }

    return true;
  }
}
