/**
 * title: dog-2019-구형모.js
 * author: Koo Hyong Mo (chrisais9@naver.com)
 */



var gameState = 0 // 게임 상태 (시작전에 알 클릭 안되도록 설정하는데 쓰임)

// 게임 설정 관련 변수
var maxEggNumber = 24; // 최대 달걀 개수 (24 고정)
var customFindDogs = 8; // 남은 달걀 개수 (alert 로 사용자가 입력 가능)
var customTime = 20; // 찾는 시간

// 게임 런타임 관련 변수
var failCount = 0
var remainCount = 0
var gameLoopIntervalID


var dogArray = []; // 강아지가 들어있는 달걀 번호 (왼쪽 위 부터 차례로 0~24)
var foundDogArray = []; // 찾은 강아지가 들어있는 번호 (런타임 에서 활용)

// BGM 자동 재생 관련 이슈 
// (https://stackoverflow.com/questions/50490304/how-to-make-audio-autoplay-on-chrome)
window.onload = function() {
    var context = new AudioContext();
};
// 메인 BGM 볼륨 조절
$('#mainbgm').prop("volume", 0.4);


initialize();

// 초기화 함수:  처음 로드 되었을때, 게임을 다시 시작할때 사용 
function initialize() {

    // attribute들 초기화
    gameState = 0;

    failCount = 0;
    remainCount = 0;

    preTimersec = 10;

    dogArray = [];
    foundDogArray = [];

    clearInterval(gameLoopIntervalID);

    // 모든 태그들 초기화
    $('#gameover-success').hide();
    $('#gameover-fail').hide();

    $('#p-start-game').show();
    $('#p-remain').text("남은수 : " + remainCount);
    $('#p-fail').text("실패수 : " + failCount);
    $('#p-timer').text('시간 0');
    $('#p-instruction').text('게임이 진행될 예정 입니다.')

    // 게임보드 만들어줌
    makeGameBoard();

}

// max 까지 랜덤 정수 반환
function generateRandom(max) {
    return Math.floor(Math.random() * max);
}

// 강아지가 들어있을 알 번호 랜덤으로 추출해서 dogArray에 넣어줌
function generateDogPosition() {
    for (var i = 0; i < customFindDogs; i++) {
        while (1) {
            var rand = generateRandom(maxEggNumber)
            if (dogArray.indexOf(rand) == -1) {
                dogArray.push(rand)
                break;
            }
        }
    }
}

// 게임 시작 버튼 클릭
$('#p-start-game').click(function() {
    initialize();

    // 남은 강아지수 (몇 마리의 강아지를 찾을지) 설정
    // false 면 prompt 에서 취소 한거임
    if (!setCustomFindDog()) {
        initialize();
        return;
    }

    // 남은 시간수 (몇 초 동안 강아지를 찾을지) 설정
    // false 면 prompt 에서 취소 한거임
    if (!setCustomTime()) {
        initialize();
        return;
    }

    // 강아지가 들어있는 알 랜덤으로 추출
    generateDogPosition();

    // 10초간 강아지 보여주기
    showDogsTemporary();

    // 게임시작 버튼 숨기기
    $(this).hide();
})

function showDogsTemporary() {
    // 강아지가 위치한 알은 임시로 보여줌 10초간
    for (var i = 0; i < maxEggNumber; i++) {
        var egg = $("#egg" + i)
        if (dogArray.indexOf(parseInt(i)) != -1) {
            egg.find('img').attr("src", "assets/img2.gif");
        }
    }

    var preTimersec = -1;
    $('#p-instruction').text('숨은 그림을 보세요');
    var intervalID = setInterval(function() {
        preTimersec++;
        $("#p-timer").text("시간 " + (10 - preTimersec));
        if (preTimersec >= 10) {
            // 게임 시작됨. 강아지를 찾아야됨
            gameState = 1;
            // 판 다시 그려줌 (강아지 안보이게)
            makeGameBoard();
            $('#p-instruction').text('정답을 찾으세요');

            // 만약 customTime 안에 강아지를 찾지 못하면 게임 오버
            setGameLoopTimeout();

            clearInterval(intervalID)
        }
    }, 1000);
}

