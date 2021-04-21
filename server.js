//add a new room to the database
const createRoom = () => {
	purgeOldRooms();

	database.ref(`/${roomCode}`).set({
		date: Date.now(),
		code: roomCode,
		users: null,
		movies: null,
		state: "lobby",
	});

	database.ref(`/${roomCode}/users/${userID}`).set({
		date: Date.now(),
		host: isHost,
		done: isDone,
	});
};

//delete old rooms after 3 hours
const purgeOldRooms = () => {
	database
		.ref("/")
		.once("value")
		.then((snapshot) => {
			Object.entries(snapshot.val()).forEach((room) => {
				room = room[1];
				if (Date.now() - room.date > 10800000) {
					database.ref(`/${room.code}`).remove();
				}
			});
		});
};

//try to join a room with a given code
const attemptToJoin = (code) => {
	database
		.ref(`/${code}`)
		.once("value")
		.then((snapshot) => {
			//see if the query returned anything
			if (snapshot.exists()) {
				$("#room-code-box").css("border", "2px solid #44b027");
				roomCode = code;
				transitionToLobby();
			} else {
				//nope it didn't
				$("#room-code-box").css("border", "2px solid red");
				$("#room-code-box").val("");
			}
		});
};

//add a set of movies to the master list in the database
const addToMasterList = (list) => {
	let i = 0;
	for (const movie of list) {
		//make sure we don't put in duplicates
		if (alreadyInTotal(movie.id)) continue;
		//add to database
		database.ref(`/${roomCode}/movies/${i}-${movie.id}`).set({
			index: i,
			id: movie.id,
			title: movie.title,
			year: movie.year,
			type: movie.type,
			score: movie.score,
			overview: movie.overview,
			smallPoster: movie.smallPoster,
			largePoster: movie.largePoster,
			active: movie.active,
		});
		i++;
	}
};

//remove all movies from master list
const emptyMasterList = () => {
	database.ref(`/${roomCode}/movies`).child("/").remove();
};

//start listening for changes in the master list and update my own totalList accordingly
const startListener = () => {
	endListener();
	listener = database.ref(`/${roomCode}/movies`).on("value", (snapshot) => {
		//something has changed, rewrite totalList
		totalList = [];
		if (snapshot.exists()) {
			Object.entries(snapshot.val()).forEach((movie) => {
				movie = movie[1];
				//watch out for duplicates
				if (!alreadyInTotal(movie.id)) totalList.push(movie);
			});
		}
		displayTotalList();
	});
	displayTotalList();
};

//stop listening to those things
const endListener = () => {
	if (listener) {
		database.ref(`/${roomCode}/movies`).off("value", listener);
		listener = undefined;
	}
};

//set a given movie as active or inactive on the server side
const setServerActive = (id, active) => {
	let updates = {};
	updates["/active"] = active;
	database.ref(`/${roomCode}/movies/${id}`).update(updates);
};

//return whether a movie is already in the total list
const alreadyInTotal = (id) => {
	for (const movie of totalList) {
		if (movie.id === id) return true;
	}
	return false;
};

//calculate a given number of winners from ranked choices (aww geez this is a long one)
const calculateVotes = () => {
	//split current list into active and inactive
	const activeList = [];
	const inactiveList = [];
	for (const movie of totalList) {
		if (movie.active) activeList.push(movie);
		else inactiveList.push(movie);
	}

	database
		.ref(`/${roomCode}/users/`)
		.once("value")
		.then((snapshot) => {
			let numPeople = 0;

			//create list of sums for each movie id
			const votes = [];
			for (let i = 0; i < activeList.length; i++) {
				const movie = activeList[i];
				votes.push({ id: movie.id, num: 0, index: i });
			}

			//put server data into list of lists of preferences
			const rawVotes = [];
			Object.entries(snapshot.val()).forEach((person) => {
				if (Date.now() - person[1].date < 90000) {
					numPeople++;
					const list = person[1].rankedList;
					if (list && list.length > 0) {
						rawVotes.push(list.slice(0));
						for (const movie of votes) {
							if (list[0].id === movie.id) movie.num++;
						}
					}
				}
			});

			const winners = []; //the actual winners
			const backup = []; //just in case we run out of winners we can use the next best thing
			let numWinners = parseInt($("#num-winners").val()); //how many winners to choose
			const winThreshold = Math.floor(numPeople / (numWinners + 1)); //minimum number of votes needed for guarenteed win (exclusive)

			//loop until we've chosen enough winners
			while (numWinners > 0) {
				votes.sort((a, b) => b.num - a.num);

				let elected = false; //flag to see if we need to eliminate last place
				//check for winners and distribute extra votes to second choices
				for (let i = 0; i < votes.length; i++) {
					const movie = votes[i];
					if (movie.num > winThreshold) {
						//we have a winner, add it to the list
						winners.push(activeList[movie.index]);
						elected = true; //set flag
						numWinners--;
						if (numWinners === 0) break; //check if we're done
						const overRatio = (movie.num - winThreshold) / winThreshold; //see what extra percentage they won by
						votes.splice(i, 1); //remove from pool of potential winners
						i--;
						//add fractional votes for the second choices of those who votes for winner
						for (let j = 0; j < rawVotes.length; j++) {
							const person = rawVotes[j];
							//if person voted for winner
							if (person.length > 0 && person[0].id === movie.id) {
								person.splice(0, 1);
								//if they have a second choice
								if (person.length > 0) {
									//add fractional votes to that second choice
									for (const otherMovie of votes) {
										if (otherMovie.id === person[0].id) otherMovie.num += overRatio;
									}
								} else {
									//person has no second choice, get them out of here
									rawVotes.splice(j, 1);
									j--;
								}
							}
						}
					} else {
						break; //list is sorted so if this index isn't enough then none past it will be
					}
				}

				//if no winners then eliminate last place
				if (!elected) {
					const lastId = votes[votes.length - 1].id;
					for (let i = 0; i < rawVotes.length; i++) {
						const person = rawVotes[i];
						//if person voted for last place
						if (person.length > 0 && person[0].id === lastId) {
							person.splice(0, 1);
							//if they have a next choice
							if (person.length > 0) {
								//transfer votes to next choice
								for (const movie of votes) {
									if (movie.id === person[0].id) movie.num++;
								}
							} else {
								//no next choice, get rid of them
								rawVotes.splice(i, 1);
								i--;
							}
						}
					}
					backup.unshift(votes.splice(votes.length - 1, 1)[0]);
				}

				//check for no more votes to distrubte
				if (votes.length === 0) {
					//fill in rest of winners with whoever was leading
					for (let i = 0; i < numWinners; i++) {
						winners.push(activeList[backup[i].index]);
					}
					numWinners = 0;
				}
			}

			//create new total list to display
			const newInactiveList = [];
			for (const movie of activeList) {
				if (!winners.includes(movie)) {
					movie.active = false;
					newInactiveList.push(movie);
				}
			}
			const combinedList = winners.concat(newInactiveList.concat(inactiveList));
			emptyMasterList();
			setTimeout(addToMasterList, 50, combinedList);
		});
};

