export function allowFigure(e: any) {
  if (e.key === '。') {
    e.key = '.';
  } else if (e.key === 'Backspace' || e.key === '.') {
  } else {
    if (e.key.match(/\D/g)) {
      e.preventDefault();
    }
  }
}