function setGameLoopTimeout() {
    var sec = -1;
    gameLoopIntervalID = setInterval(function() {
        sec++;
        $('#p-timer').text('시간 ' + (customTime - sec));
        if (sec >= customTime) {
            gameOver(false);
            clearInterval(gameLoopIntervalID);
        }
    }, 1000);
}

// 알 클릭
$(document).on('click', 'td', function() {

    // 게임 시작 안되었으면 클릭 X

    if (gameState == 0) return;

    // 누른 알의 인덱스를 구함 <td id='egg11'> -> 11
    // @see makeGameboard()
    var idx = parseInt($(this).attr('id').slice(3));

    if (dogArray.indexOf(idx) != -1) {
        // 강아지가 있는 알을 누르면

        // 찾은 강아지 배열에 넣어주고 (나중에 game over 되었을때 표시 할 예정)
        foundDogArray.push(idx);

        // 강아자 보여주고
        $(this).find('img').attr("src", "assets/img2.gif");

        // 띠링 재생해주고
        var effect = new Audio("assets/chimes.mp3");
        effect.play();

        // 남아 있는 강아지 - 1
        remainCount++;
        $('#p-remain').text("남은수 : " + (customFindDogs - remainCount));

        // 만약 다 찾으면 게임 승리
        if (remainCount == customFindDogs) {
            gameOver(true)
        }
    } else {
        // 강아지가 없는 알을 누르면

        // 삐익 재생해주고
        var effect = new Audio("assets/bad.mp3");
        effect.play();

        // 실패수 증가
        failCount++;
        $('#p-fail').text("실패수 : " + failCount);

        // 실패수 5 초과 하면 게임 실패
        if (failCount > 5) {
            gameOver(false);
        }
    }
})

function gameOver(isSuccess) {
    // 게임 상태 변경
    gameState = 0;
    clearInterval(gameLoopIntervalID);

    // 게임 시작 버튼 다시 보여주기
    $('#p-start-game').show();

    if (isSuccess) {
        // 게임 성공 했을때
        var effect = new Audio("assets/tada.mp3");
        effect.play();
        $('#gameover-success').show();
        $('#p-instruction').text('성공');
    } else {
        // 게임 실패 했을때

        // 효과음 재생 해줌 (박수음)
        var effect = new Audio("assets/ending.mp3");
        effect.play();

        // 개암사적 버튼 보여주고
        $('#gameover-fail').show();
        $('#p-instruction').text('실패');

        // 못찾은 강아지들 보여줌
        showNotFoundDogs();
    }
}

function showNotFoundDogs() {
    for (var i = 0; i < maxEggNumber; i++) {
        // 아래는 못찾은 강아지들 보여주는 로직
        var egg = $("#egg" + i)
        if (dogArray.indexOf(i) != -1) {

            egg.find('img').attr("src", "assets/img2.gif");

            // 못찾은 강아지 빨간 박스로 강조 하도록 class 추가
            if (foundDogArray.indexOf(i) == -1) {
                egg.addClass('class-not-found');
            }
        }
    }
}

function setCustomFindDog() {
    while (1) {
        var n = prompt("🐶 몇 마리의 강아지를 찾으실건가요~~? (정수, n < 8)")
        if (n == null) {
            // 사용자가 취소 누르면 다시 처음 부터
            return false;
        }
        if (isFinite(n) && n < 8) {
            customFindDogs = n;
            return true;
        }
    }
}

function setCustomTime() {
    while (1) {
        var n = prompt("⏳ 몇 초 동안 강아지를 찾으실건가요~~? (정수, n < 30)")
        if (n == null) {
            // 사용자가 취소 누르면 다시 처음 부터
            return false;
        }
        if (isFinite(n) && n < 30) {
            customTime = n;
            return true;
        }
    }
}

function makeGameBoard() {
    var tableCode = '<tr>';
    for (var i = 0; i < 24; i++) {
        if (i > 0 && i % 8 == 0) {
            tableCode += '</tr><tr>';
        }
        tableCode += "<td id=egg" + i + "><img src=assets/img1.gif></td>";
    }
    tableCode += '</tr>';

    $('#board').html(tableCode);
}