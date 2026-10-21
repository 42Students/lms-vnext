import md5 from "md5";

/** Curated palette of subtle, professional colors for calendar course events. */
const CALENDAR_COURSE_PALETTE = [
  "#5B8DEE", // Soft blue
  "#34C759", // Soft green
  "#AF52DE", // Soft purple
  "#FF9500", // Soft amber
  "#00C7BE", // Soft teal
  "#FF6B6B", // Soft coral
  "#5856D6", // Soft indigo
  "#30B0C7", // Soft cyan
];

/**
 * Returns a subtle, deterministic color for a course from a curated palette.
 * Same course ID/name always gets the same color.
 */
export function getCalendarCourseColor(courseIdOrName) {
  if (courseIdOrName == null || courseIdOrName === "") {
    return CALENDAR_COURSE_PALETTE[0];
  }
  const str = String(courseIdOrName);
  const hash = md5(str);
  const index = parseInt(hash.substring(0, 4), 16) % CALENDAR_COURSE_PALETTE.length;
  return CALENDAR_COURSE_PALETTE[index];
}

// Define a function to generate a hex color code from a string
export default function generateHexColorCodeFromString(str) {
  // Generate an MD5 hash from the input string
  const hash = md5(str);

  // Take the first 6 characters of the hash and convert them to a base-10 number
  const num = parseInt(hash.substring(0, 6), 16);

  // Convert the number to a 6-digit hexadecimal color code
  const hexColorCode = "#" + num.toString(16).padStart(6, "0");
  // let rgbCode = hex2rgb(hexColorCode);
  // console.log(rgbCode);
  return hexColorCode;
}

function hex2rgb(hex_color) {
  var pattern_color = "^#([A-Fa-f0-9]{6})$";
  if (hex_color.match(pattern_color)) {
    var hex_color = hex_color.replace("#", ""),
      r = parseInt(hex_color.substring(0, 2), 16),
      g = parseInt(hex_color.substring(2, 4), 16),
      b = parseInt(hex_color.substring(4, 6), 16);
    return "rgb(" + r + "," + g + "," + b + ",0.2)";
  } else {
    return rgb(245, 205, 20, 0.2);
  }
}

export function dateFormat(inputDate) {
  let date, month, year;

  date = inputDate.getDate();
  month = inputDate.getMonth() + 1;
  year = inputDate.getFullYear();

  date = date.toString().padStart(2, "0");

  month = month.toString().padStart(2, "0");

  return `${month}/${date}/${year}`;
}

export function getFileSizeValidator(sizeInMb, message) {
  return function (_, value) {
    const file = value?.file || value?.originFileObj || value;
    if (!file?.size) {
      return Promise.resolve();
    }
    const isValidSize = file.size / 1024 / 1024 <= sizeInMb;
    if (!isValidSize) {
      return Promise.reject(
        new Error(message || `File must smaller than ${sizeInMb}MB!`)
      );
    }
    return Promise.resolve();
  };
}

function snakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function getAppModuleName(path) {
  return path.slice(path.lastIndexOf("/") + 1);
}
