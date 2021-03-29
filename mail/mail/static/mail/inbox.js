document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // By default, load the inbox
  load_mailbox('inbox');

  // Declare active_id as a global variable and add onclick event listeners to the archive, unarchive, and reply buttons
  // The value of active_id is decalred later in the load_message function
  var active_id;
  document.querySelector('#archive').addEventListener('click', () => archive_message(active_id));
  document.querySelector('#unarchive').addEventListener('click', () => unarchive_message(active_id));
  document.querySelector('#reply').addEventListener('click', () => compose_email(active_id));

  // Add an event listener to the compose-form submit button for when it's submitted 
  document.querySelector('#compose-form').onsubmit = () => {

    // Get the recipients, subject, and body from the form
    const composeRecipients = document.querySelector('#compose-recipients');
    const composeSubject = document.querySelector('#compose-subject');
    const composeBody = document.querySelector('#compose-body');
  
    // Send the email using a post request, setting the recipients, subject, and body using the values we got from the form
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: composeRecipients.value,
        subject: composeSubject.value,
        body: composeBody.value
      })
    })
    .then(response => response.json())

    // Load the sent mailbox
    load_mailbox('sent');
    location.reload();
    return false;
  };

function compose_email(emailId) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#message-view').style.display = 'none';

  // If an active email id is passed through, fetch the contents of the email. If it's not passed through, emailId will be undefined, so don't do this step
  if(emailId !== undefined) {
    fetch(`/emails/${emailId}`)
    .then(response => response.json())
    .then(email => {

    // Set the value of the sender, body, and subject fields using the contents of the fetcehd email we're replying to
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: ${email.body}`;

    // If the email subject already starts with "RE:" then don't add "RE:" to the subject line. If it doesn't start with "RE:" then add it
    if(email.subject.startsWith('RE:')) {
      document.querySelector('#compose-subject').value = `${email.subject}`;
    } else {
      document.querySelector('#compose-subject').value = `RE: ${email.subject}`;
    }
    })
  }
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#message-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#mailbox-name').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Load emails from whichever mailbox we're on
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Set mailbox contents to nothing to clear out inbox contents from other views
    const mailboxContents = document.querySelector('#mailbox-contents')
    mailboxContents.innerHTML = ''

    // For every email we've loaded, create a div element and set its id to be the email id and add the mailbox-entry class
    // Add an onclick event listener that uses the load_message function on click 
    emails.forEach(function(item) {
      const newDiv = document.createElement('div');
      newDiv.id = item.id
      newDiv.addEventListener('click', () => load_message(item.id, mailbox));
      newDiv.classList.add('mailbox-entry');

      // If the email has been read, add the read class. If not, add the unread class.
      if(item.read === true) {
        newDiv.classList.add('read');
      } else if(item.read === false) {
        newDiv.classList.add('unread');
      }

      // Set the inner HTML of each div to contain the sender, subject, and timestamp of each email and append each div to the mailbox contents div
      newDiv.innerHTML = `<b>From:</b> ${item.sender} <b>Subject:</b> ${item.subject} <b>Time:</b> ${item.timestamp}`
      mailboxContents.append(newDiv);
    });
  });
}

function load_message(id, mailboxType) {

  // Show the message and hide other views
  document.querySelector('#message-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Once the message is opened, update its read status to true
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })

  // Fetch the email contents using the email id that was clicked from the mailbox
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    // Set the inner HTMl contents of each part to hold the correct part of the email 
    document.querySelector('#message-subject').innerHTML = email.subject;
    document.querySelector('#message-timestamp').innerHTML = email.timestamp;
    document.querySelector('#message-sender').innerHTML = email.sender;
    document.querySelector('#message-recipients').innerHTML = email.recipients;
    document.querySelector('#message-body').innerHTML = email.body;

    // If we're in the archived mailbox, show the "unarchive" button
    // If we're in the inbox, show the "archive" and "reply" button
    // If we're in the sent box, show the "reply" button
    if(mailboxType === 'archive' && email.archived === true) {
      document.querySelector('#unarchive').style.display = 'inline';
      document.querySelector('#archive').style.display = 'none';
      document.querySelector('#reply').style.display = 'none';
    } else if(mailboxType === 'inbox' && email.archived === false) {
      document.querySelector('#unarchive').style.display = 'none';
      document.querySelector('#archive').style.display = 'inline';
      document.querySelector('#reply').style.display = 'inline';
    } else {
      document.querySelector('#unarchive').style.display = 'none';
      document.querySelector('#archive').style.display = 'none';
      document.querySelector('#reply').style.display = 'inline';
    }

    // Set the global active_id variable to be id
    active_id = id; 
  });
};

// The archive function that runs when the archive button is clicked
function archive_message(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  // Load the inbox
  load_mailbox('inbox');
  location.reload();
}

// The unarchive function that runs when the unarchive button is clicked
function unarchive_message(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })

  // Load the inbox
  load_mailbox('inbox');
  location.reload();
}

});
