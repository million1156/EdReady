// NOTE: This is the original source code, I have not modified it at all except for removing information & adding this comment!
var player;
var zendeskStarted = false;
var hasBeenAnswered = false;
var questionTrackerId = 12345;

var progressMessages = [];
var remainingMessages = [];

var possiblePoints = 0;
var scoredPoints = 0;
var questionAccessible = true;
var studentNeedsAccessibility = false;
var groupAssessmentId = 12345;
var totalQuestionsHeld = 0;
var isHold = false;
let isAssessmentScoringModelCompletion = false ? false : false
let answerDetails = null;

if (isHold) {
    $('.assessment_progress_info').html("You are now viewing the questions you held earlier. Please submit an answer or pass.");
    $('.pb_title').html('Progress with held questions:');
    $('#hold').attr('disabled', 'disabled');
    $('.hold_label').html('Not available');
    $('.assessment_bar').css("background-color", "#6CC6B7");
}



//    $('#math-renderer-select').change(function(){
//        MathJax.Hub.Queue(["setRenderer", MathJax.Hub, $(this).val()]);
//        MathJax.Hub.Queue(["Rerender", MathJax.Hub]);
//    });



function warnNotAccessibleQuestion() {
    alert('Warning: This question is not considered accessible for all users');
}


function handleNextQuestionData(data) {
    remainingMessages = [];
    possiblePoints = data.possiblePoints;
    scoredPoints = data.scoredPoints;
    questionAccessible = data.accessible;
    totalQuestionsHeld = data.totalQuestionsHeld

    if (studentNeedsAccessibility && questionAccessible == false) {
        warnNotAccessibleQuestion();
    }

    var progressMessage = getNextProgressMessage(data.progressPercentage);

    if (progressMessage !== null) {
        var messageData = getModalParameters(progressMessage, data.currentScore);
        showModal(messageData, data);
        handleMessageEmailOption(messageData);
    }
    else {
        nextQuestion(data);
    }
}

function getNextProgressMessage(currentProgress) {
    var retProgressMessage = null;
    progressMessages.forEach(function (progressMessage, index) {
        if (progressMessage.completionPercentage <= currentProgress && progressMessage.active === "true") {
            retProgressMessage = progressMessage;
        }
        else {
            remainingMessages.push(progressMessage);
        }
    });
    progressMessages = remainingMessages;
    return retProgressMessage;
}

function getModalParameters(progressMessage, currentScore) {
    var dataParams = {
        message: progressMessage.message,
        secondMessage: "",
        allowSkipAssessment: progressMessage.allowSkipAssessment,
        byEmail: progressMessage.byEmail,
        emails: progressMessage.emails,
        emailStudent: progressMessage.emailStudent
    };

    if (progressMessageHasThreshold(progressMessage)) {
        if (progressMessage.threshold > currentScore) {
            dataParams.secondMessage = progressMessage.messageBelow;
            dataParams.allowSkipAssessment = dataParams.allowSkipAssessment === "true" ? true : false;
        } else {
            dataParams.secondMessage = progressMessage.messageAbove;
            dataParams.allowSkipAssessment = false;
        }
    }
    else {
        dataParams.allowSkipAssessment = false;
    }
    return dataParams;
}

function progressMessageHasThreshold(progressMessage) {
    return progressMessage.threshold !== null && progressMessage.threshold > 0;
}

function handleMessageEmailOption(data) {
    if (data.byEmail === "true") {
        var progressMessageEmail = {
            goalName: "",
            assessmentName: "AssessmentTitle",
            message: data.message,
            secondMessage: data.secondMessage,
            emails: data.emails,
            email_student: data.emailStudent
        };

        var url = "/ajax/assessment/sendProgressEmail";
        doJSONPost(url, $.toJSON(progressMessageEmail), null, null);
    }
}

if (iPad) {
    $('#submit').removeClass('button_hover');
    $('#skip').removeClass('button_hover');
    $('#hold').removeClass('button_hover');
    $('#next').removeClass('button_hover');
    $('.close_save_button').removeClass('button_hover');
}

