'use strict';


var ISSUE_TRACKER_API_ROOT = 'https://issuetracker.corp.googleapis.com';
var DISCOVERY_PATH = '/$discovery/rest';
var ISSUE_TRACKER_API_VERSION = 'v1';
var CLIENT_ID = '1027985290991-tp6lmvnn8hh46daclgjm23go2kf4q2im.apps.googleusercontent.com';
//var CLIENT_ID ='1027985290991-3ffmu50fj1fh05o71hmndlt0v423l4d3.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/buganizer';
var REST_DOMAIN = 'http://localhost:8081/ticket';

var tableBody = document.getElementById('contentTable');
var pageToken = '';
var pageSize = '500';
var start = moment().startOf('week').format();
var weekStart = start.substring(0,start.indexOf('T'));
var end = moment(moment().endOf('week')).format();
var endOfWeek = end.substring(0,end.indexOf('T'));

var messages = {
  'WITHOUT_STATUS' : 'No status',
  'WITHOUT_STAGE' : 'No Stage',
  'WITHOUT_ESTIMATION' : 'No estimated',
  'WITHOUT_LAUNCH' : ''
}

var ticketStates = {
  'NOT_STARTED' : 'Not Started',
  'IN_PROGRESS' : 'In progress',
  'BLOCKED' : 'Blocked',
  'COMPLETED' : 'Completed'
};

var responsibles = {
  '--':'--',
  'Steve' : 'Steve',
  'Fernando' : 'Fernando',
  'Nidhi' : 'Nidhi',
  'Amy':'Amy',
  'Emily':'Emily',
  'Jeff':'Jeff',
  'Laura':'Laura',
  'Magali':'Magali',
  'Caro':'Caro'

};
var carryOverCauses = {
  '--':'--',
  'Updates by the PMM in progress':'Updates by the PMM in progress',
  'Changes Priority': 'Changes Priority',
  'LQA delay':'LQA delay',
  'PMM response':'PMM response',
  'CL review delay':'CL review delay',
  'Canceled':'Canceled',
  'Project':'Project',
  'Infeasible':'Infeasible',
  'Requires Research':'Requires Research',
  'QA/Bugs':'QA/Bugs',
  'QA-ing':'QA-ing',
  'Delay to update':'Delay to update',
  'Other team dependency':'Other team dependency',
}

var buganizerTickets = {};
var customFields = {};

var formResults = document.getElementById('filterResults');
formResults.addEventListener('submit',filterResults);

var pickerStart = new Pikaday({
  field: document.getElementById('start-date'),
  format: 'D MMM YYYY',
  firstDay: 0,
  defaultDate: new Date(weekStart),
  setDefaultDate: true,
});

var pickerEnd = new Pikaday({
  field: document.getElementById('end-date'),
  format: 'D MMM YYYY',
  firstDay: 0,
  defaultDate: new Date(endOfWeek),
  setDefaultDate: true,
});

var startDateBtn = document.getElementById("ini-date-btn");
startDateBtn.addEventListener("click",function(e){
  e.preventDefault();
  console.log('ini');
  pickerStart.show();
});

var endDateBtn = document.getElementById('end-date-btn');
endDateBtn.addEventListener('click',function(e){
  e.preventDefault();
  console.log('end');
  pickerEnd.show();
});

var clearBtn = document.getElementById('clear-dates');
clearBtn.addEventListener('click',function(e){
  e.preventDefault();
  document.getElementById('start-date').value = '';
  document.getElementById('end-date').value = '';
});

/**
 * A very simple DOM helper function for modern browsers.
 * @param {string} domSelector used to retrieve a DOM element using a
 *    querySelector call.
 * @return {Object} helper object containing the methods:
 *    on, clear, append, hide, show and val, with semantics similar to the
 *    methods with the same name on jQuery.
 */
function elem(domSelector) {
  var domElem = document.querySelector(domSelector);
  return {
    on: function(event, cbk) { domElem.addEventListener(event, cbk); },
    clear: function() {
      while (domElem.lastChild) {
        domElem.removeChild(domElem.lastChild);
      }
    },
    append: function(child) { domElem.appendChild(child); },
    hide: function() { domElem.style.display = 'none'; },
    show: function() { domElem.style.display = ''; },
    val: function() { return domElem.value; }
  };
}

/**
 * Callback for authorization calls which, on success, hides the auth
 * button and shows the content div, else it makes sure the auth button
 * is visible and with the correct callback.
 *
 * @param {?Object} authResult Contains the authentication result info.
 */
