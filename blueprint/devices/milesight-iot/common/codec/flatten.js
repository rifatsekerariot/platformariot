
function process(obj) {
  const result = {};
  const shouldBeFlatten = (o) => typeof o === 'object'
    && o !== null
    && Object.keys(o).length > 0
    && !Array.isArray(o);

  function flattenSub(subObj, prefix) {
    if (prefix && Object.keys(subObj).length === 0 && !Array.isArray(subObj)) {
      return;
    }

    for (const k in subObj) {
      const newPrefix = prefix ? prefix + (prefix.includes('.') ? '#' : '.') + k : k;
      if (shouldBeFlatten(subObj[k])) {
        flattenSub(subObj[k], newPrefix);
      } else {
        result[newPrefix] = subObj[k];
      }
    }
  }

  for (const key in obj) {
    if (shouldBeFlatten(obj[key])) {
      flattenSub(obj[key], key);
    } else {
      result[key] = obj[key];
    }
  }

  return result;
}