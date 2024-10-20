var token = "7674881311:AAHbNtFIHCHfdpGc_lehoOP7WJ8r9FMHMo4";     // 1. FILL IN YOUR OWN TOKEN
var telegramUrl = "https://api.telegram.org/bot" + token;
var webAppUrl = "https://script.google.com/macros/s/AKfycbwDPUjmBWLQoazk7bmbgDKlInhOOYmFhRVHZ50DCy7E2MN8pqJ50PdB1y4P8xEyks4Mrw/exec"; // 2. FILL IN YOUR GOOGLE WEB APP ADDRESS
var ssId = "1m0wrn2aaCY8wdKIFpxKg_k1O8ZMf1impeOIfAymcMnw";      // 3. FILL IN THE ID OF YOUR SPREADSHEET
var adminID = "6501682762";   // 4. Fill in your own Telegram ID for debugging

function getMe() {
  var url = telegramUrl + "/getMe";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function setWebhook() {
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function sendText(id,text) {
  var url = telegramUrl + "/sendMessage?chat_id=" + id + "&text=" + encodeURIComponent(text);
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function doGet(e) {
  return HtmlService.createHtmlOutput("Hi there");
}

function doPost(e) {
  try {
    // this is where telegram works
    var data = JSON.parse(e.postData.contents);
    var text = data.message.text;
    var id = data.message.chat.id;
    var name = data.message.chat.first_name + " " + data.message.chat.last_name;

    if (text == "/start") {
      sendText(id, "Welcome " + name + "! Please enter your membership card number to proceed.");
      return;
    }

    if (/^\/check/.test(text)) {
      checkUserTier(id, name);
      return;
    }

    // If input looks like a card number (you can adjust regex as per your card format)
    if (/^\d+$/.test(text)) {
      checkMembership(id, text);
      return;
    }

    // Default response
    var answer = "Hi " + name;
    sendText(id, answer);
    SpreadsheetApp.openById(ssId).getSheets()[0].appendRow([new Date(), id, name, text, answer]);

  } catch(e) {
    sendText(adminID, JSON.stringify(e,null,4));
  }
}

// Function to check membership based on card number
function checkMembership(id, cardNumber) {
  var sheet = SpreadsheetApp.openById(ssId).getSheets()[0]; // Assuming MembershipDB is the first sheet
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) { // Assuming first row is headers
    if (data[i][0] == cardNumber) { // Column 1 is Card Number
      var tier = data[i][1]; // Column 2 is Tier
      var links = data[i][2]; // Column 3 is Links
      sheet.getRange(i + 1, 4).setValue(id); // Store Telegram ID in column 4
      sendText(id, "Welcome! Your membership tier is: " + tier + ". Here are your links: " + links);
      return;
    }
  }
  sendText(id, "Sorry, the card number is not found. Please try again.");
}


// Function to check user's tier (triggered by /check command)
function checkUserTier(id, name) {
  var sheet = SpreadsheetApp.openById(ssId).getSheets()[0]; // Assuming MembershipDB is the first sheet
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) { // Assuming first row is headers
    if (data[i][0] == id) { // Checking by Telegram ID
      var tier = data[i][1]; // Column 2 is Tier
      var links = data[i][2]; // Column 3 is Links
      sendText(id, name + ", your current membership tier is: " + tier + ". Here are your associated links: " + links);
      return;
    }
  }
  sendText(id, name + ", we could not find your membership. Please contact support.");
}
