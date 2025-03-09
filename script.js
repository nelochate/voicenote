// Check for browser support
try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
} catch (e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
}

var noteTextarea = $('#note-textarea');
var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';

// Get all notes from previous sessions and display them.
var notes = getAllNotes();
renderNotes(notes);

/*-----------------------------
      Voice Recognition 
------------------------------*/

// Enable continuous recognition
recognition.continuous = true;

// Enable interim results (this is key for real-time transcription)
recognition.interimResults = true;

// This block is called every time the Speech API captures a result.
recognition.onresult = function (event) {
  var interimTranscript = '';
  var finalTranscript = '';

  // Loop through all results
  for (var i = event.resultIndex; i < event.results.length; i++) {
    var transcript = event.results[i][0].transcript;

    // Check if the result is final or interim
    if (event.results[i].isFinal) {
      finalTranscript += transcript;
    } else {
      interimTranscript += transcript;
    }
  }

  // Update the textarea with both interim and final results
  noteContent = finalTranscript + interimTranscript;
  noteTextarea.val(noteContent);
};

recognition.onstart = function () {
  instructions.text('Voice recognition activated. Try speaking into the microphone.');
};

recognition.onspeechend = function () {
  instructions.text('You were quiet for a while so voice recognition turned itself off.');
};

recognition.onerror = function (event) {
  if (event.error == 'no-speech') {
    instructions.text('No speech was detected. Try again.');
  }
};

/*-----------------------------
      App buttons and input 
------------------------------*/

$('#start-record-btn').on('click', function (e) {
  if (noteContent.length) {
    noteContent += ' ';
  }
  recognition.start();
});

$('#pause-record-btn').on('click', function (e) {
  recognition.stop();
  instructions.text('Voice recognition paused.');
});

// Sync the text inside the text area with the noteContent variable.
noteTextarea.on('input', function () {
  noteContent = $(this).val();
});

$('#save-note-btn').on('click', function (e) {
  recognition.stop();

  if (!noteContent.length) {
    instructions.text('Could not save empty note. Please add a message to your note.');
  } else {
    // Save note to localStorage.
    saveNote(new Date().toLocaleString(), noteContent);

    // Reset variables and update UI.
    noteContent = '';
    renderNotes(getAllNotes());
    noteTextarea.val('');
    instructions.text('Note saved successfully.');
  }
});

notesList.on('click', function (e) {
  e.preventDefault();
  var target = $(e.target);

  // Listen to the selected note.
  if (target.hasClass('listen-note')) {
    var content = target.closest('.note').find('.content').text();
    readOutLoud(content);
  }

  // Delete note.
  if (target.hasClass('delete-note')) {
    var dateTime = target.siblings('.date').text();
    deleteNote(dateTime);
    target.closest('.note').remove();
  }
});

/*-----------------------------
      Speech Synthesis 
------------------------------*/

function readOutLoud(message) {
  var speech = new SpeechSynthesisUtterance();

  // Set the text and voice attributes.
  speech.text = message;
  speech.volume = 1;
  speech.rate = 1;
  speech.pitch = 1;

  window.speechSynthesis.speak(speech);
}

/*-----------------------------
      Helper Functions 
------------------------------*/

function renderNotes(notes) {
  var html = '';
  if (notes.length) {
    notes.forEach(function (note) {
      html += `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <a href="#" class="listen-note" title="Listen to Note">Listen to Note</a>
          <a href="#" class="delete-note" title="Delete">Delete</a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;
    });
  } else {
    html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
  }
  notesList.html(html);
}

function saveNote(dateTime, content) {
  localStorage.setItem('note-' + dateTime, content);
}

function getAllNotes() {
  var notes = [];
  var key;
  for (var i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);

    if (key.substring(0, 5) == 'note-') {
      notes.push({
        date: key.replace('note-', ''),
        content: localStorage.getItem(localStorage.key(i))
      });
    }
  }
  return notes;
}

function deleteNote(dateTime) {
  localStorage.removeItem('note-' + dateTime);
}