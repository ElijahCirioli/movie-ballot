//transition UI to voting screen
const transitionToVoting = () => {
	state = "voting";

	$("#list-wrap").hide();
	$("#winner-display").hide();
	$("#num-people-wrap").show();
	$("#swipe-waiting-label").hide();
	$("#skip-vote-button").hide();
	$("#swipe-content").hide();
	$("#swipe-wrap").hide();
	$("#voting-wrap").show();
	$("#home-button").show();
	$("#small-code-label").show();

	endListener();
	isDone = false;

	//create list of active movies
	const activeList = [];
	for (const movie of totalList) {
		if (movie.active) activeList.push(movie);
	}
	//we only need to do this if there's at least two options
	if (activeList.length < 2) {
		transitionToList();
		return;
	}

	//display special UI elements if you're the host
	if (isHost) {
		$("#number-selection").show();
		$("#num-winners").attr("max", activeList.length);
		$("#num-winners").val(1);
		$("#num-winners").removeAttr("disabled");
		$("#num-winners").css("border", "1px solid #44b027");
	} else {
		$("#number-selection").hide();
	}
	$("#done-vote-button").text("Done");

	rankedList = [];
	displayVotingList(activeList);
};

//display two html lists for the ranked and unranked movies
const displayVotingList = (unrankedList) => {
	//display unranked movies
	$(".voting-list").empty();
	for (const movie of unrankedList) {
		$("#unranked-list").append(
			`<div class="movie" id=${movie.id}>
                <img class="movie-poster" src=${movie.smallPoster}>
                <p class="movie-title">${movie.title}</p>
                <p class="movie-type">${movie.type}</p>
                <p class="movie-year">${movie.year}</p>
				<p class="movie-add-button">Add</p>
            </div>`
		);
	}
	//display ranked movies
	for (let i = 0; i < rankedList.length; i++) {
		const movie = rankedList[i];
		$("#ranked-list").append(
			`<div class="ranked-list-movie">
				<div class="movie" id=${movie.id}>
					<p class="ranking-label">${i + 1}.</p>
					<img class="movie-poster" src=${movie.smallPoster}>
					<p class="movie-title">${movie.title}</p>
					<p class="movie-type">${movie.type}</p>
					<p class="movie-year">${movie.year}</p>
					<p class="vote-x">x</p>
					<div class="arrow up-arrow"></div>
					<div class="arrow down-arrow"></div>
            	</div>
			</div>`
		);
	}
	setupVotingButtons(unrankedList); //bind buttons for all the movies
};

//return the index of a movie from a list where the ID matches the target
const getIndex = (list, id) => {
	for (let i = 0; i < list.length; i++) {
		if (list[i].id == id) return i;
	}
	return -1;
};

const setupVotingButtons = (unrankedList) => {
	/* CANT BE ARROW FUNCTIONS SINCE WE NEED this */
	$(".up-arrow").click(function () {
		//find current index within ranked list
		const id = $(this).parent().attr("id");
		const index = getIndex(rankedList, id);

		//if it's not already first
		if (index > 0) {
			//swap it up
			const temp = rankedList[index - 1];
			rankedList[index - 1] = rankedList[index];
			rankedList[index] = temp;
			displayVotingList(unrankedList);
		}
	});

	$(".down-arrow").click(function () {
		//find current index within ranked list
		const id = $(this).parent().attr("id");
		const index = getIndex(rankedList, id);

		//if it's not already last
		if (index < rankedList.length - 1) {
			//swap it down
			const temp = rankedList[index + 1];
			rankedList[index + 1] = rankedList[index];
			rankedList[index] = temp;
			displayVotingList(unrankedList);
		}
	});

	$(".vote-x").click(function () {
		//move to unranked list
		const id = $(this).parent().attr("id");
		const index = getIndex(rankedList, id);
		if (index >= 0) {
			unrankedList.unshift(rankedList.splice(index, 1)[0]);
			displayVotingList(unrankedList);
		}
	});

	$("#unranked-list")
		.children(".movie")
		.children(".movie-add-button")
		.click(function () {
			//move to ranked list
			const id = $(this).parent().attr("id");
			const index = getIndex(unrankedList, id);
			if (index >= 0) {
				rankedList.push(unrankedList.splice(index, 1)[0]);
				displayVotingList(unrankedList);
			}
		});
};

$((ready) => {
	$("#skip-vote-button").click(() => {
		state = "list";
		transitionToList();
		setTimeout(calculateVotes, 300);
	});

	$("#done-vote-button").click(() => {
		if (isHost) {
			//check if they've entered a valid number of winners
			const num = $("#num-winners").val();
			if (num < 1 || num > totalList.length) {
				$("#num-winners").css("border", "1px solid red");
				alert("Please enter a valid number of winners");
				return;
			} else {
				$("#num-winners").css("border", "1px solid #44b027");
			}
		}

		isDone = !isDone; //toggle whether we're done

		if (isDone) {
			//update UI
			$("#done-vote-button").text("Waiting");
			$(".arrow").hide();
			$(".vote-x").hide();
			$(".movie-add-button").hide();
			$("#num-winners").attr("disabled", "disabled");

			//host specific options
			if (isHost) $("#skip-vote-button").show();
			else $("#skip-vote-button").hide();
		} else {
			//update UI
			$("#done-vote-button").text("Done");
			$("#skip-vote-button").hide();
			$(".arrow").show();
			$(".vote-x").show();
			$(".movie-add-button").show();
			$("#num-winners").removeAttr("disabled");
		}
	});
});