function disableButtons() {
    $('#question_buttons_div button').attr('disabled', 'disabled');
}

function enableButtons() {
    $('#question_buttons_div button').removeAttr('disabled');
}

$('#big_loading_div').hide();

$('#submit').on('click dblclick', function (e) {
    e.preventDefault();
    if (isAssessmentScoringModelCompletion) {
        provideAnswerFeedback();
    } else {
        submit();
    }
});

$('#submit').keydown(function (e) {
    if (e.keyCode == 13) {
        e.preventDefault();
        if (isAssessmentScoringModelCompletion) {
            provideAnswerFeedback();
        } else {
            submit();
        }
    }
});


$('#skip').on('click dblclick', function (e) {
    e.preventDefault();
    disableButtons();
    $('#question_buttons_div').hide();
    skip();
}).keydown(function (e) {
    if (e.keyCode == 13) {
        disableButtons();
        e.preventDefault();
        $('#question_buttons_div').hide();
        skip();
    }
});


$('#hold').on('click dblclick', function (e) {
    e.preventDefault();
    disableButtons();
    $('#question_buttons_div').hide();
    hold();
});


$('#hold').keydown(function (e) {
    if (e.keyCode == 13) {
        disableButtons();
        e.preventDefault();
        $('#question_buttons_div').hide();
        hold();
    }
});



function saveAndCloseButton() {
    keepAliveAssessment();
    saveAssessmentAction();
    var from = $('#assessment').data("from");



    var url = "/studyPlanWithState";
    var parameters = "?studyObjectId=12345&groupId=12345";

    parameters += "&unitId=12345";


    parameters += "&isUnit=false";

    if (from != null) {
        parameters += "&from=assessments";
    }
    window.location = url + parameters;


    return false;
}

$('.close_save_button').on('click dblclick', function (e) {
    e.stopPropagation();
    return saveAndCloseButton();
});

$('.close_save_button').on('keydown').keydown(function (e) {
    e.stopPropagation();
    if (e.keyCode == 13) {
        return saveAndCloseButton();
    }
});

//The QuestionPlayer calls this function, if it exists.  Declare it
//if you want to know when the player is initialized.  Calls to configure
//the player before it is ready will fail.  Also, note the nrocQuestionPlayer
//is a hard-coded name inserted into the DOM for player access.
function nrocQuestionPlayerInit(questionImportCode) {
    $('#big_loading_div').show();
    if (questionImportCode === undefined || questionImportCode === null) {
        questionImportCode = 1155263;
    }

    //Note: submitChanged is a callback function if you want to know when the question is submit-ready.
    nrocQuestionPlayer.loadPlayer('question_player', submitChanged);
    nrocQuestionPlayer.disableScrollBars();
    nrocQuestionPlayer.middleAlignRadioButtons();
    nrocQuestionPlayer.tabIndexZeroMode();

    loadQuestion(questionImportCode)
}


function loadQuestion(questionImportCode) {
    $('#question_id_tag').text("Question ID: " + questionImportCode);
    var questionUrl = "https://content.nroc.org/nroc-question-player" + "/" + questionImportCode + ".json";
    nrocQuestionPlayer.loadQuestion(questionUrl, loaded);
    hasBeenAnswered = false;
}

//Callback function for submission state event.  If the question is not answered, this can disable your submit button (optional)
function submitChanged(enable) {
    hasBeenAnswered = enable;
}

//Then do something like this in your callback:
function loaded() {
    $('#question_buttons_div').show();
    setTimeout(function () {
        $('#loading_div').hide();
        $('#big_loading_div').hide();
        $('.btn').blur();
        if (!zendeskStarted) {
            zendeskStarted = true;
            $(document).trigger('loadzendesk');
        }
    }, 250);
}

function getAnswerDetails() {
    disableButtons();
    var correct = nrocQuestionPlayer.submitQuestion();
    var answer = nrocQuestionPlayer.getState();
    answer = encodeURIComponent(answer);
    answerDetails = {
        correct: correct,
        skipped: false,
        answer: answer,
        hold: false
    };
}

