# EdReady.. and it's very terrible security..

> [!WARNING]
> There is no issue that can leak user data, credentials, etc. This purely contains information that allows somebody to bypass the whole point of EdReady (that is, to *prepare* students). Also note this was written quite awhile ago, although these issues should still be prevelant (based on talking to friends who are in High School). I decided to publish this now as I don't use EdReady anymore, so I don't have a use for "hoarding" this.

> [!NOTE]
> When I reference "vulns", I more so mean "lapses".

This is a small writeup about NROCPortal, EdReady, whatever you'd like to call it.

If you are looking for the "source code" I am referencing, you can find it [here](https://github.com/million1156/EdReady/blob/main/src.js).

For the way I was able to determine all possible `nrocQuestionPlayer` "child functions", you can view [printChildren.js](https://github.com/million1156/EdReady/blob/main/printChildren.js).

Enjoy! :)


## What even is that..?
[EdReady](https://get.edready.org) (or NROCPortal) is a platform that allows educators to "quiz" students in multiple subjects (such as Reading and Math). Think of it similar to [Eduphoria](https://eduphoria.net), where it's more of an "assessment" for future readiness. For example, I've taken this before for TSI exemption (TSI is sort of like a PSAT/SAT, but *different*. blame the education system xd).

## Okay, but what's the issue?

EdReady has a multitude of vulns, however, only 1 of them were tested, the other examples here are purely theoretical. The first one is suprisingly simple.

### Part 1: The tales of nrocQuestionPlayer..
EdReady has a sort of "framework" called "nrocQuestionPlayer" that is hardcoded into the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model). This has many different functions, such as "loadQuestion", "loadPlayer", "submitQuestion", and "getState", but none of these are vulnerable. It's actually ["showAnswer"](https://github.com/million1156/EdReady/blob/main/src.js#L326)! If it wasn't obvious, this, well, shows the answer to the "player" (aka client). However, this performs **0** checks **at all**, meaning you can easily have the answer given to you, and it not counted wrong, nor does it take any points away from you. 


The interesting part about this is that the client itself *tries* to do authentication, but this is very easily bypassed by calling the function directly instead:
```js
function provideAnswerFeedback() {
    keepAliveAssessment();
    // Tries to make sure it's already been answered..
    if (hasBeenAnswered) {

        getAnswerDetails();
        // But by calling this directly, the check above is bypassed!
        nrocQuestionPlayer.showAnswer(); 
        /* misc code... */
}
}
// By calling showAnswer, we can highlight the correct answer :)
nrocQuestionPlayer.showAnswer();
```

Therefore, by calling `nrocQuestionPlayer.showAnswer();`, you're able to easily call this function, have the answer highlighted, click on the right answer, and both the client and the server count your answer as correct, therefore allowing you to cheat exam(s).

### Part 2: We love email! Right..?
This and the next one(s) are purely theoretical as said above, so please keep that in mind :)

This has to do again with the client-sided code, but this time, it has to do with "progess emails". 

Essentially, EdReady will occasionally send both the instructor & student "progress" emails intended to inform both parties about the student's progress within the course. However, on first glance, there does not seem to be any e-mail validation, meaning, someone with an authenticated account (this would essentially just equate to someone who is logged into any account on the same domain, so for example, another student) could send any email to *anybody*, with it appearing to come from *edready.org! However, I have not tested this, so please take this with a heavy grain of salt.

## EDIT: This vulnerability has been confirmed by me. By sending a POST request using it's built-in "doJSONPost" function, you are able to send an email to anyone you would like with whatever content you'd like.
This is an example script (you'd run it in the browser console):
```javascript
var progressMessageEmail = {
    goalName: "Test Name",
    assessmentName: "Amazing Test Name LOLL",
    // will appear right below "Your Message:"
    message: "hi sir plz click lnik: https://microsoft.com for fre row buck >w<",
    // appears right under the message above
    secondMessage: "sincierly microsoft",
    // can only send to 1 email at a time
    emails: "youremail@example.com",
    // set to false if you don't want to be CC'd
    email_student: false
};

doJSONPost("/ajax/assessment/sendProgressEmail", $.toJSON(progressMessageEmail), null, null);
```
Running the above code (but modifying it to suit your needs) results in something like this being sent:
![image](https://github.com/million1156/EdReady/assets/91338231/223f1c2c-fc07-4af4-9639-6c0ddcb0ed41)

Note; Your real name (or whatever name you set in your settings) is included in the email, so be aware!


### Part 3: Requests, requests, requests!
When submitting an answer to the server, the client formats it like this:
```json
{
    questionTrackerId: 12345,
    correct:  true,
    skipped:  false,
    studyObjectId: 12345,
    answer: "encodedURIComponentOfgetState",
    possiblePoints: 999,
    scoredPoints: 999,
    groupAssessmentId: 12345,
    hold: "isQuestionOnHold",
    totalQuestionsHeld: 55,
}
```

Notice how there is a `correct` parameter? This makes it very possible for someone to forge a request, claim the answer is correct, and it'll be marked down as correct. This one is a little less theoretical, as testing this seems to prove my theory is correct, but it most likely depends (e.g if the answer you chose was *actually* correct or not).

There is also a `possiblePoints` and `scoredPoints` parameter, however I am personally not sure what they do, so they most likely are "useless" in nature.


# And that's it!

That's all that I really have to say about this, I hope this is interesting for at least somebody :)

I probably won't remember much, but if you have any questions about this, please feel free to email me at [contact@alyocord.com](mailto:contact@alyocord.com)
