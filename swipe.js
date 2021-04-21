//transition UI to thumbs up/down mode
const transitionToSwipe = () => {
	state = "swipe";

	$("#list-wrap").hide();
	$("#winner-display").hide();
	$("#num-people-wrap").hide();
	$("#swipe-waiting-label").hide();
	$("#skip-swipe-button").hide();
	$("#swipe-content").show();
	$("#home-button").show();
	$("#small-code-label").show();
	$("#swipe-wrap").show();

	endListener();
	isDone = false;

	//create shuffled list of active movies
	const activeList = [];
	const totalListCopy = totalList.slice(0);
	while (totalList.length > 0) {
		const index = Math.floor(Math.random() * totalList.length);
		if (totalList[index].active) {
			activeList.push(totalList.splice(index, 1)[0]);
		} else {
			totalList.splice(index, 1);
		}
	}
	totalList = totalListCopy;
	//if there's no active movies then this is a waste of time
	if (activeList.length === 0) {
		transitionToList();
		return;
	}

	yesList = [];
	swipeMovies(activeList);
};

//display cards and add handlers for buttons and swiping
const swipeMovies = (activeList) => {
	//if we're done swiping
	if (activeList.length === 0) {
		//update UI
		$("#num-people-wrap").show();
		$("#swipe-waiting-label").show();
		$("#swipe-content").hide();
		isDone = true;

		if (isHost) $("#skip-swipe-button").show();
		else $("#skip-swipe-button").hide();
		return;
	}

	const movie = activeList.splice(0, 1)[0]; //remove an element and make it our current card
	$("#current-card").empty();
	$("#next-card").empty();
	createBigCard(movie, $("#current-card")); //create the actual HTML
	//lock the width in once it loads so it doesn't get funky as we swipe
	$(".big-card-poster").on("load", function () {
		const width = $(this).parent().width();
		if (width > 0) {
			$(this)
				.parent()
				.css("max-width", width + "px");
		}
	});
	//if there's another card display that small and behind the first one
	if (activeList.length > 0) {
		createBigCard(activeList[0], $("#next-card"));
	}

	//Button controls
	$(".swipe-button").unbind("click");
	$("#yes-button").click(() => {
		yesList.push(movie.id);
		animateCard("", "#59d936");
		setTimeout(swipeMovies, 200, activeList);
	});
	$("#no-button").click(() => {
		animateCard("-", "#de402f");
		setTimeout(swipeMovies, 200, activeList);
	});

	//Swipe controls
	const swipeArea = $("#card-holder");
	swipeArea.off("mousedown touchstart mousemove touchmove mouseup touchend touchcancel mouseleave");
	const pageCenter = $("#card-holder").width() / 2;
	let animating = false;
	swipeArea.css("cursor", "grab");
	//when mouse clicks down
	swipeArea.on("mousedown touchstart", (a) => {
		if (animating) return; //as long as we're not in the middle of an animation
		//mark starting position and begin tracking movement
		const startPos = a.pageX || a.originalEvent.touches[0].pageX;
		swipeArea.on("mousemove touchmove", (e) => {
			if (animating) return;
			const xPos = e.pageX || e.originalEvent.touches[0].pageX;
			const offset = Math.round(xPos - startPos);
			$("#current-card").css("left", 2 * offset); //move card div
			//check if we've reached the threshold for a complete swipe
			if (offset * 1.6 > pageCenter) {
				animating = true;
				swipeArea.off("mousedown touchstart mousemove touchmove mouseup touchend touchcancel mouseleave");
				$("#yes-button").click(); //just use the buttons it's easier
			} else if (offset * 1.6 < -pageCenter) {
				animating = true;
				swipeArea.off("mousedown touchstart mousemove touchmove mouseup touchend touchcancel mouseleave");
				$("#no-button").click(); //just use the buttons it's easier
			}
		});
		swipeArea.css("cursor", "grabbing");
	});
	//when mouse is released
	swipeArea.on("mouseup touchend touchcancel mouseleave", (e) => {
		//remove handlers to stop moving the card around
		swipeArea.off("mousemove touchmove");
		swipeArea.css("cursor", "grab");
		if (!animating) $("#current-card").css("left", 0); //reset card position
	});
};

//get that card outta here! (in the given direction)
const animateCard = (direction, color) => {
	//all of this relies on CSS transitions
	$("#current-card").css("left", direction + "100vw");
	$("#current-card").css("opacity", "0.7");
	$("#current-card").children(".big-card").css("background-color", color);
	$("#next-card").css("opacity", "1");
	$("#next-card").css("transform", "scale(1)");
	setTimeout(() => {
		$("#card-holder").addClass("no-transition"); //turn off transitions so it doesn't animate back
		$("#next-card").css("opacity", "0");
		$("#next-card").css("transform", "scale(0.8)");
		$("#current-card").css("left", "0");
		$("#current-card").css("opacity", "1");
		$("#card-holder")[0].offsetHeight;
		$("#card-holder").removeClass("no-transition");
	}, 200);
};

$((ready) => {
	$("#skip-swipe-button").click(() => {
		state = "list";
		transitionToList();
		setTimeout(calculateFavorability, 300);
	});
});