//An example call to the player's submit function.  Returns true if correct.
function submit() {
    keepAliveAssessment();
    if (hasBeenAnswered) {

        getAnswerDetails();
        submitAnswer(answerDetails.correct, false, answerDetails.answer, false);
        $('#question_buttons_div').hide();
    }
    else {
        showAccessibleAlertMessage($('#alert_message_id'), 'danger', 'Please answer the question first.');
    }
}


function skip() {
    keepAliveAssessment();
    submitAnswer(false, true, "", false);
}


function hold() {
    keepAliveAssessment();
    submitAnswer(false, false, "", true);
}

function provideAnswerFeedback() {
    answerDetails = { correct: null, skipped: false, answer: null, hold: false };

    keepAliveAssessment();
    if (hasBeenAnswered) {

        getAnswerDetails();
        // Show answer feedback
        nrocQuestionPlayer.showAnswer();
        nrocQuestionPlayer.lock();
        if (answerDetails.correct === true) {
            showAccessibleAlertMessage($('#alert_message_id'), 'success', 'Correct');
        } else {
            showAccessibleAlertMessage($('#alert_message_id'), 'warning', 'Incorrect. The correct answer is selected above.');
        }
        $('#question_buttons_div').hide();
        $('#submit').attr('hidden', 'hidden');
        next_btn.removeAttr('hidden disabled');
    } else {
        showAccessibleAlertMessage($('#alert_message_id'), 'danger', 'Please answer the question first.');
    }
}

function loadNextQuestionAfterFeedback() {
    if (answerDetails != null /* || answerDetails !== {} */) {
        $('#submit').removeAttr('hidden');
        next_btn.attr('hidden', 'hidden');
        submitAnswer(
            answerDetails.correct,
            answerDetails.skipped,
            answerDetails.answer,
            answerDetails.hold
        );
    } else {
        showAccessibleAlertMessage($('#alert_message_id'), 'danger', 'We are having some issues loading the next question, please reload the page and try again');
    }
}

/** Alert messages methods **********/
function showMessage(alertName, type, message) {
    var alert = $('#' + alertName);
    alert.removeClass().addClass("alert alert-" + type);
    alert.text(message).show();
}

function hideMessage(alertName) {
    var alert = $('#' + alertName);
    alert.text('');
    alert.removeClass();
}

function successAnswerQuestion(data) {
    if (data.done) {
        var url = "/assessment/done?" +
            "studentAssessmentId=" + data.studentAssessmentId +
            "&studyObjectId=12345";

        url += "&isUnit=false";


        url += "&singleUnitId=12345";

        window.location = url;
        return false;
    } else {
        handleNextQuestionData(data);
    }
}

function nextQuestion(data) {
    questionTrackerId = data.questionTrackerId;
    $('.assessment_progress').attr('aria-label', data.progressPercentage + '%');
    $('.assessment_bar').width(data.progressPercentage + '%');
    $('#unit-name').html(data.unitName);
    enableButtons();

    if (data.previousHold) {
        $('.assessment_progress_info').html('All held questions will be shown to you again at the end of this test. You have held'.concat(' ' + totalQuestionsHeld + ' ').concat('questions so far.'));
    } else {
        $('.assessment_progress_info').html('The movement of the progress bar may be uneven because questions can be worth more or less (including zero) depending on your answer.');
    }

    if (data.hold) {
        $('.assessment_progress_info').html("You are now viewing the questions you held earlier. Please submit an answer or pass.");
        $('.pb_title').html('Progress with held questions:');
        $('#hold').attr('disabled', 'disabled');
        $('.hold_label').html('Not available');
        $('.assessment_bar').css("background-color", "#6CC6B7");
    }

    $('#topic-name').html(data.topicName);
    $('.btn').blur();
    loadQuestion(data.questionImportCode);
}

