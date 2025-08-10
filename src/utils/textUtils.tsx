

// Cotrol line breaks
export const insertLineBreak = (name: string | undefined, maxLength: number): string => {
  const results: string[] = [];
  let current = "";
  
  name?.split("").forEach((char) => {
    current += char;
    if (current.length >= maxLength) {
      results.push(current);
      current = "";
    }
  });
  if (current) results.push(current);
  return results.join("\n");
};

// For preventing line breaks in certain characters
export const noBreakDots = (name: string) => {
  //
  return name
    .replace(/・/g, "\u2060・\u2060")
    .replace(/\./g, "\u2060.\u2060")
    .replace(/ー/g, "\u2060ー\u2060");
}

  // For checking if the fighter name is small enough to fit in the button
export const isSmallFont = (name: string | undefined | null) => {
  const maxLength = 6;
  if (!name) return false;

  // Two letters of the alphabet are counted as one letter
  let i = 0;
  let count = 0;
  const isAlpha = (c: string) => /^[a-z]$/.test(c);
  while (i < name.length - 1) {
    if (isAlpha(name[i] ) && isAlpha(name[i + 1])) {
      count++;
      i += 2;
    } else {
      i += 1;
    }
  }
  
  return (name.length - count) >= maxLength;
};