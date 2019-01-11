import { autoCompleteView } from "../views/autoCompleteView";

export default class autoComplete {
	constructor(config) {
		// User input Selector
		this.selector = config.selector || "#autoComplete";
		// Source of data list
		this.data = {
			src: () => (typeof config.data.src === "function" ? config.data.src() : config.data.src),
			key: config.data.key
		};
		// Search engine type
		this.searchEngine = config.searchEngine === "loose" ? "loose" : "strict";
		// Minimum characters length before engine starts rendering
		this.threshold = config.threshold || 0;
		// Rendered results destination
		this.resultsList = autoCompleteView.createResultsList({
			container: config.resultsList && config.resultsList.container
				? config.resultsList.container : false,
			destination: config.resultsList && config.resultsList.destination
				? config.resultsList.destination : autoCompleteView.getInput(this.selector),
			position: config.resultsList && config.resultsList.position
				? config.resultsList.position : "afterend"
		});
		// Placeholder text
		this.placeHolder = config.placeHolder;
		// Maximum number of results to show
		this.maxResults = config.maxResults || 5;
		//
		this.resultItem = config.resultItem;
		// Highlighting matching results
		this.highlight = config.highlight || false;
		// Action function on result selection
		this.onSelection = config.onSelection;
		// Starts the app Enigne
		this.init();
	}

	// Search common characters within record
	search(query, record) {
		// Hightlight State value holder
		const highlight = this.highlight;
		// Current record value toLowerCase
		const recordLowerCase = record.toLowerCase();
		// Loose mode
		if (this.searchEngine === "loose") {
			// Search query string sanitized & normalized
			query = query.replace(/ /g, "");
			// Array of matching characters
			const match = [];
			// Query character position based on success
			let searchPosition = 0;
			// Iterate over record characters
			for (let number = 0; number < recordLowerCase.length; number++) {
				// Holds current record character
				let recordChar = recordLowerCase[number];
				// Matching case
				if (searchPosition < query.length && recordChar === query[searchPosition]) {
					// Highlight matching character
					recordChar = highlight ? autoCompleteView.highlight(recordChar) : recordChar;
					// Increment search position
					searchPosition++;
				}
				// Adds matching character to the matching list
				match.push(recordChar);
			}
			// Non-Matching case
			if (searchPosition !== query.length) {
				return false;
			}
			// Return the joined match
			return match.join("");
			// Strict mode
		} else {
			if (recordLowerCase.includes(query)) {
				// If Highlighted
				if (highlight) {
					const inputValue = autoCompleteView.getInput(this.selector).value.toLowerCase();
					return recordLowerCase.replace(inputValue, autoCompleteView.highlight(inputValue));
					// If NOT Hightligthed
				} else {
					return recordLowerCase;
				}
			}
		}
	}

	// List all matching results
	listMatchedResults(data) {
		// Final highlighted results list of array
		const resList = [];
		// Holds the input search value
		const inputValue = autoCompleteView.getInput(this.selector).value.toLowerCase();
		// Checks input has matches in data source
		data.filter(record => {
			const match = this.search(inputValue, record[this.data.key] || record);
			if (match) {
				resList.push({ match, source: record });
			}
		});
		const list = resList.slice(0, this.maxResults);
		// Rendering matching results to the UI list
		autoCompleteView.addResultsToList(this.resultsList, list, this.data.key, this.resultItem);
		// Keyboard Arrow Navigation
		autoCompleteView.navigation(this.selector, this.resultsList);
		// Returns rendered list
		return list;
	}

	ignite(data) {
		// Selector value holder
		const selector = this.selector;
		// Specified Input field selector
		const input = autoCompleteView.getInput(selector);
		// Placeholder value holder
		const placeHolder = this.placeHolder;
		// onSelection function holder
		const onSelection = this.onSelection;
		// Placeholder setter
		if (placeHolder) {
			input.setAttribute("placeholder", placeHolder);
		}
		// Input field handler fires an event onKeyup action
		input.onkeyup = () => {
			// Get results list value
			const resultsList = this.resultsList;
			// Clear Results function holder
			const clearResults = autoCompleteView.clearResults(resultsList);
			// Check if input is not empty or just have space before triggering the app
			if (input.value.length > this.threshold && input.value.replace(/ /g, "").length) {
				// clear results list
				clearResults;
				// List matching results
				const list = this.listMatchedResults(data);
				// Gets user's selection
				// If action configured
				if (onSelection) {
					autoCompleteView.getSelection(selector, resultsList, onSelection, list, this.data.key);
				}
			} else {
				// clears all results list
				clearResults;
			}
		};
	}

	// Starts the app Enigne
	init() {
		// Data Source holder
		const dataSrc = this.data.src();
		// Data source is Async
		if (dataSrc instanceof Promise) {
			// Return Data
			dataSrc.then(data => this.ignite(data));
			// Data source is Array/Function
		} else {
			// Return Data
			this.ignite(dataSrc);
		}
	}
}