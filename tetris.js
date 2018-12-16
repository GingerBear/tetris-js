/**
 * shapes:
 *
 * 0.   1.    2.    3.     4.
 * ##   ####  ##    ###     ##
 * ##          ##    #     ##
 *
 *
 */

const initialState = {
  width: 20, // px
  height: 40,
  score: 0,
  currentPosition: [0, 0],
  currentShape: null, // 0,1,2,3,4,
  currentShapeOrientation: 0, // 0,1,2,3
  baseShape: [] // [[0, 79], [1, 79], [2, 79], [3, 79]]
};

let state = JSON.parse(JSON.stringify(initialState));
let speed = 300;
let pixelSize = 10;
let timer = null;
let skip = false;
let pixelDOMMap = [];
let possibleShapes = [0, 4];

if (module.hot) {
  module.hot.dispose(function() {
    clearInterval(timer);
  });
}

start();

function start() {
  timer = setInterval(() => {
    if (skip) {
      skip = false;
      return;
    }
    state = next(state);
    render(state);
  }, speed);

  bindKeyboardEvent();
}

function next(state) {
  const nextState = { ...state };
  nextState.currentPosition = [...nextState.currentPosition];

  if (nextState.currentShape === null) {
    nextState.currentPosition[0] = 8;
    nextState.currentShape = getRandomInt.apply(null, possibleShapes);
    nextState.currentShapeOrientation = getRandomInt(0, 3);
  } else {
    nextState.currentPosition[1] = state.currentPosition[1] + 1;
    tryStackShapes(nextState, state);
  }

  return nextState;
}

function render(state) {
  const pixelMap = layout(state);
  document.querySelector('.score').textContent = state.score;
  paintHTML(pixelMap);
  // paintConsole(pixelMap);
}

function layout({
  width,
  height,
  baseShape,
  currentPosition,
  currentShape,
  currentShapeOrientation
}) {
  const currentShapePixel = shiftPixel(
    getShapePixel(currentShape, currentShapeOrientation),
    currentPosition
  );

  if (!currentShapePixel) {
    return [];
  }

  return arr(height).map((_, row) => {
    return arr(width).map((_, column) => {
      const isInBaseShape = !!baseShape.find(([x, y]) => x === column && y === row);
      const isInCurrentShap = !!currentShapePixel.find(([x, y]) => x === column && y === row);
      const isFilled = isInBaseShape || isInCurrentShap;

      return isFilled;
    });
  });
}

function paintHTML(pixelMap) {
  if (!document.querySelector('.canvas').innerHTML) {
    document.querySelector('.canvas').innerHTML = pixelMap
      .map((row, y) => {
        return row
          .map((column, x) => {
            return `<span
            class="pixel ${column ? 'filled' : ''}"
            data-x="${x}"
            data-y="${y}"
            style="transform: translate(${pixelSize * x}px, ${pixelSize * y}px);"
          ></span>`;
          })
          .join('');
      })
      .join('');

    pixelDOMMap = pixelMap.map((row, y) => {
      return row.map((_, x) => {
        return document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
      });
    });
  } else {
    pixelMap.map((row, y) => {
      return row.map((column, x) => {
        const classList = pixelDOMMap[y][x].classList;
        if (column && !classList.contains('filled')) {
          classList.add('filled');
        } else if (!column && classList.contains('filled')) {
          classList.remove('filled');
        }
      });
    });
  }
}

function paintConsole(pixelMap) {
  console.clear();
  console.log(pixelMap.map(row => row.map(r => (r ? '■' : '□')).join(' ')).join('\n'));
}

function getShapePixel(shape, shapeOrientation) {
  if (shape === 0) {
    return [[0, 0], [1, 1], [1, 0], [0, 1]];
  }
  if (shape === 1) {
    if (shapeOrientation === 0 || shapeOrientation === 2) {
      return [[0, 0], [1, 0], [2, 0], [3, 0]];
    } else {
      return [[0, 0], [0, 1], [0, 2], [0, 3]];
    }
  }
  if (shape === 2) {
    if (shapeOrientation === 0 || shapeOrientation === 2) {
      return [[0, 0], [1, 0], [1, 1], [2, 1]];
    } else {
      return [[1, 0], [0, 1], [1, 1], [0, 2]];
    }
  }
  if (shape === 3) {
    if (shapeOrientation === 0) {
      return [[0, 0], [1, 0], [2, 0], [1, 1]];
    } else if (shapeOrientation === 1) {
      return [[0, 1], [1, 0], [1, 1], [1, 2]];
    } else if (shapeOrientation === 2) {
      return [[1, 0], [0, 1], [1, 1], [2, 1]];
    } else {
      return [[2, 1], [1, 0], [1, 1], [1, 2]];
    }
  }
  if (shape === 4) {
    if (shapeOrientation === 0 || shapeOrientation === 2) {
      return [[1, 0], [2, 0], [0, 1], [1, 1]];
    } else {
      return [[0, 0], [0, 1], [1, 1], [1, 2]];
    }
  }
}

function shiftPixel(pixels, shiftPixel) {
  return pixels && pixels.map(p => [p[0] + shiftPixel[0], p[1] + shiftPixel[1]]);
}

