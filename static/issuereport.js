'use strict';

/**
 * The root URL for the Issue Tracker API.
 * This API talks to the same backend as http://buganizer
 * This is the Buganizer production datastore.
 */
var ISSUE_TRACKER_API_ROOT = 'https://issuetracker.corp.googleapis.com';

/**
 * Discovery file path.
 */
var DISCOVERY_PATH = '/$discovery/rest';

/**
 * The version of the Issue Tracker API.
 */
var ISSUE_TRACKER_API_VERSION = 'v1';

/**
 * A client ID for a web application from the Google Developers Console.
 */
//'693999850130-8nk5le2hgvadjmf7qru59ec4nmp2k6m4.apps.googleusercontent.com'; demo ID
var CLIENT_ID = '1027985290991-tp6lmvnn8hh46daclgjm23go2kf4q2im.apps.googleusercontent.com';
//var CLIENT_ID ='1027985290991-3ffmu50fj1fh05o71hmndlt0v423l4d3.apps.googleusercontent.com';

/**
 * The space-delimited list of scopes to authorize
 */
var SCOPES = 'https://www.googleapis.com/auth/buganizer';

var tableBody = document.getElementById('reportTable');
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
        'query': 'savedsearchid:551706' + ' status:assigned | status:accepted',
        'page_token': pageToken,
        'page_size': pageSize
      });

      request.execute(handleResponse);
  });
}

console.log('weekStart '+weekStart);

function filter(query){
  var request = gapi.client.corp_issuetracker.issues.list({
  'query': query,
  'page_token': pageToken,
  'page_size': pageSize
  });
  elem('#reportTable').clear();
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

/**
 * Displays the list of issues.
 *
 * @param {?Object} response The response payload.
 */
function handleResponse(response) {
  // Something went wrong.
  if (!response) {
    alert('A bad request was made.');
    return;
  }

  elem('#issues').clear();

  if (!response['issues']) {
    elem('#issues').append(document.createTextNode('No issues found.'));
  } else {
    response.issues.forEach(function(issue) {
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

      var stageLink = document.createElement('a');

      var storyPointCell = document.createElement('TD');

      var stageCell = document.createElement('TD');
      stageCell.innerHTML = messages.WITHOUT_STAGE;

      var launchDateCell = document.createElement('TD');


      if(issue.issueState.customFields) {
        issue.issueState.customFields.forEach(function(customField) {
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

      rowTag.appendChild(storyPointCell);
      rowTag.appendChild(stageCell);
      rowTag.appendChild(launchDateCell);

      tableBody.appendChild(rowTag);
      //elem('#issues').append(item);
    });
  }

  pageToken = response.nextPageToken;

  if(pageToken ){
    makeApiCall();
  }
}
