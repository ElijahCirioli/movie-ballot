/*
    GLOBAL VARIABLES
*/
const database = firebase.database();
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let roomCode, userID;
let isHost = false;
let isDone = false;
let state = "home";
let updateThread, listener;
let personalList = []; //the movies I chose
let totalList = []; //the list of all movies
let yesList = []; //the list of movies I would watch
let rankedList = []; //my favorite movies ranked

//transition UI to home screen
const transitionToHome = () => {
	clearInterval(updateThread);
	endListener();

	//delay a little bit to be sure the listener won't send us back
	setTimeout(() => {
		state = "home";
		isHost = false;

		//change div visibility
		$("#home-wrap").show();
		$("#lobby-wrap").hide();
		$("#search-wrap").hide();
		$("#list-wrap").hide();
		$("#swipe-wrap").hide();
		$("#swipe-content").hide();
		$("#voting-wrap").hide();
		$("#winner-display").hide();
		$("#small-code-label").hide();
		$("#home-button").hide();
		$("#num-people-wrap").hide();
		$("#host-notification").hide();
		$("#room-code-box").css("border", "1px solid #44b027");
		$("#room-code-box").val("");

		//remove url params
		if (window.location.href.includes("?code=")) {
			window.history.replaceState(null, null, window.location.href.split("?code=")[0]);
		}

		setNotDone();
		personalList = []; //the movies I chose
		totalList = []; //the list of all movies
		yesList = []; //the list of movies I would watch
		rankedList = []; //my favorite movies ranked

		window.scrollTo(0, 0);
	}, 50);
};

//create ID for room (lots of potential for bad words but I'm too lazy to make a filter)
const generateRoomCode = (length) => {
	roomCode = "";
	for (let i = 0; i < length; i++) {
		const index = Math.floor(Math.random() * letters.length);
		roomCode += letters.split("")[index];
	}
};

//create hidden ID for user to identify them server-side
const generateUserID = (length) => {
	userID = "";
	for (let i = 0; i < length; i++) {
		const index = Math.floor(Math.random() * letters.length);
		userID += letters.split("")[index];
	}
};

//check if there is a room code in the url
const checkUrlParameters = () => {
	const params = window.location.href.split("?code=");
	if (params.length > 1) {
		isHost = false;
		attemptToJoin(params[1]);
	}
};

$((ready) => {
	generateUserID(10);
	checkUrlParameters();

	$("#create-room-button").click(() => {
		generateRoomCode(4);
		isHost = true;
		transitionToLobby();
	});

	$("#join-room-button").click(() => {
		isHost = false;
		const attemptedCode = $("#room-code-box").val().toUpperCase();
		if (attemptedCode.length === 0) {
			$("#room-code-box").css("border", "1px solid red");
		} else {
			attemptToJoin(attemptedCode);
		}
	});

	$("#home-button").click(() => {
		transitionToHome();
	});

	$("form").submit(() => {
		return false;
	});

	$("#host-notification").click(() => {
		$("#host-notification").hide();
	});

	transitionToHome();
});
