export const convertArrayValuesToNumbers = <T>(values: T[]): number[] => {
  // convert strings to numbers and filter out NaN values
  const numbers = values.map(Number).filter((num) => !isNaN(num));

  // return the numbers array or an empty array if there are no valid numbers
  return numbers.length > 0 ? numbers : [];
};

export const removeDuplicatesFromArrays = <T>(...arrays: T[][]): T[] => {
  // combine all arrays into one and create a Set to remove duplicates
  return [...new Set(arrays.flat())];
};
