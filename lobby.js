//transition UI to room lobby
const transitionToLobby = () => {
	$("#home-wrap").hide();
	$("#search-wrap").hide();
	$("#list-wrap").hide();
	$("#winner-display").hide();
	$("#swipe-wrap").hide();
	$("#lobby-wrap").show();
	$("#small-code-label").show();
	$("#home-button").show();
	$("#num-people-wrap").css("display", "flex");
	$("#big-code-label").text(roomCode);
	$("#small-code-label").text(roomCode);

	//change what displays based on whether you're host
	if (isHost) {
		$("#lobby-waiting-label").hide();
		$("#start-button").show();
		createRoom();
	} else {
		$("#lobby-waiting-label").show();
		$("#start-button").hide();
	}

	//add room code to url
	window.history.replaceState(null, null, `?code=${roomCode}`);

	endListener();
	clearInterval(updateThread);
	updateThread = setInterval(update, 250); //query the server every 250ms
	state = "lobby";

	window.scrollTo(0, 0);
};

$((ready) => {
	$("#copy-link-button").click(() => {
		//copy the link to the room
		const input = document.body.appendChild(document.createElement("input"));
		input.value = window.location.href;
		input.focus();
		input.select();
		document.execCommand("copy");
		input.parentNode.removeChild(input);
		window.scrollTo(0, 0);
	});

	$("#small-code-label").click(() => {
		//copy the code when you click the little icon
		const input = document.body.appendChild(document.createElement("input"));
		input.value = window.location.href;
		input.focus();
		input.select();
		document.execCommand("copy");
		input.parentNode.removeChild(input);
		window.scrollTo(0, 0);
	});

	$("#start-button").click(() => {
		transitionToSearch();
	});
});
