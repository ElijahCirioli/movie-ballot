//transition UI elements to list display
const transitionToList = () => {
	state = "list";
	isDone = false;

	$("#home-wrap").hide();
	$("#search-wrap").hide();
	$("#lobby-wrap").hide();
	$("#list-controls-wrap").hide();
	$("#list-waiting-label").show();
	$("#num-people-wrap").show();
	$("#list-wrap").show();
	$("#winner-display").hide();
	$("#add-more-button").hide();
	$("#enable-all-button").hide();
	$("#enable-all-button").hide();
	$("#swipe-wrap").hide();
	$("#voting-wrap").hide();
	$("#home-button").show();
	$("#small-code-label").show();
	$("#total-list").empty();

	addToMasterList(personalList); //add personal movies to database
	setTimeout(startListener, 250); //wait a second and then start listening for changes in the DB

	//show buttons if you're the host
	if (isHost) {
		$("#list-controls-wrap").css("display", "flex");
		$("#list-waiting-label").hide();
		$("#add-more-button").show();
		$("#enable-all-button").show();
	} else {
		$("#list-controls-wrap").css("display", "none");
		$("#list-waiting-label").show();
		$("#add-more-button").hide();
		$("#enable-all-button").hide();
	}
};

//turn the json list of everyone's movies into something visible
const displayTotalList = () => {
	$("#total-list").empty();
	for (const movie of totalList) {
		//add html for the movie
		$("#total-list").append(
			`<div class="movie" id=${movie.id}>
                <img class="movie-poster" src=${movie.smallPoster}>
                <p class="movie-title">${movie.title}</p>
                <p class="movie-type">${movie.type}</p>
                <p class="movie-year">${movie.year}</p>
            </div>`
		);

		//set it's active state
		const movieElement = $("#total-list").children(".movie").last();
		if (movie.active) setActive(movieElement, movie.id);
		else setInactive(movieElement, movie.id);

		//if you're the host let you click to deactivate it
		if (isHost) {
			movieElement.click(() => {
				if (movie.active) {
					setInactive(movieElement);
					setServerActive(`${movie.index}-${movie.id}`, false);
				} else {
					setActive(movieElement);
					setServerActive(`${movie.index}-${movie.id}`, true);
				}
				movie.active = !movie.active;
			});
		}

		setTimeout(displayWinner, 100);
	}
	if (isHost) {
		$(".movie").css("cursor", "pointer");
	}
};

//set movie as active on the client side
const setActive = (element) => {
	element.children(".movie-title").css("text-decoration-line", "none");
	element.removeClass("movie-inactive");
};

//set movie as inactive on the client side
const setInactive = (element) => {
	element.children(".movie-title").css("text-decoration-line", "line-through");
	element.addClass("movie-inactive");
};

//select 1 random movie from the pool of active movies
const pickRandom = () => {
	//split the current list into active and inactive lists
	let wasInactiveList = [];
	let wasActiveList = [];
	for (const movie of totalList) {
		if (movie.active) wasActiveList.push(movie);
		else wasInactiveList.push(movie);
	}
	//shuffle the active list
	let newActiveList = [];
	while (wasActiveList.length > 0) {
		const index = Math.floor(Math.random() * wasActiveList.length);
		wasActiveList[index].active = false;
		newActiveList.push(wasActiveList.splice(index, 1)[0]);
	}

	if (newActiveList.length > 0) newActiveList[0].active = true; //set the first element as active
	let combinedList = newActiveList.concat(wasInactiveList); //combine the lists to make one big one

	emptyMasterList();
	setTimeout(addToMasterList, 50, combinedList);
};

//display a big card to represent the winner
const displayWinner = () => {
	//make sure that we even should be displaying a winner
	if (totalList.length == 0) return;
	let numActive = 0;
	for (const movie of totalList) {
		if (movie.active) numActive++;
	}
	if (numActive !== 1) return;

	//add a big card for the winner
	for (const movie of totalList) {
		if (movie.active) {
			$("#winner-card-wrap").empty();
			createBigCard(movie, $("#winner-card-wrap"));
			$("#winner-display").show();
			return;
		}
	}
};

//create html for a big card of a given movie
const createBigCard = (movie, target) => {
	target.append(
		`<div class="big-card" id=${movie.id}>
			<img class="big-card-poster" src=${movie.largePoster}>
			<p class="big-card-title">${movie.title}</p>
			<div class="big-card-details">
				<p class="big-card-year">${movie.year}</p>
				<p class="big-card-type">${movie.type}</p>
				<div class="big-card-score-wrap"><div class="star-cutout"></div><p class="big-card-score">${movie.score}/10</p></div>
			</div>
			<p class="big-card-overview"><i>${movie.overview}</i></p>
		</div>`
	);
};

//handle events
$((ready) => {
	$("#add-more-button").click(() => {
		emptyMasterList();
		transitionToSearch();
	});

	$("#enable-all-button").click(() => {
		//set all movies to active (host only)
		for (const movie of totalList) {
			setServerActive(`${movie.index}-${movie.id}`, true);
		}
	});

	$("#random-button").click(() => {
		pickRandom();
	});

	$("#vote-button").click(() => {
		transitionToVoting();
	});

	$("#thumb-button").click(() => {
		transitionToSwipe();
	});

	$("#winner-card-x").click(() => {
		$("#winner-display").hide();
	});
});
