// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;

/**
 * @typedef {Object} SubredditConfigEntry
 * @property {string} title - The display title of the subreddit.
 * @property {string[]} authorsToSkip - An array of Reddit usernames to skip.
 * @property {'top'|'hot'} redditSort - The Reddit sort order, top will be the last week.
 */

/**
 * Configuration object for various subreddits.
 * @type {Object.<string, SubredditConfigEntry>} - object key is subreddit in lowercase
 */
const subredditConfig = {
	liverpool: {
		title: "Liverpool",
		authorsToSkip: ["/u/anagoge"],
		redditSort: "top",
	},
	liverpoolfc: {
		title: "LFC",
		authorsToSkip: ["/u/AutoModerator"],
		redditSort: "hot",
	},
	soccer: {
		title: "⚽",
		authorsToSkip: ["/u/AutoModerator", "/u/2soccer2bot"],
		redditSort: "hot",
	},
	formula1: { title: "🏎️", authorsToSkip: ["/u/F1-Bot", "/u/SkySports"], redditSort: "hot" },
};

const subreddit = args.widgetParameter ?? "soccer";

const items = await loadItems(subreddit);

const widget = await createWidget(items, subreddit);
// Check if the script is running in
// a widget. If not, show a preview of
// the widget to easier debug it.
if (!config.runsInWidget) {
	await widget.presentMedium();
}
// Tell the system to show the widget.
Script.setWidget(widget);
Script.complete();

async function createWidget(items, title) {
	const config = subredditConfig[title];
	const w = new ListWidget();
	w.backgroundColor = new Color("#000000");

	const hs = w.addText(config.title);
	hs.font = Font.systemFont(20);

	w.addSpacer();

	for (i = 0; i < 3; i++) {
		addNews(w, items[i]);
	}

	return w;
}

function addNews(w, item) {
	let titleTxt = w.addText(item.title);
	titleTxt.font = Font.boldSystemFont(12);
	titleTxt.textColor = Color.white();
	let rawDate = item.published;
	let date = new Date(Date.parse(rawDate));
	let dates = w.addDate(date);
	dates.applyRelativeStyle();
	dates.font = Font.systemFont(10);
}

async function loadItems(subreddit) {
	const config = subredditConfig[subreddit];
	const url =
		"https://www.reddit.com/r/" +
		subreddit +
		"/" +
		config.redditSort +
		".rss" +
		(config.redditSort === "top" ? "?t=week" : "");
	let req = new Request(url);
	let str = await req.loadString();
	let items = [];
	let currentItem = null;
	let inEntry = false;
	let currentValue = "";

	const xmlParser = new XMLParser(str);
	xmlParser.didStartElement = (name) => {
		currentValue = "";
		if (name == "entry") {
			inEntry = true;
			currentItem = {};
		}
	};
	xmlParser.foundCharacters = (str) => {
		currentValue += str;
	};
	xmlParser.didEndElement = (name) => {
		if (inEntry && currentItem != null) {
			if (name == "title") {
				currentItem["title"] = currentValue.trim();
			} else if (name == "published") {
				currentItem["published"] = currentValue.trim();
			} else if (name == "name") {
				currentItem["author"] = currentValue.trim();
			}
		}

		if (name == "entry") {
			inEntry = false;
			if (currentItem != null) {
				if (!config.authorsToSkip.includes(currentItem["author"])) {
					items.push(currentItem);
				}
				currentItem = null;
			}
		}
	};
	xmlParser.didEndDocument = (name) => {};

	xmlParser.parse();
	return items;
}
