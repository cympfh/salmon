function timezone(date) {
  date = new Date('' + date);
  return date.toString();
}

function source_trim(str) {
  if (str.indexOf("<a") == 0) str = str.slice(str.indexOf(">")+1, str.length-4);
  return str;
}

function hash(data) {
  return data.id_str;
}

module.exports = {
  timezone: timezone,
  source_trim: source_trim,
  hash: hash
};
