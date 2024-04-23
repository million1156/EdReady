# EdReady.. and it's very terrible security..

> [!WARNING]
> There is no issue that can leak user data, credentials, etc. This purely contains information that allows somebody to bypass the whole point of EdReady (that is, to *prepare* students). Also note this was written quite awhile ago, although these issues should still be prevelant (based on talking to friends who are in High School). I decided to publish this now as I don't use EdReady anymore, so I don't have a use for "hoarding" this.
> When I reference "vulns", I more so mean "lapses".

This is a small writeup about NROCPortal, EdReady, whatever you'd like to call it.

If you are looking for the "source code" I am referencing, you can find it at `/src.js`.

For the way I was able to determine all possible `nrocQuestionPlayer` "child functions", you can view `printChildren.js`.

Enjoy! :)


## What even is that..?
[EdReady](https://get.edready.org) (or NROCPortal) is a platform that allows educators to "quiz" students in multiple subjects (such as Reading and Math). Think of it similar to [Eduphoria](https://eduphoria.net), where it's more of an "assessment" for future readiness. For example, I've taken this before for TSI exemption (TSI is sort of like a PSAT/SAT, but *different*. blame the education system xd).

## Okay, but what's the issue?

EdReady has a multitude of vulns, however, only 1 of them were tested, the other examples here are purely theoretical. The first one is suprisingly simple.

### The tales of nrocQuestionPlayer..
EdReady has a sort of "framework" called "nrocQuestionPlayer" that is hardcoded into the DOM. This has many different functions, such as "loadQuestion", "loadPlayer", "submitQuestion", and "getState", but none of these are vulnerable. It's actually "showAnswer"! If it wasn't obvious, this, well, shows the answer to the "player" (aka client). However, this performs **0** checks **at all**, meaning you can easily have the answer given to you, and it not counted wrong, nor does it take any points away from you. Therefore, by calling `nrocQuestionPlayer.showAnswer();`, you're able to easily call this function, have the answer highlighted, click on the right answer, and both the client and the server count your answer as correct, therefore allowing you to cheat exam(s).

### We love email! Right..?
This and the next one(s) are purely theoretical as said above, so please keep that in mind :)

This has to do again with the client-sided code, but this time, it has to do with "progess emails". 

Essentially, EdReady will occasionally send both the instructor & student "progress" emails intended to inform both parties about the student's progress within the course. However, on first glance, there does not seem to be any e-mail validation, meaning, someone with an authenticated account (this would essentially just equate to someone who is logged into any account on the same domain, so for example, another student) could send any email to *anybody*, with it appearing to come from *edready.org! However, I have not tested this, so please take this with a heavy grain of salt.

### Requests, requests, requests!
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
}```

Notice how there is a `correct` parameter? This makes it very possible for someone to forge a request, claim the answer is correct, and it'll be marked down as correct. This one is a little less theoretical, as testing this seems to prove my theory is correct, but it most likely depends (e.g if the answer you chose was *actually* correct or not).

There is also a `possiblePoints` and `scoredPoints` parameter, however I am personally not sure what they do, so they most likely are "useless" in nature.