//only pass through movies that at least 50% of people see favorably
const calculateFavorability = () => {
	//split list, you know the drill
	const activeList = [];
	const inactiveList = [];
	for (const movie of totalList) {
		if (movie.active) {
			activeList.push(movie);
		} else {
			inactiveList.push(movie);
		}
	}

	database
		.ref(`/${roomCode}/users/`)
		.once("value")
		.then((snapshot) => {
			let numPeople = 0;
			const numYes = [];
			for (let i = 0; i < activeList.length; i++) {
				numYes[i] = 0;
			}
			Object.entries(snapshot.val()).forEach((person) => {
				if (Date.now() - person[1].date < 180000) {
					numPeople++;
					//look for all the movies in the activeList that match this person's yes list
					for (let i = 0; i < activeList.length; i++) {
						if (person[1].yesList) {
							person[1].yesList.forEach((movie) => {
								if (activeList[i].id == movie) numYes[i]++;
							});
						}
					}
				}
			});

			//create a new active list based on overall favorability
			let newActiveList = [];
			let newInactiveList = [];
			for (let i = 0; i < activeList.length; i++) {
				if (numYes[i] / numPeople >= 0.5) {
					activeList[i].active = true;
					newActiveList.push(activeList[i]);
				} else {
					activeList[i].active = false;
					newInactiveList.push(activeList[i]);
				}
			}

			const combinedList = newActiveList.concat(newInactiveList.concat(inactiveList));
			emptyMasterList();
			setTimeout(addToMasterList, 50, combinedList);
		});
};

//check data from the database and update my personal data
const update = () => {
	//count all users and make sure things exist
	database
		.ref(`/${roomCode}/users/`)
		.once("value")
		.then((snapshot) => {
			let numPeople = 0;
			let numDone = 0;
			let hasHost = false;
			let newHostID; //for picking the next host if the current one leaves
			Object.entries(snapshot.val()).forEach((person) => {
				if (Date.now() - person[1].date < 180000) {
					numPeople++;
					if (person[1].host) {
						//if I'm a host but we've already got one
						if (hasHost && person[0] === userID) {
							console.log("multiple hosts, taking away your powers");
							isHost = false;
							setTimeout(transitionToState, 50);
						}
						hasHost = true;
					}
					if (person[1].done) numDone++;
					newHostID = person[0]; //update this until it's the last active person in the list
				}
			});

			//display number of people and num done depending on state
			if (state === "search" || state === "swipe" || state === "voting") {
				$("#people-count").text(`${numDone}/${numPeople}`);
			} else {
				$("#people-count").text(numPeople);
			}

			//transition states when everyone is done
			if (isHost && numPeople === numDone) {
				if (state === "search") {
					state = "list";
					transitionToList();
				} else if (state === "swipe") {
					state = "list";
					transitionToList();
					setTimeout(calculateFavorability, 300);
				} else if (state === "voting") {
					state = "list";
					transitionToList();
					setTimeout(calculateVotes, 300);
				}
			}

			//if the host has left
			if (!hasHost) {
				//make someone else the host and notify them
				if (newHostID && newHostID === userID) {
					isHost = true;
					transitionToState();
					$("#host-notification").show();
				}
			}
		});

	//post personal data to database
	database.ref(`/${roomCode}/users/${userID}`).set({
		date: Date.now(),
		host: isHost,
		done: isDone,
		yesList: yesList,
		rankedList: rankedList,
	});

	//update state server side
	if (isHost) {
		let updates = {};
		updates["/state"] = state;
		updates["/done"] = isDone;
		database.ref(`/${roomCode}`).update(updates);
	} else {
		//update state client side
		database
			.ref(`/${roomCode}/state`)
			.once("value")
			.then((snapshot) => {
				const newState = snapshot.val();
				if (newState !== state) {
					state = newState;
					transitionToState();
				}
			});
	}
};

//transition to whatever the new state is
const transitionToState = () => {
	switch (state) {
		case "search":
			transitionToSearch();
			break;
		case "list":
			transitionToList();
			break;
		case "swipe":
			transitionToSwipe();
			break;
		case "voting":
			transitionToVoting();
			break;
	}
};