function showModal(messageData, data) {
    var source = $('#progress_message_template').html();
    var modal = $('#progress_message_modal').modal({ backdrop: 'static', show: false, keyboard: false });
    var template = Handlebars.compile(source);
    var message1 = (messageData.message !== "") ? ($.parseHTML(messageData.message))[0].data : "";
    var message2 = (messageData.secondMessage !== "") ? ($.parseHTML(messageData.secondMessage))[0].data : "";
    var parameters = {
        assessmentName: "AssessmentTitle",
        assessmentMessage: message1,
        assessmentSecondMessage: message2,
        allowSkipAssessment: messageData.allowSkipAssessment
    };

    modal.empty();
    modal.html(template(parameters));
    modal.modal('show');

    window.setTimeout(function () {
        $('.first_modal_element').focus();
    }, 500);

    closeModal(data);

    $('#continue_assessment_button').off('click').on('click', function (e) {
        $('#progress_message_modal').modal('hide');
        nextQuestion(data);
        e.preventDefault();
    });

    $('#continue_assessment_button').off('keydown').keydown(function (e) {
        if (e.keyCode == 13) {
            $('#progress_message_modal').modal('hide');
            nextQuestion(data);
            e.preventDefault();
        }
    });

    $('#skip_in_progress_assessment_button').off('click').on('click', function (e) {
        $('#progress_message_modal').modal('hide');
        skipAssessment();
        e.preventDefault();
    });

    $('#skip_in_progress_assessment_button').off('keydown').keydown(function (e) {
        if (e.keyCode == 13) {
            $('#progress_message_modal').modal('hide');
            skipAssessment();
            e.preventDefault();
        }
    });
};

function closeModal(data) {
    $('.close_button').off('click').on('click', function (e) {
        e.stopPropagation();
        $('#progress_message_modal').modal('hide');
        nextQuestion(data);
    });

    $('.close_button').off('keydown').keydown(function (e) {
        if (e.keyCode == 13) {
            e.stopPropagation();
            $('#progress_message_modal').modal('hide');
            nextQuestion(data);
        }
    });

    $('.assessment_modal_close').off('click').on('click', function (e) {
        e.stopPropagation();
        $('#retake_assessment_modal').modal('hide');
    });

    $('.assessment_modal_close').off('keydown').keydown(function (e) {
        if (e.keyCode == 13) {
            e.stopPropagation();
            $('#retake_assessment_modal').modal('hide');
        }
    });

}

function errorAnswerQuestion(data) {
    enableButtons(data.hold);
    $('#big_loading_div').hide();
    if (data.responseText === undefined) {
        $('.alert').slideDown();
    } else {
        //invalid session
        window.location = "/invalidSession";
        return false;
    }
}

function submitAnswer(correct, skipped, answer, hold) {
    $('.alert').slideUp();
    $('#big_loading_div').show();

    var url = "/ajax/assessment/answerQuestion";
    var answeredQuestion = {
        questionTrackerId: questionTrackerId,
        correct: correct,
        skipped: skipped,
        studyObjectId: 12345,
        answer: answer,
        possiblePoints: possiblePoints,
        scoredPoints: scoredPoints,
        groupAssessmentId: groupAssessmentId,
        hold: hold,
        totalQuestionsHeld: totalQuestionsHeld
    };

    answeredQuestion.unitTest = false;


    answeredQuestion.singleUnit = 12345;

    doJSONPost(url, $.toJSON(answeredQuestion), successAnswerQuestion, errorAnswerQuestion);
}

function saveAssessmentAction() {
    var url = "/ajax/assessment/save";
    var parameters = { questionTrackerId: 12345 };
    doJSONGet(url, parameters);
}

function skipAssessment() {
    $('.alert').slideUp();
    $('#big_loading_div').show();

    var url = "/ajax/assessment/12345/skip";

    var successCallback = function (data) {
        if (data.status == "true") {
            var url = "/assessment/done?" +
                "studentAssessmentId=12345&studyObjectId=12345";
            window.location = url;
        }
    };

    var errorCallback = function (e) {
        console.log("error skipping the assessment");
    };

    doJSONPost(url, $.toJSON(), successCallback, errorCallback);
}