function handleAuthResult(authResult) {
  if (authResult && !authResult.error){
    elem('#authorize-button').hide();
    elem('#content').show();
    makeApiCall();
  }
  else {
    elem('#authorize-button').show();
    elem('#content').hide();
  }
}
elem('#authorize-button').on('click', handleAuthClick);

/**
 * Sends an Auth call with immediate mode off, which will show the user
 * a popup requesting him to authorize our application.
 * @see http://go/gapi-auth
 */
function handleAuthClick() {
  gapi.auth.authorize({client_id: CLIENT_ID, scope: SCOPES, immediate: false},
    handleAuthResult);
}

/**
 * Called as soon the gapi script is loaded, since the script tag we used had
 * the name of this function on the onload parameter:
 *  <script src="//apis.google.com/js/client.js?onload=handleClientLoad">
 */
function handleClientLoad() {
  /*
   * Sends an Auth call with immediate mode on, which attempts to refresh
   * the token behind the scenes, without showing any UI to the user.
   */
  gapi.auth.authorize({client_id: CLIENT_ID, scope: SCOPES, immediate: true},
    handleAuthResult);
}

/**
 * Loads the API and makes a call for all the user's issues.
 */
function makeApiCall() {
  // Load correct version and make call to find assigned issues.
  gapi.client.load(
    ISSUE_TRACKER_API_ROOT + DISCOVERY_PATH,
    ISSUE_TRACKER_API_VERSION,
      function() {
      var request = gapi.client.corp_issuetracker.issues.list({
        'query': 'savedsearchid:551706' /*+ ' status:assigned | status:accepted'*/,
        'page_token': pageToken,
        'page_size': pageSize
      });

      request.execute(handleResponse);
  });
}

function filter(query){
  var request = gapi.client.corp_issuetracker.issues.list({
  'query': query,
  'page_token': pageToken,
  'page_size': pageSize
  });
  elem('#contentTable').clear();
  request.execute(handleResponse);
}

function filterResults(e){
  // Grab username as a string
  //debugger;
  e.preventDefault();
  var username = '' + elem('#username-select').val();
  var iniDateLaunch =  moment(pickerStart.getDate()).format();
  var iniDefaultDate = (moment().subtract(30,'days').format()).substring(0,(moment().subtract(30,'days').format()).indexOf('T'));
  var initialDate = elem('#start-date').val() == '' ? iniDefaultDate : iniDateLaunch.substring(0,(iniDateLaunch.indexOf('T')));
  var endDateLaunch =  moment(pickerEnd.getDate()).format();
  var endDefaultDate = (moment().add(30,'days').format()).substring(0,(moment().add(30,'days').format()).indexOf('T'));
  var endDate = elem('#end-date').val() == '' ? endDefaultDate : endDateLaunch.substring(0,(endDateLaunch.indexOf('T')));

  e.preventDefault();
  if((username === 'fguerrero') || (username === 'sgeer') || (username === 'machadoca')|| (username === 'zfisher')|| (username === 'nidhireddy')){
    if(initialDate === iniDefaultDate){
      var queryDefaultDate = ' assignee:' + username + '@google.com' + ' status:assigned | status:accepted';
      filter(queryDefaultDate);
    }
    else{
      var queryUpdateDate = ' assignee:' + username + '@google.com'  +' customfield62965:'+initialDate+'..'+endDate;
      filter(queryUpdateDate);
    }
  }
  else if((username === 'lpolkus') || (username === 'cocoliu') || (username === 'eluedecke') || (username === 'nipan') || (username ==='jeffconley')){
    var queryDesign = ' assignee:' + username + '@google.com' + ' status:accepted | status:assigned' + ' -customfield62960:Handoff-to-PMM | Handoff-to-DEV';
    filter(queryDesign);
  }
  else{
    makeApiCall();
  }
}

function addTicketDetail(infoTicket){
  // inserto el vinculo dentro de la celda
  anchorCell.appendChild(infoTicket)
  // inserto celda dentro del row de cada ticket
  rowTag.appendChild(anchorCell);
}

function handleResponse(response) {
  buganizerTickets = response;
  makeRequest('GET', REST_DOMAIN, 'printData');
}

/**
 * Displays the list of issues.
 *
 * @param {?Object} response The response payload.
 */
