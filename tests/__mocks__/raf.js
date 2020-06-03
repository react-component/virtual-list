function raf(callback) {
  return setTimeout(callback);
}

raf.cancel = id => {
  clearTimeout(id);
};

export default raf;
