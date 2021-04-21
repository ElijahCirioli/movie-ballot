//transition UI elements to search screen
const transitionToSearch = () => {
	$("#lobby-wrap").hide();
	$("#home-wrap").hide();
	$("#list-wrap").hide();
	$("#search-wrap").show();
	$("#num-people-wrap").show();
	$("#home-button").show();
	$("#small-code-label").show();
	$("#search-results").empty();
	$("#search-box").val("");
	displayCompactList(personalList);

	state = "search";

	endListener();
	setNotDone();

	window.scrollTo(0, 0);
};

//query the database when a user types
const updateSearchResults = () => {
	const query = $("#search-box").val();
	if (query.length === 0) {
		$("#search-results").empty();
		return;
	}

	//send search request to The Movie Database (https://www.themoviedb.org/?language=en-US)
	$.get(
		`https://api.themoviedb.org/3/search/multi?api_key=12d2710cdadd77b992e913a3c3bf3fdb&language=en-US&page=1&include_adult=false&query=${query}`,
		(res) => {
			$("#search-results").empty();
			for (const movie of res.results) {
				if (movie.media_type !== "person") {
					addToSearchResults(movie);
				}
			}
		}
	).fail(() => {});
};

//add a movie to the search results
const addToSearchResults = (movie) => {
	//they use different formats for titles sometimes IDK why
	const title = movie.title ? movie.title : movie.name;
	if (title === undefined) return;

	const type = movie.media_type === "movie" ? "Movie" : "Series"; //find if it's a movie or show
	let year = movie.release_date ? movie.release_date.split("-")[0] : ""; //find when it was released
	//the date is a little different for TV shows
	if (year === "" && movie.first_air_date) {
		year = movie.first_air_date.split("-")[0];
	}
	//get urls for two different sizes of the poster
	const smallPoster =
		movie.poster_path !== null
			? `https://image.tmdb.org/t/p/w185_and_h278_bestv2/${movie.poster_path}`
			: "default_poster.png";
	const largePoster =
		movie.poster_path !== null
			? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
			: "default_poster_large.png";

	//format into html and append to search results div
	$("#search-results").append(
		`<div class="movie" id=${movie.id}>
			<img class="movie-poster" src=${smallPoster}>
			<p class="movie-title">${title}</p>
			<p class="movie-type">${type}</p>
			<p class="movie-year">${year}</p>
			<p class="movie-add-button">Add</p>
		</div>`
	);

	//add click event to the movie we just created
	$("#search-results")
		.children()
		.last()
		.children(".movie-add-button")
		.click(() => {
			//add it to your personal list
			personalList.push({
				id: movie.id,
				title: title,
				year: year,
				type: type,
				smallPoster: smallPoster,
				largePoster: largePoster,
				score: movie.vote_average,
				overview: movie.overview,
				active: true,
			});
			removePersonalDuplicates(personalList);
			displayCompactList(personalList);
			$("#search-results").empty();
			$(".text-field").val("");
			$(".text-field").focus();
		});
};

//remove duplicates movies from a list
const removePersonalDuplicates = (list) => {
	for (let i = 0; i < list.length; i++) {
		for (let j = 0; j < list.length; j++) {
			if (i !== j && list[i].id === list[j].id) {
				list.splice(j, 1);
				j--;
			}
		}
	}
};

//display a list of just titles
const displayCompactList = (list) => {
	$("#personal-list").empty();
	for (let i = 0; i < list.length; i++) {
		const movie = list[i];
		//append to div
		$("#personal-list").append(
			`<div class="compact-movie">
				<p class="compact-movie-title">${movie.title}</p>
				<p class="movie-remove-button">x</p>
			</div>`
		);

		//add events for clicking the x
		$("#personal-list")
			.children()
			.last()
			.children(".movie-remove-button")
			.click(() => {
				personalList.splice(i, 1);
				displayCompactList(list);
			});
	}

	if (list.length === 0) {
		$("#my-list-label").hide();
	} else {
		$("#my-list-label").show();
	}
};

//set server state that you're done adding movies
const setDone = () => {
	isDone = true;
	$("#done-search-button").text("Waiting");
	$("#search-box").attr("disabled", "disabled");
	$("#search-box").val("");
	$(".text-field").css("background-color", "#bababa");
	if (isHost) {
		$("#skip-wait-button").show();
	} else {
		$("#skip-wait-button").hide();
	}
};

//oopsie doopsie I'm actually not done
const setNotDone = () => {
	isDone = false;
	$("#done-search-button").text("Done");
	$("#search-box").removeAttr("disabled");
	$(".text-field").css("background-color", "#e3e3e3");
	$("#skip-wait-button").hide();
};

//handle events
$((ready) => {
	$(".text-field").keydown((event) => {
		if (event.keyCode === 13) {
			event.preventDefault();
			return false;
		}
	});

	$("#search-box").keydown((event) => {
		setTimeout(updateSearchResults, 10);
	});

	$("#done-search-button").click(() => {
		if (isDone) {
			setNotDone();
		} else {
			setDone();
		}
	});

	$("#skip-wait-button").click(() => {
		transitionToList();
	});
});
