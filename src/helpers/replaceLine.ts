export function replaceLine(
  question,
  answerOne?: string,
  answerTwo?: string,
  answerThree?: string
) {
  const oneLineRegex = /---/;
  const twoLineRegex = /----/;
  const threeLineRegex = /-----/;
  if (answerOne || answerTwo || answerThree) {
    return question
      .replace(oneLineRegex, `<b> ${answerOne}</b>`)
      .replace(twoLineRegex, `<b> ${answerTwo}</b>`)
      .replace(threeLineRegex, `<b> ${answerThree}</b>`);
  } else {
    return question
      .replace(oneLineRegex, " _________")
      .replace(twoLineRegex, " _________")
      .replace(threeLineRegex, " _________");
  }
}