function arr(len) {
  return [...new Array(len)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function collapse({ currentPosition, currentShape, currentShapeOrientation, baseShape, height }) {
  const currentShapePixel = shiftPixel(
    getShapePixel(currentShape, currentShapeOrientation),
    currentPosition
  );

  if (!currentShapePixel) {
    return false;
  }

  const isTouchBottom = Math.max.apply(null, currentShapePixel.map(p => p[1])) > height - 1;

  const collapseWithBaseShape = !!baseShape.find(bs => {
    return !!currentShapePixel.find(cs => cs[0] === bs[0] && cs[1] === bs[1]);
  });

  if (isTouchBottom || collapseWithBaseShape) {
    return true;
  } else {
    return false;
  }
}

function bindKeyboardEvent() {
  document.addEventListener('keydown', e => {
    handleKeyBoardInput(e);
  });
}

function handleKeyBoardInput(e) {
  const nextState = { ...state };
  nextState.currentPosition = [...nextState.currentPosition];

  if (e.keyCode === 38) {
    // up
    nextState.currentShapeOrientation = nextState.currentShapeOrientation + 1;
    if (nextState.currentShapeOrientation === 4) {
      nextState.currentShapeOrientation = 0;
    }
    if (invalidMove(nextState)) {
      nextState.currentShapeOrientation = state.currentShapeOrientation;
    }
  } else if (e.keyCode === 37) {
    // left
    nextState.currentPosition[0] = nextState.currentPosition[0] - 1;
    if (invalidMove(nextState)) {
      nextState.currentPosition[0] = state.currentPosition[0];
    }
  } else if (e.keyCode === 39) {
    // right
    nextState.currentPosition[0] = nextState.currentPosition[0] + 1;
    if (invalidMove(nextState)) {
      nextState.currentPosition[0] = state.currentPosition[0];
    }
  } else if (e.keyCode === 40) {
    // down
    nextState.currentPosition[1] = nextState.currentPosition[1] + 1;
    tryStackShapes(nextState, state);
  }

  skip = true;
  state = nextState;
  render(nextState);
}

function invalidMove(state) {
  const overLeft = state.currentPosition[0] < 0;
  const overRight =
    state.currentPosition[0] + getWidthByShape(state.currentShape, state.currentShapeOrientation) >
    state.width;
  return collapse(state) || overLeft || overRight;
}

function tryStackShapes(nextState, prevState) {
  if (collapse(nextState)) {
    nextState.baseShape = [
      ...nextState.baseShape,
      ...shiftPixel(
        getShapePixel(prevState.currentShape, prevState.currentShapeOrientation),
        prevState.currentPosition
      )
    ];

    removeFilledLines(nextState);

    nextState.currentPosition = [8, 0];
    nextState.currentShape = getRandomInt.apply(null, possibleShapes);
    nextState.currentShapeOrientation = getRandomInt(0, 3);
  }
}

function getWidthByShape(shape, orientation) {
  if (shape === 0) {
    return 2;
  } else if (shape === 1) {
    if (orientation === 1 || orientation === 3) {
      return 1;
    } else {
      return 4;
    }
  } else if (shape === 2) {
    if (orientation === 0 || orientation === 2) {
      return 3;
    } else {
      return 2;
    }
  } else if (shape === 3) {
    if (orientation === 0 || orientation === 2) {
      return 3;
    } else {
      return 2;
    }
  } else {
    if (orientation === 0 || orientation === 2) {
      return 3;
    } else {
      return 2;
    }
  }
}

function getFilledLines(width, baseShape) {
  const mostBottom = Math.max.apply(null, baseShape.map(p => p[1]));
  const mostTop = Math.min.apply(null, baseShape.map(p => p[1]));
  const filledLines = [];

  for (let i = mostTop; i <= mostBottom; i++) {
    const pointsOfCurrentLine = baseShape.filter(s => s[1] === i).map(s => s[0]);
    const uniquePointsOfCurrentLine = uniqeArr(pointsOfCurrentLine);
    if (uniquePointsOfCurrentLine.length === width) {
      filledLines.push(i);
    }
  }

  return filledLines;
}

function uniqeArr(arr) {
  const _arr = [];
  arr.forEach(i => {
    if (_arr.indexOf(i) === -1) {
      _arr.push(i);
    }
  });

  return _arr;
}

function removeFilledLines(state) {
  const filledLines = getFilledLines(state.width, state.baseShape);
  const toShiftMap = {};
  filledLines.forEach(lineIndex => {
    state.baseShape = state.baseShape.filter(s => s[1] !== lineIndex);
  });
  filledLines.forEach(lineIndex => {
    state.baseShape.forEach(s => {
      if (s[1] < lineIndex) {
        toShiftMap[`${s[0]},${s[1]}`] = toShiftMap[`${s[0]},${s[1]}`] || 0;
        toShiftMap[`${s[0]},${s[1]}`]++;
      }
    });
  });

  Object.keys(toShiftMap).forEach(k => {
    const split = k.split(',');
    const p0 = +split[0];
    const p1 = +split[1];
    state.baseShape.forEach(s => {
      if (s[0] === p0 && s[1] === p1) {
        s[1] + toShiftMap[k];
      }
    });
  });

  state.baseShape.forEach(s => {
    if (toShiftMap[`${s[0]},${s[1]}`]) {
      s[1] = s[1] + toShiftMap[`${s[0]},${s[1]}`];
    }
  });

  state.score = state.score + filledLines.length;
}
