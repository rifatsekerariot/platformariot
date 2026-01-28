function process(obj) {
  const result = {};

  for (const key in obj) {
    const path = key.split(/\.|#/g);
    let curr = result;

    for (let i = 0; i < path.length; i++) {
      const part = path[i];

      if (i === path.length - 1) {
        curr[part] = obj[key];
      } else {
        if (!(part in curr)) {
          curr[part] = {};
        }
        curr = curr[part];
      }
    }
  }

  return result;
}
