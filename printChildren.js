/*
This is a simpleish script that'll print all the child functions (for your viewing pleasure)!
Note: you must be taking an EdReady assessment, as the questionPlayer is only loaded during that time.
*/


// store array
var childFunctions = []
// get amount of "child functions"
var keys = Object.keys(nrocQuestionPlayer);
// only loop for length (prevents console spam)
for (var i = 0; i < keys.length; i++) {
    // only push functions
  if (typeof nrocQuestionPlayer[keys[i]] === 'function') {
    // push to arr
    childFunctions.push(keys[i]);
  }
}
// convert the array to a string
childFunctions = childFunctions.join('\n');
// show results
console.log(childFunctions);



/* All functions:
loadPlayerRoot
loadPlayer
loadQuestion
submitQuestion
getState
getScore
setState
lock
isLocked
isCorrect
showAnswer
retry
disableScrollBars
middleAlignRadioButtons
tabIndexZeroMode
tabIndexNormalMode
setScreenReader
fireMathRenderingCompleteEvent
hideExtraControls
*/