function printData(response) {
  response = JSON.parse(response);
  customFields = response;
  // Something went wrong.
  if (!buganizerTickets) {
    alert('A bad request was made.');
    return;
  }
  elem('#issues').clear();

  if (!buganizerTickets['issues']) {
    elem('#issues').append(document.createTextNode('No issues found.'));
  } else {
    buganizerTickets.issues.forEach(function(issue) {
      issue.extrainfo = response.result.filter( function(el) { return issue.issueId === el.gid } )
      issue.comment = issue.extrainfo.length ? issue.extrainfo[0].comment : "";
      issue.customStatus = issue.extrainfo.length ? issue.extrainfo[0].status : "";
      issue.sprintDate = issue.extrainfo.length ? issue.extrainfo[0].sprintDate : "";
      issue.responsible = issue.extrainfo.length ? issue.extrainfo[0].responsible : "";
      issue.method = issue.extrainfo.length ? 'PUT' : 'POST';

      var formWrapper = document.createElement('FORM');
      var rowTag = document.createElement('TR');
      var issueUrl = 'http://b/' + issue.issueId;
      // creo la etiqueta de link para linkear cada ticket a buganizer
      var anchor = document.createElement('a');
      var item = document.createElement('li');
      anchor.href = issueUrl;
      anchor.target = '_blank';
      anchor.appendChild(document.createTextNode(issue.issueId));

      // creo la primera celda
      var anchorCell = document.createElement('TD');
      // inserto el vinculo dentro de la celda
      anchorCell.appendChild(anchor)
      // inserto celda dentro del row de cada ticket
      rowTag.appendChild(anchorCell);

      var titleCell = document.createElement('TD');
      rowTag.appendChild(titleCell);
      titleCell.appendChild(document.createTextNode(issue.issueState.title))

      var assigneeCell = document.createElement('TD');
      rowTag.appendChild(assigneeCell);
      assigneeCell.appendChild(document.createTextNode(issue.issueState.assignee ? issue.issueState.assignee.emailAddress : ''));

      var verifierCell = document.createElement('TD');
      rowTag.appendChild(verifierCell);
      verifierCell.appendChild(document.createTextNode(issue.issueState.verifier ? issue.issueState.verifier.emailAddress : ''));

      var statusCell = document.createElement('TD');
      rowTag.appendChild(statusCell);
      statusCell.appendChild(document.createTextNode(issue.issueState.status));

      var phaseCell = document.createElement('TD');
      phaseCell.innerHTML = messages.WITHOUT_STATUS;

      var storyPointCell = document.createElement('TD');

      var stageCell = document.createElement('TD');
      stageCell.innerHTML = messages.WITHOUT_STAGE;

      var launchDateCell = document.createElement('TD');

      var stageLink = document.createElement('a');

      if(issue.issueState.customFields) {
        issue.issueState.customFields.forEach(function(customField) {
          if (customField.customFieldId === '62960') {
            phaseCell.innerHTML = (customField.enumValue === '' ? messages.WITHOUT_STATUS : customField.enumValue);
          }

          if (customField.customFieldId === '80345') {
            storyPointCell.appendChild(document.createTextNode(customField.enumValue === '' ? messages.WITHOUT_ESTIMATION : customField.enumValue));
          }

          if (customField.customFieldId === '126815') {
            if(customField.textValue != ''){
              stageLink.href = customField.textValue;
              stageLink.target = '_blank';
              stageLink.name = 'Stage';
              stageLink.appendChild(document.createTextNode('Stage Link'));
              stageCell.innerHTML = '';
              stageCell.appendChild(stageLink);
            }
          }

          if (customField.customFieldId === '62965') {
            var date = customField.dateValue;
            date.month -=1;
            var dateLaunch = moment(date).format();
            var launchDate = dateLaunch.substring(0,dateLaunch.indexOf('T'));
            launchDateCell.appendChild(document.createTextNode(customField.dateValue === '' ? messages.WITHOUT_LAUNCH : launchDate));
            //console.log(moment(date).format());
          }
        });
      }

      var commentCell = document.createElement('TD');
      var commentForm = document.createElement('FORM');

      commentForm.dataset.method = issue.method;
      commentForm.dataset.action = REST_DOMAIN;
      commentForm.dataset.gid = issue.issueId;

      /*var carryOverCell = document.createElement('TD');
      var carryOverList = document.createElement('SELECT');
      fillSelectOptions(carryOverList, carryOverCauses, )*/

      var commentInput = document.createElement('INPUT');
      commentInput.setAttribute('type', 'text');
      commentInput.setAttribute('name', 'comment');
      commentInput.value = issue.comment || '';
      commentForm.appendChild(commentInput);
      commentForm.addEventListener('submit', onFieldSubmit);
      commentCell.appendChild(commentForm);

      var statusCustomCell = document.createElement('TD');
      var statusCustomList = document.createElement('SELECT');
      fillSelectOptions(statusCustomList, ticketStates, issue.customStatus);
      statusCustomList.dataset.method = issue.method;
      statusCustomList.dataset.action = REST_DOMAIN;
      statusCustomList.dataset.gid = issue.issueId;
      statusCustomList.addEventListener('change',onFieldSubmit);
      statusCustomCell.appendChild(statusCustomList);

      var sprintDateCell = document.createElement('TD');
      var sprintDateForm = document.createElement('FORM');
      var sprintDateInput = document.createElement('INPUT');
      sprintDateInput.setAttribute('type', 'text');
      sprintDateInput.setAttribute('name', 'sprintDate');
      sprintDateInput.dataset.method = issue.method;
      sprintDateInput.dataset.action = REST_DOMAIN;
      sprintDateInput.dataset.gid = issue.issueId;
      sprintDateForm.appendChild(sprintDateInput);
      sprintDateCell.appendChild(sprintDateForm);

      var pickerSprintDate = new Pikaday({
        field: sprintDateInput,
        format: 'D MMM YYYY',
        firstDay: 0,
        defaultDate: new Date(issue.sprintDate),
        setDefaultDate: true
      });

      sprintDateInput.addEventListener('change', onFieldSubmit);

      var responsibleCell = document.createElement('TD');
      var responsibleForm = document.createElement('FORM');

      responsibleForm.dataset.method = issue.method;
      responsibleForm.dataset.action = REST_DOMAIN;
      responsibleForm.dataset.gid = issue.issueId;

      var responsibleSelect = document.createElement('SELECT');
      fillSelectOptions(responsibleSelect, responsibles, issue.responsible);
      responsibleSelect.setAttribute('name', 'responsible');
      responsibleForm.addEventListener('change', onFieldSubmit);
      responsibleForm.appendChild(responsibleSelect);
      responsibleCell.appendChild(responsibleForm);

      rowTag.appendChild(phaseCell);
      rowTag.appendChild(storyPointCell);
      rowTag.appendChild(stageCell);
      rowTag.appendChild(launchDateCell);
      rowTag.appendChild(commentCell);
      rowTag.appendChild(statusCustomCell);
      rowTag.appendChild(sprintDateCell);
      rowTag.appendChild(responsibleCell);
      //formWrapper.ape
      tableBody.appendChild(rowTag);
    });
  }

  pageToken = buganizerTickets.nextPageToken;

  if(pageToken){
    makeApiCall();
  }
}

