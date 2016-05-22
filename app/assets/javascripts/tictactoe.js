$(function(){
  attachListeners();
});

var turn = 0;
var currentGame = 0;
var gameSaved = false;
var x, y;

function attachListeners(){
  var moves = [
    [0,0],
    [0,1],
    [0,2],
    [1,0],
    [1,1],
    [1,2],
    [2,0],
    [2,1],
    [2,2]
  ];
  var available = moves; 
  $('td').on("click", function(){
    x = $(this).attr("data-x");
    y = $(this).attr("data-y");
    doTurn();
    console.log("[" + x + "," + y + "]");
  }); 
  $('#previous').on("click", function() {
    getAllGames();
  });
  $("#save").on("click", function() {
    if (gameSaved === false) {
      saveGame();
    } else {
      updateGame();
    }
  });
  $("#games").on("click", "div", function(){
    var id = $(this).attr('data-gameid');
    id = Number(id);
    loadGame(id);
    currentGame = id;
  });
}


function doTurn(){
  if ( isTaken(x,y) ){
    return;
  }
  updateState();
  turn++;
  if ( checkWinner() ) {
    saveGame();
    turn = 0;
    resetBoard();
    gameSaved = false;
    currentGame = 0;
  }
}
//////////////////////////////
// Winner Checking Functions
//////////////////////////////

function checkWinner(){
  for ( var i = 0 ; i < 3 ; i++ ) {
    if ( isVerticalWin(i) ) {
      return message("Player " + isVerticalWin(i) + " Won!");
    }
    if ( isHorizontalWin(i) ) {
      return message("Player " + isHorizontalWin(i) + " Won!");
    }
    if ( isDiagonalWin() ) {
      return message("Player " + isDiagonalWin() + " Won!");
    }
  }
  if ( turn === 9 ) {
    return message("Tie game");
  } else {
    return false;  
  }
}

function isVerticalWin(x) {
  var column = $('td[data-x=' + x + ']');
  if ( getValue(column[0]) === getValue(column[1]) && getValue(column[1]) === getValue(column[2]) && (getValue(column[0]) === "X" || getValue(column[0]) === "O") ) {
    return getValue(column[0]);
  } else {
    return false;
  }
}

function isHorizontalWin(y) {
  var row = $('td[data-y=' + y + ']');
  if ( getValue(row[0]) === getValue(row[1]) && getValue(row[1]) === getValue(row[2]) && (getValue(row[0]) === "X" || getValue(row[0]) === "O") ) {
    return getValue(row[0]);
  } else {
    return false;
  }
}

function isDiagonalWin() {
  if ( getXYValue(0,0) === getXYValue(1,1) && getXYValue(1,1) === getXYValue(2,2) && ( getXYValue(0,0) === "X" || getXYValue(0,0) === 'O' ) ) {
    return getXYValue(0,0);
  } else if ( getXYValue(2,0) === getXYValue(1,1) && getXYValue(1,1) === getXYValue(0,2) && (getXYValue(0,2) === "X" || getXYValue(0,2) === "O") ) {
    return getXYValue(0,2);
  } else {
    return false;
  }
}

function message(string) {
  return $("#message").html(string);
}

//////////////////////////////////
// Checking and Setting Cell State
//////////////////////////////////

function getValue(cell) {
  return cell.innerHTML;
}

function getXYValue(x,y) {
  return $('td[data-x=' + x + '][data-y=' + y + ']')[0].innerHTML;
}

function setXYValue(x,y,value) {
  $('td[data-x=' + x + '][data-y=' + y + ']')[0].innerHTML = value;
}

function isTaken(x,y) {
  if ( getXYValue(x,y) === '' ) {
    return false;
  } else {
    return true;
  }
}

function updateState(){ 
  $('td[data-x=' + x + '][data-y=' + y + ']')[0].innerHTML = player();
}

function resetBoard() {
  var cells = $('td');
  $.each(cells, function(index, value){
    value.innerHTML = "";
  });
}

function player() {
  if ( turn % 2 == 0 ) {
    return "X"
  } else {
    return "O"
  }
}

//////////////////////
// AJAX Requests
//////////////////////


function getAllGames() {
  $.get('/games').done(function(data) {
    var games = data["games"];
    var html = "";
    $.each(games, function(index, value){
      var item = '<div data-gameid="' + value["id"] + '">';
        item += value["id"];
      item += "</div>";
      html += item;
    });
    if (data["games"].length > 0) {
      $("#games").html(html); 
    }
    return games;
  });
}

function loadGame(id) {
  $.get('/games/'+ id).done(function(data){
    var gameState = data["game"]["state"];
    setState(gameState);
    currentGame = data["game"]["id"];
    resetTurn();
  });
}

function saveGame() {
  console.log("Current Game (before save): " + currentGame);
  var gameState = getState();
  console.log(gameState);
  var hash = { "game": { "state": gameState } };
  var url = "/games";
  var posting = $.post(url, hash);
  posting.done(function(data){
    console.log("id: " + data["game"]["id"]);
    currentGame = data["game"]["id"];
    console.log("Current Game (after save): " + currentGame);
    console.log("Saved?:" + gameSaved);
    gameSaved = true;

    return data;
  });
}

function updateGame() {
  console.log("Current Game (before update): " + currentGame);
  var gameState = getState();
  var hash = { "game": { "id": currentGame, "state": gameState } }; 
  var url = "/games/" + currentGame;
  console.log(url);
  $.ajax({
    data: hash, 
    type: "PATCH", 
    url: url, 
    success: function(data) {
      console.log(data);
    }
  })
  console.log("Current Game (after update): " + currentGame);
}

//////////////////////////////////////
// Saving and Reloading the Game State
//////////////////////////////////////

function getState() {
  var gameState = [];
  for ( var col = 0 ; col < 3 ; col++ ) {
    for (var row = 0 ; row < 3 ; row++ ) {
      gameState.push(getXYValue(row, col));
    }
  }
  return gameState;
}

function setState(gameState) {
  i = 0;
  for ( var col = 0 ; col < 3 ; col++ ) {
    for (var row = 0 ; row < 3 ; row++ ) {
      setXYValue(row, col, gameState[i]);
      i++;
    }
  }
}

function resetTurn() {
  i = 0
  for ( var col = 0 ; col < 3 ; col++ ) {
    for (var row = 0 ; row < 3 ; row++ ) {
      if ( isTaken(row, col) ){
        i++;
      }
    }
  }
  turn = i;
  return turn;
}