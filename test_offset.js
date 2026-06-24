const val = parseInt('hello');
console.log(isNaN(val));
console.log(Math.max(0, isNaN(val) ? 0 : val));