function onFieldSubmit(evt){
  evt.preventDefault();

  var form = document.querySelector('form[data-gid="' + this.dataset.gid + '"]');
  var commentField = document.querySelector('form[data-gid="' + this.dataset.gid + '"] input[name="comment"]');
  var stateSelect = document.querySelector('select[data-gid="' + this.dataset.gid + '"]');
  var sprintDateField = document.querySelector('input[data-gid="' + this.dataset.gid + '"]');
  var responsibleField = document.querySelector('form[data-gid="' + this.dataset.gid + '"] select[name="responsible"]');

  var commentData = new FormData();
  commentData.gid = this.dataset.gid;
  commentData.comment = commentField.value;
  commentData.status = stateSelect.value;
  commentData.sprintDate = sprintDateField.value;
  commentData.responsible = responsibleField.value;

  this.customMethod = this.dataset.method;
  this.customAction = this.dataset.action;

  makeRequest(this.customMethod, this.customAction, 'onFieldSuccess', commentData);
  form.dataset.method = 'PUT';
  stateSelect.dataset.method = 'PUT';
}

function onFieldSuccess(response) {

}

function fillSelectOptions(select, data, selectedOption) {
  for(var key in data) {
    var option = document.createElement('OPTION');
    option.innerHTML = data[key];
    option.value = key;
    if (key === selectedOption) {
      option.selected = true;
    }
    select.appendChild(option);
  }
}


function makeRequest(method, url, handler, data) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      window[handler](this.response);
    }
  };

  xhttp.open(method, url, true);
  xhttp.setRequestHeader("Content-Type", "application/json");

  if(data) {
    xhttp.send(JSON.stringify(data));
  }  else {
    xhttp.send();
  }
}
